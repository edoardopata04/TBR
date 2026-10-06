#!/usr/bin/env python3
"""Aggregate customer automation logs into compact metrics for deep analysis.

Reads python/CUSTOMERS/<account>/LOGS/unified_scheduler_<DATE>.log and
python/CUSTOMERS/<account>/processed_users_<DATE>.log, streaming line by line.

Outputs (default: logs/log-analysis/<from>_<to>/):
  metrics.json  full aggregated data
  summary.md    compact report meant to be read by the analyst/agent
History: logs/log-analysis/history.jsonl (one compact record per analysed period).

Usage:
  python .devin/skills/log-analysis/analyze_logs.py                 # last 3 full days
  python .devin/skills/log-analysis/analyze_logs.py --days 5 --include-today
  python .devin/skills/log-analysis/analyze_logs.py --from 2026-09-22 --to 2026-09-24
  python .devin/skills/log-analysis/analyze_logs.py --customers allastrozza,enerpay.it
  python .devin/skills/log-analysis/analyze_logs.py --with-scheduler   # adds scheduler_groups from Supabase
  python .devin/skills/log-analysis/analyze_logs.py --compare          # computes previous period if not in history
"""
from __future__ import annotations

import argparse
import json
import re
import statistics
import sys
import urllib.request
from collections import Counter, defaultdict, deque
from datetime import date, datetime, timedelta
from pathlib import Path

REPO = Path(__file__).resolve().parents[3]
EXPECTED_FILE = Path(__file__).with_name("expected_signatures.txt")
DEFAULT_HISTORY = REPO / "logs" / "log-analysis" / "history.jsonl"
KV_SPLIT = re.compile(r" (?=[a-z_][a-z0-9_]*=)")
NUM = re.compile(r"\b\d+\b")
FREEZE_GAP_S = 25 * 60
PAUSE_CATS = {"break", "daily_limit", "cooldown"}
LEVEL_WEIGHT = {"CRITICAL": 4, "ERROR": 3, "WARN": 1}
CASCADE_WINDOW_S = 60      # WARN of the same category within 60s before an ERROR belong to its chain
FOLLOWUP_WINDOW_S = 5      # "Target failed" within 5s after another ERROR is its consequence
CHILD_ONLY_RATIO = 0.8     # signatures >= 80% inside chains are shown only under their parent
WINDOW_END_MINUTES = {58, 59, 0, 1, 2}
PHANTOM_TRANSITION_SOURCES = {"row", "post_click"}
INTERRUPTED_REASONS = ("errore", "riavviata_meta_finestra")


def parse_kv(s: str) -> dict[str, str]:
    out = {}
    for part in KV_SPLIT.split(s.strip()):
        k, sep, v = part.partition("=")
        if sep:
            out[k] = v
    return out


def parse_line(line: str):
    # [YYYY-MM-DD HH:MM:SS] LEVEL category | message | k=v ...
    if len(line) < 24 or line[0] != "[" or line[20] != "]":
        return None
    head, _, rest = line[22:].partition(" | ")
    level, _, cat = head.partition(" ")
    if not cat:
        return None
    msg, _, kv = rest.rstrip("\n").partition(" | ")
    return line[1:20], level, cat.strip(), msg.strip(), kv


def ts(s: str) -> datetime:
    return datetime.strptime(s, "%Y-%m-%d %H:%M:%S")


def pct(values, p):
    if not values:
        return None
    v = sorted(values)
    return v[min(len(v) - 1, int(round(p / 100 * (len(v) - 1))))]


def rel(p: Path) -> str:
    try:
        return p.relative_to(REPO).as_posix()
    except ValueError:
        return p.as_posix()


def action_kind(msg: str) -> str | None:
    m = msg.lower()
    if m.startswith("story liked"):
        return "like_story"
    if m.startswith("post liked"):
        return "like_post"
    if "comment" in m:
        return "comment_post"
    return None


def logged_kind(action_type: str) -> str:
    a = action_type.lower()
    if "comment" in a:
        return "comment_post"
    if "story" in a:
        return "like_story"
    if "post" in a:
        return "like_post"
    return a


def load_expected() -> list[str]:
    if not EXPECTED_FILE.exists():
        return []
    return [l.strip().lower() for l in EXPECTED_FILE.read_text(encoding="utf-8").splitlines() if l.strip() and not l.lstrip().startswith("#")]


class DayStats:
    def __init__(self, customer: str, day: str, path: Path):
        self.customer, self.day, self.path = customer, day, rel(path)
        self.lines = 0
        self.levels = Counter()
        self.first = self.last = None
        self.sessions: list[dict] = []
        self.actions = Counter()          # like_story / like_post / comment_post from SUCCESS lines
        self.action_variants = Counter()  # raw SUCCESS messages (e.g. "Story liked (fallback)")
        self.logged_actions = Counter()   # supabase_log action_type, normalised
        self.story_fail_reasons = Counter()
        self.completion_reasons = Counter()
        self.targets_completed = 0
        self.target_actions: list[int] = []
        self.targets_failed: list[dict] = []
        self.cycle_ms: list[int] = []
        self.acted = self.processed = 0
        self.daily_limit_at = None
        self.heartbeat_fail = Counter()
        self.phantom: list[dict] = []
        self.breaks = 0
        self.lists_exhausted = 0
        self.hourly_actions = Counter()
        self.freezes: list[dict] = []
        self.config = {}
        self.last_limits = {}
        self.processed_users = 0
        self.processed_dupes = 0
        self.acted_on = Counter()
        self.script_versions = Counter()


def new_sig() -> dict:
    return {"count": 0, "cascade_hits": 0, "lost_s": 0, "children": Counter(), "customers": Counter(),
            "days": Counter(), "hours": Counter(), "examples": []}


