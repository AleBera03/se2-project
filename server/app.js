import express from "express";
import cors from "cors";

import { getServices } from "./dao.js";

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

export default app;