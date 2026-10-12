import { useRef, useState } from "react";

import { callNextCustomer } from "../API/API.mjs";

function useNextCustomerLogic(counterId) {
    // State of the next-customer request and result.
    const [ticket, setTicket] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [noCustomer, setNoCustomer] = useState(false);
    const requestInProgress = useRef(false);

    // Calls the next customer and prevents overlapping requests.
    const handleNextCustomer = async () => {
        if (requestInProgress.current) {
            return;
        }

        requestInProgress.current = true;
        setLoading(true);
        setError(null);
        setTicket(null);
        setNoCustomer(false);

        try {
            const nextTicket = await callNextCustomer(counterId);

            if (nextTicket === null) {
                setNoCustomer(true);
            } else {
                setTicket(nextTicket);
            }
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : "Unable to call the next customer."
            );
        } finally {
            requestInProgress.current = false;
            setLoading(false);
        }
    };

    return {
        ticket,
        loading,
        error,
        noCustomer,
        handleNextCustomer
    };
}

export { useNextCustomerLogic };