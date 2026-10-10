import { describe, it, expect } from 'vitest';
import { run, all } from './helpers/testDb.js';
import { assignNextTicket } from '../queueService.js';

// fixtures
// counter 1 -> services 1 (5 min) 2 (7 min)
// counter 2 -> services 2, 3 (15 min)
const addWaiting = async (serviceId, count = 1, createdAt) => {
  for (let i = 0; i < count; i++) {
    if (createdAt) await run('INSERT INTO Ticket (service_id, created_at) VALUES (?, ?)', [serviceId, createdAt]);
    else await run('INSERT INTO Ticket (service_id) VALUES (?)', [serviceId]);
  }
};
const tickets = () => all('SELECT id, service_id, status, counter_id FROM Ticket ORDER BY id');

describe('assignNextTicket', () => {
  it('assigns the oldest waiting ticket of the selected queue', async () => {
    await addWaiting(2, 1, '2026-10-09T10:00:00.000Z');
    await addWaiting(2, 1, '2026-10-09T09:00:00.000Z');
    await addWaiting(1, 1);

    const ticket = await assignNextTicket(1);

    expect(ticket.id).toBe(2);
    expect(await tickets()).toEqual([
      { id: 1, service_id: 2, status: 'waiting', counter_id: null },
      { id: 2, service_id: 2, status: 'served', counter_id: 1 },
      { id: 3, service_id: 1, status: 'waiting', counter_id: null },
    ]);
  });

  it('breaks equal timestamps with the lowest ticket ID', async () => {
    await addWaiting(1, 3, '2026-10-09T09:00:00.000Z');

    expect((await assignNextTicket(1)).id).toBe(1);
  });

  it('returns null without modifying data when compatible queues are empty', async () => {
    await addWaiting(3, 2);
    const before = await tickets();

    expect(await assignNextTicket(1)).toBeNull();
    expect(await tickets()).toEqual(before);
  });

  it('never assigns the same ticket to simultaneous requests', async () => {
    await addWaiting(2, 2);

    const [a, b] = await Promise.all([assignNextTicket(1), assignNextTicket(2)]);

    expect(a.id).not.toBe(b.id);
    expect((await tickets()).map((t) => t.status)).toEqual(['served', 'served']);
  });

  it('rejects an invalid counter ID without modifying data', async () => {
    await addWaiting(1, 1);
    const before = await tickets();

    await expect(assignNextTicket(0)).rejects.toThrow(/positive integer/);
    expect(await tickets()).toEqual(before);
  });
});