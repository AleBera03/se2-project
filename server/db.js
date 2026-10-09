import sqlite3 from "sqlite3";
import fs from "fs";
import path from "path";

import { fileURLToPath } from "url";

import { initializeData } from "./init-db.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const DB_FILE = process.env.NODE_ENV === "test" ? "oqms-test.sqlite" : "oqms.sqlite";
const DB_PATH = process.env.DB_PATH ?? path.join(__dirname, DB_FILE);
const SCHEMA_PATH = path.join(__dirname, "oqms-schema.sql");

const db = new sqlite3.Database(DB_PATH);
let queue = Promise.resolve();

await new Promise((resolve, reject) => {
    db.run("PRAGMA foreign_keys = ON;", (err) => {
        if (err) {
            reject(err);
            return;
        }

        console.log("Foreign key constraints enabled.");
        initDatabase(resolve, reject);
    });
});

function initDatabase(resolve, reject) {
    const sql = `
        SELECT name
        FROM sqlite_master
        WHERE type = 'table'
          AND name IN ('Service', 'Counter', 'CounterService', 'Ticket')
    `;

    db.all(sql, [], (err, tables) => {
        if (err) {
            reject(err);
            return;
        }

        if (tables.length === 4) {
            console.log("Connected to the existing SQLite database.");
            resolve();
            return;
        }

        if (tables.length > 0) {
            reject(new Error("The database schema is incomplete."));
            return;
        }

        if (!fs.existsSync(SCHEMA_PATH)) {
            reject(new Error(`Schema file not found: ${SCHEMA_PATH}`));
            return;
        }

        const schema = fs.readFileSync(SCHEMA_PATH, "utf-8");

        db.exec(schema, (err) => {
            if (err) {
                reject(err);
                return;
            }

            console.log("Database schema initialized successfully.");
            resolve();
        });
    });
}

await initializeData(db);

// HELPERS

export function runAsync(sql, params = []) {
    return new Promise((resolve, reject) => {
        db.run(sql, params, function (err) {
            if (err) {
                reject(err);
                return;
            }

            resolve(this);
        });
    });
}

export function transaction(callback) {
    const execute = async () => {
        await runAsync('BEGIN TRANSACTION');
        try {
            const res = await callback();
            await runAsync('COMMIT');
            return res;
        } catch (err) {
            await runAsync('ROLLBACK');
            throw err;
        }
    };
    const result = queue.then(execute);
    queue = result.catch(() => {});
    return result;
}

export default db;