def classify_session_end(s: dict, is_last: bool) -> str:
    if s["daily_limit"]:
        return "limite_giornaliero"
    if s["last_level"] in ("ERROR", "CRITICAL") or "traceback" in s["last_event"].lower():
        return "errore"
    minute = int(s["last"][14:16])
    if minute in WINDOW_END_MINUTES:
        return "fine_finestra"
    return "fine_file_meta_finestra" if is_last else "riavviata_meta_finestra"


def analyze_file(customer: str, day: str, path: Path, sigs: dict, examples_per_sig: int) -> DayStats:
    st = DayStats(customer, day, path)
    session = None
    target_start = None
    prev_t = prev_cat = None
    prev_line_no = 0
    recent_warns: deque = deque()   # (t, key, cat) for cascade attribution
    last_error = None               # (t, key, cat)
    with path.open(encoding="utf-8", errors="replace") as fh:
        for n, raw in enumerate(fh, 1):
            p = parse_line(raw)
            if not p:
                continue
            t_s, level, cat, msg, kv = p
            st.lines += 1
            st.levels[level] += 1
            t = ts(t_s)
            st.first = st.first or t_s
            st.last = t_s

            if prev_t and (t - prev_t).total_seconds() > FREEZE_GAP_S and prev_cat not in PAUSE_CATS and cat != "startup":
                st.freezes.append({"from": prev_t.strftime("%H:%M:%S"), "to": t_s[11:], "gap_min": round((t - prev_t).total_seconds() / 60), "line": prev_line_no, "prev_cat": prev_cat})
            prev_t, prev_cat, prev_line_no = t, cat, n

            # Start a new process session at the explicit version marker, before config or action logs.
            if cat == "startup" and msg == "Logger configured":
                session = None
            elif cat in ("startup", "session_start") and msg == "Automation script starting":
                startup_fields = parse_kv(kv)
                session = {"start": t_s, "line": n, "last": t_s, "last_event": f"{level} {cat} | {msg}",
                           "last_level": level, "last_line": n, "daily_limit": False, "actions": 0,
                           "script_version": startup_fields.get("script_version", "unknown"),
                           "module": startup_fields.get("module", "unknown"),
                           "configured_script_version": startup_fields.get("configured_script_version", "unset"),
                           "pid": startup_fields.get("pid", "?"), "run_id": startup_fields.get("run_id", "?")}
                st.sessions.append(session)
                st.script_versions[session["script_version"]] += 1
                continue
            elif cat == "startup" and msg == "Heartbeat loop started":
                if session is None:
                    session = {"start": t_s, "line": n, "last": t_s, "last_event": "", "last_level": "", "last_line": n,
                               "daily_limit": False, "actions": 0, "script_version": "unknown", "module": "unknown",
                               "configured_script_version": "unset", "pid": "?", "run_id": "?"}
                    st.sessions.append(session)
                    st.script_versions["unknown"] += 1
            if session is not None:
                session.update(last=t_s, last_event=f"{level} {cat} | {msg}", last_level=level, last_line=n)
            if cat == "startup" and msg == "Heartbeat loop started":
                continue

            tf_parent = None
            key = None
            if level in LEVEL_WEIGHT and cat != "tap_forensics":
                key = f"{level} {cat} | {NUM.sub('N', msg)}"
                s = sigs.setdefault(key, new_sig())
                s["count"] += 1
                s["customers"][customer] += 1
                s["days"][day] += 1
                s["hours"][t.hour] += 1
                if len(s["examples"]) < examples_per_sig and customer not in {e["customer"] for e in s["examples"]}:
                    s["examples"].append({"customer": customer, "ref": f"{st.path}:{n}", "line": raw.strip()[:300]})

                while recent_warns and (t - recent_warns[0][0]).total_seconds() > CASCADE_WINDOW_S:
                    recent_warns.popleft()
                if level == "WARN":
                    recent_warns.append((t, key, cat))
                else:
                    is_tf = cat == "multi_target" and msg.startswith("Target failed")
                    if is_tf and last_error and last_error[2] != "multi_target" and (t - last_error[0]).total_seconds() <= FOLLOWUP_WINDOW_S:
                        tf_parent = last_error[1]
                        s["cascade_hits"] += 1
                        sigs[tf_parent]["children"][key] += 1
                    elif not is_tf:
                        kept = deque()
                        for item in recent_warns:
                            if item[2] == cat:
                                sigs[item[1]]["cascade_hits"] += 1
                                s["children"][item[1]] += 1
                            else:
                                kept.append(item)
                        recent_warns = kept
                        last_error = (t, key, cat)

            if cat == "session_start" and msg == "Config dump" and not st.config:
                kvd = parse_kv(kv)
                st.config = {k: kvd[k] for k in ("device", "max_actions", "like_post_enabled", "comments_enabled", "follow_enabled", "max_follows", "cooldown", "break_every", "break_duration") if k in kvd}
            elif level == "SUCCESS":
                kind = action_kind(msg)
                st.action_variants[msg] += 1
                if kind:
                    st.actions[kind] += 1
                    st.hourly_actions[t.hour] += 1
                    if session is not None:
                        session["actions"] += 1
                    user = parse_kv(kv).get("username")
                    if user:
                        st.acted_on[(kind, user)] += 1
            elif cat == "supabase_log" and msg.startswith("Single insert successful"):
                st.logged_actions[logged_kind(parse_kv(kv).get("action_type", "?"))] += 1
            elif cat == "process" and msg == "Story like failed":
                st.story_fail_reasons[parse_kv(kv).get("reason", "?")] += 1
            elif cat == "multi_target":
                if msg.startswith("Per-target state reset"):
                    target_start = t
                elif msg == "Target completed":
                    kvd = parse_kv(kv)
                    st.targets_completed += 1
                    st.completion_reasons[kvd.get("completion_reason", "?")] += 1
                    st.target_actions.append(int(kvd.get("total_actions", 0) or 0))
                    target_start = None
                elif msg.startswith("Target failed") and level in ("ERROR", "CRITICAL"):
                    kvd = parse_kv(kv)
                    lost = int((t - target_start).total_seconds()) if target_start else 0
                    st.targets_failed.append({"username": kvd.get("username", "?"), "error": kvd.get("error", "?"), "time": t_s[11:],
                                              "lost_s": lost, "cause": tf_parent, "ref": f"{st.path}:{n}"})
                    sigs[tf_parent or key]["lost_s"] += lost
                    target_start = None
            elif cat == "loop" and msg == "Cycle summary":
                kvd = parse_kv(kv)
                try:
                    st.cycle_ms.append(int(kvd.get("cycle_ms", 0)))
                    st.acted += int(kvd.get("acted", 0))
                    st.processed += int(kvd.get("new_rows", 0))
                except ValueError:
                    pass
            elif cat == "limits" and msg.startswith("Per-type limit check"):
                st.last_limits = parse_kv(kv)
            elif cat == "daily_limit" and "reached" in msg:
                st.daily_limit_at = st.daily_limit_at or t_s[11:]
                if session is not None:
                    session["daily_limit"] = True
            elif cat == "heartbeat" and "failed" in msg:
                st.heartbeat_fail[parse_kv(kv).get("error", "?")[:80]] += 1
            elif cat == "phantom_follow" and level in LEVEL_WEIGHT:
                kvd = parse_kv(kv)
                source = kvd.get("source")
                before = kvd.get("before")
                st.phantom.append({"time": t_s[11:], "username": kvd.get("username") or kvd.get("profile"), "target": kvd.get("target"),
                                   "before": before, "after": kvd.get("after"), "source": source, "context": kvd.get("context"),
                                   "transition": source in PHANTOM_TRANSITION_SOURCES or before not in (None, "None", ""),
                                   "ref": f"{st.path}:{n}"})
            elif cat == "break" and msg == "Break started":
                st.breaks += 1
            elif cat == "stall" and "list exhausted" in msg:
                st.lists_exhausted += 1

    pu = path.parent.parent / f"processed_users_{day}.log"
    if pu.exists():
        names = [l.strip() for l in pu.open(encoding="utf-8", errors="replace") if l.strip()]
        st.processed_users = len(names)
        st.processed_dupes = len(names) - len(set(names))
    return st


