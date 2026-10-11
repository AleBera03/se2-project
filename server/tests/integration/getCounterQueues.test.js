import { test } from 'vitest';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { mkdtemp, mkdir, copyFile, writeFile, rm, realpath } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

// Tests the actual exported dao.js function, not the removed getCounterQueues.js.
// Uses a private temporary ES-module environment and SQLite memory database.
async function fixture() {
  const dir = await realpath(
    await mkdtemp(join(tmpdir(), 'counter-queues-'))
  );
  await writeFile(join(dir, 'package.json'), JSON.stringify({ type: 'module' }));
  await mkdir(join(dir, 'dao'));
  await copyFile(
    new URL('../../dao/ticket-dao.js', import.meta.url),
    join(dir, 'dao', 'ticket-dao.js')
  );
  await writeFile(join(dir, 'db.js'), `
    import { DatabaseSync } from 'node:sqlite';
    export const sqlite = new DatabaseSync(':memory:');
    export const db = {
      failNext: false,
      all(sql, params, callback) {
        if (this.failNext) {
          this.failNext = false;
          callback(new Error('database unavailable'));
          return;
        }
        try { callback(null, sqlite.prepare(sql).all(...params).map(row => ({ ...row }))); }
        catch (err) { callback(err); }
      }
    };
    export function runAsync() {
      throw new Error('runAsync is not supported by this queue-retrieval fixture');
    }
    export function transaction() {
      throw new Error('transaction is not supported by this queue-retrieval fixture');
    }
    export default db;
  `);
  const dao = await import(
    pathToFileURL(join(dir, 'dao', 'ticket-dao.js')).href
  );
  const { sqlite, db } = await import(pathToFileURL(join(dir, 'db.js')).href);
  sqlite.exec(`
    CREATE TABLE Service (id INTEGER PRIMARY KEY, name TEXT NOT NULL, service_time REAL NOT NULL);
    CREATE TABLE CounterService (counter_id INTEGER NOT NULL, service_id INTEGER NOT NULL, PRIMARY KEY(counter_id, service_id));
    CREATE TABLE Ticket (id INTEGER PRIMARY KEY, service_id INTEGER NOT NULL, status TEXT NOT NULL, ticket_date TEXT NOT NULL DEFAULT (strftime('%Y-%m-%d', 'now')));
    INSERT INTO Service VALUES (1, 'Payments', 5), (2, 'Mail', 7), (3, 'Insurance', 20);
    INSERT INTO CounterService VALUES (1, 1), (1, 2), (2, 3);
    INSERT INTO Ticket (id, service_id, status) VALUES (1, 1, 'waiting'), (2, 1, 'waiting'), (3, 1, 'served'), (4, 3, 'waiting');
  `);
  return { ...dao, sqlite, db, async cleanup() { sqlite.close(); await rm(dir, { recursive: true, force: true }); } };
}

test('returns compatible services and includes empty queues', async () => {
  const f = await fixture();
  try {
    assert.deepEqual(await f.getCounterQueues(1), [
      { serviceId: 1, serviceName: 'Payments', averageServiceTime: 5, queueLength: 2 },
      { serviceId: 2, serviceName: 'Mail', averageServiceTime: 7, queueLength: 0 }
    ]);
  } finally { await f.cleanup(); }
});

test('excludes incompatible services', async () => {
  const f = await fixture();
  try {
    assert.deepEqual(await f.getCounterQueues(2), [
      { serviceId: 3, serviceName: 'Insurance', averageServiceTime: 20, queueLength: 1 }
    ]);
  } finally { await f.cleanup(); }
});

test('unknown counter returns empty array', async () => {
  const f = await fixture();
  try { assert.deepEqual(await f.getCounterQueues(99), []); }
  finally { await f.cleanup(); }
});

test('rejects invalid counter IDs', async () => {
  const f = await fixture();
  try {
    for (const id of [0, -1, 1.5, '1', null, NaN]) {
      await assert.rejects(f.getCounterQueues(id), /positive integer/);
    }
  } finally { await f.cleanup(); }
});

test('propagates database errors', async () => {
  const f = await fixture();
  try {
    f.db.failNext = true;
    await assert.rejects(f.getCounterQueues(1), /database unavailable/);
  } finally { await f.cleanup(); }
});

test('retrieval does not modify tickets', async () => {
  const f = await fixture();
  try {
    const before = f.sqlite.prepare('SELECT id, service_id, status FROM Ticket ORDER BY id').all();
    await f.getCounterQueues(1);
    const after = f.sqlite.prepare('SELECT id, service_id, status FROM Ticket ORDER BY id').all();
    assert.deepEqual(after, before);
  } finally { await f.cleanup(); }
});

test('excludes previous-day tickets without deleting them', async () => {
  const f = await fixture();

  try {
    // Move existing waiting tickets to the previous day.
    f.sqlite.exec(`
      UPDATE Ticket
      SET ticket_date = date('now', '-1 day')
      WHERE status = 'waiting';

      INSERT INTO Ticket (id, service_id, status)
      VALUES (5, 2, 'waiting');
    `);

    const before = f.sqlite.prepare(
      'SELECT * FROM Ticket ORDER BY id'
    ).all();

    assert.deepEqual(await f.getCounterQueues(1), [
      {
        serviceId: 1,
        serviceName: 'Payments',
        averageServiceTime: 5,
        queueLength: 0,
      },
      {
        serviceId: 2,
        serviceName: 'Mail',
        averageServiceTime: 7,
        queueLength: 1,
      },
    ]);

    assert.deepEqual(
      f.sqlite.prepare('SELECT * FROM Ticket ORDER BY id').all(),
      before
    );
  } finally {
    await f.cleanup();
  }
});
