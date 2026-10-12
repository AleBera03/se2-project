import { Service, Ticket, User } from "../models/models.js";

const BASE_URL = 'http://localhost:3001/api';

/**
 * Creates a waiting ticket for the selected service.
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

    return new Ticket(data);
}

/**
 * Retrieves the available services.
 */
export async function getServices() {
    const response = await fetch(`${BASE_URL}/services`);
    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.error ?? 'Unable to retrieve services.');
    }

    return data.map(service => new Service(service));
}

/**
 * Assigns the next waiting ticket to the authenticated counter.
 */
export async function callNextCustomer(counterId) {
    const response = await fetch(
        `${BASE_URL}/counters/${counterId}/next`,
        {
            method: "POST",
            credentials: "include"
        }
    );

    if (!response.ok) {
        const data = await response.json().catch(() => null);

        throw new Error(
            data?.error ?? "Unable to call the next customer."
        );
    }

    const data = await response.json();

    return data === null ? null : new Ticket(data);
}

/**
 * Logs in with a preconfigured counter account.
 */
export async function login(username, password) {
    const response = await fetch(`${BASE_URL}/sessions`, {
        method: "POST",
        credentials: "include",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ username, password })
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.error ?? "Unable to log in.");
    }

    return new User(data);
}

/**
 * Restores the current session or returns null when not authenticated.
 */
export async function getCurrentUser() {
    const response = await fetch(`${BASE_URL}/sessions/current`, {
        credentials: "include"
    });

    if (response.status === 401) {
        return null;
    }

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.error ?? "Unable to retrieve the session.");
    }

    return new User(data);
}

/**
 * Ends the current session.
 */
export async function logout() {
    const response = await fetch(`${BASE_URL}/sessions/current`, {
        method: "DELETE",
        credentials: "include"
    });

    if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error ?? "Unable to log out.");
    }
}