def day_row(st: DayStats) -> dict:
    fails = st.targets_failed
    total_t = st.targets_completed + len(fails)
    active_h = len([h for h, c in st.hourly_actions.items() if c])
    total_actions = sum(st.actions.values())
    logged_total = sum(st.logged_actions.values())
    transitions = [p for p in st.phantom if p["transition"]]
    profile_alarms = [p for p in st.phantom if not p["transition"]]
    sessions = []
    version_mismatches = Counter()
    for i, s in enumerate(st.sessions):
        nxt = st.sessions[i + 1] if i + 1 < len(st.sessions) else None
        sessions.append({"start": s["start"][11:], "end": s["last"][11:], "actions": s["actions"],
                         "script_version": s["script_version"], "module": s["module"],
                         "configured_script_version": s["configured_script_version"], "pid": s["pid"], "run_id": s["run_id"],
                         "end_reason": classify_session_end(s, nxt is None),
                         "gap_to_next_min": round((ts(nxt["start"]) - ts(s["last"])).total_seconds() / 60, 1) if nxt else None,
                         "last_event": s["last_event"][:140], "ref": f"{st.path}:{s['last_line']}"})
        configured_version = s["configured_script_version"]
        if configured_version not in ("", "unset", "unknown") and configured_version != s["script_version"]:
            version_mismatches[(s["script_version"], configured_version)] += 1
    return {
        "customer": st.customer, "day": st.day, "log": st.path, "lines": st.lines,
        "first": st.first, "last": st.last, "sessions": len(st.sessions), "session_details": sessions,
        "script_versions": dict(st.script_versions),
        "script_version_mismatches": [{"actual": a, "configured": c, "count": n} for (a, c), n in version_mismatches.items()],
        "actions": dict(st.actions), "action_variants": dict(st.action_variants), "total_actions": total_actions,
        "logged_actions": dict(st.logged_actions),
        "success_vs_logged": {"success": total_actions, "logged": logged_total, "diff": total_actions - logged_total},
        "actions_per_active_hour": round(total_actions / active_h, 1) if active_h else 0,
        "targets_completed": st.targets_completed, "targets_failed": len(fails),
        "targets_failed_unique": len({f["username"] for f in fails}),
        "target_success_rate": round(st.targets_completed / total_t, 3) if total_t else None,
        "avg_actions_per_completed_target": round(statistics.mean(st.target_actions), 1) if st.target_actions else None,
        "time_lost_failed_targets_min": round(sum(f["lost_s"] for f in fails) / 60, 1),
        "completion_reasons": dict(st.completion_reasons), "story_like_fail_reasons": dict(st.story_fail_reasons.most_common(8)),
        "cycle_ms": {"n": len(st.cycle_ms), "mean": round(statistics.mean(st.cycle_ms)) if st.cycle_ms else None, "p95": pct(st.cycle_ms, 95), "max": max(st.cycle_ms) if st.cycle_ms else None},
        "conversion_acted_per_new_row": round(st.acted / st.processed, 3) if st.processed else None,
        "last_limits": st.last_limits, "daily_limit_reached_at": st.daily_limit_at, "config": st.config,
        "levels": dict(st.levels), "heartbeat_failures": dict(st.heartbeat_fail),
        "phantom_transitions": transitions, "profile_follow_alarms": profile_alarms,
        "profile_follow_unique": len({(p["username"] or "?").lower() for p in profile_alarms}),
        "breaks": st.breaks, "lists_exhausted": st.lists_exhausted, "freezes": st.freezes,
        "hourly_actions": {str(h): st.hourly_actions[h] for h in sorted(st.hourly_actions)},
        "processed_users": st.processed_users, "processed_users_duplicates": st.processed_dupes,
        "duplicate_actions": [{"type": k, "username": u, "count": c} for (k, u), c in st.acted_on.items() if c > 1],
        "failed_targets": fails,
    }


