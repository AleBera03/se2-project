import { useState } from "react";

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

    // Select the service requested by the customer.
    const handleSelectService = (service) => {
        setSelectedService(service);
    };

    return {
        services: mockServices,
        selectedService,
        handleSelectService
    };
}

export { useCustomerLogic };