PRAGMA foreign_keys = ON;

DROP TABLE IF EXISTS Ticket;
DROP TABLE IF EXISTS CounterService;
DROP TABLE IF EXISTS Counter;
DROP TABLE IF EXISTS Service;



CREATE TABLE Service (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    code TEXT NOT NULL UNIQUE,
    estimated_time INTEGER NOT NULL DEFAULT 10,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP

);


CREATE TABLE Counter (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    counter_number INTEGER NOT NULL UNIQUE,
    status TEXT CHECK(status IN ('ACTIVE', 'INACTIVE', 'CLOSED')) DEFAULT 'ACTIVE',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP

);

CREATE TABLE CounterService (
    counter_id INTEGER NOT NULL,
    service_id INTEGER NOT NULL,
    PRIMARY KEY (counter_id, service_id),
    FOREIGN KEY (counter_id) REFERENCES Counter(id) ON DELETE CASCADE,
    FOREIGN KEY (service_id) REFERENCES Service(id) ON DELETE CASCADE

);

CREATE TABLE Ticket (

    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ticket_number TEXT NOT NULL,
    service_id INTEGER NOT NULL,
    counter_id INTEGER NULL, --NULL until assigned to a counter
    status TEXT CHECK(status IN ('WAITING', 'CALLING', 'SERVED', 'CANCELLED')) DEFAULT 'WAITING',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (service_id) REFERENCES Service(id) ON DELETE RESTRICT,
    FOREIGN KEY (counter_id) REFERENCES Counter(id) ON DELETE SET NULL

);





INSERT INTO Service (name, code, estimated_time) VALUES
    ('General Enquiries', 'GEN', 5),
    ('Financial Services', 'FIN', 15),
    ('Document Processing', 'DOC', 10);


INSERT INTO Counter(counter_number, status) VALUES
    (1, 'ACTIVE'),
    (2, 'ACTIVE'),
    (3, 'INACTIVE');


INSERT INTO CounterService (counter_id, service_id) VALUES (1, 1), (1, 3);

INSERT INTO CounterService (counter_id, service_id) VALUES (2, 2);

INSERT INTO Ticket (ticket_number, service_id, status) VALUES 
    ('GEN-001', 1, 'WAITING'),
    ('FIN-001', 2, 'WAITING');