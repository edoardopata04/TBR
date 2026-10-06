# Problemi noti — log automazione

Elenco dei problemi già conosciuti. La skill `log-analysis` li riporta solo come stato
(risolto / persistente / peggiorato). Aggiorna questo file quando un problema viene
scoperto, corretto o chiuso.

Formato: `- [stato] firma o sintomo — contesto — data/commit fix (se presente)`

- [fix applicato, da verificare] Card dashboard non "running" per script avviati dallo scheduler — il PID non è nel process-registry Next.js; `app/api/admin/android-phones/route.ts` ora considera valido un heartbeat recente — 2026-09-24
- [fix applicato, da verificare] `WARN heartbeat | Heartbeat request failed` (HTTP 500 / WinError 10061 / timed out) — dashboard su porta 3005 non raggiungibile; lo scheduler ora passa `HEARTBEAT_API_URL` e `SCRIPT_VERSION` ai processi figli — 2026-09-23
- [in osservazione] `ERROR phantom_follow | PHANTOM FOLLOW ...` — rilevati passaggi a following con follow disabilitato; monitorare frequenza e contesto (tap_forensics)
- [atteso] Sessioni che terminano senza una riga di chiusura all'orario di fine intervallo — kill dello scheduler a fine finestra
- [atteso] `DEBUG process | comments disabled by config` / `like_post disabled by config` — dipende dalla configurazione del cliente
