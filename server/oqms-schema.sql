PRAGMA foreign_keys = ON;

BEGIN TRANSACTION;

CREATE TABLE Service (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE CHECK (length(trim(name)) > 0),
    code TEXT NOT NULL UNIQUE
    CHECK (length(code) = 1 AND code GLOB '[A-Z]'),
    service_time REAL NOT NULL CHECK (service_time > 0)
);

CREATE TABLE Counter (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE CHECK (length(trim(name)) > 0)
);

CREATE TABLE CounterAccount (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE CHECK (length(trim(username)) > 0),
    hash TEXT NOT NULL,
    salt TEXT NOT NULL,
    counter_id INTEGER NOT NULL UNIQUE REFERENCES Counter(id)
);

CREATE TABLE CounterService (
    counter_id INTEGER NOT NULL REFERENCES Counter(id),
    service_id INTEGER NOT NULL REFERENCES Service(id),
    PRIMARY KEY (counter_id, service_id)
);

CREATE TABLE Ticket (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    daily_number INTEGER NOT NULL DEFAULT 0
    CHECK (daily_number BETWEEN 0 AND 999),
    ticket_date TEXT NOT NULL DEFAULT (strftime('%Y-%m-%d', 'now')),
    code TEXT NOT NULL,
    service_id INTEGER NOT NULL REFERENCES Service(id),
    status TEXT NOT NULL DEFAULT 'waiting'
        CHECK (status IN ('waiting', 'served')),
    created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
    counter_id INTEGER REFERENCES Counter(id),
    CHECK (
        (status = 'waiting' AND counter_id IS NULL) OR
        (status = 'served' AND counter_id IS NOT NULL)
    ),
    FOREIGN KEY (counter_id, service_id)
        REFERENCES CounterService(counter_id, service_id)
);

CREATE UNIQUE INDEX idx_ticket_waiting_code ON Ticket(ticket_date, code) WHERE status = 'waiting';
CREATE INDEX idx_ticket_queue ON Ticket(service_id, status, created_at, id);
CREATE INDEX idx_counter_service_service ON CounterService(service_id);

COMMIT;