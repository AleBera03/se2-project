import { useEffect, useRef, useState } from "react";

import { createTicket, getServices } from "../API/API.mjs";

function useCustomerLogic() {

    // State of the available services.
    const [services, setServices] = useState([]);
    const [isLoadingServices, setIsLoadingServices] = useState(true);
    const [servicesError, setServicesError] = useState(null);

    // Retrieves services when the page opens.
    useEffect(() => {
        let cancelled = false;

        async function loadServices() {
            try {
                const availableServices = await getServices();

                if (!cancelled) {
                    setServices(availableServices);
                }
            } catch (error) {
                if (!cancelled) {
                    setServicesError(
                        error instanceof Error
                            ? error.message
                            : "Unable to retrieve services."
                    );
                }
            } finally {
                if (!cancelled) {
                    setIsLoadingServices(false);
                }
            }
        }

        loadServices();

        return () => {
            cancelled = true;
        };
    }, []);

    // State of the service selected by the customer.
    const [selectedService, setSelectedService] = useState(null);

    // State of ticket generation and confirmation.
    const [showTicketConfirmation, setShowTicketConfirmation] = useState(false);
    const [ticket, setTicket] = useState(null);
    const [ticketError, setTicketError] = useState(null);
    const [isGeneratingTicket, setIsGeneratingTicket] = useState(false);
    const requestInProgress = useRef(false);

    // Generates a ticket for the selected service.
    const handleSelectService = async (service) => {
        if (requestInProgress.current) {
            return;
        }

        setSelectedService(service); 
        setTicket(null);
        setTicketError(null);
        setIsGeneratingTicket(true);
        requestInProgress.current = true;

        try {
            const createdTicket = await createTicket(service.id);

            setTicket({
                ...createdTicket,
                createdAt: createdTicket.created_at
            });
            setShowTicketConfirmation(true);
        } catch (error) {
            setTicketError(
                error instanceof Error
                    ? error.message
                    : "Unable to create ticket."
            );
        } finally {
            requestInProgress.current = false;
            setIsGeneratingTicket(false);
        }
    };

    // Closes the confirmation and resets the selected service.
    const handleCloseTicketConfirmation = () => {
        setShowTicketConfirmation(false);
        setSelectedService(null);
        setTicket(null);
        setTicketError(null);
    };

    return {
        services,
        isLoadingServices,
        servicesError,
        selectedService,
        handleSelectService,
        showTicketConfirmation,
        handleCloseTicketConfirmation,
        ticket,
        ticketError,
        isGeneratingTicket
    };
}

export { useCustomerLogic };