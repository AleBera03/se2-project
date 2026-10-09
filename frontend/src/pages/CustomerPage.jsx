import { Alert, Container, Stack } from "react-bootstrap";

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
        handleCloseTicketConfirmation
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
                        variant="primary" 
                        role="status"
                    >
                        Selected service:{" "}
                        <span className="fw-bold">{selectedService.name}</span>
                    </Alert>
                )}

                <ServiceSelection
                    services={services}
                    selectedServiceId={selectedService?.id}
                    onSelectService={handleSelectService}
                />

                <TicketConfirmation
                    show={showTicketConfirmation}
                    onClose={handleCloseTicketConfirmation}
                    ticket={{
                        code: "T11",
                        createdAt: new Date().toISOString()
                    }}
                    service={selectedService}
                    estimatedWaitingMinutes={16}
                />

            </Stack>
        </Container>
    );
}

export default CustomerPage;