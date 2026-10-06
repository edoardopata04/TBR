# Guida all'uso della skill `log-analysis`

Questa guida spiega come avviare e interpretare l'analisi dei log dell'automazione in `python/CUSTOMERS/`.
La skill è pensata per investigare problemi e proporre interventi: non modifica il codice, il database o i processi.

## Avvio rapido in Devin

Dalla conversazione nel progetto, invoca:

```text
/log-analysis
```

Senza altri parametri analizza gli **ultimi 3 giorni completi**, escludendo oggi, e include tutti i clienti con directory `LOGS`.
La skill esegue l'aggregatore, legge il report sintetico e approfondisce i problemi più rilevanti nei log e nel codice.

Puoi aggiungere periodo, clienti o un argomento prioritario in linguaggio naturale:

```text
/log-analysis analizza gli ultimi 5 giorni completi per tutti i clienti, focus sui phantom follow
/log-analysis dal 2026-09-22 al 2026-09-24 per allastrozza e autopo_cupra_ferrara
/log-analysis analizza anche oggi (giornata parziale) e concentra l'indagine sugli errori di navigazione
```

Le date devono essere nel formato `YYYY-MM-DD`. Se periodo o clienti non sono specificati chiaramente, la skill usa i default sopra e lo dichiara.

## Versione dello script nei log

La directory del log non identifica necessariamente la versione di automazione usata durante quella sessione. Le versioni modulari selezionabili dalla dashboard (`v2_1`, `v2_1_1`, `v2_2`, `v2_3`, `v2_3_1`, `v3_1_1`, `v3_1_1_remoto`, `v4`) e gli entrypoint legacy (`08`, `08_local`, `11`, `15`) ora scrivono all'avvio `INFO startup | Automation script starting | script_version=... module=...`. Nei moduli più recenti sono inclusi anche `configured_script_version`, PID e run ID; lo script 15 registra inoltre la sua code version (`15.2.0`). L'aggregatore associa il marker alla sessione e mostra le versioni per cliente/giorno. Per i log precedenti al marker la versione appare `unknown`; se è presente e `configured_script_version` non coincide col modulo effettivo, la tabella segnala il mismatch.

Per determinare la versione dei log storici, cerca prima marker espliciti nel log o nel comando di avvio. In assenza di marker confronta le firme con le implementazioni e dichiara l'identificazione come ipotesi.

Per i log del 22–24 settembre 2026, `label_find | Searching for See more label | min_y=0` con match a `bounds=(220, 0, 261, 60)` è coerente con il default di ricerca dall'alto presente in `scriptv4`. Il `scriptv3_1_1` attuale filtra invece la fascia superiore usando una soglia del 10% dell'altezza. Questo suggerisce v4 oppure una build v3 precedente alla correzione, ma non dimostra da solo quale binario fosse attivo.

## Eseguire solo l'aggregazione da PowerShell

Apri PowerShell nella root del repository:

```powershell
cd "C:\Users\produ\Desktop\SSL\Admin_SSL"
python .devin\skills\log-analysis\analyze_logs.py --with-scheduler --compare
```

Questo elabora gli ultimi tre giorni completi per tutti i clienti e li confronta con i tre giorni precedenti. Lo script legge i log in streaming e genera il report e i dati grezzi aggregati, ma non formula da solo una diagnosi: per l'analisi ragionata usa `/log-analysis`.

### Opzioni supportate dall'aggregatore

| Obiettivo | Esempio |
|---|---|
| Ultimi N giorni completi | `python .devin\skills\log-analysis\analyze_logs.py --days 5` |
| Intervallo esplicito inclusivo | `python .devin\skills\log-analysis\analyze_logs.py --from 2026-09-22 --to 2026-09-24` |
| Includere oggi (parziale) | aggiungi `--include-today` senza specificare `--to` |
| Selezionare clienti | `--customers allastrozza,enerpay.it` |
| Leggere gruppi scheduler | `--with-scheduler` |
| Cambiare cartella d'output | `--out logs\analisi-personalizzata` |
| Cambiare root dei clienti | `--root "D:\dati\CUSTOMERS"` |
| Più firme di errore nel riepilogo | `--top 60` |
| Più esempi per firma nei dati | `--examples 5` |
| Confronto col periodo precedente | `--compare` (lo calcola se non è già nello storico) |
| Non leggere/scrivere lo storico | `--no-history` |
| Storico in un altro file | `--history logs\altro-storico.jsonl` |
| Nascondere l'avanzamento per cliente | `--quiet` |
| Vedere tutte le opzioni | `python .devin\skills\log-analysis\analyze_logs.py --help` |

