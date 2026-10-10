import test from 'node:test';
import assert from 'node:assert';
import { createTicket } from '../dao.js';

test('createTicket should generate a ticket with waiting status and a unique code', async () => {
    // 1. Execute the function (assuming serviceId 1 exists in the DB)
    const ticket = await createTicket(1);

    // 2. Assertions: automatically verify the results are correct
    assert.strictEqual(ticket.service_id, 1, 'The service_id does not match');
    assert.strictEqual(ticket.status, 'waiting', 'The default status should be waiting');
    
    // Verify the service prefix and daily progressive number.
    assert.match(ticket.code, /^PAY-\d{3}$/, 'The code must contain the service prefix and number');
    
    // Verify that the timestamp has been generated
    assert.ok(ticket.created_at, 'The creation timestamp is missing');
});