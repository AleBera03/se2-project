# Office Queue Management System

Applicazione web per gestire le code di un ufficio con più servizi e sportelli. Il cliente richiede un ticket senza autenticarsi; l’operatore accede al proprio sportello e chiama il prossimo cliente.

## Indice

- [1. Tecnologie e requisiti](#1-tecnologie-e-requisiti)
- [2. Installazione e avvio](#2-installazione-e-avvio)
- [3. Funzionalità](#3-funzionalità)
- [4. Utilizzo](#4-utilizzo)
- [5. Regole di selezione e gestione giornaliera](#5-regole-di-selezione-e-gestione-giornaliera)
  - [5.1 Selezione della coda e del ticket](#51-selezione-della-coda-e-del-ticket)
  - [5.2 Codici e gestione giornaliera](#52-codici-e-gestione-giornaliera)
- [6. Server-side](#6-server-side)
  - [6.1 API](#61-api)
  - [6.2 Tabelle del database](#62-tabelle-del-database)
  - [6.3 Configurazione](#63-configurazione)
  - [6.4 File principali](#64-file-principali)
- [7. Client-side](#7-client-side)
  - [7.1 Routes](#71-routes)
  - [7.2 Componenti React](#72-componenti-react)
  - [7.3 Hook, context e API](#73-hook-context-e-api)
- [8. Test e verifiche](#8-test-e-verifiche)

## 1. Tecnologie e requisiti

| Componente | Tecnologie |
| --- | --- |
| Frontend | React, Vite, React Router, Bootstrap, React Bootstrap, Bootstrap Icons |
| Backend | Node.js 24.x, npm, Express, Passport, express-session |
| Database | SQLite tramite sqlite3 |
| Verifiche | Vitest, Supertest, ESLint, node:sqlite per alcuni test |

```bash
node --version
npm --version
```

## 2. Installazione e avvio

1. **Clonare la repository e installare le dipendenze:**

   ```bash
   git clone https://github.com/AleBera03/se2-project.git
   cd se2-project
   npm --prefix server ci
   npm --prefix frontend ci
   ```

   `npm ci` crea le cartelle `node_modules` installando le versioni delle dipendenze indicate nei file `package-lock.json`.

2. **Avviare il backend in un terminale dalla cartella principale:**

   ```bash
   npm --prefix server run dev
   ```

   Il backend risponde su `http://localhost:3001`. Per avviarlo senza riavvio automatico usare `npm --prefix server start`.

3. **Avviare il frontend in un secondo terminale dalla cartella principale:**

   ```bash
   npm --prefix frontend run dev
   ```

   Il frontend è disponibile su `http://localhost:5173`.

## 3. Funzionalità

| Area | Funzionalità | Descrizione |
| --- | --- | --- |
| Cliente | Servizi disponibili | Visualizzazione dei servizi presenti nel database |
| Cliente | Emissione ticket | Selezione del servizio e creazione di un codice con prefisso e progressivo giornaliero |
| Cliente | Conferma | Visualizzazione di codice, servizio e data di emissione |
| Cliente | Chiusura conferma | Manuale o automatica dopo 20 secondi |
| Operatore | Login | Accesso con un account predefinito associato a uno sportello |
| Operatore | Next customer | Selezione e assegnazione atomica del prossimo ticket tra le code compatibili |
| Operatore | Risultato | Visualizzazione del ticket chiamato o del messaggio di coda vuota |
| Operatore | Logout | Chiusura della sessione |
| Persistenza | Database | Memorizzazione di servizi, sportelli, account e ticket in SQLite |
| Persistenza | Storico | Conservazione dei ticket già serviti e delle giornate precedenti |

## 4. Utilizzo

**Cliente**

1. Aprire la pagina cliente e selezionare un servizio.
2. Annotare il codice mostrato nella conferma.
3. Chiudere la conferma oppure attendere 20 secondi.
4. Se necessario, selezionare un altro servizio. In caso di errore durante l’emissione, usare il pulsante **Retry**.

**Operatore**

1. Aprire `/counter` e accedere con uno degli account demo:

   | Sportello | Username | Password |
   | --- | --- | --- |
   | Counter 1 | `counter1` | `Counter1!` |
   | Counter 2 | `counter2` | `Counter2!` |
   | Counter 3 | `counter3` | `Counter3!` |
   | Counter 4 | `counter4` | `Counter4!` |
   | Counter 5 | `counter5` | `Counter5!` |

   Gli account vengono creati automaticamente per gli sportelli privi di account. Non è prevista la registrazione. Nel database sono salvati hash e salt delle password. Le credenziali indicate appartengono alla configurazione iniziale demo.

2. Premere **Next customer** per chiamare il prossimo ticket. La pagina mostra codice e servizio oppure **No customers waiting.** L’operatore può gestire soltanto lo sportello associato al proprio account.

3. Premere **Log out** per terminare la sessione.

## 5. Regole di selezione e gestione giornaliera

### 5.1 Selezione della coda e del ticket

1. Considerare soltanto i servizi gestiti dallo sportello che hanno almeno un ticket in attesa nella giornata corrente.
2. Scegliere la coda con più ticket in attesa.
3. A parità di lunghezza, scegliere il tempo medio di servizio minore.
4. A ulteriore parità, scegliere il servizio con ID minore.
5. Selezionare il ticket più vecchio per `created_at`, risolvendo timestamp uguali con l’ID minore.

Dopo la selezione del prossimo ticket, l’assegnazione segue queste regole:

- **Assegnazione:** associa il ticket allo sportello e imposta subito lo stato a `served`, rimuovendolo dalla coda di attesa.
- **Code vuote:** non viene assegnato alcun ticket e l’API restituisce `null`.
- **Transazioni:** emissione e assegnazione utilizzano la stessa coda di transazioni sul database.

### 5.2 Codici e gestione giornaliera

La numerazione dei ticket e le code vengono gestite per servizio e giornata, secondo le seguenti regole:

- **Formato:** lettera del servizio e progressivo di tre cifre, ad esempio `A000`.
- **Progressivo:** è indipendente per servizio e giornata; parte da `000`, arriva a `999` e riparte da `000`.
- **Riutilizzo del codice:** viene bloccato con risposta HTTP `409` se lo stesso codice è ancora in attesa nella giornata corrente.
- **Identificativo univoco:** l’ID distingue ogni ticket, anche quando il codice viene riutilizzato.
- **Fuso orario:** date e timestamp utilizzano UTC.
- **Code giornaliere:** il conteggio dei ticket in attesa e l’aggiornamento a `served` considerano la data UTC corrente.
- **Storico:** i ticket delle giornate precedenti vengono conservati nel database.

## 6. Server-side

### 6.1 API

Base URL: `http://localhost:3001/api`

| Metodo | Percorso | Accesso | Risposta principale |
| --- | --- | --- | --- |
| GET | `/api/health` | Pubblico | `200`, `{"status":"ok"}` |
| GET | `/api/services` | Pubblico | `200`, elenco di ID e nomi |
| POST | `/api/tickets` | Pubblico | `201`, ticket creato |
| POST | `/api/sessions` | Pubblico | `201`, account autenticato |
| GET | `/api/sessions/current` | Autenticato | `200`, account corrente; `401` senza sessione |
| DELETE | `/api/sessions/current` | Sessione, se presente | `204`, logout |
| POST | `/api/counters/:counterId/next` | Account dello sportello | `200`, ticket assegnato oppure JSON `null` |


**Errori:** hanno forma `{"error":"messaggio"}`:

- `400`: parametri non validi.
- `401`: credenziali errate o sessione assente.
- `403`: richiesta per uno sportello diverso da quello dell’account.
- `404`: servizio inesistente; per Next customer, sportello assente dopo i controlli di autorizzazione.
- `409`: codice ticket ancora in attesa nella giornata corrente.
- `500`: errore del server.

**Esempi di richieste e risposte:**

| Endpoint | Request body | Response body di successo |
| --- | --- | --- |
| `GET /api/services` | Nessuno | `[{"id":1,"name":"Postal Payment Slips (up to 5)"}]` |
| `POST /api/tickets` | `{"serviceId":1}` | `{"id":1,"code":"A000","service_id":1,"status":"waiting","created_at":"2026-10-11T09:00:00.000Z"}` |
| `POST /api/sessions` | `{"username":"counter1","password":"Counter1!"}` | `{"id":1,"username":"counter1","counterId":1}` |
| `GET /api/sessions/current` | Nessuno | `{"id":1,"username":"counter1","counterId":1}` |
| `DELETE /api/sessions/current` | Nessuno | Nessun contenuto |
| `POST /api/counters/:counterId/next` | Nessuno | Dati del ticket con `service_name`, `status: "served"` e `counter_id`, oppure `null` |

### 6.2 Tabelle del database

| Tabella | Campi | Descrizione |
| --- | --- | --- |
| `Service` | `id`, `name`, `code`, `service_time` | Servizi, prefissi e tempi medi di servizio |
| `Counter` | `id`, `name` | Sportelli |
| `CounterService` | `counter_id`, `service_id` | Associazioni tra sportelli e servizi |
| `CounterAccount` | `id`, `username`, `hash`, `salt`, `counter_id` | Credenziali e sportello associato all’account |
| `Ticket` | `id`, `daily_number`, `ticket_date`, `code`, `service_id`, `status`, `created_at`, `counter_id` | Ticket emessi e relativa assegnazione |

| Sportello | Prefissi dei servizi compatibili |
| --- | --- |
| Counter 1 | A, B, C |
| Counter 2 | A, B, F |
| Counter 3 | C, D |
| Counter 4 | E, I, J |
| Counter 5 | F, G, H, K, L |

Il database viene inizializzato automaticamente e conserva la configurazione dell’ufficio e i ticket, secondo le seguenti regole:

- **Inizializzazione:** se il database non esiste, il backend lo crea e inserisce 12 servizi, 5 sportelli, le associazioni tra sportelli e servizi e gli account demo. Agli avvii successivi mantiene i dati già presenti e crea soltanto gli account mancanti.
- **Servizi:** i nomi e i relativi tempi medi di servizio, espressi in minuti, sono definiti in `server/init/init-db.js`.
- **Stati:** `waiting` indica un ticket in attesa; `served` indica un ticket chiamato e associato allo sportello.

### 6.3 Configurazione

| Variabile backend | Valore predefinito | Funzione |
| --- | --- | --- |
| `PORT` | `3001` | Porta del backend |
| `DB_PATH` | `server/oqms.sqlite` | Percorso del database. Se non specificato, viene usato `server/oqms.sqlite` |
| `NODE_ENV` | Non impostata dagli script di avvio | Durante i test viene impostata automaticamente a `test`, usando `server/oqms-test.sqlite` se `DB_PATH` non è specificata |
| `SESSION_SECRET` | Generato a ogni avvio | Segreto per firmare il cookie della sessione |

La comunicazione tra frontend e backend e le variabili di configurazione sono gestite come segue:

- **Comunicazione frontend–backend:** le richieste del frontend usano `BASE_URL` in `frontend/src/API/API.mjs`, attualmente `http://localhost:3001/api`. Il backend permette l’origine `http://localhost:5173` con credenziali CORS. Vite configura inoltre un proxy `/api` verso la porta 3001.
- **Variabili:** possono essere impostate nel terminale prima dell’avvio. I file `.env` non vengono letti automaticamente.
- **Indirizzi:** se si cambiano porte o indirizzi, aggiornare `BASE_URL`, CORS e proxy Vite. Anche la preview frontend richiede un’origine consentita dal backend.

### 6.4 File principali

| File | Responsabilità |
| --- | --- |
| `server/index.js` | Avvio del backend |
| `server/app.js` | Endpoint, autenticazione e sessioni |
| `server/db.js` | Connessione, inizializzazione e coda delle transazioni |
| `server/dao/ticket-dao.js` | Lettura e scrittura di servizi, code e ticket |
| `server/dao/auth-dao.js` | Verifica delle credenziali e recupero degli account |
| `server/queueService.js` | Selezione della coda e assegnazione del prossimo ticket |
| `server/init/init-db.js` | Configurazione iniziale di servizi e sportelli |
| `server/init/init-accounts.js` | Creazione degli account demo mancanti |
| `server/oqms-schema.sql` | Tabelle, indici e vincoli |


## 7. Client-side

### 7.1 Routes

| Route | Pagina | Descrizione | Parametri |
| --- | --- | --- | --- |
| `/` | `CustomerPage` | Selezione del servizio ed emissione del ticket, senza login | Nessuno |
| `/customer` | `CustomerPage` | Accesso alternativo alla pagina cliente | Nessuno |
| `/counter` | `OfficerPage` | Form di login oppure sportello dell’operatore autenticato | Nessuno |
| Altri percorsi | — | Reindirizzamento a `/` | — |

### 7.2 Componenti React

| Area | Componente | Descrizione |
| --- | --- | --- |
| `pages` | `CustomerPage` | Organizza selezione del servizio, messaggi e conferma del ticket |
| `pages` | `OfficerPage` | Mostra login oppure il componente Next customer |
| `components/layout` | `Layout` | Mostra la navbar opzionale e le pagine tramite `Outlet` |
| `components/common` | `PageHeader` | Intestazione riutilizzabile |
| `components/customer` | `ServiceSelection` | Elenco dei servizi selezionabili |
| `components/customer` | `TicketConfirmation` | Conferma del ticket e conto alla rovescia |
| `components/officer` | `OfficerNavbar` | Account autenticato e pulsante logout |
| `components/officer` | `NextCustomer` | Pulsante di chiamata, ticket assegnato, errori e coda vuota |

### 7.3 Hook, context e API

| Area | File | Responsabilità |
| --- | --- | --- |
| `hooks` | `useCustomerLogic.js` | Recupero servizi, emissione e chiusura della conferma |
| `hooks` | `useOfficerLogic.js` | Login, recupero della sessione e logout |
| `hooks` | `useNextCustomerLogic.js` | Chiamata del prossimo cliente e gestione del risultato |
| `context` | `OfficerContext.js` | Condivisione dello stato dell’operatore |
| `context` | `OfficerProvider.jsx` | Inizializzazione della logica condivisa per la parte Officer |
| `API` | `API.mjs` | Richieste HTTP al backend |

**Organizzazione:** componenti per l’interfaccia, hook per stato e interazioni, API per le richieste HTTP. Il provider Officer condivide la sessione tra pagina e navbar; le pagine cliente rimangono pubbliche e fuori dal provider.

## 8. Test e verifiche

| Verifica | Comando |
| --- | --- |
| Tutti i test backend | `npm --prefix server test` |
| Unit test | `npm --prefix server test -- tests/unit` |
| Test di integrazione | `npm --prefix server test -- tests/integration` |
| Integrazione Get ticket | `npm --prefix server test -- tests/integration/getTicket.test.js` |
| Integrazione Next customer | `npm --prefix server test -- tests/integration/nextCustomer.test.js` |
| Modalità continua | `npm --prefix server run test:watch` |
| Controllo frontend | `npm --prefix frontend run lint` |
| Build frontend | `npm --prefix frontend run build` |

I test automatici verificano il comportamento del backend con la seguente organizzazione:

- **Organizzazione:** unit test in `server/tests/unit` e test di integrazione in `server/tests/integration`. Il comando `npm --prefix server test` esegue tutti i test.
- **Database:** i test usano un database separato, con dati ripristinati prima di ogni test.
- **Esecuzione:** non serve avviare il backend; Supertest utilizza direttamente l’app Express.
- **Copertura:** emissione e assegnazione dei ticket, selezione delle code, numerazione, persistenza, richieste simultanee e API.