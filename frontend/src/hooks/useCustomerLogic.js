import { useRef, useState } from "react";

import { createTicket } from "../API/API.mjs";

const mockServices = [
    { id: 1, name: "Postal Payment Slips (up to 5)" },
    {
        id: 2,
        name: "Deposits, Withdrawals, F24, Top-ups and Other Payments"
    },
    { id: 3, name: "Mail and Parcels" },
    { id: 4, name: "Postepay Cards, Energy and Phone Services" },
    { id: 5, name: "Public Administration Services - Polis" },
    { id: 6, name: "Postal Savings Bonds and Savings Books" },
    { id: 7, name: "Motor Insurance" },
    {
        id: 8,
        name: "Current Accounts, Loans, Investments and Insurance"
    },
    { id: 9, name: "SPID" },
    { id: 10, name: "Residence Permits" },
    { id: 11, name: "Other" }
];

function useCustomerLogic() {

    // State of the service selected by the customer.
    const [selectedService, setSelectedService] = useState(null);

    // State of the ticket confirmation modal.
    const [showTicketConfirmation, setShowTicketConfirmation] = useState(false);
    const [ticket, setTicket] = useState(null);
    const [ticketError, setTicketError] = useState(null);
    const [isGeneratingTicket, setIsGeneratingTicket] = useState(false);
    const requestInProgress = useRef(false);

    // Select the service requested by the customer.
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
                createdAt: createdTicket.createdAt ?? createdTicket.created_at
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

    // Close the ticket confirmation and reset the selected service.
    const handleCloseTicketConfirmation = () => {
        setShowTicketConfirmation(false);
        setSelectedService(null);
        setTicket(null);
        setTicketError(null);
    };

    return {
        services: mockServices,
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