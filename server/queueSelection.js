/**
 * Choose a compatible, nonempty service queue from getCounterQueues(counterId).
 * This function never selects, updates, or assigns an individual ticket.
 * @param {Array<{serviceId:number,queueLength:number,averageServiceTime:number}>} queues
 * @returns {object|null} Chosen service row or null when no one is waiting.
 */
export function selectQueue(queues) {
  if (!Array.isArray(queues)) throw new TypeError('queues must be an array');
  for (const queue of queues) {
    if (!queue || !Number.isSafeInteger(queue.serviceId) || queue.serviceId <= 0 ||
        !Number.isSafeInteger(queue.queueLength) || queue.queueLength < 0 ||
        typeof queue.averageServiceTime !== 'number' ||
        !Number.isFinite(queue.averageServiceTime) || queue.averageServiceTime < 0) {
      throw new TypeError('Invalid queue data');
    }
  }
  const waiting = queues.filter(q => q.queueLength > 0);
  if (!waiting.length) return null;
  const longest = Math.max(...waiting.map(q => q.queueLength));
  const biggest = waiting.filter(q => q.queueLength === longest);
  const shortestTime = Math.min(...biggest.map(q => q.averageServiceTime));
  const finalists = biggest.filter(q => q.averageServiceTime === shortestTime);
  // Deterministic final tie-break: choose the smallest service ID.
  return finalists.reduce((best, current) =>
    current.serviceId < best.serviceId ? current : best
  );
}
