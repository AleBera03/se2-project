// Unit tests: DAO and transaction dependencies are mocked.
// SQL ordering, rollback and concurrency are covered by integration tests.

import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  assignTicket,
  getCounterQueues,
  getFirstWaitingTicket,
} from '../../dao/ticket-dao.js';
import { transaction } from '../../db.js';
import { assignNextTicket } from '../../queueService.js';

vi.mock('../../dao/ticket-dao.js', () => ({
  getCounterQueues: vi.fn(),
  getFirstWaitingTicket: vi.fn(),
  assignTicket: vi.fn(),
}));

vi.mock('../../db.js', () => ({
  transaction: vi.fn(),
}));

describe('assignNextTicket — unit tests', () => {
  beforeEach(() => {
    vi.resetAllMocks();

    // Execute the callback without opening a real transaction.
    vi.mocked(transaction).mockImplementation(
      async (callback) => callback()
    );

    vi.mocked(getCounterQueues).mockResolvedValue([
      {
        serviceId: 2,
        queueLength: 3,
        averageServiceTime: 7,
      },
    ]);
  });

  it('assigns the retrieved ticket and returns its updated fields', async () => {
    const waitingTicket = {
      id: 12,
      code: 'C003',
      service_id: 2,
      status: 'waiting',
      counter_id: null,
      created_at: '2026-10-11T09:00:00.000Z',
    };

    vi.mocked(getFirstWaitingTicket).mockResolvedValue(waitingTicket);
    vi.mocked(assignTicket).mockResolvedValue({ changes: 1 });

    const result = await assignNextTicket(1);

    expect(transaction).toHaveBeenCalledOnce();
    expect(transaction).toHaveBeenCalledWith(expect.any(Function));
    expect(getCounterQueues).toHaveBeenCalledWith(1);
    expect(getFirstWaitingTicket).toHaveBeenCalledWith(2);
    expect(assignTicket).toHaveBeenCalledExactlyOnceWith(12, 1);

    expect(result).toEqual({
      ...waitingTicket,
      status: 'served',
      counter_id: 1,
    });

    expect(waitingTicket.status).toBe('waiting');
    expect(waitingTicket.counter_id).toBeNull();
  });

  it('does not retrieve or assign a ticket when all queues are empty', async () => {
    vi.mocked(getCounterQueues).mockResolvedValue([
      {
        serviceId: 2,
        queueLength: 0,
        averageServiceTime: 7,
      },
    ]);

    expect(await assignNextTicket(1)).toBeNull();
    expect(getFirstWaitingTicket).not.toHaveBeenCalled();
    expect(assignTicket).not.toHaveBeenCalled();
  });

  it('returns null if the selected queue has no ticket', async () => {
    vi.mocked(getFirstWaitingTicket).mockResolvedValue(undefined);

    expect(await assignNextTicket(1)).toBeNull();
    expect(getFirstWaitingTicket).toHaveBeenCalledWith(2);
    expect(assignTicket).not.toHaveBeenCalled();
  });

  it('propagates queue-retrieval errors without assigning a ticket', async () => {
    const error = new Error('Unable to retrieve queues');
    vi.mocked(getCounterQueues).mockRejectedValue(error);

    await expect(assignNextTicket(1)).rejects.toBe(error);

    expect(getFirstWaitingTicket).not.toHaveBeenCalled();
    expect(assignTicket).not.toHaveBeenCalled();
  });

  it('propagates ticket-retrieval errors without assigning a ticket', async () => {
    const error = new Error('Unable to retrieve ticket');
    vi.mocked(getFirstWaitingTicket).mockRejectedValue(error);

    await expect(assignNextTicket(1)).rejects.toBe(error);

    expect(assignTicket).not.toHaveBeenCalled();
  });

  it('propagates assignment errors', async () => {
    vi.mocked(getFirstWaitingTicket).mockResolvedValue({
      id: 12,
      service_id: 2,
      status: 'waiting',
      counter_id: null,
    });

    const error = new Error('Ticket is no longer waiting');
    vi.mocked(assignTicket).mockRejectedValue(error);

    await expect(assignNextTicket(1)).rejects.toBe(error);

    expect(assignTicket).toHaveBeenCalledExactlyOnceWith(12, 1);
  });

  it('propagates transaction errors without accessing the DAO', async () => {
    const error = new Error('Unable to start transaction');
    vi.mocked(transaction).mockRejectedValue(error);

    await expect(assignNextTicket(1)).rejects.toBe(error);

    expect(getCounterQueues).not.toHaveBeenCalled();
    expect(getFirstWaitingTicket).not.toHaveBeenCalled();
    expect(assignTicket).not.toHaveBeenCalled();
  });
});