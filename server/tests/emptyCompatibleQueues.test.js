import { beforeEach, describe, expect, it, vi } from 'vitest';

// Mock external dependencies, but test the real queueService.js implementation.
const mocks = vi.hoisted(() => ({
  getCounterQueues: vi.fn(),
  getFirstWaitingTicket: vi.fn(),
  assignTicket: vi.fn(),
  transaction: vi.fn(),
}));

vi.mock('../dao.js', () => ({
  getCounterQueues: mocks.getCounterQueues,
  getFirstWaitingTicket: mocks.getFirstWaitingTicket,
  assignTicket: mocks.assignTicket,
}));

vi.mock('../db.js', () => ({ transaction: mocks.transaction }));

import { chooseQueueForCounter, selectQueue, assignNextTicket } from '../queueService.js';

const queue = (serviceId, queueLength, averageServiceTime) => ({
  serviceId,
  queueLength,
  averageServiceTime,
});

beforeEach(() => {
  vi.resetAllMocks();
  mocks.transaction.mockImplementation(async (callback) => callback());
});

describe('Handle empty compatible queues', () => {
  it('returns null when all compatible queues have no waiting tickets', async () => {
    mocks.getCounterQueues.mockResolvedValue([queue(1, 0, 5), queue(2, 0, 7)]);
    await expect(chooseQueueForCounter(1)).resolves.toBeNull();
    expect(mocks.getCounterQueues).toHaveBeenCalledExactlyOnceWith(1);
  });

  it('returns null when a counter has no compatible services', async () => {
    mocks.getCounterQueues.mockResolvedValue([]);
    await expect(chooseQueueForCounter(1)).resolves.toBeNull();
  });

  it('does not mutate input queue records when queues are empty', () => {
    const queues = Object.freeze([
      Object.freeze(queue(1, 0, 5)),
      Object.freeze(queue(2, 0, 7)),
    ]);
    expect(selectQueue(queues)).toBeNull();
    expect(queues).toEqual([queue(1, 0, 5), queue(2, 0, 7)]);
  });

  it('still selects a compatible queue when one has waiting tickets', async () => {
    mocks.getCounterQueues.mockResolvedValue([queue(1, 0, 5), queue(2, 2, 7)]);
    await expect(chooseQueueForCounter(1)).resolves.toMatchObject({ serviceId: 2 });
  });

  it('does not fetch or assign individual tickets when all queues are empty', async () => {
    mocks.getCounterQueues.mockResolvedValue([queue(1, 0, 5), queue(2, 0, 7)]);
    await expect(assignNextTicket(1)).resolves.toBeNull();
    expect(mocks.transaction).toHaveBeenCalledOnce();
    expect(mocks.getFirstWaitingTicket).not.toHaveBeenCalled();
    expect(mocks.assignTicket).not.toHaveBeenCalled();
  });
});
