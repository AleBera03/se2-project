import { describe, it, expect } from 'vitest';
import request from 'supertest';

import app from '../../app.js';
import { get, run } from '../helpers/testDb.js';

describe('Get ticket — API and database integration', () => {
  it('returns the services stored in the database', async () => {
    const response = await request(app).get('/api/services');

    expect(response.status).toBe(200);
    expect(response.body).toEqual([
      { id: 1, name: 'Payments' },
      { id: 2, name: 'Mail and Parcels' },
      { id: 3, name: 'SPID' },
    ]);
  });

  it('creates and persists a waiting ticket for the selected service', async () => {
    const response = await request(app)
      .post('/api/tickets')
      .send({ serviceId: 2 });

    expect(response.status).toBe(201);
    expect(response.body).toMatchObject({
      service_id: 2,
      status: 'waiting',
      code: 'C000',
    });
    expect(Number.isSafeInteger(response.body.id)).toBe(true);
    expect(response.body.id).toBeGreaterThan(0);
    expect(typeof response.body.created_at).toBe('string');
    expect(Number.isNaN(Date.parse(response.body.created_at))).toBe(false);

    const savedTicket = await get(`
      SELECT id, code, service_id, status, created_at, counter_id
      FROM Ticket
      WHERE id = ?
    `, [response.body.id]);

    expect(savedTicket).toEqual({
      ...response.body,
      counter_id: null,
    });

    expect(await get(`
      SELECT daily_number, ticket_date
      FROM Ticket
      WHERE id = ?
    `, [response.body.id])).toEqual({
      daily_number: 0,
      ticket_date: (await get(
        "SELECT date('now') AS today"
      )).today,
    });

    expect(await get('SELECT COUNT(*) AS count FROM Ticket'))
      .toEqual({ count: 1 });
  });

  it('creates distinct progressive codes for the same service', async () => {
    const first = await request(app)
      .post('/api/tickets')
      .send({ serviceId: 1 });

    const second = await request(app)
      .post('/api/tickets')
      .send({ serviceId: 1 });

    expect(first.status).toBe(201);
    expect(second.status).toBe(201);
    expect(first.body.code).toBe('A000');
    expect(second.body.code).toBe('A001');
    expect(second.body.id).toBeGreaterThan(first.body.id);

    expect(await get(`
      SELECT COUNT(*) AS count,
             COUNT(DISTINCT code) AS distinctCodes
      FROM Ticket
      WHERE service_id = ?
    `, [1])).toEqual({
      count: 2,
      distinctCodes: 2,
    });
  });

  it('uses separate prefixes and progressives for different services', async () => {
    const first = await request(app)
      .post('/api/tickets')
      .send({ serviceId: 1 });

    const second = await request(app)
      .post('/api/tickets')
      .send({ serviceId: 3 });

    expect(first.status).toBe(201);
    expect(second.status).toBe(201);
    expect(first.body.code).toBe('A000');
    expect(second.body.code).toBe('I000');

    expect(await get(
      'SELECT service_id, status FROM Ticket WHERE id = ?',
      [first.body.id],
    )).toEqual({
      service_id: 1,
      status: 'waiting',
    });

    expect(await get(
      'SELECT service_id, status FROM Ticket WHERE id = ?',
      [second.body.id],
    )).toEqual({
      service_id: 3,
      status: 'waiting',
    });
  });

  it('creates distinct codes for simultaneous requests', async () => {
    const responses = await Promise.all([
      request(app).post('/api/tickets').send({ serviceId: 1 }),
      request(app).post('/api/tickets').send({ serviceId: 1 }),
    ]);

    for (const response of responses) {
      expect(response.status).toBe(201);
    }

    expect(responses.map((response) => response.body.code).sort())
      .toEqual(['A000', 'A001']);

    expect(await get(`
      SELECT COUNT(*) AS count,
             COUNT(DISTINCT code) AS distinctCodes
      FROM Ticket
    `)).toEqual({
      count: 2,
      distinctCodes: 2,
    });
  });

  it('starts from zero for a new day and preserves previous tickets', async () => {
    await run(`
      INSERT INTO Ticket (
        service_id, daily_number, ticket_date, code,
        status, counter_id
      )
      VALUES (
        1, 42, date('now', '-1 day'), 'A042',
        'served', 1
      )
    `);

    const previousTicket = await get('SELECT * FROM Ticket');

    const response = await request(app)
      .post('/api/tickets')
      .send({ serviceId: 1 });

    expect(response.status).toBe(201);
    expect(response.body.code).toBe('A000');

    expect(await get(`
      SELECT daily_number, ticket_date
      FROM Ticket
      WHERE id = ?
    `, [response.body.id])).toEqual({
      daily_number: 0,
      ticket_date: (await get(
        "SELECT date('now') AS today"
      )).today,
    });

    expect(await get(
      'SELECT * FROM Ticket WHERE id = ?',
      [previousTicket.id],
    )).toEqual(previousTicket);
  });

  it('wraps from 999 to zero when the previous zero is already served', async () => {
    await run(`
      INSERT INTO Ticket (
        service_id, daily_number, code, status, counter_id
      )
      VALUES
        (1, 0, 'A000', 'served', 1),
        (1, 999, 'A999', 'served', 1)
    `);

    const response = await request(app)
      .post('/api/tickets')
      .send({ serviceId: 1 });

    expect(response.status).toBe(201);
    expect(response.body.code).toBe('A000');

    expect(await get(`
      SELECT daily_number, status, counter_id
      FROM Ticket
      WHERE id = ?
    `, [response.body.id])).toEqual({
      daily_number: 0,
      status: 'waiting',
      counter_id: null,
    });

    expect(await get('SELECT COUNT(*) AS count FROM Ticket'))
      .toEqual({ count: 3 });
  });

  it('returns 409 when the rollover code is still waiting', async () => {
    await run(`
      INSERT INTO Ticket (service_id, daily_number, code)
      VALUES (1, 0, 'A000'), (1, 999, 'A999')
    `);

    const response = await request(app)
      .post('/api/tickets')
      .send({ serviceId: 1 });

    expect(response.status).toBe(409);
    expect(response.body.error).toBe(
      'Ticket code is still in use. Please wait before requesting another ticket.'
    );

    expect(await get('SELECT COUNT(*) AS count FROM Ticket'))
      .toEqual({ count: 2 });
  });

  it.each([
    ['missing serviceId', {}],
    ['null serviceId', { serviceId: null }],
    ['string serviceId', { serviceId: '1' }],
    ['zero serviceId', { serviceId: 0 }],
    ['negative serviceId', { serviceId: -1 }],
    ['decimal serviceId', { serviceId: 1.5 }],
    ['boolean serviceId', { serviceId: true }],
    ['unsafe integer serviceId', { serviceId: Number.MAX_SAFE_INTEGER + 1 }],
  ])('rejects %s without creating a ticket', async (_, body) => {
    const response = await request(app)
      .post('/api/tickets')
      .send(body);

    expect(response.status).toBe(400);
    expect(response.body.error).toEqual(expect.any(String));

    expect(await get('SELECT COUNT(*) AS count FROM Ticket'))
      .toEqual({ count: 0 });
  });

  it('rejects an unknown service without creating a ticket', async () => {
    const response = await request(app)
      .post('/api/tickets')
      .send({ serviceId: 999 });

    expect(response.status).toBe(404);
    expect(response.body.error).toEqual(expect.any(String));

    expect(await get('SELECT COUNT(*) AS count FROM Ticket'))
      .toEqual({ count: 0 });
  });
});