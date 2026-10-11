import { describe, it, expect } from 'vitest';
import { run, get, all, resetTestDb } from './helpers/testDb.js';

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

  it('reset removes tickets and restarts their codes from PAY-001', async () => {
    await run(`
      INSERT INTO Ticket (service_id, daily_number, code)
      VALUES (1, 1, 'PAY-001'), (2, 1, 'MAIL-001')
    `);

    await resetTestDb();

    expect(await get('SELECT COUNT(*) AS n FROM Ticket')).toEqual({ n: 0 });
    const { lastID } = await run(`
      INSERT INTO Ticket (service_id, daily_number, code)
      VALUES (1, 1, 'PAY-001')
    `);
    expect(await get('SELECT code FROM Ticket WHERE id = ?', [lastID])).toEqual({ code: 'PAY-001' });
  });
});