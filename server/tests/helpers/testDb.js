import db from '../../db.js';

export const run = (sql, params = []) => new Promise((resolve, reject) => {
  db.run(sql, params, function (err) {
    if (err) reject(err);
    else resolve({ lastID: this.lastID, changes: this.changes });
  });
});

export const get = (sql, params = []) => new Promise((resolve, reject) => {
  db.get(sql, params, (err, row) => (err ? reject(err) : resolve(row)));
});

export const all = (sql, params = []) => new Promise((resolve, reject) => {
  db.all(sql, params, (err, rows) => (err ? reject(err) : resolve(rows)));
});

const exec = (sql) => new Promise((resolve, reject) => {
  db.exec(sql, (err) => (err ? reject(err) : resolve()));
});

// empties every table, resets AUTOINCREMENT counters and reloads the fixtures
export async function resetTestDb() {
  const tables = await all(
    "SELECT name FROM sqlite_master WHERE type = 'table' AND (name NOT LIKE 'sqlite_%' OR name = 'sqlite_sequence')",
  );
  await exec('PRAGMA foreign_keys = OFF');
  for (const { name } of tables) await exec(`DELETE FROM "${name}"`);
  await exec('PRAGMA foreign_keys = ON');
  await seedFixtures();
}

// counter 1: services 1, 2 - counter 2: services 2, 3 - no tickets
async function seedFixtures() {
  await exec(`
    INSERT INTO Service (id, name, service_time) VALUES
      (1, 'Payments', 5),
      (2, 'Mail and Parcels', 7),
      (3, 'SPID', 15);
    INSERT INTO Counter (id, name) VALUES
      (1, 'Counter 1'),
      (2, 'Counter 2');
    INSERT INTO CounterService (counter_id, service_id) VALUES (1, 1), (1, 2), (2, 2), (2, 3);
  `);
}

export { db };