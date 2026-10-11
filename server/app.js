import express from "express";
import cors from "cors";

import db from "./db.js";
import { createTicket, getServices } from "./dao.js";
import { assignNextTicket } from "./queueService.js";

const app = express();

/* GENERAL MIDDLEWARE */

// Parses JSON request bodies.
app.use(express.json());

/* CORS */

const corsOptions = {
    origin: "http://localhost:5173"
};

app.use(cors(corsOptions));

/* HEALTH */

/**
 * Checks whether the API server is reachable.
 */
app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
});

/* SERVICES */

/**
 * Retrieves the available services.
 */
app.get("/api/services", async (req, res) => {
    try {
        const services = await getServices();
        res.json(services);
    } catch (err) {
        console.error(err);
        res.status(500).json({
            error: "Unable to retrieve services."
        });
    }
});

/* TICKETS */

/**
 * Creates a waiting ticket for an existing service.
 */
app.post("/api/tickets", async (req, res) => {
    const { serviceId } = req.body ?? {};

    if (!Number.isSafeInteger(serviceId) || serviceId <= 0) {
        res.status(400).json({
            error: "serviceId must be a positive integer."
        });
        return;
    }

    try {
        const services = await getServices();

        if (!services.some((service) => service.id === serviceId)) {
            res.status(404).json({
                error: "Service not found."
            });
            return;
        }

        const ticket = await createTicket(serviceId);
        res.status(201).json(ticket);
    } catch (err) {
        if (err.code === "TICKET_CODE_IN_USE") {
            return res.status(409).json({
                error: err.message
            });
        }
        console.error(err);
        res.status(500).json({
            error: "Unable to create ticket."
        });
    }
});

/* COUNTERS */

/**
 * Serves the next waiting customer for a counter.
 */
export function registerNextCustomerRoute(app, { db, assignNextTicket }) {
    app.post("/api/counters/:counterId/next", async (req, res) => {
        const rawId = req.params.counterId;

        if (typeof rawId !== "string" || !/^[1-9]\d*$/.test(rawId)) {
            res.status(400).json({
                error: "Invalid counter ID"
            });
            return;
        }

        const counterId = Number(rawId);

        if (!Number.isSafeInteger(counterId)) {
            res.status(400).json({
                error: "Invalid counter ID"
            });
            return;
        }

        try {
            const counter = await new Promise((resolve, reject) => {
                db.get(
                    "SELECT id FROM Counter WHERE id = ?",
                    [counterId],
                    (err, row) => {
                        if (err) {
                            reject(err);
                            return;
                        }

                        resolve(row);
                    }
                );
            });

            if (!counter) {
                res.status(404).json({
                    error: "Counter not found"
                });
                return;
            }

            const ticket = await assignNextTicket(counterId);
            res.status(200).json(ticket ?? null);
        } catch (err) {
            console.error("Next-customer API error:", err);
            res.status(500).json({
                error: "Unable to retrieve next customer"
            });
        }
    });
}

registerNextCustomerRoute(app, { db, assignNextTicket });

export default app;
