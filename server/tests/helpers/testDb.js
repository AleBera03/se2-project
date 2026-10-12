import db from '../../db.js';
import { initializeAccounts } from '../../init/init-accounts.js';

/**
 * Executes a statement and returns its insertion ID and affected-row count.
 */
export const run = (sql, params = []) => new Promise((resolve, reject) => {
  db.run(sql, params, function (err) {
    if (err) reject(err);
    else resolve({ lastID: this.lastID, changes: this.changes });
  });
});

/**
 * Retrieves a single row.
 */
export const get = (sql, params = []) => new Promise((resolve, reject) => {
  db.get(sql, params, (err, row) => (err ? reject(err) : resolve(row)));
});

/**
 * Retrieves all matching rows.
 */
export const all = (sql, params = []) => new Promise((resolve, reject) => {
  db.all(sql, params, (err, rows) => (err ? reject(err) : resolve(rows)));
});

/**
 * Executes SQL statements without returning rows.
 */
const exec = (sql) => new Promise((resolve, reject) => {
  db.exec(sql, (err) => (err ? reject(err) : resolve()));
});

/**
 * Clears all tables, resets generated IDs and restores test data and accounts.
 */
export async function resetTestDb() {
  const tables = await all(
    "SELECT name FROM sqlite_master WHERE type = 'table' AND (name NOT LIKE 'sqlite_%' OR name = 'sqlite_sequence')",
  );

  // Temporarily disables foreign keys to clear related tables.
  await exec('PRAGMA foreign_keys = OFF');

  for (const { name } of tables) {
    await exec(`DELETE FROM "${name}"`);
  }

  await exec('PRAGMA foreign_keys = ON');

  await seedFixtures();
  await initializeAccounts(db);
}

/**
 * Inserts services and counters with empty ticket queues.
 */
async function seedFixtures() {
  // Counter 1 serves services 1 and 2; Counter 2 serves services 2 and 3. Initially, no tickets are present.
  await exec(`
    INSERT INTO Service (id, code, name, service_time) VALUES
      (1, 'A', 'Payments', 5),
      (2, 'C', 'Mail and Parcels', 7),
      (3, 'I', 'SPID', 15);
    INSERT INTO Counter (id, name) VALUES
      (1, 'Counter 1'),
      (2, 'Counter 2');
    INSERT INTO CounterService (counter_id, service_id) VALUES (1, 1), (1, 2), (2, 2), (2, 3);
  `);
}

export { db };