/**
 * Inserts the sample configuration into an empty database.
 *
 * Called by db.js after the tables have been created.
 * Existing configuration and tickets are preserved.
 */
const services = [
    { id: 1, code: "PAY", name: "Postal Payment Slips (up to 5)", serviceTime: 5 },
    {
        id: 2,
        code: "BANK", name: "Deposits, Withdrawals, F24, Top-ups and Other Payments",
        serviceTime: 8
    },
    { id: 3, code: "MAIL", name: "Mail and Parcels", serviceTime: 7 },
    {
        id: 4,
        code: "CARD", name: "Postepay Cards, Energy and Phone Services",
        serviceTime: 15
    },
    {
        id: 5,
        code: "ADMIN", name: "Public Administration Services - Polis",
        serviceTime: 20
    },
    {
        id: 6,
        code: "SAVE", name: "Postal Savings Bonds and Savings Books",
        serviceTime: 12
    },
    { id: 7, code: "INS", name: "Motor Insurance", serviceTime: 20 },
    {
        id: 8,
        code: "FIN", name: "Current Accounts, Loans, Investments and Insurance",
        serviceTime: 25
    },
    { id: 9, code: "SPID", name: "SPID", serviceTime: 15 },
    { id: 10, code: "PERMIT", name: "Residence Permits", serviceTime: 20 },
    { id: 11, code: "OTHER", name: "Other", serviceTime: 10 }
];

const counters = [
    { id: 1, name: "Counter 1" },
    { id: 2, name: "Counter 2" },
    { id: 3, name: "Counter 3" },
    { id: 4, name: "Counter 4" },
    { id: 5, name: "Counter 5" }
];

const counterServices = [
    // Counter 1: Postal Payment Slips (up to 5); Deposits, Withdrawals, F24, Top-ups and Other Payments; Mail and Parcels.
    { counterId: 1, serviceId: 1 },
    { counterId: 1, serviceId: 2 },
    { counterId: 1, serviceId: 3 },

    // Counter 2: Postal Payment Slips (up to 5); Deposits, Withdrawals, F24, Top-ups and Other Payments; Postal Savings Bonds and Savings Books.
    { counterId: 2, serviceId: 1 },
    { counterId: 2, serviceId: 2 },
    { counterId: 2, serviceId: 6 },

    // Counter 3: Mail and Parcels; Postepay Cards, Energy and Phone Services.
    { counterId: 3, serviceId: 3 },
    { counterId: 3, serviceId: 4 },

    // Counter 4: Public Administration Services - Polis; SPID; Residence Permits.
    { counterId: 4, serviceId: 5 },
    { counterId: 4, serviceId: 9 },
    { counterId: 4, serviceId: 10 },

    // Counter 5: Postal Savings Bonds and Savings Books; Motor Insurance; Current Accounts, Loans, Investments and Insurance; Other.
    { counterId: 5, serviceId: 6 },
    { counterId: 5, serviceId: 7 },
    { counterId: 5, serviceId: 8 },
    { counterId: 5, serviceId: 11 }
];

function runQuery(db, sql, params = []) {
    return new Promise((resolve, reject) => {
        db.run(sql, params, (err) => {
            if (err) {
                reject(err);
                return;
            }

            resolve();
        });
    });
}

export async function initializeData(db) {
    const counts = await new Promise((resolve, reject) => {
        const sql = `
            SELECT
                (SELECT COUNT(*) FROM Service) AS services,
                (SELECT COUNT(*) FROM Counter) AS counters,
                (SELECT COUNT(*) FROM CounterService) AS associations,
                (SELECT COUNT(*) FROM Ticket) AS tickets
        `;

        db.get(sql, [], (err, row) => {
            if (err) {
                reject(err);
                return;
            }

            resolve(row);
        });
    });

    if (
        counts.services > 0 &&
        counts.counters > 0 &&
        counts.associations > 0
    ) {
        console.log("Existing configuration preserved.");
        return;
    }

    if (
        counts.services > 0 ||
        counts.counters > 0 ||
        counts.associations > 0 ||
        counts.tickets > 0
    ) {
        throw new Error(
            "Initial configuration is incomplete. Check the database."
        );
    }

    await runQuery(db, "BEGIN TRANSACTION");

    try {
        for (const service of services) {
            await runQuery(
                db,
                `INSERT INTO Service(id, code, name, service_time)
                 VALUES (?, ?, ?, ?)`,
                [service.id, service.code, service.name, service.serviceTime]
            );
        }

        for (const counter of counters) {
            await runQuery(
                db,
                `INSERT INTO Counter(id, name)
                 VALUES (?, ?)`,
                [counter.id, counter.name]
            );
        }

        for (const association of counterServices) {
            await runQuery(
                db,
                `INSERT INTO CounterService(counter_id, service_id)
                 VALUES (?, ?)`,
                [association.counterId, association.serviceId]
            );
        }

        await runQuery(db, "COMMIT");
        console.log("Initial services and counters inserted.");
    } catch (err) {
        await runQuery(db, "ROLLBACK");
        throw err;
    }
}