`--days` e `--from`/`--to` sono modalità alternative. L'intervallo `--from`/`--to` include entrambe le date.
Per includere esplicitamente oggi in un intervallo, imposta `--to` alla data odierna; il report segnalerà che è parziale.

### Attenzione a `--with-scheduler`

Questa opzione fa una richiesta **in sola lettura** alla tabella `scheduler_groups` usando URL e chiave già configurati nel `.env`.
Prima di usarla, verifica localmente che l'URL punti al progetto desiderato (ad esempio dev e non produzione).
La chiave non viene stampata nel report. Se la configurazione o la tabella non sono disponibili, l'aggregazione dei log continua e il report indica che i gruppi non sono stati recuperati.

### Storico e confronto con il periodo precedente

Ogni esecuzione su giorni completi salva un riepilogo compatto in `logs/log-analysis/history.jsonl` (totali, clienti, conteggi per firma).
Il periodo precedente ha la stessa durata e finisce il giorno prima dell'inizio (per 22–24 settembre: 19–21 settembre).

- Se il periodo precedente è già nello storico, il confronto è immediato.
- Altrimenti `--compare` lo calcola dai log, se esistono ancora (i log vengono puliti dopo circa 7 giorni), e lo salva nello storico.
- Le esecuzioni che includono oggi non vengono salvate nello storico, perché la giornata è parziale.
- Lo storico distingue anche il filtro clienti: un'analisi su `--customers a,b` si confronta solo con analisi sugli stessi clienti.

### Warning attesi

`expected_signatures.txt` elenca i warning di routine (ad esempio `No new rows — scrolling`) da escludere dalla classifica dei problemi.
Restano contati in `metrics.json` e in una riga del summary. Aggiungi una riga solo dopo aver verificato che il messaggio sia davvero normale: un warning escluso non verrà più approfondito.

## File generati

Con le opzioni predefinite, i risultati sono scritti in:

```text
logs/log-analysis/<data-inizio>_<data-fine>/summary.md
logs/log-analysis/<data-inizio>_<data-fine>/metrics.json
logs/log-analysis/<data-inizio>_<data-fine>/analysis.md   (scritto da /log-analysis)
logs/log-analysis/history.jsonl
```

- **`summary.md`**: confronto col periodo precedente, tabelle per giorno/cliente, problemi per impatto con catene raggruppate, phantom follow separati, differenze SUCCESS/DB, target falliti ricorrenti, fine delle sessioni, heartbeat e altri indicatori.
- **`metrics.json`**: risultati dettagliati per cliente e giorno, riferimenti `file:riga`, catene di errori, esempi e dettagli da consultare durante l'indagine.
- **`analysis.md`**: il report finale ragionato della skill (executive summary, top problemi, cause, fix proposti), da conservare o condividere.
- **`history.jsonl`**: storico compatto usato per i confronti tra periodi.

I file sono output locali di analisi e non vanno condivisi senza controllare che non contengano informazioni operative sensibili.

## Come leggere i risultati

