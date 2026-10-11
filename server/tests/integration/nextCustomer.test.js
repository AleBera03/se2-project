import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';

import app from '../../app.js';
import { all, run } from '../helpers/testDb.js';

// fixtures
// counter 1 -> services 1 (A, 5 min), 2 (C, 7 min)
// counter 2 -> services 2, 3 (I, 15 min)
let officers;

// Create authenticated sessions for the two fixture counters.
beforeEach(async () => {
  officers = {
    1: request.agent(app),
    2: request.agent(app),
  };

  for (const counterId of [1, 2]) {
    const response = await officers[counterId]
      .post('/api/sessions')
      .send({
        username: `counter${counterId}`,
        password: `Counter${counterId}!`,
      });

    expect(response.status).toBe(201);
  }
});

const issue = async (serviceId, count = 1) => {
  for (let i = 0; i < count; i++) {
    const response = await request(app)
      .post('/api/tickets')
      .send({ serviceId });

    expect(response.status).toBe(201);
  }
};

const callNext = async (counterId) => {
  const response = await officers[counterId].post(`/api/counters/${counterId}/next`);

  expect(response.status).toBe(200);
  return response.body;
};

const tickets = () => all('SELECT * FROM Ticket ORDER BY id');

const queueLengths = async () => Object.fromEntries((await all(`
  SELECT s.id, COUNT(t.id) AS length
  FROM Service AS s
  LEFT JOIN Ticket AS t ON t.service_id = s.id AND t.status = 'waiting'
  GROUP BY s.id
`)).map((row) => [row.id, row.length]));

describe('Next customer — API and database integration', () => {
  it('calls the first ticket of the longest compatible queue and shortens only that queue', async () => {
    await issue(1, 2);
    await issue(2, 3);
    await issue(3, 4);
    const before = await tickets();

    const called = await callNext(1);
    const expected = {
      ...before.find((ticket) => ticket.code === 'C000'),
      status: 'served',
      counter_id: 1,
    };

    expect(called).toEqual({
    ...expected,
    service_name: 'Mail and Parcels',
    });
    expect(await tickets()).toEqual(
      before.map((ticket) => (ticket.id === expected.id ? expected : ticket)),
    );
    expect(await queueLengths()).toEqual({ 1: 2, 2: 2, 3: 4 });
  });

  it('re-evaluates the queues at every call until the compatible ones are empty', async () => {
    await issue(1, 2);
    await issue(2, 3);
    await issue(3, 1);

    const codes = [];
    for (let i = 0; i < 5; i++) {
      codes.push((await callNext(1)).code);
    }

    expect(codes).toEqual(['C000', 'A000', 'C001', 'A001', 'C002']);

    const before = await tickets();

    expect(await callNext(1)).toBeNull();
    expect(await tickets()).toEqual(before);
    expect(await queueLengths()).toEqual({ 1: 0, 2: 0, 3: 1 });
  });

  it('lets counters sharing a service call from the same queue', async () => {
    await issue(2, 2);
    await issue(3, 1);

    expect(await callNext(1)).toMatchObject({ code: 'C000', counter_id: 1 });
    expect(await callNext(2)).toMatchObject({ code: 'C001', counter_id: 2 });
    expect(await callNext(1)).toBeNull();
    expect(await callNext(2)).toMatchObject({ code: 'I000', counter_id: 2 });
    expect(await queueLengths()).toEqual({ 1: 0, 2: 0, 3: 0 });
  });

  it('never calls the same ticket for simultaneous requests from different counters', async () => {
    await issue(1, 1);
    await issue(2, 3);
    await issue(3, 1);

    const results = await Promise.all(
      [1, 2, 1, 2, 1, 2, 1, 2].map((counterId) => callNext(counterId)),
    );
    const called = results.filter(Boolean).sort((a, b) => a.id - b.id);

    expect(called).toHaveLength(5);
    expect(new Set(called.map((ticket) => ticket.id)).size).toBe(5);
    expect(await all(`
        SELECT t.*, s.name AS service_name
        FROM Ticket AS t
        JOIN Service AS s ON s.id = t.service_id
        WHERE t.status = 'served'
        ORDER BY t.id
    `)).toEqual(called);
    expect(await queueLengths()).toEqual({ 1: 0, 2: 0, 3: 0 });
  });

  it('keeps the queues consistent when tickets are issued while counters call customers', async () => {
    await issue(2, 2);

    const [issued, results] = await Promise.all([
      Promise.all([1, 2, 3].map(() => request(app).post('/api/tickets').send({ serviceId: 2 }))),
      Promise.all([1, 2, 1].map((counterId) => callNext(counterId))),
    ]);
    const called = results.filter(Boolean).sort((a, b) => a.id - b.id);
    const rows = await tickets();

    expect(issued.map((response) => response.status)).toEqual([201, 201, 201]);
    expect(rows).toHaveLength(5);
    expect(new Set(rows.map((ticket) => ticket.code)).size).toBe(5);
    expect(called.length).toBeGreaterThanOrEqual(2);
    expect(await all(`
        SELECT t.*, s.name AS service_name
        FROM Ticket AS t
        JOIN Service AS s ON s.id = t.service_id
        WHERE t.status = 'served'
        ORDER BY t.id
    `)).toEqual(called);
    expect((await queueLengths())[2]).toBe(5 - called.length);
  });

  it.each(['abc', '0', '-1', '1.5', '01', '9007199254740992'])(
    'rejects counter ID %s without modifying tickets',
    async (counterId) => {
      await issue(1, 1);
      const before = await tickets();

      const response = await officers[1].post(`/api/counters/${counterId}/next`);

      expect(response.status).toBe(400);
      expect(response.body.error).toEqual(expect.any(String));
      expect(await tickets()).toEqual(before);
    },
  );

  it('rejects an unassigned counter without modifying tickets', async () => {
    await issue(1, 1);
    const before = await tickets();

    const response = await officers[1].post('/api/counters/99/next');

    expect(response.status).toBe(403);
    expect(response.body.error).toEqual(expect.any(String));
    expect(await tickets()).toEqual(before);
  });

  it('returns 500 and keeps the ticket waiting when the assignment fails', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    await issue(1, 1);
    const before = await tickets();

    await run(`
      CREATE TEMP TRIGGER fail_next_customer
      BEFORE UPDATE ON Ticket
      BEGIN
        SELECT RAISE(ABORT, 'Simulated assignment failure');
      END
    `);

    try {
      const response = await officers[1].post('/api/counters/1/next');

      expect(response.status).toBe(500);
      expect(response.body.error).toEqual(expect.any(String));
      expect(await tickets()).toEqual(before);
    } finally {
      await run('DROP TRIGGER IF EXISTS fail_next_customer');
      consoleError.mockRestore();
    }
  });
});