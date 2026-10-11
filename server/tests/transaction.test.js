import { describe, it, expect } from 'vitest';
import { run, get, all } from './helpers/testDb.js';
import { transaction } from '../db.js';

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const addWaiting = async (serviceId) => {
  const row = await get(`
    SELECT
      COALESCE(
        (SELECT code FROM Service WHERE id = ?),
        'Z'
      ) AS serviceCode,
      COALESCE(
        (SELECT MAX(daily_number) FROM Ticket WHERE service_id = ?),
        -1
      ) + 1 AS dailyNumber
  `, [serviceId, serviceId]);

  const code =
    `${row.serviceCode}${String(row.dailyNumber).padStart(3, '0')}`;

  return run(`
    INSERT INTO Ticket (service_id, daily_number, code)
    VALUES (?, ?, ?)
  `, [serviceId, row.dailyNumber, code]);
};
const tickets = () => all('SELECT id, service_id FROM Ticket ORDER BY id');

describe('transaction', () => {
  it('commits the changes and returns the callback result', async () => {
    const result = await transaction(async () => {
      await addWaiting(1);
      return 'done';
    });

    expect(result).toBe('done');
    expect(await tickets()).toHaveLength(1);
  });

  it('rolls back the changes and propagates the callback error', async () => {
    await expect(transaction(async () => {
      await addWaiting(1);
      throw new Error('boom');
    })).rejects.toThrow('boom');

    expect(await tickets()).toHaveLength(0);
  });

  it('keeps working after a failed transaction', async () => {
    await transaction(async () => { throw new Error('boom'); }).catch(() => {});

    await transaction(() => addWaiting(1));

    expect(await tickets()).toHaveLength(1);
  });

  it('propagates a COMMIT failure and rolls back', async () => {
    await expect(transaction(async () => {
      await run('PRAGMA defer_foreign_keys = ON');
      await addWaiting(99);
    })).rejects.toThrow(/FOREIGN KEY/);

    expect(await tickets()).toHaveLength(0);
    await transaction(() => addWaiting(1));
    expect(await tickets()).toHaveLength(1);
  });

  it('runs concurrent transactions one after another', async () => {
    const events = [];
    const slow = transaction(async () => {
      events.push('slow start');
      await addWaiting(1);
      await wait(30);
      await addWaiting(1);
      events.push('slow end');
    });
    const fast = transaction(async () => {
      events.push('fast start');
      await addWaiting(2);
      events.push('fast end');
    });

    await Promise.all([slow, fast]);

    expect(events).toEqual(['slow start', 'slow end', 'fast start', 'fast end']);
    expect(await tickets()).toHaveLength(3);
  });

  it('rolls back only the failing one among concurrent transactions', async () => {
    const ok = transaction(async () => {
      await addWaiting(1);
      await wait(30);
      await addWaiting(1);
    });
    const failing = transaction(async () => {
      await addWaiting(2);
      throw new Error('boom');
    });

    const [okResult, failingResult] = await Promise.allSettled([ok, failing]);

    expect(okResult.status).toBe('fulfilled');
    expect(failingResult.status).toBe('rejected');
    expect((await tickets()).map((t) => t.service_id)).toEqual([1, 1]);
  });
});