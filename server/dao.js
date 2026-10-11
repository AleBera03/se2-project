import db, { runAsync, transaction } from "./db.js";

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
 * Retrieve the oldest waiting ticket for the selected service.
 * Resolve equal creation timestamps by lowest ticket ID.
 */
export const getFirstWaitingTicket = (serviceId) => {
    return new Promise((resolve, reject) => {
        if (!Number.isSafeInteger(serviceId) || serviceId <= 0) {
            reject(new TypeError("serviceId must be a positive integer"));
            return;
        }

        const sql = `
            SELECT
                t.*,
                s.name AS service_name
            FROM Ticket AS t
            JOIN Service AS s ON s.id = t.service_id
            WHERE t.service_id = ? AND t.status = 'waiting'
            ORDER BY t.created_at, t.id
            LIMIT 1
        `;

        db.get(sql, [serviceId], (err, row) => {
            if (err) reject(err);
            else resolve(row);
        });
    });
};

/**
 * Assign a waiting ticket to a counter and mark it as served.
 * Reject the operation if the ticket is no longer waiting.
 */
export async function assignTicket(ticketId, counterId) {
    if (!Number.isSafeInteger(ticketId) || ticketId <= 0) {
        throw new TypeError("ticketId must be a positive integer");
    }

    if (!Number.isSafeInteger(counterId) || counterId <= 0) {
        throw new TypeError("counterId must be a positive integer");
    }

    const result = await runAsync(`
        UPDATE Ticket
        SET status = 'served', counter_id = ?
        WHERE id = ? AND status = 'waiting'
    `, [counterId, ticketId]);

    if (result.changes !== 1) {
        throw new Error("Ticket is no longer waiting");
    }

    return result;
}

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
 * Create a waiting ticket with a service-specific daily number.
 */
export async function createTicket(serviceId) {
    if (!Number.isSafeInteger(serviceId) || serviceId <= 0) {
        throw new TypeError("serviceId must be a positive integer");
    }

    return transaction(async () => {
        const getRow = (sql, params = []) =>
            new Promise((resolve, reject) => {
                db.get(sql, params, (err, row) => {
                    if (err) reject(err);
                    else resolve(row);
                });
            });

        const service = await getRow(`
            SELECT code, strftime('%Y-%m-%d', 'now') AS ticketDate
            FROM Service
            WHERE id = ?
        `, [serviceId]);

        if (!service) {
            throw new Error("Service not found.");
        }

        const lastTicket = await getRow(`
            SELECT daily_number
            FROM Ticket
            WHERE service_id = ? AND ticket_date = ?
            ORDER BY id DESC
            LIMIT 1
        `, [serviceId, service.ticketDate]);

        const dailyNumber = lastTicket
            ? (lastTicket.daily_number + 1) % (MAX_DAILY_TICKET_NUMBER + 1)
            : 0;

        const code =
            `${service.code}${String(dailyNumber).padStart(3, "0")}`;

        const waitingTicket = await getRow(`
            SELECT id
            FROM Ticket
            WHERE code = ? AND status = 'waiting'
            LIMIT 1
        `, [code]);

        if (waitingTicket) {
            const error = new Error(
                "Ticket code is still in use. Please wait before requesting another ticket."
            );
            error.code = "TICKET_CODE_IN_USE";
            throw error;
        }
        
        const result = await runAsync(`
            INSERT INTO Ticket (
                service_id, daily_number, ticket_date, code
            )
            VALUES (?, ?, ?, ?)
        `, [serviceId, dailyNumber, service.ticketDate, code]);

        return getRow(`
            SELECT id, code, service_id, status, created_at
            FROM Ticket
            WHERE id = ?
        `, [result.lastID]);
    });
}