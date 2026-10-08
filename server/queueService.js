import { getCounterQueues } from './dao.js';
import { selectQueue } from './queueSelection.js';

/**
 * Reads the services compatible with a counter and chooses the best nonempty queue.
 * Does not select, update, or assign any individual ticket.
 * Final ties use the lowest service ID as a deterministic fallback (pending team approval).
 */
export async function chooseQueueForCounter(counterId) {
  const queues = await getCounterQueues(counterId);
  return selectQueue(queues);
}