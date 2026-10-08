import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getCounterQueues } from '../dao.js';
import { selectQueue, chooseQueueForCounter } from '../queueService.js';

vi.mock('../dao.js', () => ({ getCounterQueues: vi.fn() }));

const q = (serviceId, queueLength, averageServiceTime) => ({ serviceId, queueLength, averageServiceTime });

describe('selectQueue', () => {
  it('selects the longest waiting queue', () => {
    expect(selectQueue([q(1, 2, 2), q(2, 5, 20), q(3, 3, 1)]).serviceId).toBe(2);
  });

  it('breaks equal lengths with the shortest average service time', () => {
    expect(selectQueue([q(1, 4, 9), q(2, 4, 3), q(3, 2, 1)]).serviceId).toBe(2);
  });

  it('breaks a full tie with the lowest service ID regardless of order', () => {
    expect(selectQueue([q(8, 3, 5), q(2, 3, 5), q(5, 3, 5)]).serviceId).toBe(2);
    expect(selectQueue([q(5, 3, 5), q(8, 3, 5), q(2, 3, 5)]).serviceId).toBe(2);
  });

  it('ignores empty queues even with a shorter service time', () => {
    expect(selectQueue([q(1, 0, 1), q(2, 2, 8)]).serviceId).toBe(2);
  });

  it('returns null when all queues are empty or none are compatible', () => {
    expect(selectQueue([q(1, 0, 3), q(2, 0, 2)])).toBeNull();
    expect(selectQueue([])).toBeNull();
  });

  it('rejects a non-array input', () => {
    expect(() => selectQueue(null)).toThrow(/array/);
  });

  it.each([0, -1, NaN, Infinity, '4', null, undefined])('rejects service time %s', (time) => {
    expect(() => selectQueue([q(1, 1, time)])).toThrow(/Invalid queue data/);
  });

  it.each([
    ['service ID 0', q(0, 1, 2)],
    ['negative length', q(1, -1, 2)],
    ['non-integer length', q(1, 1.5, 2)],
    ['null row', null],
  ])('rejects %s', (_, row) => {
    expect(() => selectQueue([row])).toThrow(/Invalid queue data/);
  });

  it('does not mutate its input', () => {
    const data = Object.freeze([Object.freeze(q(1, 1, 4)), Object.freeze(q(2, 2, 5))]);
    selectQueue(data);
    expect(data).toEqual([q(1, 1, 4), q(2, 2, 5)]);
  });
});

describe('chooseQueueForCounter', () => {
  beforeEach(() => {
    vi.mocked(getCounterQueues).mockReset();
  });

  it('selects among the queues returned for the counter', async () => {
    vi.mocked(getCounterQueues).mockResolvedValue([q(10, 4, 8), q(11, 4, 3), q(12, 0, 1)]);
    expect((await chooseQueueForCounter(7)).serviceId).toBe(11);
    expect(getCounterQueues).toHaveBeenCalledWith(7);
  });

  it('returns null when the counter has no waiting customers', async () => {
    vi.mocked(getCounterQueues).mockResolvedValue([q(10, 0, 8)]);
    expect(await chooseQueueForCounter(7)).toBeNull();
  });

  it('propagates DAO errors', async () => {
    vi.mocked(getCounterQueues).mockRejectedValue(new TypeError('counterId must be a positive integer'));
    await expect(chooseQueueForCounter(0)).rejects.toThrow(/counterId/);
  });
});
