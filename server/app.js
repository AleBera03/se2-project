import express from "express";
import cors from "cors";

import { createTicket, getServices } from "./dao.js";

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
        console.error(err);
        res.status(500).json({
            error: "Unable to create ticket."
        });
    }
});

export default app;