const BASE_URL = 'http://localhost:3001/api';

/**
 * Creates a waiting ticket for the selected service.
 *
 * @param {number} serviceId The id of an existing service.
 * @returns {Promise<object>} The ticket returned by the API.
 */

export async function createTicket(serviceId) {
    const response = await fetch(`${BASE_URL}/tickets`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ serviceId })
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
        throw new Error(data.error ?? 'Unable to create ticket.');
    }

    return data;
}

/**
 * Retrieves the available services.
 *
 * @returns {Promise<Array<{id: number, name: string}>>}
 * The services returned by the API.
 */
export async function getServices() {
    const response = await fetch(`${BASE_URL}/services`);
    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.error ?? 'Unable to retrieve services.');
    }

    return data;
}