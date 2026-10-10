import db from "./db.js";

const MAX_DAILY_TICKET_NUMBER = 999;

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

/**
 * Persist a ticket with a unique code in the selected service queue.
 */
export const createTicket = (serviceId) => {
    return new Promise((resolve, reject) => {
        if (!Number.isSafeInteger(serviceId) || serviceId <= 0) {
            reject(new TypeError("serviceId must be a positive integer"));
            return;
        }

        db.run("BEGIN IMMEDIATE TRANSACTION", (err) => {
            if (err) {
                reject(err);
                return;
            }

            const sequenceSql = `
                SELECT s.code AS serviceCode,
                       COALESCE(MAX(t.daily_number), 0) + 1 AS dailyNumber
                FROM Service AS s
                LEFT JOIN Ticket AS t
                    ON t.service_id = s.id
                   AND t.ticket_date = strftime('%Y-%m-%d', 'now')
                WHERE s.id = ?
                GROUP BY s.id, s.code
            `;

            db.get(sequenceSql, [serviceId], (err, row) => {
                if (err) {
                    db.run("ROLLBACK", () => reject(err));
                    return;
                }

                if (!row) {
                    db.run("ROLLBACK", () => {
                        reject(new Error("Service not found."));
                    });
                    return;
                }

                const dailyNumber = row.dailyNumber > MAX_DAILY_TICKET_NUMBER
                    ? 1
                    : row.dailyNumber;
                const code = `${row.serviceCode}-${String(dailyNumber).padStart(3, "0")}`;
                const insertSql = `
                    INSERT INTO Ticket (service_id, daily_number, code)
                    VALUES (?, ?, ?)
                `;

                db.run(insertSql, [serviceId, dailyNumber, code], function (err) {
                    if (err) {
                        db.run("ROLLBACK", () => reject(err));
                        return;
                    }

                    const newTicketId = this.lastID;
                    const selectSql = `
                        SELECT id, code, service_id, status, created_at
                        FROM Ticket
                        WHERE id = ?
                    `;

                    db.get(selectSql, [newTicketId], (err, ticket) => {
                        if (err) {
                            db.run("ROLLBACK", () => reject(err));
                            return;
                        }

                        db.run("COMMIT", (err) => {
                            if (err) {
                                db.run("ROLLBACK", () => reject(err));
                                return;
                            }

                            resolve(ticket);
                        });
                    });
                });
            });
        });
    });
};