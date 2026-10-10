import { describe, it, expect } from 'vitest';
import { createTicket } from '../dao.js';

describe('createTicket', () => {
  it('generates a waiting ticket with a service-specific daily code', async () => {
    const ticket = await createTicket(1);

    expect(ticket.service_id).toBe(1);
    expect(ticket.status).toBe('waiting');
    expect(ticket.code).toMatch(/^PAY-\d{3}$/);
    expect(ticket.created_at).toBeTruthy();
  });
});