- **FATTO**: dato direttamente presente nel log o conteggio prodotto dallo script. Una citazione `file:riga` individua l'evidenza nel log.
- **IPOTESI**: spiegazione possibile; deve essere accompagnata da un controllo che possa confermarla o smentirla.
- **RACCOMANDAZIONE**: intervento suggerito, non una modifica già applicata.
- **CRITICO / ATTENZIONE / OK**: priorità del singolo cliente-giorno, non una diagnosi automatica definitiva. La skill deve motivare la classificazione con gli indicatori elencati nella tabella.
- **Firma**: messaggio WARN/ERROR normalizzato per aggregare occorrenze simili; controlla gli esempi e il contesto prima di concludere che condividano la stessa causa.
- **Catena**: i WARN della stessa categoria nei 60 secondi prima di un ERROR, e i `Target failed` entro 5 secondi, sono attribuiti a quell'ERROR. La colonna "occ (autonome)" indica quante occorrenze restano fuori da catene; le firme quasi sempre dentro una catena non compaiono da sole in classifica. "min persi" somma il tempo speso sui target poi falliti.
- **Punteggio di impatto**: peso del livello (ERROR 3, WARN 1) × occorrenze autonome × numero di clienti. Serve a ordinare, non misura il danno reale.
- **Phantom follow — transizioni osservate**: il pulsante di una riga è passato da `follow` a `following` durante la sessione, o lo stato è cambiato subito dopo un click. È il segnale più grave: verificare con le righe `tap_forensics`.
- **Profili risultati già seguiti**: il controllo sulla pagina profilo trova un profilo seguito, senza uno stato precedente (`before=None`). Indica che il profilo è seguito, non quando né da chi è stato seguito; le ripetizioni sullo stesso utente sono lo stesso fatto.
- **SUCCESS vs DB**: differenza tra le righe `SUCCESS` e gli inserimenti `supabase_log`; è segnalata solo oltre 5 azioni o il 5%.
- **Fine sessione**: `fine_finestra` (ultima riga tra HH:58 e HH:02, kill dello scheduler atteso), `limite_giornaliero`, `errore`, `riavviata_meta_finestra` (un nuovo processo parte a metà ora; viene indicato quanti minuti di silenzio lo precedono), `fine_file_meta_finestra` (ultima sessione del file chiusa a metà ora). Le ultime righe prima di un kill possono mancare se il log è scritto a blocchi.
- **Freeze**: intervallo superiore a 25 minuti fra righe di log, escluse categorie di pausa note. È un indicatore, non prova da solo che il processo fosse bloccato.
- **Target falliti**: un target può fallire per navigazione, profilo non disponibile o altri motivi. Verifica il contesto prima di attribuire il problema al codice o al target.
- **Log mancanti**: indicano che non è stato trovato il file atteso; non equivalgono a zero azioni o a un cliente inattivo.

## Limiti da tenere presenti

- I dati derivano dai log locali presenti: file mancanti, rotazioni o registrazioni incomplete limitano le conclusioni.
- `processed_users` è un file di stato e non necessariamente il conteggio delle sole azioni riuscite; non usarlo da solo come numero di like/follow.
- I conteggi `SUCCESS` e gli insert `supabase_log` sono indicatori distinti. In caso di differenze vanno investigati, non sommati automaticamente.
- Il collegamento cliente → gruppo scheduler non è ricavabile sempre dai soli log. Gli intervalli del database non dimostrano da soli quale gruppo sia stato assegnato a ogni dispositivo.
- Le righe senza chiusura esplicita non dimostrano da sole un crash: lo scheduler può terminare i processi alla fine dell'intervallo. Verifica scheduler, processi e sessioni prima di concludere.
- I problemi registrati in `known_issues.md` vengono controllati come persistenti/risolti/peggiorati. Aggiorna quel file solo dopo aver verificato un cambiamento.

## Flusso consigliato

1. Avvia `/log-analysis` con periodo e clienti desiderati.
2. Controlla che periodo, numero di clienti, file mancanti e giornata parziale siano corretti.
3. Leggi il riepilogo e scegli i problemi a maggior impatto; non trattare i warning più frequenti automaticamente come i più gravi.
4. Per ogni problema, verifica i riferimenti `file:riga`, il contesto circostante e la funzione corrispondente nel codice.
5. Se serve, chiedi un'analisi focalizzata, per esempio: `/log-analysis focus phantom follow su crisgolf_ dal 2026-09-22 al 2026-09-24`.
6. Usa le raccomandazioni come base per una successiva richiesta di modifica separata. Questa skill non applica fix.
7. Dopo un fix, rilancia `/log-analysis` sul periodo successivo: il confronto mostra se la firma corrispondente è calata.
