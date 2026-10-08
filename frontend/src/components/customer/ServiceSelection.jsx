import { Button, Card, Col, Row } from "react-bootstrap";

function ServiceSelection(props) {
    const {
        services,
        selectedServiceId,
        onSelectService
    } = props;

    if (services.length === 0) {
        return <p>No services are currently available.</p>;
    }

    return (
        <Row className="g-4">

            {services.map((service) => {
                const isSelected = service.id === selectedServiceId;

                return (
                    <Col key={service.id} xs={12} md={6} xl={4}>
                        <Card
                            className={`service-card h-100 ${
                                isSelected ? "service-card-selected" : ""
                            }`}
                        >
                            <Card.Body className="d-flex flex-column gap-3">

                                <Card.Title as="h2" className="h5">
                                    {service.name}
                                </Card.Title>

                                <Button
                                    className={`mt-auto ${
                                        isSelected ? "service-button-selected" : ""
                                    }`}
                                    variant={
                                        isSelected
                                            ? "primary"
                                            : "outline-primary"
                                    }
                                    aria-pressed={isSelected}
                                    aria-label={`Select ${service.name}`}
                                    onClick={() => onSelectService(service)}
                                >
                                    {isSelected ? "Selected" : "Select service"}
                                </Button>

                            </Card.Body>
                        </Card>
                    </Col>
                );
            })}

        </Row>
    );
}

export default ServiceSelection;