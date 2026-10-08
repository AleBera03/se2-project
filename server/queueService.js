import { getCounterQueues } from "./dao.js";

/**
 * Read the services compatible with a counter and choose the best nonempty queue.
 * Do not select, update, or assign any individual ticket.
 */
export async function chooseQueueForCounter(counterId) {
    const queues = await getCounterQueues(counterId);
    return selectQueue(queues);
}

/**
 * Choose a nonempty queue from the compatible services received.
 * Resolve ties by shortest average service time, then lowest service ID.
 * Do not select, update, or assign any individual ticket.
 */
export function selectQueue(queues) {
    if (!Array.isArray(queues)) {
        throw new TypeError("queues must be an array");
    }

    for (const queue of queues) {
        if (
            !queue ||
            !Number.isSafeInteger(queue.serviceId) ||
            queue.serviceId <= 0 ||
            !Number.isSafeInteger(queue.queueLength) ||
            queue.queueLength < 0 ||
            typeof queue.averageServiceTime !== "number" ||
            !Number.isFinite(queue.averageServiceTime) ||
            queue.averageServiceTime <= 0
        ) {
            throw new TypeError("Invalid queue data");
        }
    }

    const waiting = queues.filter((queue) => queue.queueLength > 0);

    if (waiting.length === 0) {
        return null;
    }

    const longest = Math.max(
        ...waiting.map((queue) => queue.queueLength)
    );

    const biggest = waiting.filter(
        (queue) => queue.queueLength === longest
    );

    const shortestTime = Math.min(
        ...biggest.map((queue) => queue.averageServiceTime)
    );

    const finalists = biggest.filter(
        (queue) => queue.averageServiceTime === shortestTime
    );

    return finalists.reduce((best, current) =>
        current.serviceId < best.serviceId ? current : best
    );
}