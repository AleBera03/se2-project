/**
 * Script used during development to insert
 * the initial services and counters.
 *
 * It is not executed by the server and is not required
 * to run the project once the delivered database
 * already contains the initial configuration.
 *
 * Run from the server folder on existing, empty tables.
 * Service times are sample estimates expressed in minutes.
 * Counter assignments are sample configuration.
 */

import sqlite from "sqlite3";

const db = new sqlite.Database("oqms.sqlite", (err) => {
    if (err) throw err;
});

const services = [
    { id: 1, name: "Postal Payment Slips (up to 5)", serviceTime: 5 },
    {
        id: 2,
        name: "Deposits, Withdrawals, F24, Top-ups and Other Payments",
        serviceTime: 8
    },
    { id: 3, name: "Mail and Parcels", serviceTime: 7 },
    {
        id: 4,
        name: "Postepay Cards, Energy and Phone Services",
        serviceTime: 15
    },
    {
        id: 5,
        name: "Public Administration Services - Polis",
        serviceTime: 20
    },
    {
        id: 6,
        name: "Postal Savings Bonds and Savings Books",
        serviceTime: 12
    },
    { id: 7, name: "Motor Insurance", serviceTime: 20 },
    {
        id: 8,
        name: "Current Accounts, Loans, Investments and Insurance",
        serviceTime: 25
    },
    { id: 9, name: "SPID", serviceTime: 15 },
    { id: 10, name: "Residence Permits", serviceTime: 20 },
    { id: 11, name: "Other", serviceTime: 10 }
];

const counters = [
    { id: 1, name: "Counter 1" },
    { id: 2, name: "Counter 2" },
    { id: 3, name: "Counter 3" },
    { id: 4, name: "Counter 4" },
    { id: 5, name: "Counter 5" }
];

const counterServices = [
    // Counter 1: payment slips, payments, mail and parcels.
    { counterId: 1, serviceId: 1 },
    { counterId: 1, serviceId: 2 },
    { counterId: 1, serviceId: 3 },

    // Counter 2: payment slips, payments, savings products.
    { counterId: 2, serviceId: 1 },
    { counterId: 2, serviceId: 2 },
    { counterId: 2, serviceId: 6 },

    // Counter 3: mail, Postepay cards, energy and phone services.
    { counterId: 3, serviceId: 3 },
    { counterId: 3, serviceId: 4 },

    // Counter 4: public administration, SPID, residence permits.
    { counterId: 4, serviceId: 5 },
    { counterId: 4, serviceId: 9 },
    { counterId: 4, serviceId: 10 },

    // Counter 5: savings, insurance, accounts and other requests.
    { counterId: 5, serviceId: 6 },
    { counterId: 5, serviceId: 7 },
    { counterId: 5, serviceId: 8 },
    { counterId: 5, serviceId: 11 }
];

// Execute queries in order: associations require existing services and counters.
db.serialize(() => {
    db.run("PRAGMA foreign_keys = ON", (err) => {
        if (err) throw err;
    });

    for (const service of services) {
        const sql = `
            INSERT INTO Service(id, name, service_time)
            VALUES (?, ?, ?)
        `;

        db.run(sql, [service.id, service.name, service.serviceTime], (err) => {
            if (err)
                console.error(err.message);
            else
                console.log(`Created service ${service.name}`);
        });
    }

    for (const counter of counters) {
        const sql = `
            INSERT INTO Counter(id, name)
            VALUES (?, ?)
        `;

        db.run(sql, [counter.id, counter.name], (err) => {
            if (err)
                console.error(err.message);
            else
                console.log(`Created counter ${counter.name}`);
        });
    }

    for (const association of counterServices) {
        const sql = `
            INSERT INTO CounterService(counter_id, service_id)
            VALUES (?, ?)
        `;

        db.run(sql, [association.counterId, association.serviceId], (err) => {
            if (err)
                console.error(err.message);
            else
                console.log(
                    `Assigned service ${association.serviceId} to counter ${association.counterId}`
                );
        });
    }

    db.close((err) => {
        if (err)
            console.error(err.message);
    });
});