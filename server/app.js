import crypto from "node:crypto";
import express from "express";
import cors from "cors";
import { Passport } from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import session from "express-session";

import db from "./db.js";
import { getUser, getUserById } from "./dao/auth-dao.js";
import { createTicket, getServices } from "./dao/ticket-dao.js";
import { assignNextTicket } from "./queueService.js";

const app = express();

const passport = new Passport();

// Verifies credentials through the authentication DAO.
passport.use(new LocalStrategy(async (username, password, done) => {
    try {
        const user = await getUser(username, password);

        if (!user) {
            return done(null, false, {
                message: "Incorrect username or password."
            });
        }

        done(null, user);
    } catch (err) {
        done(err);
    }
}));

// Stores only the account ID in the session.
passport.serializeUser((user, done) => {
    done(null, user.id);
});

// Restores the account and its associated counter.
passport.deserializeUser(async (id, done) => {
    try {
        const user = await getUserById(id);
        done(null, user ?? false);
    } catch (err) {
        done(err);
    }
});

/* GENERAL MIDDLEWARE */

// Parses JSON request bodies.
app.use(express.json());

/* CORS */

const corsOptions = {
    origin: "http://localhost:5173",
    credentials: true
};

app.use(cors(corsOptions));

/* SESSIONS */

app.use(session({
    name: "oqms.sid",
    secret: process.env.SESSION_SECRET ?? crypto.randomBytes(32).toString("hex"),
    resave: false,
    saveUninitialized: false,
    cookie: {
        httpOnly: true,
        sameSite: "lax",
        maxAge: 8 * 60 * 60 * 1000
    }
}));

app.use(passport.initialize());
app.use(passport.session());

/* AUTHENTICATION */

// Authenticates the officer and creates a session.
app.post("/api/sessions", (req, res, next) => {
    const { username, password } = req.body ?? {};

    if (
        typeof username !== "string" ||
        typeof password !== "string" ||
        username.length === 0 ||
        password.length === 0
    ) {
        return res.status(400).json({
            error: "Username and password are required."
        });
    }

    passport.authenticate("local", (err, user, info) => {
        if (err) {
            console.error(err);
            return res.status(500).json({
                error: "Unable to log in."
            });
        }

        if (!user) {
            return res.status(401).json({
                error: info?.message ?? "Incorrect username or password."
            });
        }

        req.login(user, (err) => {
            if (err) {
                return res.status(500).json({
                    error: "Unable to log in."
                });
            }

            res.status(201).json(user);
        });
    })(req, res, next);
});

// Restores the current authenticated account.
app.get("/api/sessions/current", (req, res) => {
    if (!req.isAuthenticated()) {
        return res.status(401).json({
            error: "Not authenticated."
        });
    }

    res.json(req.user);
});

// Destroys the session and removes its cookie.
app.delete("/api/sessions/current", (req, res) => {
    req.logout((err) => {
        if (err) {
            return res.status(500).json({
                error: "Unable to log out."
            });
        }

        req.session.destroy((err) => {
            if (err) {
                return res.status(500).json({
                    error: "Unable to log out."
                });
            }

            res.clearCookie("oqms.sid", {
                httpOnly: true,
                sameSite: "lax"
            });
            res.status(204).end();
        });
    });
});

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
function registerNextCustomerRoute(app, { db, assignNextTicket }) {
    app.post("/api/counters/:counterId/next", async (req, res) => {
        if (!req.isAuthenticated()) {
            return res.status(401).json({
                error: "Please log in."
            });
        }

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

        if (req.user.counterId !== counterId) {
            return res.status(403).json({
                error: "You can only serve your assigned counter."
            });
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

export {
    app as default,
    registerNextCustomerRoute
};
