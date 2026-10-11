import test from 'node:test';
import assert from 'node:assert/strict';
import { registerNextCustomerRoute } from '../nextCustomerRoute.js';

function setup({ found = true, dbError = null, ticket = { id: 4, status: 'served' }, assignmentError = null } = {}) {
  let handler;
  let calls = [];
  const app = { post(path, cb) { assert.equal(path, '/api/counters/:counterId/next'); handler = cb; } };
  const db = { get(sql, params, cb) { calls.push(['db', sql, params]); cb(dbError, found ? { id: params[0] } : undefined); } };
  const assignNextTicket = async (id) => { calls.push(['assign', id]); if (assignmentError) throw assignmentError; return ticket; };
  registerNextCustomerRoute(app, { db, assignNextTicket });
  async function request(counterId) {
    let code = 200, body;
    const res = { status(value) { code = value; return this; }, json(value) { body = value; return this; } };
    await handler({ params: { counterId } }, res);
    return { code, body, calls };
  }
  return request;
}

test('returns assigned ticket and calls assignment once', async () => {
  const result = await setup()('7');
  assert.equal(result.code, 200);
  assert.deepEqual(result.body, { id: 4, status: 'served' });
  assert.equal(result.calls.filter(x => x[0] === 'assign').length, 1);
  assert.deepEqual(result.calls.at(-1), ['assign', 7]);
});
test('returns JSON null for empty queues', async () => {
  const result = await setup({ ticket: null })('7');
  assert.equal(result.code, 200);
  assert.equal(result.body, null);
});
test('rejects invalid IDs before DB access', async () => {
  for (const id of ['0', '-1', 'abc', '1.2', '9007199254740992', '01']) {
    const result = await setup()(id);
    assert.equal(result.code, 400);
    assert.equal(result.calls.length, 0);
  }
});
test('returns 404 for missing counter without assignment', async () => {
  const result = await setup({ found: false })('2');
  assert.equal(result.code, 404);
  assert.equal(result.calls.some(x => x[0] === 'assign'), false);
});
test('handles DB errors', async () => {
  const original = console.error; console.error = () => {};
  try { const result = await setup({ dbError: new Error('db unavailable') })('3'); assert.equal(result.code, 500); } finally { console.error = original; }
});
test('handles assignment errors', async () => {
  const original = console.error; console.error = () => {};
  try { const result = await setup({ assignmentError: new Error('failure') })('3'); assert.equal(result.code, 500); } finally { console.error = original; }
});
