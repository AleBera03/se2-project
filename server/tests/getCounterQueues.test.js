import test from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { mkdtemp, copyFile, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

// Tests the actual exported dao.js function, not the removed getCounterQueues.js.
// Uses a private temporary ES-module environment and SQLite memory database.
async function fixture() {
  const dir = await mkdtemp(join(tmpdir(), 'counter-queues-'));
  await writeFile(join(dir, 'package.json'), JSON.stringify({ type: 'module' }));
  await copyFile(resolve('server/dao.js'), join(dir, 'dao.js'));
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
    export default db;
  `);
  const dao = await import(pathToFileURL(join(dir, 'dao.js')).href);
  const { sqlite, db } = await import(pathToFileURL(join(dir, 'db.js')).href);
  sqlite.exec(`
    CREATE TABLE Service (id INTEGER PRIMARY KEY, name TEXT NOT NULL, service_time REAL NOT NULL);
    CREATE TABLE CounterService (counter_id INTEGER NOT NULL, service_id INTEGER NOT NULL, PRIMARY KEY(counter_id, service_id));
    CREATE TABLE Ticket (id INTEGER PRIMARY KEY, service_id INTEGER NOT NULL, status TEXT NOT NULL);
    INSERT INTO Service VALUES (1, 'Payments', 5), (2, 'Mail', 7), (3, 'Insurance', 20);
    INSERT INTO CounterService VALUES (1, 1), (1, 2), (2, 3);
    INSERT INTO Ticket VALUES (1, 1, 'waiting'), (2, 1, 'waiting'), (3, 1, 'served'), (4, 3, 'waiting');
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
