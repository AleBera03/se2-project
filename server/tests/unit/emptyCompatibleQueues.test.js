import { test } from 'vitest';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, readFile, writeFile, rm, realpath } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL, fileURLToPath } from 'node:url';

const queueServicePath =
  fileURLToPath(new URL('../../queueService.js', import.meta.url));

/**
 * Creates a queue record for the tests.
 */
const row = (serviceId, queueLength, averageServiceTime) => ({ serviceId, queueLength, averageServiceTime });

/**
 * Loads the queue service in a temporary environment with mocked dependencies.
 */
async function loadWithQueues(queues) {
  const dir = await realpath(
    await mkdtemp(join(tmpdir(), 'empty-compatible-queues-'))
  );

  try {
    await writeFile(join(dir, 'package.json'), '{"type":"module"}');
    await mkdir(join(dir, 'dao'));
    // Copies the project's actual implementation.
    await writeFile(join(dir, 'queueService.js'), await readFile(queueServicePath));
    await writeFile(join(dir, 'dao', 'ticket-dao.js'), `
      export const calls = { getCounterQueues: 0, getFirstWaitingTicket: 0, assignTicket: 0 };
      export async function getCounterQueues() { calls.getCounterQueues++; return ${JSON.stringify(queues)}; }
      export async function getFirstWaitingTicket() { calls.getFirstWaitingTicket++; throw new Error('Should not fetch tickets'); }
      export async function assignTicket() { calls.assignTicket++; throw new Error('Should not assign tickets'); }
    `);
    await writeFile(join(dir, 'db.js'), `
      export const transactionCalls = { count: 0 };
      export async function transaction(callback) { transactionCalls.count++; return await callback(); }
    `);

    const service = await import(pathToFileURL(join(dir, 'queueService.js')).href);
    const dao = await import(
      pathToFileURL(join(dir, 'dao', 'ticket-dao.js')).href
    );

    return {
      ...service,
      calls: dao.calls,
      cleanup: () => rm(dir, { recursive: true, force: true })
    };
  } catch (err) {
    await rm(dir, { recursive: true, force: true });
    throw err;
  }
}

test('returns null when all compatible queues have no waiting tickets', async () => {
  const s = await loadWithQueues([row(1, 0, 5), row(2, 0, 7)]);

  try {
    assert.equal(await s.chooseQueueForCounter(1), null);
  } finally {
    await s.cleanup();
  }
});

test('returns null when counter has no compatible services', async () => {
  const s = await loadWithQueues([]);

  try {
    assert.equal(await s.chooseQueueForCounter(1), null);
  } finally {
    await s.cleanup();
  }
});

test('empty selection does not mutate its input queue records', async () => {
  const s = await loadWithQueues([]);

  try {
    const queues = Object.freeze([Object.freeze(row(1, 0, 5)), Object.freeze(row(2, 0, 7))]);

    assert.equal(s.selectQueue(queues), null);
    assert.deepEqual(queues, [row(1, 0, 5), row(2, 0, 7)]);
  } finally {
    await s.cleanup();
  }
});

test('nonempty compatible queue remains selectable', async () => {
  const s = await loadWithQueues([row(1, 0, 5), row(2, 2, 7)]);

  try {
    assert.equal((await s.chooseQueueForCounter(1)).serviceId, 2);
  } finally {
    await s.cleanup();
  }
});

test('empty queues do not fetch or assign tickets through assignNextTicket', async () => {
  const s = await loadWithQueues([row(1, 0, 5), row(2, 0, 7)]);

  try {
    assert.equal(await s.assignNextTicket(1), null);
    assert.equal(s.calls.getFirstWaitingTicket, 0);
    assert.equal(s.calls.assignTicket, 0);
  } finally {
    await s.cleanup();
  }
});
