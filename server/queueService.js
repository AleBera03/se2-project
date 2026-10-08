// queue selection and ticket assignment.
import { getCounterQueues } from './dao.js';
import { selectQueue } from './queueSelection.js';

/**
 * Reads the services compatible with a counter and chooses the best nonempty queue.
 * Does not select, update, or assign any individual ticket.
 * The final-tie rule must be agreed with the team before using it in production.
 */
export async function chooseQueueForCounter(counterId, options = {}) {
  const queues = await getCounterQueues(counterId);
  return selectQueue(queues, options);
}