import { describe, it, expect } from 'vitest';
import { get, all, resetTestDb } from '../helpers/testDb.js';
import { createTicket } from '../../dao/ticket-dao.js';

describe('test database', () => {
  it('uses the dedicated test file', async () => {
    const row = await get("SELECT file FROM pragma_database_list WHERE name = 'main'");
    expect(row.file).toMatch(/oqms-test\.sqlite$/);
  });

  it('starts every test with the fixtures and no tickets', async () => {
    const services = await all('SELECT id FROM Service ORDER BY id');
    expect(services.map((s) => s.id)).toEqual([1, 2, 3]);
    expect(await get('SELECT COUNT(*) AS n FROM CounterService')).toEqual({ n: 4 });
    expect(await get('SELECT COUNT(*) AS n FROM Ticket')).toEqual({ n: 0 });
  });

  it('reset removes tickets and restarts their codes from A000', async () => {
    await createTicket(1);
    await createTicket(2);

    await resetTestDb();

    expect(await get('SELECT COUNT(*) AS n FROM Ticket'))
      .toEqual({ n: 0 });

    const ticket = await createTicket(1);

    expect(ticket.id).toBe(1);
    expect(ticket.code).toBe('A000');
  });
});