import { Alert, Button, Container, Stack } from "react-bootstrap";

import { useCustomerLogic } from "../hooks/useCustomerLogic";

import PageHeader from "../components/common/PageHeader";
import ServiceSelection from "../components/customer/ServiceSelection";
import TicketConfirmation from "../components/customer/TicketConfirmation";

function CustomerPage() {

    const {
        services,
        selectedService,
        handleSelectService,
        showTicketConfirmation,
        handleCloseTicketConfirmation,
        ticket,
        ticketError,
        isGeneratingTicket
    } = useCustomerLogic();

    return (
        <Container fluid className="p-0">
            <Stack gap={4}>

                <PageHeader
                    className="customer-header text-center"
                    kicker="Office Queue Management"
                    title="Choose a service"
                    description="Select the service you need."
                />

                {selectedService && (
                    <Alert 
                        className="service-selection-feedback"
                        variant={ticketError ? "danger" : "primary"}
                        role="status"
                    >
                        {ticketError ? (
                            <>
                                {ticketError} Please try again.
                                <Button
                                    variant="link"
                                    className="p-0 ms-2 align-baseline"
                                    onClick={() => handleSelectService(selectedService)}
                                    disabled={isGeneratingTicket}
                                >
                                    Retry
                                </Button>
                            </>
                        ) : (
                            <>
                                Selected service:{" "}
                                <span className="fw-bold">{selectedService.name}</span>
                            </>
                        )}
                    </Alert>
                )}

                <ServiceSelection
                    services={services}
                    selectedServiceId={selectedService?.id}
                    onSelectService={handleSelectService}
                    isGeneratingTicket={isGeneratingTicket}
                />

                <TicketConfirmation
                    show={showTicketConfirmation}
                    onClose={handleCloseTicketConfirmation}
                    ticket={ticket}
                    service={selectedService}
                />

            </Stack>
        </Container>
    );
}

export default CustomerPage;