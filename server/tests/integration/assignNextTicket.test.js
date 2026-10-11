import { describe, it, expect } from 'vitest';
import { run, get, all } from '../helpers/testDb.js';
import { assignNextTicket } from '../../queueService.js';
import { createTicket } from '../../dao/ticket-dao.js';

// fixtures
// counter 1 -> services 1 (5 min) 2 (7 min)
// counter 2 -> services 2, 3 (15 min)
const addWaiting = async (serviceId, count = 1, createdAt) => {
  for (let i = 0; i < count; i++) {
    const ticket = await createTicket(serviceId);

    if (createdAt) {
      await run(
        'UPDATE Ticket SET created_at = ? WHERE id = ?',
        [createdAt, ticket.id]
      );
    }
  }
};
const tickets = () => all('SELECT id, service_id, status, counter_id FROM Ticket ORDER BY id');

describe('assignNextTicket', () => {
  it('assigns the oldest waiting ticket of the selected queue', async () => {
    await addWaiting(2, 1, '2026-10-09T10:00:00.000Z');
    await addWaiting(2, 1, '2026-10-09T09:00:00.000Z');
    await addWaiting(1, 1);

    const ticket = await assignNextTicket(1);

    expect(ticket).toMatchObject({
      id: 2,
      service_id: 2,
      status: 'served',
      counter_id: 1,
    });
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

  it('preserves a concurrent new ticket when assignment rolls back', async () => {
    const original = await createTicket(1);

    // Integration test: force an assignment failure in the real database.
    await run(`
      CREATE TEMP TRIGGER fail_ticket_assignment
      BEFORE UPDATE OF status ON Ticket
      WHEN NEW.status = 'served'
      BEGIN
        SELECT RAISE(ABORT, 'Simulated assignment failure');
      END
    `);

    try {
      const [assignment, creation] = await Promise.allSettled([
        assignNextTicket(1),
        createTicket(1),
      ]);

      expect(assignment.status).toBe('rejected');
      expect(assignment.reason.message)
        .toContain('Simulated assignment failure');

      expect(creation.status).toBe('fulfilled');

      const newTicket = creation.value;

      expect(newTicket.id).not.toBe(original.id);
      expect(newTicket.code).toBe('A001');

      expect(await get(`
        SELECT status, counter_id
        FROM Ticket
        WHERE id = ?
      `, [original.id])).toEqual({
        status: 'waiting',
        counter_id: null,
      });

      expect(await get(`
        SELECT code, service_id, status, counter_id
        FROM Ticket
        WHERE id = ?
      `, [newTicket.id])).toEqual({
        code: 'A001',
        service_id: 1,
        status: 'waiting',
        counter_id: null,
      });

      expect(await get('SELECT COUNT(*) AS count FROM Ticket'))
        .toEqual({ count: 2 });
    } finally {
      await run('DROP TRIGGER IF EXISTS fail_ticket_assignment');
    }
  });

  it('ignores previous-day waiting tickets and assigns today’s ticket', async () => {
    const previousTicket = await createTicket(1);

    await run(`
      UPDATE Ticket
      SET ticket_date = date('now', '-1 day'),
          created_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now', '-1 day')
      WHERE id = ?
    `, [previousTicket.id]);

    const currentTicket = await createTicket(1);

    const assigned = await assignNextTicket(1);

    expect(assigned).toMatchObject({
      id: currentTicket.id,
      status: 'served',
      counter_id: 1,
    });

    expect(await tickets()).toEqual([
      {
        id: previousTicket.id,
        service_id: 1,
        status: 'waiting',
        counter_id: null,
      },
      {
        id: currentTicket.id,
        service_id: 1,
        status: 'served',
        counter_id: 1,
      },
    ]);
  });

});