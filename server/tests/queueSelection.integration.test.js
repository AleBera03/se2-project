import { describe, it, expect } from 'vitest';
import { run, all } from './helpers/testDb.js';
import { chooseQueueForCounter } from '../queueService.js';

// fixtures: counter 1 -> services 1 (5 min), 2 (7 min); counter 2 -> services 2, 3 (15 min)
const addWaiting = async (serviceId, count) => {
  for (let i = 0; i < count; i++) {
    await run(
      'INSERT INTO Ticket (service_id, daily_number, code) VALUES (?, ?, ?)',
      [serviceId, i + 1, `TEST-${serviceId}-${i + 1}`],
    );
  }
};

describe('chooseQueueForCounter with the test database', () => {
  it('selects the longest compatible queue without modifying tickets', async () => {
    await addWaiting(1, 2);
    await addWaiting(2, 3);
    const before = await all('SELECT * FROM Ticket ORDER BY id');

    const chosen = await chooseQueueForCounter(1);

    expect(chosen).toMatchObject({ serviceId: 2, queueLength: 3, averageServiceTime: 7 });
    expect(await all('SELECT * FROM Ticket ORDER BY id')).toEqual(before);
  });

  it('ignores queues of services the counter cannot serve', async () => {
    await addWaiting(3, 5);
    await addWaiting(1, 1);
    expect((await chooseQueueForCounter(1)).serviceId).toBe(1);
  });

  it('does not count served tickets', async () => {
    await addWaiting(1, 2);
    await addWaiting(2, 1);
    await run(`
      INSERT INTO Ticket (service_id, daily_number, code, status, counter_id)
      VALUES (2, 4, 'TEST-2-4', 'served', 1),
             (2, 5, 'TEST-2-5', 'served', 1)
    `);
    expect(await chooseQueueForCounter(1)).toMatchObject({ serviceId: 1, queueLength: 2 });
  });

  it('breaks equal lengths with the shortest service time', async () => {
    await addWaiting(2, 2);
    await addWaiting(3, 2);
    expect((await chooseQueueForCounter(2)).serviceId).toBe(2);
  });

  it('breaks a full tie with the lowest service ID', async () => {
    await run('UPDATE Service SET service_time = 5 WHERE id = 2');
    await addWaiting(2, 2);
    await addWaiting(1, 2);
    expect((await chooseQueueForCounter(1)).serviceId).toBe(1);
  });

  it('returns null when all compatible queues are empty', async () => {
    await addWaiting(3, 4);
    expect(await chooseQueueForCounter(1)).toBeNull();
  });

  it('returns null for a counter without services', async () => {
    expect(await chooseQueueForCounter(99)).toBeNull();
  });
});
