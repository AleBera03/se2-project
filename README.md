# Office Queue Management System

Web application for managing queues in an office with multiple services and counters. Customers request a ticket without authentication; officers log in to their assigned counter and call the next customer.

## Table of contents

- [1. Technologies and requirements](#1-technologies-and-requirements)
- [2. Installation and startup](#2-installation-and-startup)
- [3. Features](#3-features)
- [4. Usage](#4-usage)
- [5. Selection rules and daily management](#5-selection-rules-and-daily-management)
  - [5.1 Queue and ticket selection](#51-queue-and-ticket-selection)
  - [5.2 Codes and daily management](#52-codes-and-daily-management)
- [6. Server-side](#6-server-side)
  - [6.1 API](#61-api)
  - [6.2 Database tables](#62-database-tables)
  - [6.3 Configuration](#63-configuration)
  - [6.4 Main files](#64-main-files)
- [7. Client-side](#7-client-side)
  - [7.1 Routes](#71-routes)
  - [7.2 React components](#72-react-components)
  - [7.3 Hooks, context and API](#73-hooks-context-and-api)
- [8. Tests and checks](#8-tests-and-checks)

## 1. Technologies and requirements

| Component | Technologies |
| --- | --- |
| Frontend | React, Vite, React Router, Bootstrap, React Bootstrap, Bootstrap Icons |
| Backend | Node.js 24.x, npm, Express, Passport, express-session |
| Database | SQLite through sqlite3 |
| Checks | Vitest, Supertest, ESLint, node:sqlite for some tests |

```bash
node --version
npm --version
```

## 2. Installation and startup

1. **Clone the repository and install the dependencies:**

   ```bash
   git clone https://github.com/AleBera03/se2-project.git
   cd se2-project
   npm --prefix server ci
   npm --prefix frontend ci
   ```

   `npm ci` creates the `node_modules` folders by installing the dependency versions specified in the `package-lock.json` files.

2. **Start the backend in a terminal from the project root:**

   ```bash
   npm --prefix server run dev
   ```

   The backend runs at `http://localhost:3001`. To start it without automatic restarts, use `npm --prefix server start`.

3. **Start the frontend in a second terminal from the project root:**

   ```bash
   npm --prefix frontend run dev
   ```

   The frontend is available at `http://localhost:5173`.

## 3. Features

| Area | Feature | Description |
| --- | --- | --- |
| Customer | Available services | Display of the services stored in the database |
| Customer | Ticket issuance | Service selection and creation of a code with a prefix and daily sequence number |
| Customer | Confirmation | Display of the code, service and issuance date |
| Customer | Confirmation closure | Manual or automatic after 20 seconds |
| Officer | Login | Access with a predefined account associated with a counter |
| Officer | Next customer | Atomic selection and assignment of the next ticket from compatible queues |
| Officer | Result | Display of the called ticket or the empty-queue message |
| Officer | Logout | Session termination |
| Persistence | Database | Storage of services, counters, accounts and tickets in SQLite |
| Persistence | History | Retention of tickets already served and tickets from previous days |

## 4. Usage

**Customer**

1. Open the customer page and select a service.
2. Note the code displayed in the confirmation.
3. Close the confirmation or wait 20 seconds.
4. If needed, select another service. If an error occurs during ticket issuance, use the **Retry** button.

**Officer**

1. Open `/counter` and log in with one of the demo accounts:

   | Counter | Username | Password |
   | --- | --- | --- |
   | Counter 1 | `counter1` | `Counter1!` |
   | Counter 2 | `counter2` | `Counter2!` |
   | Counter 3 | `counter3` | `Counter3!` |
   | Counter 4 | `counter4` | `Counter4!` |
   | Counter 5 | `counter5` | `Counter5!` |

   Accounts are automatically created for counters without an account. Registration is not available. Password hashes and salts are stored in the database. The listed credentials belong to the initial demo configuration.

2. Press **Next customer** to call the next ticket. The page displays the code and service or **No customers waiting.** Officers can only manage the counter associated with their account.

3. Press **Log out** to end the session.

## 5. Selection rules and daily management

### 5.1 Queue and ticket selection

1. Consider only services handled by the counter that have at least one waiting ticket for the current day.
2. Choose the queue with the most waiting tickets.
3. If queue lengths are equal, choose the shortest average service time.
4. If there is still a tie, choose the service with the lowest ID.
5. Select the oldest ticket by `created_at`, resolving equal timestamps with the lowest ID.

After selecting the next ticket, assignment follows these rules:

- **Assignment:** associates the ticket with the counter and immediately sets its status to `served`, removing it from the waiting queue.
- **Empty queues:** no ticket is assigned and the API returns `null`.
- **Transactions:** ticket issuance and assignment use the same database transaction queue.

### 5.2 Codes and daily management

Ticket numbering and queues are managed per service and day, according to the following rules:

- **Format:** service letter and a three-digit sequence number, for example `A000`.
- **Sequence number:** independent for each service and day; starts at `000`, reaches `999` and restarts at `000`.
- **Code reuse:** blocked with HTTP response `409` if the same code is still waiting on the current day.
- **Unique identifier:** the ID distinguishes each ticket, even when the code is reused.
- **Time zone:** dates and timestamps use UTC.
- **Daily queues:** the waiting-ticket count and updates to `served` use the current UTC date.
- **History:** tickets from previous days are retained in the database.

## 6. Server-side

### 6.1 API

Base URL: `http://localhost:3001/api`

| Method | Path | Access | Main response |
| --- | --- | --- | --- |
| GET | `/api/health` | Public | `200`, `{"status":"ok"}` |
| GET | `/api/services` | Public | `200`, list of IDs and names |
| POST | `/api/tickets` | Public | `201`, created ticket |
| POST | `/api/sessions` | Public | `201`, authenticated account |
| GET | `/api/sessions/current` | Authenticated | `200`, current account; `401` without a session |
| DELETE | `/api/sessions/current` | Session, if present | `204`, logout |
| POST | `/api/counters/:counterId/next` | Counter account | `200`, assigned ticket or JSON `null` |


**Errors:** use the format `{"error":"message"}`:

- `400`: invalid parameters.
- `401`: incorrect credentials or missing session.
- `403`: request for a counter different from the account’s assigned counter.
- `404`: nonexistent service; for Next customer, counter not found after authorization checks.
- `409`: ticket code still waiting on the current day.
- `500`: server error.

**Request and response examples:**

| Endpoint | Request body | Successful response body |
| --- | --- | --- |
| `GET /api/services` | None | `[{"id":1,"name":"Postal Payment Slips (up to 5)"}]` |
| `POST /api/tickets` | `{"serviceId":1}` | `{"id":1,"code":"A000","service_id":1,"status":"waiting","created_at":"2026-10-11T09:00:00.000Z"}` |
| `POST /api/sessions` | `{"username":"counter1","password":"Counter1!"}` | `{"id":1,"username":"counter1","counterId":1}` |
| `GET /api/sessions/current` | None | `{"id":1,"username":"counter1","counterId":1}` |
| `DELETE /api/sessions/current` | None | No content |
| `POST /api/counters/:counterId/next` | None | Ticket data with `service_name`, `status: "served"` and `counter_id`, or `null` |

### 6.2 Database tables

| Table | Fields | Description |
| --- | --- | --- |
| `Service` | `id`, `name`, `code`, `service_time` | Services, prefixes and average service times |
| `Counter` | `id`, `name` | Counters |
| `CounterService` | `counter_id`, `service_id` | Associations between counters and services |
| `CounterAccount` | `id`, `username`, `hash`, `salt`, `counter_id` | Credentials and counter associated with the account |
| `Ticket` | `id`, `daily_number`, `ticket_date`, `code`, `service_id`, `status`, `created_at`, `counter_id` | Issued tickets and their assignment |

| Counter | Compatible service prefixes |
| --- | --- |
| Counter 1 | A, B, C |
| Counter 2 | A, B, F |
| Counter 3 | C, D |
| Counter 4 | E, I, J |
| Counter 5 | F, G, H, K, L |

The database is initialized automatically and stores the office configuration and tickets according to the following rules:

- **Initialization:** if the database does not exist, the backend creates it and inserts 12 services, 5 counters, the associations between counters and services, and the demo accounts. On subsequent starts, it preserves existing data and creates only missing accounts.
- **Services:** service names and their average service times, expressed in minutes, are defined in `server/init/init-db.js`.
- **Statuses:** `waiting` indicates a waiting ticket; `served` indicates a ticket that has been called and associated with a counter.

### 6.3 Configuration

| Backend variable | Default value | Purpose |
| --- | --- | --- |
| `PORT` | `3001` | Backend port |
| `DB_PATH` | `server/oqms.sqlite` | Database path. If unspecified, `server/oqms.sqlite` is used |
| `NODE_ENV` | Not set by startup scripts | Automatically set to `test` during tests, using `server/oqms-test.sqlite` if `DB_PATH` is unspecified |
| `SESSION_SECRET` | Generated at each startup | Secret used to sign the session cookie |

Communication between frontend and backend and configuration variables are managed as follows:

- **Frontend–backend communication:** frontend requests use `BASE_URL` in `frontend/src/API/API.mjs`, currently `http://localhost:3001/api`. The backend allows the origin `http://localhost:5173` with CORS credentials. Vite also configures an `/api` proxy to port 3001.
- **Variables:** can be set in the terminal before startup. `.env` files are not read automatically.
- **Addresses:** if ports or addresses change, update `BASE_URL`, CORS and the Vite proxy. The frontend preview also requires an origin allowed by the backend.

### 6.4 Main files

| File | Responsibility |
| --- | --- |
| `server/index.js` | Backend startup |
| `server/app.js` | Endpoints, authentication and sessions |
| `server/db.js` | Connection, initialization and transaction queue |
| `server/dao/ticket-dao.js` | Reading and writing services, queues and tickets |
| `server/dao/auth-dao.js` | Credential verification and account retrieval |
| `server/queueService.js` | Queue selection and next-ticket assignment |
| `server/init/init-db.js` | Initial service and counter configuration |
| `server/init/init-accounts.js` | Creation of missing demo accounts |
| `server/oqms-schema.sql` | Tables, indexes and constraints |


## 7. Client-side

### 7.1 Routes

| Route | Page | Description | Parameters |
| --- | --- | --- | --- |
| `/` | `CustomerPage` | Service selection and ticket issuance, without login | None |
| `/customer` | `CustomerPage` | Alternative access to the customer page | None |
| `/counter` | `OfficerPage` | Login form or the authenticated officer’s counter | None |
| Other paths | — | Redirect to `/` | — |

### 7.2 React components

| Area | Component | Description |
| --- | --- | --- |
| `pages` | `CustomerPage` | Organizes service selection, messages and ticket confirmation |
| `pages` | `OfficerPage` | Displays login or the Next customer component |
| `components/layout` | `Layout` | Displays the optional navbar and pages through `Outlet` |
| `components/common` | `PageHeader` | Reusable heading |
| `components/customer` | `ServiceSelection` | List of selectable services |
| `components/customer` | `TicketConfirmation` | Ticket confirmation and countdown |
| `components/officer` | `OfficerNavbar` | Authenticated account and logout button |
| `components/officer` | `NextCustomer` | Call button, assigned ticket, errors and empty queue |

### 7.3 Hooks, context and API

| Area | File | Responsibility |
| --- | --- | --- |
| `hooks` | `useCustomerLogic.js` | Service retrieval, ticket issuance and confirmation closure |
| `hooks` | `useOfficerLogic.js` | Login, session restoration and logout |
| `hooks` | `useNextCustomerLogic.js` | Calling the next customer and handling the result |
| `context` | `OfficerContext.js` | Sharing the officer’s state |
| `context` | `OfficerProvider.jsx` | Initialization of shared logic for the Officer area |
| `API` | `API.mjs` | HTTP requests to the backend |

**Organization:** components handle the interface, hooks handle state and interactions, and APIs handle HTTP requests. The Officer provider shares the session between the page and navbar; customer pages remain public and outside the provider.

## 8. Tests and checks

| Check | Command |
| --- | --- |
| All backend tests | `npm --prefix server test` |
| Unit tests | `npm --prefix server test -- tests/unit` |
| Integration tests | `npm --prefix server test -- tests/integration` |
| Get ticket integration | `npm --prefix server test -- tests/integration/getTicket.test.js` |
| Next customer integration | `npm --prefix server test -- tests/integration/nextCustomer.test.js` |
| Watch mode | `npm --prefix server run test:watch` |
| Frontend checks | `npm --prefix frontend run lint` |
| Frontend build | `npm --prefix frontend run build` |

Automated tests verify backend behavior with the following organization:

- **Organization:** unit tests in `server/tests/unit` and integration tests in `server/tests/integration`. The command `npm --prefix server test` runs all tests.
- **Database:** tests use a separate database, with data reset before each test.
- **Execution:** starting the backend is not required; Supertest uses the Express app directly.
- **Coverage:** ticket issuance and assignment, queue selection, numbering, persistence, simultaneous requests and APIs.