import { assignTicket, getCounterQueues, getFirstWaitingTicket } from "./dao/ticket-dao.js";
import { transaction } from "./db.js";

/**
 * Retrieves compatible queues and selects the best nonempty one.
 */
async function chooseQueueForCounter(counterId) {
    const queues = await getCounterQueues(counterId);
    return selectQueue(queues);
}

/**
 * Selects the longest nonempty queue.
 * Resolves ties by shortest service time, then lowest service ID.
 */
function selectQueue(queues) {
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

/**
 * Selects and assigns the next waiting ticket in a single transaction.
 */
async function assignNextTicket(counterId) {
    return transaction(async () => {
        const queue = await chooseQueueForCounter(counterId);

        if (queue === null) {
            return null;
        }

        const firstTicket = await getFirstWaitingTicket(queue.serviceId);

        if (!firstTicket) {
            return null;
        }

        await assignTicket(firstTicket.id, counterId);

        return { ...firstTicket, status: 'served', counter_id: counterId };
    })
}

export {
    chooseQueueForCounter,
    selectQueue,
    assignNextTicket
};