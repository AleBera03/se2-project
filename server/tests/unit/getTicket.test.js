// Unit tests: database queries and transactions are mocked.
// Real persistence, daily reset and concurrency are tested in integration tests.

import { beforeEach, describe, expect, it, vi } from 'vitest';

import db, { runAsync, transaction } from '../../db.js';
import { createTicket } from '../../dao/ticket-dao.js';

vi.mock('../../db.js', () => ({
  default: {
    get: vi.fn(),
  },
  runAsync: vi.fn(),
  transaction: vi.fn(),
}));

// Configure the next mocked database read.
const nextRow = (row) => {
  vi.mocked(db.get).mockImplementationOnce((sql, params, callback) => {
    callback(null, row);
  });
};

describe('createTicket — unit tests', () => {
  beforeEach(() => {
    vi.resetAllMocks();

    // Execute the callback without opening a real transaction.
    vi.mocked(transaction).mockImplementation(
      async (callback) => callback()
    );

    vi.mocked(runAsync).mockResolvedValue({
      lastID: 12,
      changes: 1,
    });
  });

  it.each([
    ['undefined', undefined],
    ['null', null],
    ['string', '1'],
    ['zero', 0],
    ['negative number', -1],
    ['decimal number', 1.5],
    ['boolean', true],
    ['NaN', NaN],
    ['Infinity', Infinity],
    ['unsafe integer', Number.MAX_SAFE_INTEGER + 1],
  ])('rejects an invalid service ID: %s', async (_, serviceId) => {
    await expect(createTicket(serviceId))
      .rejects.toThrow('serviceId must be a positive integer');

    expect(transaction).not.toHaveBeenCalled();
    expect(db.get).not.toHaveBeenCalled();
    expect(runAsync).not.toHaveBeenCalled();
  });

  it.each([
    ['A', undefined, 0, 'A000'],
    ['C', 6, 7, 'C007'],
    ['I', 98, 99, 'I099'],
    ['L', 998, 999, 'L999'],
    ['A', 999, 0, 'A000'],
  ])(
    'builds code %s from previous number %s',
    async (prefix, previousNumber, expectedNumber, expectedCode) => {
      const ticketDate = '2026-10-11';
      const savedTicket = {
        id: 12,
        code: expectedCode,
        service_id: 1,
        status: 'waiting',
        created_at: '2026-10-11T09:00:00.000Z',
      };

      nextRow({ code: prefix, ticketDate });
      nextRow(
        previousNumber === undefined
          ? undefined
          : { daily_number: previousNumber }
      );
      nextRow(undefined); // No waiting ticket has the generated code.
      nextRow(savedTicket);

      const result = await createTicket(1);

      expect(transaction).toHaveBeenCalledOnce();
      expect(transaction).toHaveBeenCalledWith(expect.any(Function));

      expect(runAsync).toHaveBeenCalledExactlyOnceWith(
        expect.any(String),
        [1, expectedNumber, ticketDate, expectedCode]
      );

      // Look up the returned ticket using the ID from the insertion.
      expect(db.get).toHaveBeenLastCalledWith(
        expect.any(String),
        [12],
        expect.any(Function)
      );

      expect(result).toEqual(savedTicket);
    }
  );

  it('rejects a service that does not exist', async () => {
    nextRow(undefined);

    await expect(createTicket(1))
      .rejects.toThrow('Service not found.');

    expect(runAsync).not.toHaveBeenCalled();
  });

  it('rejects a code already used by a waiting ticket', async () => {
    nextRow({ code: 'A', ticketDate: '2026-10-11' });
    nextRow({ daily_number: 999 });
    nextRow({ id: 4 });

    await expect(createTicket(1)).rejects.toMatchObject({
      code: 'TICKET_CODE_IN_USE',
      message:
        'Ticket code is still in use. Please wait before requesting another ticket.',
    });

    expect(db.get).toHaveBeenNthCalledWith(
      3,
      expect.any(String),
      ['A000', '2026-10-11'],
      expect.any(Function)
    );

    expect(runAsync).not.toHaveBeenCalled();
  });

  it('propagates database read errors without inserting a ticket', async () => {
    const error = new Error('Database read failed');

    vi.mocked(db.get).mockImplementationOnce((sql, params, callback) => {
      callback(error);
    });

    await expect(createTicket(1)).rejects.toBe(error);
    expect(runAsync).not.toHaveBeenCalled();
  });

  it('propagates insertion errors without reading a saved ticket', async () => {
    nextRow({ code: 'A', ticketDate: '2026-10-11' });
    nextRow(undefined);
    nextRow(undefined);

    const error = new Error('Ticket insertion failed');
    vi.mocked(runAsync).mockRejectedValue(error);

    await expect(createTicket(1)).rejects.toBe(error);

    expect(db.get).toHaveBeenCalledTimes(3);
  });

  it('propagates errors when retrieving the inserted ticket', async () => {
    nextRow({ code: 'A', ticketDate: '2026-10-11' });
    nextRow(undefined);
    nextRow(undefined);

    const error = new Error('Saved ticket retrieval failed');

    vi.mocked(db.get).mockImplementationOnce((sql, params, callback) => {
      callback(error);
    });

    await expect(createTicket(1)).rejects.toBe(error);
  });

  it('propagates transaction errors without accessing the database', async () => {
    const error = new Error('Unable to start transaction');
    vi.mocked(transaction).mockRejectedValue(error);

    await expect(createTicket(1)).rejects.toBe(error);

    expect(db.get).not.toHaveBeenCalled();
    expect(runAsync).not.toHaveBeenCalled();
  });
});