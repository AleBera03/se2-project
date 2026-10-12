import crypto from "node:crypto";
import { promisify } from "node:util";

const scryptAsync = promisify(crypto.scrypt);

function run(db, sql, params = []) {
    return new Promise((resolve, reject) => {
        db.run(sql, params, (err) => {
            if (err) reject(err);
            else resolve();
        });
    });
}

function all(db, sql, params = []) {
    return new Promise((resolve, reject) => {
        db.all(sql, params, (err, rows) => {
            if (err) reject(err);
            else resolve(rows);
        });
    });
}

/**
 * Creates missing demo accounts without changing existing credentials.
 */
async function initializeAccounts(db) {
    await run(db, `
        CREATE TABLE IF NOT EXISTS CounterAccount (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT NOT NULL UNIQUE
                CHECK (length(trim(username)) > 0),
            hash TEXT NOT NULL,
            salt TEXT NOT NULL,
            counter_id INTEGER NOT NULL UNIQUE REFERENCES Counter(id)
        )
    `);

    const counters = await all(db, `
        SELECT c.id
        FROM Counter AS c
        LEFT JOIN CounterAccount AS a ON a.counter_id = c.id
        WHERE a.id IS NULL
        ORDER BY c.id
    `);

    for (const counter of counters) {
        const username = `counter${counter.id}`;

        // Preconfigured credentials for the project demo.
        const password = `Counter${counter.id}!`;
        const salt = crypto.randomBytes(16).toString("hex");
        const hash = await scryptAsync(password, salt, 64);

        await run(db, `
            INSERT INTO CounterAccount (username, hash, salt, counter_id)
            VALUES (?, ?, ?, ?)
        `, [username, hash.toString("hex"), salt, counter.id]);
    }
}

export { initializeAccounts };