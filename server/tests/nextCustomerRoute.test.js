import { describe, it, expect, vi, afterEach } from 'vitest';
import { registerNextCustomerRoute } from '../app.js';

function setup({ found = true, dbError = null, ticket = { id: 4, status: 'served' }, assignmentError = null } = {}) {
  let handler;
  const calls = [];
  const app = {
    post(path, cb) {
      expect(path).toBe('/api/counters/:counterId/next');
      handler = cb;
    },
  };
  const db = {
    get(sql, params, cb) {
      calls.push(['db', sql, params]);
      cb(dbError, found ? { id: params[0] } : undefined);
    },
  };
  const assignNextTicket = vi.fn(async (id) => {
    calls.push(['assign', id]);
    if (assignmentError) throw assignmentError;
    return ticket;
  });
  registerNextCustomerRoute(app, { db, assignNextTicket });

  async function request(counterId) {
    let code = 200;
    let body;
    const res = {
      status(value) { code = value; return this; },
      json(value) { body = value; return this; },
    };
    await handler({
      params: { counterId },
      isAuthenticated: () => true,
      user: { counterId: Number(counterId) },
    }, res);
    return { code, body, calls, assignNextTicket };
  }
  return request;
}

afterEach(() => vi.restoreAllMocks());

describe('Next-Customer API', () => {
  it('returns assigned ticket and calls assignment once', async () => {
    const result = await setup()('7');
    expect(result.code).toBe(200);
    expect(result.body).toEqual({ id: 4, status: 'served' });
    expect(result.assignNextTicket).toHaveBeenCalledExactlyOnceWith(7);
  });

  it('returns JSON null for empty queues', async () => {
    const result = await setup({ ticket: null })('7');
    expect(result.code).toBe(200);
    expect(result.body).toBeNull();
  });

  it('rejects invalid IDs before DB access', async () => {
    for (const id of ['0', '-1', 'abc', '1.2', '9007199254740992', '01']) {
      const result = await setup()(id);
      expect(result.code).toBe(400);
      expect(result.calls).toHaveLength(0);
      expect(result.assignNextTicket).not.toHaveBeenCalled();
    }
  });

  it('returns 404 for missing counter without assignment', async () => {
    const result = await setup({ found: false })('2');
    expect(result.code).toBe(404);
    expect(result.assignNextTicket).not.toHaveBeenCalled();
  });

  it('handles DB errors', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const result = await setup({ dbError: new Error('db unavailable') })('3');
    expect(result.code).toBe(500);
    expect(result.assignNextTicket).not.toHaveBeenCalled();
  });

  it('handles assignment errors', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const result = await setup({ assignmentError: new Error('failure') })('3');
    expect(result.code).toBe(500);
    expect(result.assignNextTicket).toHaveBeenCalledOnce();
  });
});
