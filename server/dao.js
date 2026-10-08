import db from "./db.js";

/**
 * Retrieve the available services.
 */
export const getServices = () => {
    return new Promise((resolve, reject) => {
        const sql = `
            SELECT id, name
            FROM Service
            ORDER BY id
        `;

        db.all(sql, [], (err, rows) => {
            if (err) {
                reject(err);
                return;
            }

            resolve(rows);
        });
    });
};

/**
 * Retrieve supported services and waiting-queue lengths for a counter.
 */
export const getCounterQueues = (counterId) => {
    return new Promise((resolve, reject) => {
        if (!Number.isSafeInteger(counterId) || counterId <= 0) {
            reject(new TypeError("counterId must be a positive integer"));
            return;
        }

        const sql = `
            SELECT
                s.id AS serviceId,
                s.name AS serviceName,
                s.service_time AS averageServiceTime,
                COUNT(t.id) AS queueLength
            FROM CounterService AS cs
            JOIN Service AS s ON s.id = cs.service_id
            LEFT JOIN Ticket AS t
                ON t.service_id = s.id AND t.status = 'waiting'
            WHERE cs.counter_id = ?
            GROUP BY s.id, s.name, s.service_time
            ORDER BY s.id
        `;

        db.all(sql, [counterId], (err, rows) => {
            if (err) {
                reject(err);
                return;
            }

            resolve(rows);
        });
    });
};

export const createTicket = (serviceId) => {
    return new Promise((resolve, reject) => {
        if (!Number.isSafeInteger(serviceId) || serviceId <= 0) {
            reject(new TypeError("serviceId must be a positive integer"));
            return;
        }

        const insertSql = `
            INSERT INTO Ticket (service_id)
            VALUES (?)
        `;

        db.run(insertSql, [serviceId], function (err) {
            if (err) {
                reject(err);
                return;
            }

            const newTicketId = this.lastID;

            const selectSql = `
                SELECT id, code, service_id, status, created_at
                FROM Ticket
                WHERE id = ?
            `;

            db.get(selectSql, [newTicketId], (err, row) => {
                if (err) {
                    reject(err);
                    return;
                }

                resolve(row);
            });
        });
    });
};