def status_of(r: dict) -> tuple[str, list[str]]:
    crit, warn = [], []
    if r["sessions"] and r["total_actions"] == 0:
        crit.append("0 azioni")
    if r["duplicate_actions"]:
        crit.append(f"{len(r['duplicate_actions'])} azioni duplicate")
    if r["phantom_transitions"]:
        crit.append(f"{len(r['phantom_transitions'])} phantom transizioni")
    if r["profile_follow_alarms"]:
        warn.append(f"{r['profile_follow_unique']} profili già seguiti ({len(r['profile_follow_alarms'])} allarmi)")
    sr = r["target_success_rate"]
    if sr is not None and sr < 0.5:
        crit.append(f"succ target {sr:.0%}")
    elif sr is not None and sr < 0.7:
        warn.append(f"succ target {sr:.0%}")
    if r["freezes"]:
        warn.append(f"{len(r['freezes'])} freeze")
    if r["heartbeat_failures"]:
        warn.append(f"{sum(r['heartbeat_failures'].values())} heartbeat ko")
    if r["script_version_mismatches"]:
        mismatches = ", ".join(f"actual={m['actual']} env={m['configured']}" for m in r["script_version_mismatches"])
        warn.append(f"SCRIPT_VERSION mismatch: {mismatches}")
    sv = r["success_vs_logged"]
    if abs(sv["diff"]) > max(5, 0.05 * max(sv["success"], sv["logged"])):
        warn.append(f"SUCCESS/DB diff {sv['diff']:+d}")
    interrupted = sum(1 for s in r["session_details"] if s["end_reason"] in INTERRUPTED_REASONS)
    if interrupted:
        warn.append(f"{interrupted} sessioni interrotte")
    return ("CRITICO" if crit else "ATTENZIONE" if warn else "OK"), crit + warn


def rank_signatures(sigs: dict, expected: list[str]) -> tuple[list[dict], list[dict]]:
    ranked, expected_list = [], []
    for k, v in sigs.items():
        level = k.split(" ", 1)[0]
        standalone = v["count"] - v["cascade_hits"]
        entry = {"signature": k, "count": v["count"], "standalone": standalone, "cascade_hits": v["cascade_hits"],
                 "lost_min": round(v["lost_s"] / 60, 1), "children": dict(v["children"].most_common(8)),
                 "customers": dict(v["customers"].most_common()), "days": dict(v["days"]),
                 "hours": dict(sorted(v["hours"].items())), "examples": v["examples"],
                 "child_only": v["count"] > 0 and v["cascade_hits"] >= CHILD_ONLY_RATIO * v["count"],
                 "score": LEVEL_WEIGHT.get(level, 1) * standalone * len(v["customers"])}
        low = k.lower()
        entry["expected"] = any(p in low for p in expected)
        (expected_list if entry["expected"] else ranked).append(entry)
    ranked.sort(key=lambda s: (-s["score"], -s["count"]))
    expected_list.sort(key=lambda s: -s["count"])
    return ranked, expected_list


def run_period(root: Path, customers: list[str], days: list[str], examples: int, quiet: bool) -> dict:
    sigs: dict = {}
    rows, missing = [], []
    for c in customers:
        for d in days:
            f = root / c / "LOGS" / f"unified_scheduler_{d}.log"
            if not f.exists():
                missing.append(f"{c}@{d[5:]}")
                continue
            r = day_row(analyze_file(c, d, f, sigs, examples))
            r["status"], r["reasons"] = status_of(r)
            rows.append(r)
        if not quiet:
            print(f"  {c}: ok", flush=True)

    ranked, expected_sigs = rank_signatures(sigs, load_expected())

    tf = defaultdict(lambda: {"count": 0, "customers": set(), "days": set(), "errors": set()})
    for r in rows:
        for f in r["failed_targets"]:
            e = tf[f["username"]]
            e["count"] += 1
            e["customers"].add(r["customer"])
            e["days"].add(r["day"])
            e["errors"].add(f["error"][:60])
    cross = sorted(({"username": u, "count": e["count"], "customers": sorted(e["customers"]), "days": sorted(e["days"]), "errors": sorted(e["errors"])}
                    for u, e in tf.items() if e["count"] >= 2), key=lambda x: (-len(x["days"]), -x["count"]))
    return {"rows": rows, "missing": missing, "signatures": ranked, "expected_signatures": expected_sigs, "repeated_failed_targets": cross,
            "phantom_transitions": [dict(p, customer=r["customer"], day=r["day"]) for r in rows for p in r["phantom_transitions"]],
            "profile_follow_alarms": [dict(p, customer=r["customer"], day=r["day"]) for r in rows for p in r["profile_follow_alarms"]]}


