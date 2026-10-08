/** Read-only queue retrieval for services supported by a counter. */
export function createGetCounterQueues(db) {
  return function getCounterQueues(counterId) {
    if (!Number.isSafeInteger(counterId) || counterId <= 0) {
      return Promise.reject(new TypeError('counterId must be a positive integer'));
    }

    const sql = `
      SELECT
        s.id AS serviceId,
        s.name AS serviceName,
        s.service_time AS averageServiceTime,
        COUNT(t.id) AS queueLength
      FROM CounterService AS cs
      JOIN Service AS s ON s.id = cs.service_id
      LEFT JOIN Ticket AS t
        ON t.service_id = s.id AND t.status = 'waiting'
      WHERE cs.counter_id = ?
      GROUP BY s.id, s.name, s.service_time
      ORDER BY s.id
    `;

    return new Promise((resolve, reject) => {
      db.all(sql, [counterId], (err, rows) => {
        if (err) return reject(err);
        resolve(rows);
      });
    });
  };
}
