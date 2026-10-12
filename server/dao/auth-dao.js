import crypto from "node:crypto";
import { promisify } from "node:util";

import db from "../db.js";
import { User } from "../models.js";

const scryptAsync = promisify(crypto.scrypt);

/**
 * Reads an account from the database.
 */
function getRow(sql, params = []) {
    return new Promise((resolve, reject) => {
        db.get(sql, params, (err, row) => {
            if (err) {
                reject(err);
                return;
            }

            resolve(row);
        });
    });
}

/**
 * Verifies credentials and returns the account's public information.
 */
export async function getUser(username, password) {
    if (
        typeof username !== "string" ||
        typeof password !== "string" ||
        username.length === 0 ||
        password.length === 0
    ) {
        return false;
    }

    const account = await getRow(`
        SELECT id, username, hash, salt, counter_id AS counterId
        FROM CounterAccount
        WHERE username = ?
    `, [username]);

    if (!account) {
        return false;
    }

    const storedHash = Buffer.from(account.hash, "hex");
    const suppliedHash = await scryptAsync(password, account.salt, 64);

    if (
        storedHash.length !== suppliedHash.length ||
        !crypto.timingSafeEqual(storedHash, suppliedHash)
    ) {
        return false;
    }

    return new User(
        account.id,
        account.username,
        account.counterId
    );
}

/**
 * Restores the authenticated account from its session identifier.
 */
export async function getUserById(id) {
    const account = await getRow(`
        SELECT id, username, counter_id AS counterId
        FROM CounterAccount
        WHERE id = ?
    `, [id]);

    return account
        ? new User(account.id, account.username, account.counterId)
        : undefined;
}