def compact(result: dict, days: list[str], customers_filter: str) -> dict:
    rows = result["rows"]
    script_versions = Counter()
    per_customer_versions = defaultdict(Counter)
    for r in rows:
        script_versions.update(r["script_versions"])
        per_customer_versions[r["customer"]].update(r["script_versions"])
    totals = {
        "files": len(rows), "sessions": sum(r["sessions"] for r in rows),
        "like_story": sum(r["actions"].get("like_story", 0) for r in rows),
        "like_post": sum(r["actions"].get("like_post", 0) for r in rows),
        "comment_post": sum(r["actions"].get("comment_post", 0) for r in rows),
        "total_actions": sum(r["total_actions"] for r in rows),
        "targets_completed": sum(r["targets_completed"] for r in rows),
        "targets_failed": sum(r["targets_failed"] for r in rows),
        "time_lost_failed_targets_min": round(sum(r["time_lost_failed_targets_min"] for r in rows), 1),
        "phantom_transitions": len(result["phantom_transitions"]),
        "profile_follow_alarms": len(result["profile_follow_alarms"]),
        "heartbeat_failures": sum(sum(r["heartbeat_failures"].values()) for r in rows),
        "sessions_interrupted": sum(1 for r in rows for s in r["session_details"] if s["end_reason"] in INTERRUPTED_REASONS),
    }
    per_customer = defaultdict(lambda: Counter())
    for r in rows:
        pc = per_customer[r["customer"]]
        pc["files"] += 1
        pc["total_actions"] += r["total_actions"]
        pc["targets_completed"] += r["targets_completed"]
        pc["targets_failed"] += r["targets_failed"]
        pc["phantom_transitions"] += len(r["phantom_transitions"])
        pc["profile_follow_alarms"] += len(r["profile_follow_alarms"])
    all_sigs = result["signatures"] + result["expected_signatures"]
    return {"key": f"{days[0]}_{days[-1]}|{customers_filter}", "from": days[0], "to": days[-1], "days": len(days),
            "customers_filter": customers_filter, "generated": datetime.now().strftime("%Y-%m-%d %H:%M"),
            "totals": totals, "script_versions": dict(script_versions),
            "script_versions_by_customer": {c: dict(v) for c, v in per_customer_versions.items()},
            "per_customer": {c: dict(v) for c, v in per_customer.items()},
            "signatures": {s["signature"]: s["count"] for s in sorted(all_sigs, key=lambda s: -s["count"])[:200]}}


def load_history(path: Path) -> list[dict]:
    if not path.exists():
        return []
    out = []
    for line in path.read_text(encoding="utf-8").splitlines():
        try:
            out.append(json.loads(line))
        except json.JSONDecodeError:
            continue
    return out


def save_history(path: Path, records: list[dict]) -> None:
    history = load_history(path)
    keys = {r["key"] for r in records}
    history = [h for h in history if h.get("key") not in keys] + records
    history.sort(key=lambda h: (h.get("from", ""), h.get("key", "")))
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text("\n".join(json.dumps(h, ensure_ascii=False) for h in history) + "\n", encoding="utf-8")


def delta(cur: float, prev: float) -> str:
    if not prev:
        return "n/d" if cur else "="
    return f"{(cur - prev) / prev * 100:+.0f}%"


def build_comparison(cur: dict, prev: dict | None, note: str) -> dict:
    if not prev:
        return {"available": False, "note": note}
    ct, pt = cur["totals"], prev["totals"]
    sig_moves = []
    for s in set(cur["signatures"]) | set(prev["signatures"]):
        c, p = cur["signatures"].get(s, 0), prev["signatures"].get(s, 0)
        if max(c, p) >= 20:
            sig_moves.append({"signature": s, "current": c, "previous": p, "diff": c - p})
    sig_moves.sort(key=lambda x: -x["diff"])
    cust_moves = []
    for c in set(cur["per_customer"]) | set(prev["per_customer"]):
        a, b = cur["per_customer"].get(c, {}), prev["per_customer"].get(c, {})
        cust_moves.append({"customer": c, "actions": a.get("total_actions", 0), "actions_prev": b.get("total_actions", 0),
                           "targets_failed": a.get("targets_failed", 0), "targets_failed_prev": b.get("targets_failed", 0),
                           "files": a.get("files", 0), "files_prev": b.get("files", 0)})
    cust_moves.sort(key=lambda x: x["actions"] - x["actions_prev"])
    coverage_warning = abs(ct["files"] - pt["files"]) > 0.1 * max(ct["files"], pt["files"], 1)
    return {"available": True, "previous": {"from": prev["from"], "to": prev["to"]}, "note": note,
            "coverage_warning": coverage_warning,
            "totals": {k: {"current": ct.get(k, 0), "previous": pt.get(k, 0), "delta": delta(ct.get(k, 0), pt.get(k, 0))} for k in ct},
            "signatures_up": [m for m in sig_moves if m["diff"] > 0][:12],
            "signatures_down": [m for m in reversed(sig_moves) if m["diff"] < 0][:12],
            "customers": cust_moves}


def load_env() -> dict:
    env = {}
    f = REPO / ".env"
    if f.exists():
        for line in f.read_text(encoding="utf-8", errors="replace").splitlines():
            k, sep, v = line.strip().partition("=")
            if sep and not k.startswith("#"):
                env[k.strip()] = v.strip().strip('"').strip("'")
    return env


def fetch_scheduler() -> dict:
    env = load_env()
    url, key = env.get("NEXT_PUBLIC_SUPABASE_URL"), env.get("SUPABASE_SERVICE_ROLE_KEY") or env.get("SUPABASE_SECRET_KEY")
    if not url or not key:
        return {"error": "Supabase URL/key non trovati in .env"}
    try:
        req = urllib.request.Request(f"{url.rstrip('/')}/rest/v1/scheduler_groups?select=name,enabled,intervals,script_version",
                                     headers={"apikey": key, "Authorization": f"Bearer {key}"})
        with urllib.request.urlopen(req, timeout=20) as resp:
            return {"groups": json.loads(resp.read())}
    except Exception as exc:  # noqa: BLE001
        return {"error": f"{type(exc).__name__}: {str(exc)[:160]}"}


