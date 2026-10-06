---
name: log-analysis
description: Analisi approfondita dei log automazione Instagram (python/CUSTOMERS) degli ultimi giorni, con problemi prioritizzati, evidenze, confronto col periodo precedente e fix nel codice
argument-hint: "[giorni=3 | YYYY-MM-DD..YYYY-MM-DD] [clienti=tutti] [--include-today] [focus]"
allowed-tools:
  - read
  - grep
  - glob
  - exec
  - edit
permissions:
  allow:
    - Exec(python .devin/skills/log-analysis/analyze_logs.py)
    - Write(logs/log-analysis/**)
---

# Analisi approfondita log automazione

## Obiettivo
Trovare i problemi che riducono le azioni effettive (like_story, like_post, comment_post) o mettono
a rischio gli account, quantificarne l'impatto e indicare dove intervenire nel codice.
Non descrivere i log: produci problemi prioritizzati con evidenze verificabili. Rispondi in italiano.
Per esempi d'uso, opzioni, output e limiti, vedi `USAGE.md` nella stessa directory.

## Parametri (dagli argomenti dell'utente)
- Periodo: default ultimi 3 giorni completi (oggi escluso). Accetta `N` giorni, `YYYY-MM-DD..YYYY-MM-DD`,
  `--include-today` (la giornata odierna è parziale: non confrontarla 1:1).
- Clienti: default tutti; altrimenti elenco di cartelle in `python/CUSTOMERS/`.
- Focus opzionale (es. "phantom follow", "navigazione", "un cliente"): approfondisci quello per primo.
- **Versione automazione:** se l'utente indica una versione (es. `scriptv4`), usala come ipotesi iniziale,
  ma verifica che corrisponda a ciascun cliente/sessione nei log. Se non è indicata, cercala in
  `script_version`, nel comando di avvio o nei marker di startup. Se non è esplicita, inferiscila solo da
  firme di log confrontate con il sorgente e marca la conclusione come IPOTESI; le cartelle clienti
  possono contenere versioni diverse.
Se gli argomenti sono ambigui usa i default e dichiaralo nel report.

## Vincoli
- Nessuna modifica a codice, DB, processi, `known_issues.md`, `expected_signatures.txt` o ai file della skill.
- Uniche scritture ammesse: output dello script e il report finale `analysis.md`, entrambi in
  `logs/log-analysis/` (cartella ignorata da git).
- Mai riportare segreti (.env, token, chiavi, connection string).
- I log sono enormi (~30k righe/cliente/giorno, milioni in totale): **non leggerli per intero**.
  Parti sempre dall'output dello script; leggi i log grezzi solo con `read` mirato (offset ±40 righe)
  sui riferimenti `file:riga` forniti dallo script o con `grep` su una firma precisa.
- Ogni affermazione è FATTO (con `file:riga` o conteggio dello script), IPOTESI (con come verificarla)
  o RACCOMANDAZIONE. Se un segnale non è presente nei log, scrivilo invece di dedurlo.

## Fase 0 — Aggregazione (obbligatoria)
Esegui dalla root del repo (circa 2-5 minuti per 3 giorni su tutti i clienti; di più se deve calcolare
anche il periodo precedente):

```
python .devin/skills/log-analysis/analyze_logs.py [--days N | --from YYYY-MM-DD --to YYYY-MM-DD] [--include-today] [--customers a,b] --with-scheduler --compare --quiet
```

Poi leggi `logs/log-analysis/<from>_<to>/summary.md` (compatto). Usa `metrics.json` solo per dettagli
mirati (con `grep` sul nome cliente/firma, non leggerlo tutto). Leggi anche
`.devin/skills/log-analysis/known_issues.md`.

Cosa produce lo script:
- **Confronto con il periodo precedente** di pari durata (da `logs/log-analysis/history.jsonl`, oppure
  calcolato con `--compare`): totali, firme in aumento/calo, clienti con calo di azioni. Se compare
  l'avviso di copertura (numero di file diverso), non confrontare le variazioni assolute 1:1.
- **Per cliente×giorno**: sessioni e versione dello script rilevata per sessione (versioni non marcate
  nei log vecchi risultano `unknown`; eventuale differenza tra modulo reale e `SCRIPT_VERSION` configurata
  viene evidenziata), azioni `SUCCESS` (tutte le varianti "Story liked…" contano come like storia),
  confronto con gli inserimenti DB (`supabase_log`), target completati/falliti (anche unici), tempo perso,
  cicli, limiti, heartbeat, freeze, stato OK/ATTENZIONE/CRITICO con motivi.
- **Problemi per impatto**: firme WARN/ERROR con catene raggruppate (i WARN della stessa categoria nei 60 s
  prima di un ERROR e i `Target failed` entro 5 s sono attribuiti a quell'ERROR, con i minuti persi).
  I warning di routine elencati in `expected_signatures.txt` sono esclusi dalla classifica.
- **Phantom follow separati**: *transizioni osservate* (`follow→following` in lista o dopo un click, gravi)
  e *profili risultati già seguiti* (controllo profilo con `before=None`, raggruppati per utente: non
  indicano quando è avvenuto il follow).
- **Come terminano le sessioni**: `fine_finestra` (atteso), `limite_giornaliero`, `errore`,
  `riavviata_meta_finestra` (nuovo processo a metà ora, con minuti di silenzio prima del riavvio),
  `fine_file_meta_finestra`.
- Target falliti ripetutamente, azioni duplicate, gruppi scheduler dal DB (`--with-scheduler`).

Formato riga log: `[YYYY-MM-DD HH:MM:SS] LEVEL categoria | messaggio | k=v k=v`
(LEVEL ∈ INFO, WARN, ERROR, SUCCESS, DEBUG). Orari locali del PC.

## Fase 1 — Classificazione e priorità
Parti dalle tabelle del summary e assegna la gravità:
- **CRITICA**: rischio account (action block, challenge, login richiesto, "Try again later"),
  phantom follow *transizioni*, azioni duplicate, unfollow senza transizione reale
  not-following → following, cliente con 0 azioni in un giorno con sessioni.
- **ALTA**: tasso successo target < 70% (guarda anche i target *unici* falliti), catene di errori su molti
  clienti o in crescita rispetto al periodo precedente, sessioni riavviate a metà finestra ripetute,
  freeze, heartbeat falliti prolungati (card dashboard non "running"), differenze SUCCESS/DB.
- **MEDIA**: profili risultati già seguiti (da verificare manualmente), rallentamenti (cycle p95 alto,
  `story_detect | Poll took too long`), stall ripetuti, errori recuperati automaticamente.
- **BASSA**: warning attesi o cosmetici: citali solo in appendice.

Confronta con `known_issues.md`: i problemi noti vanno riportati solo come stato
(risolto / persistente / peggiorato), usando il confronto col periodo precedente come evidenza.

## Fase 2 — Approfondimento top problemi (default 5, o il focus richiesto)
Per ciascuno:
1. Identifica prima la versione in esecuzione per cliente/sessione usando marker espliciti nei log o nel comando di avvio. Non assumere che tutti i clienti usino la stessa versione.
2. Leggi 2-3 esempi dai riferimenti `file:riga` (±40 righe): cosa si aspettava lo script, cosa ha trovato
   (schermata, resource-id, package, polling, tap precedenti; per phantom follow usa anche le righe
   `tap_forensics` subito dopo l'evento).
3. Distingui la causa: UI Instagram cambiata / account target (privato, rinominato, inesistente) /
   dispositivo-ADB-uiautomator (lentezza, UiObjectNotFound) / logica dello script / rete-dashboard.
4. Cerca prima nel sorgente della versione identificata; confronta `scriptv3_1_1`, `scriptv4` e
   `scriptv3_1_1_remoto` solo se la versione è ignota o il comportamento differisce. Indica funzione e
   `file:riga` dell'implementazione effettivamente compatibile con i log.
5. Proponi un fix concreto e come verificarlo (quale firma/metrica deve calare nel prossimo confronto).

Indizio per i log del 22–24 settembre 2026: `label_find | Searching for See more label | min_y=0` e
un match con bounds `y=0..60` sono compatibili con il default di `scriptv4`; `scriptv3_1_1` attuale
calcola invece una soglia minima pari al 10% dell'altezza dello schermo. Usalo come indizio, non come
prova della versione: potrebbe trattarsi anche di una build precedente/non aggiornata.

## Fase 3 — Controlli specifici (scrivi "nessuna evidenza" se assente)
- Come terminano le sessioni: `fine_finestra` è atteso; approfondisci `riavviata_meta_finestra` ed `errore`
  (cosa succedeva prima del silenzio, chi ha riavviato). I log possono perdere le ultime righe prima di un kill.
- Attività fuori dagli intervalli dei gruppi scheduler o intervalli senza attività.
  L'associazione cliente→gruppo non è nei log: se serve, indicala come verifica da fare.
- Target falliti su ≥2 giorni o ≥2 clienti → lista per revisione manuale.
- Clienti con limite giornaliero mai raggiunto e poche azioni/ora, oppure raggiunto molto presto.

## Output
Scrivi il report completo in `logs/log-analysis/<from>_<to>/analysis.md` (sovrascrivi se esiste) e in chat
riporta l'executive summary, i top problemi in forma breve e il percorso del file. Struttura del report:
1. **Executive summary** (max 8 righe): salute generale, variazione rispetto al periodo precedente,
   i 3 problemi a maggior impatto.
2. **Tabella clienti critici/attenzione** (dal summary), con motivo in una riga.
3. **Top problemi**: gravità · firma · occorrenze/clienti/trend/variazione · evidenze `file:riga`
   · causa (FATTO/IPOTESI) · codice da modificare `file:riga` · fix proposto · verifica.
4. **Problemi noti**: stato di ciascuno.
5. **Target da revisionare manualmente.**
6. **Azioni consigliate**: oggi / modifiche al codice / monitoraggio.
7. **Appendice**: comando eseguito, percorso di summary/metrics, eventuali limiti dell'analisi.

Nel report usa percorsi `file:riga` relativi alla root del repo; in chat usa
`<ref_snippet file="..." lines="..." />` per citare log e codice.
Al termine, se hai scoperto un problema stabile nuovo o un warning di routine da escludere, proponi
(senza scriverla) la riga da aggiungere a `known_issues.md` o `expected_signatures.txt`.
