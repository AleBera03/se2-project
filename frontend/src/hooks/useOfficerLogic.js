import { useEffect, useState } from "react";

import { getCurrentUser, login, logout } from "../API/API.mjs";

function useOfficerLogic() {
    // State of officer authentication and the login form.
    const [user, setUser] = useState(null);
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [checkingSession, setCheckingSession] = useState(true);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState(null);

    // Restores the officer session when the page opens.
    useEffect(() => {
        let cancelled = false;

        async function restoreSession() {
            try {
                const currentUser = await getCurrentUser();

                if (!cancelled) {
                    setUser(currentUser);
                }
            } catch (err) {
                if (!cancelled) {
                    setError(err.message);
                }
            } finally {
                if (!cancelled) {
                    setCheckingSession(false);
                }
            }
        }

        restoreSession();

        return () => {
            cancelled = true;
        };
    }, []);

    // Authenticates the officer and clears the password field.
    const handleLogin = async (event) => {
        event.preventDefault();

        if (busy) return;

        setBusy(true);
        setError(null);

        try {
            const account = await login(username, password);
            setUser(account);
            setPassword("");
        } catch (err) {
            setError(err.message);
        } finally {
            setBusy(false);
        }
    };

    // Ends the session and resets the login form.
    const handleLogout = async () => {
        if (busy) return;

        setBusy(true);
        setError(null);

        try {
            await logout();
            setUser(null);
            setUsername("");
            setPassword("");
        } catch (err) {
            setError(err.message);
        } finally {
            setBusy(false);
        }
    };

    return {
        user,
        username,
        setUsername,
        password,
        setPassword,
        checkingSession,
        busy,
        error,
        handleLogin,
        handleLogout
    };
}

export { useOfficerLogic };