def build_summary(meta: dict, res: dict, comparison: dict, scheduler: dict | None) -> str:
    rows = res["rows"]
    out = [f"# Log analysis {meta['from']} → {meta['to']}", ""]
    out.append(f"Generato: {meta['generated']} · clienti: {meta['customers']} · file: {meta['files']} · righe: {meta['lines']:,}")
    if meta["partial_day"]:
        out.append(f"**Giornata parziale inclusa: {meta['partial_day']}** (non confrontarla 1:1)")
    if res["missing"]:
        out.append(f"Log mancanti ({len(res['missing'])}): " + ", ".join(res["missing"][:40]))

    out += ["", "## Confronto con il periodo precedente", ""]
    if comparison["available"]:
        pv = comparison["previous"]
        out.append(f"Periodo precedente: {pv['from']} → {pv['to']} ({comparison['note']})")
        cur_versions = ", ".join(f"{v} ×{n}" for v, n in sorted(meta["script_versions"].items())) or "nessun marker"
        prev_versions = ", ".join(f"{v} ×{n}" for v, n in sorted(pv.get("script_versions", {}).items())) or "non registrata nello storico precedente"
        out.append(f"Versioni script rilevate: attuale {cur_versions}; periodo precedente {prev_versions}")
        if comparison["coverage_warning"]:
            out.append("**Attenzione: numero di file molto diverso tra i due periodi — le variazioni assolute non sono confrontabili 1:1.**")
        out += ["", "| metrica | attuale | precedente | variazione |", "|---|---|---|---|"]
        out += [f"| {k} | {v['current']} | {v['previous']} | {v['delta']} |" for k, v in comparison["totals"].items()]
        out += ["", "Firme in aumento:"] + ([f"- `{m['signature'][:110]}` {m['previous']} → {m['current']} ({m['diff']:+d})" for m in comparison["signatures_up"]] or ["- nessuna"])
        out += ["", "Firme in calo:"] + ([f"- `{m['signature'][:110]}` {m['previous']} → {m['current']} ({m['diff']:+d})" for m in comparison["signatures_down"]] or ["- nessuna"])
        drops = [c for c in comparison["customers"] if c["actions"] < c["actions_prev"]][:10]
        out += ["", "Clienti con calo di azioni (top 10):"]
        out += [f"- {c['customer']}: {c['actions_prev']} → {c['actions']} ({delta(c['actions'], c['actions_prev'])}), target ko {c['targets_failed_prev']} → {c['targets_failed']}, file {c['files_prev']} → {c['files']}" for c in drops] or ["- nessuno"]
    else:
        out.append(comparison["note"])

    out += ["", "## Totali per giorno", "", "| giorno | clienti attivi | sessioni | versioni script | like_story | like_post | comment | target ok | target ko | phantom transizioni | allarmi profilo | heartbeat ko |", "|---|---|---|---|---|---|---|---|---|---|---|---|"]
    by_day = defaultdict(list)
    for r in rows:
        by_day[r["day"]].append(r)
    for d in sorted(by_day):
        rs = by_day[d]
        versions = Counter()
        for r in rs:
            versions.update(r["script_versions"])
        versions_text = ", ".join(f"{v}×{n}" for v, n in sorted(versions.items())) or "unknown"
        out.append(f"| {d} | {sum(1 for r in rs if r['sessions'])} | {sum(r['sessions'] for r in rs)} | {versions_text} | {sum(r['actions'].get('like_story', 0) for r in rs)} | {sum(r['actions'].get('like_post', 0) for r in rs)} | {sum(r['actions'].get('comment_post', 0) for r in rs)} | {sum(r['targets_completed'] for r in rs)} | {sum(r['targets_failed'] for r in rs)} | {sum(len(r['phantom_transitions']) for r in rs)} | {sum(len(r['profile_follow_alarms']) for r in rs)} | {sum(sum(r['heartbeat_failures'].values()) for r in rs)} |")

    out += ["", "## Clienti × giorni", "", "| stato | cliente | giorno | sess | script | azioni (s/p/c) | az/h | target ok/ko (unici) | succ% | limite | cycle p95 s | motivi |", "|---|---|---|---|---|---|---|---|---|---|---|---|"]
    order = {"CRITICO": 0, "ATTENZIONE": 1, "OK": 2}
    for r in sorted(rows, key=lambda r: (order[r["status"]], r["customer"], r["day"])):
        a = r["actions"]
        version_text = ", ".join(f"{v}×{n}" for v, n in sorted(r["script_versions"].items())) or "unknown"
        sr = f"{r['target_success_rate'] * 100:.0f}" if r["target_success_rate"] is not None else "-"
        p95 = f"{r['cycle_ms']['p95'] / 1000:.0f}" if r["cycle_ms"]["p95"] else "-"
        out.append(f"| {r['status']} | {r['customer']} | {r['day'][5:]} | {r['sessions']} | {version_text} | {a.get('like_story', 0)}/{a.get('like_post', 0)}/{a.get('comment_post', 0)} | {r['actions_per_active_hour']} | {r['targets_completed']}/{r['targets_failed']} ({r['targets_failed_unique']}) | {sr} | {r['daily_limit_reached_at'] or '-'} | {p95} | {', '.join(r['reasons']) or '-'} |")

    days_sorted = sorted(by_day)
    out += ["", "## Problemi per impatto (catene raggruppate, warning attesi esclusi)", "",
            "Punteggio = peso livello (ERROR 3, WARN 1) × occorrenze autonome × clienti. I warning della stessa categoria nei 60 s precedenti un ERROR e i `Target failed` entro 5 s sono attribuiti alla catena dell'ERROR.", "",
            "| # | firma | occ (autonome) | clienti | trend | min persi | catena | esempio |", "|---|---|---|---|---|---|---|---|"]
    shown = [s for s in res["signatures"] if not s["child_only"]]
    for i, s in enumerate(shown[:meta["top"]], 1):
        trend = "→".join(str(s["days"].get(d, 0)) for d in days_sorted)
        chain = "; ".join(f"{k.split(' | ', 1)[-1][:45]} ×{v}" for k, v in list(s["children"].items())[:3]) or "-"
        ex = s["examples"][0]["ref"] if s["examples"] else ""
        out.append(f"| {i} | `{s['signature'][:100]}` | {s['count']} ({s['standalone']}) | {len(s['customers'])} | {trend} | {s['lost_min'] or '-'} | {chain} | {ex} |")
    hidden = [s for s in res["signatures"] if s["child_only"]]
    if hidden:
        out.append(f"\n{len(hidden)} firme compaiono quasi solo dentro catene e sono mostrate sotto il loro ERROR (dettagli in metrics.json).")
    if res["expected_signatures"]:
        out += ["", "Warning attesi (da expected_signatures.txt, esclusi dalla classifica): " +
                ", ".join(f"`{s['signature'].split(' | ', 1)[-1][:50]}` ×{s['count']}" for s in res["expected_signatures"][:10])]

    trans = res["phantom_transitions"]
    out += ["", f"## Phantom follow — transizioni osservate ({len(trans)})", "",
            "Cambio di stato reale durante la sessione (lista followers `follow→following` o subito dopo un click). Priorità massima.", ""]
    if trans:
        out += ["| cliente | giorno | ora | utente | target | prima→dopo | fonte | ref |", "|---|---|---|---|---|---|---|---|"]
        out += [f"| {p['customer']} | {p['day'][5:]} | {p['time']} | {p['username']} | {p['target']} | {p['before']}→{p['after']} | {p['source']} | {p['ref']} |" for p in trans[:40]]
    else:
        out.append("Nessuna.")

    alarms = res["profile_follow_alarms"]
    out += ["", f"## Profili risultati già seguiti ({len(alarms)} allarmi)", "",
            "Controllo sulla pagina profilo senza stato precedente (`before=None`): indica un profilo seguito, non quando è stato seguito. Ripetizioni sullo stesso utente sono lo stesso fatto.", ""]
    if alarms:
        grouped: dict = {}
        for p in alarms:
            g = grouped.setdefault((p["customer"], (p["username"] or "?").lower()), {"count": 0, "days": set(), "targets": set(), "contexts": Counter(), "first": p})
            g["count"] += 1
            g["days"].add(p["day"][5:])
            g["targets"].add(p["target"] or "?")
            g["contexts"][p["context"] or "?"] += 1
        out += ["| cliente | utente | target | contesti | n | giorni | primo ref |", "|---|---|---|---|---|---|---|"]
        for (c, u), g in sorted(grouped.items(), key=lambda kv: -kv[1]["count"])[:40]:
            out.append(f"| {c} | {u} | {', '.join(sorted(g['targets']))[:60]} | {', '.join(k for k, _ in g['contexts'].most_common(3))} | {g['count']} | {', '.join(sorted(g['days']))} | {g['first']['ref']} |")
    else:
        out.append("Nessuno.")

    dups = [(r["customer"], r["day"], d) for r in rows for d in r["duplicate_actions"]]
    out += ["", f"## Azioni duplicate nello stesso giorno ({len(dups)})", ""]
    out += [f"- {c} {d[5:]}: {x['type']} su {x['username']} ×{x['count']}" for c, d, x in dups[:40]] or ["Nessuna."]

    mism = [r for r in rows if "SUCCESS/DB" in " ".join(r["reasons"])]
    out += ["", f"## Differenze SUCCESS vs inserimenti DB ({len(mism)})", ""]
    out += [f"- {r['customer']} {r['day'][5:]}: SUCCESS {r['success_vs_logged']['success']} · DB {r['success_vs_logged']['logged']} ({r['success_vs_logged']['diff']:+d})" for r in mism[:30]] or ["Nessuna oltre la tolleranza (max 5 o 5%)."]

    out += ["", "## Target falliti ripetutamente (≥2 volte)", ""]
    if res["repeated_failed_targets"]:
        out += ["| target | fallimenti | clienti | giorni | errori |", "|---|---|---|---|---|"]
        for c in res["repeated_failed_targets"][:50]:
            out.append(f"| {c['username']} | {c['count']} | {', '.join(c['customers'])} | {', '.join(d[5:] for d in c['days'])} | {'; '.join(c['errors'])} |")
    else:
        out.append("Nessuno.")

    ends = Counter(s["end_reason"] for r in rows for s in r["session_details"])
    out += ["", "## Come terminano le sessioni", "",
            "`fine_finestra` = ultima riga tra HH:58 e HH:02 (kill scheduler atteso); `limite_giornaliero` = limite raggiunto nella sessione; `errore` = ultima riga ERROR; `riavviata_meta_finestra` = un nuovo processo è partito a metà ora (riavvio manuale, watchdog o crash); `fine_file_meta_finestra` = ultima sessione del file chiusa a metà ora (log copiato durante l'esecuzione, pausa o kill: da verificare). Nota: se il log viene scritto a blocchi, le ultime righe prima di un kill possono mancare (numeri di riga finali tondi); l'orario di fine è quindi un limite inferiore.", ""]
    out += [f"- {v}× {k}" for k, v in ends.most_common()]
    anomalous = [(r["customer"], r["day"], s) for r in rows for s in r["session_details"] if s["end_reason"] in INTERRUPTED_REASONS]
    if anomalous:
        out += ["", "Sessioni interrotte o terminate con errore:"]
        out += [f"- {c} {d[5:]} {s['start']}→{s['end']} ({s['end_reason']}, azioni {s['actions']}"
                + (f", riavvio dopo {s['gap_to_next_min']} min" if s["gap_to_next_min"] is not None else "")
                + f"): `{s['last_event'][:90]}` {s['ref']}" for c, d, s in anomalous[:30]]

    freezes = [(r, f) for r in rows for f in r["freezes"]]
    out += ["", f"## Freeze (gap > {FREEZE_GAP_S // 60} min senza pausa) — {len(freezes)}", ""]
    out += [f"- {r['customer']} {r['day'][5:]} {f['from']}→{f['to']} ({f['gap_min']} min, dopo `{f['prev_cat']}`) {r['log']}:{f['line']}" for r, f in freezes[:30]]

    hb = [(r["customer"], r["day"], r["heartbeat_failures"]) for r in rows if r["heartbeat_failures"]]
    out += ["", "## Heartbeat falliti", ""]
    out += [f"- {c} {d[5:]}: {json.dumps(h, ensure_ascii=False)}" for c, d, h in hb] or ["Nessuno."]

    reasons, fails = Counter(), Counter()
    for r in rows:
        reasons.update(r["completion_reasons"])
        fails.update(r["story_like_fail_reasons"])
    out += ["", "## Completion reason (tutti i clienti)", ""] + [f"- {v}× {k}" for k, v in reasons.most_common(12)]
    out += ["", "## Motivi 'Story like failed' (top)", ""] + [f"- {v}× {k}" for k, v in fails.most_common(10)]

    if scheduler is not None:
        out += ["", "## Gruppi scheduler (DB)", ""]
        if "groups" in scheduler:
            for g in scheduler["groups"]:
                iv = ", ".join(f"{i['start']:02d}-{i['end']:02d}" for i in g.get("intervals") or [])
                out.append(f"- {g['name']} (enabled={g['enabled']}, {g.get('script_version')}): {iv}")
        else:
            out.append(f"Non disponibile: {scheduler['error']}")
    out += ["", "Dettagli completi (ore, config, target falliti, catene, esempi): metrics.json", ""]
    return "\n".join(out)


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--root", default=str(REPO / "python" / "CUSTOMERS"))
    ap.add_argument("--days", type=int, default=3)
    ap.add_argument("--from", dest="date_from")
    ap.add_argument("--to", dest="date_to")
    ap.add_argument("--include-today", action="store_true")
    ap.add_argument("--customers", help="comma-separated list")
    ap.add_argument("--out")
    ap.add_argument("--top", type=int, default=40)
    ap.add_argument("--examples", type=int, default=3)
    ap.add_argument("--with-scheduler", action="store_true")
    ap.add_argument("--compare", action="store_true", help="compute the previous period of equal length if it is not in history")
    ap.add_argument("--history", default=str(DEFAULT_HISTORY))
    ap.add_argument("--no-history", action="store_true", help="do not read or write history.jsonl")
    ap.add_argument("--quiet", action="store_true", help="suppress per-customer progress")
    a = ap.parse_args()

    today = date.today()
    end = date.fromisoformat(a.date_to) if a.date_to else (today if a.include_today else today - timedelta(days=1))
    start = date.fromisoformat(a.date_from) if a.date_from else end - timedelta(days=a.days - 1)
    if start > end:
        print("Intervallo non valido: --from successivo a --to", file=sys.stderr)
        return 2
    days = [(start + timedelta(days=i)).isoformat() for i in range((end - start).days + 1)]
    root = Path(a.root)
    wanted = {c.strip() for c in a.customers.split(",")} if a.customers else None
    customers = sorted(d.name for d in root.iterdir() if d.is_dir() and (d / "LOGS").is_dir() and (not wanted or d.name in wanted))
    if not customers:
        print(f"Nessun cliente trovato in {root}", file=sys.stderr)
        return 1
    customers_filter = ",".join(sorted(wanted)) if wanted else "all"

    res = run_period(root, customers, days, a.examples, a.quiet)
    current = compact(res, days, customers_filter)

    prev_days = [(start - timedelta(days=len(days) - i)).isoformat() for i in range(len(days))]
    prev_key = f"{prev_days[0]}_{prev_days[-1]}|{customers_filter}"
    history_path = Path(a.history)
    history = [] if a.no_history else load_history(history_path)
    previous = next((h for h in history if h.get("key") == prev_key), None)
    to_save = [current]
    note = "da storico"
    if previous is None and a.compare:
        if not a.quiet:
            print(f"Calcolo periodo precedente {prev_days[0]} -> {prev_days[-1]} ...", flush=True)
        prev_res = run_period(root, customers, prev_days, 1, True)
        if prev_res["rows"]:
            previous = compact(prev_res, prev_days, customers_filter)
            to_save.append(previous)
            note = "calcolato ora"
    comparison = build_comparison(current, previous, note if previous else
                                  f"Nessun dato per il periodo precedente ({prev_days[0]} → {prev_days[-1]}): usa --compare per calcolarlo (se i log esistono ancora).")
    if not a.no_history and not meta_partial(today, days):
        save_history(history_path, to_save)

    meta = {"from": days[0], "to": days[-1], "generated": datetime.now().strftime("%Y-%m-%d %H:%M"), "customers": len(customers),
            "files": len(res["rows"]), "lines": sum(r["lines"] for r in res["rows"]), "script_versions": current["script_versions"], "top": a.top,
            "partial_day": today.isoformat() if meta_partial(today, days) else None}
    scheduler = fetch_scheduler() if a.with_scheduler else None

    out_dir = Path(a.out) if a.out else REPO / "logs" / "log-analysis" / f"{days[0]}_{days[-1]}"
    out_dir.mkdir(parents=True, exist_ok=True)
    (out_dir / "metrics.json").write_text(json.dumps({"meta": meta, **res, "comparison": comparison, "scheduler": scheduler},
                                                     ensure_ascii=False, indent=1), encoding="utf-8")
    (out_dir / "summary.md").write_text(build_summary(meta, res, comparison, scheduler), encoding="utf-8")
    print(f"OK {meta['files']} file, {meta['lines']:,} righe -> {rel(out_dir / 'summary.md')} , {rel(out_dir / 'metrics.json')}")
    return 0


def meta_partial(today: date, days: list[str]) -> bool:
    return today.isoformat() in days


if __name__ == "__main__":
    sys.exit(main())
