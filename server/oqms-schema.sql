PRAGMA foreign_keys = ON;

BEGIN TRANSACTION;

CREATE TABLE Service (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE CHECK (length(trim(name)) > 0),
    service_time REAL NOT NULL CHECK (service_time > 0)
);

CREATE TABLE Counter (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE CHECK (length(trim(name)) > 0)
);

CREATE TABLE CounterService (
    counter_id INTEGER NOT NULL REFERENCES Counter(id),
    service_id INTEGER NOT NULL REFERENCES Service(id),
    PRIMARY KEY (counter_id, service_id)
);

CREATE TABLE Ticket (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    code TEXT GENERATED ALWAYS AS ('T' || id) VIRTUAL,
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

CREATE INDEX idx_ticket_queue ON Ticket(service_id, status, created_at, id);
CREATE INDEX idx_counter_service_service ON CounterService(service_id);

COMMIT;