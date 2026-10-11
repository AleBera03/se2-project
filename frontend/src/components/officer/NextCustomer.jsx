import { useNextCustomerLogic } from "../../hooks/useNextCustomerLogic";
import { Button, Card, Col, Row, Alert, Spinner } from "react-bootstrap";

function NextCustomer(props) {

    const { counterId = 1 } = props;

    const {
        ticket,
        loading,
        error,
        noCustomer,
        handleNextCustomer
    } = useNextCustomerLogic(counterId);

    return (
        <Row className="justify-content-center mt-4">
            <Col xs={12} md={8} xl={6}>
                <Card className="h-100 text-center shadow-sm">
                    <Card.Header as="h2" className="h5 bg-white py-3">
                        Counter {counterId}
                    </Card.Header>

                    <Card.Body className="d-flex flex-column gap-4 p-4">
                        <Button
                            variant="primary"
                            size="lg"
                            className="w-100 py-3"
                            disabled={loading}
                            onClick={handleNextCustomer}
                            aria-label="Call next customer"
                        >
                            {loading ? (
                                <>
                                    <Spinner
                                        as="span"
                                        animation="border"
                                        size="sm"
                                        role="status"
                                        aria-hidden="true"
                                        className="me-2"
                                    />
                                    Calling...
                                </>
                            ) : (
                                "Next customer"
                            )}
                        </Button>

                        <div className="result-area mt-auto">
                            {!loading && !error && !ticket && !noCustomer && (
                                <p className="text-muted mb-0">
                                    Ready to call the next customer in the queue.
                                </p>
                            )}

                            {error && (
                                <Alert variant="danger" className="mb-0">
                                    {error}
                                </Alert>
                            )}

                            {noCustomer && (
                                <Alert variant="info" className="mb-0">
                                    No customers waiting.
                                </Alert>
                            )}

                            {ticket && (
                                <Card className="border-primary bg-light">
                                    <Card.Body>
                                        <Card.Subtitle className="mb-2 text-muted">
                                            Currently Serving
                                        </Card.Subtitle>
                                        <Card.Title className="display-4 fw-bold text-primary mb-0">
                                            {ticket.code}
                                        </Card.Title>
                                        <Card.Text className="mb-0">
                                            {ticket.service_name ||
                                                `Service ${ticket.service_id}`}
                                        </Card.Text>
                                    </Card.Body>
                                </Card>
                            )}
                        </div>
                    </Card.Body>
                </Card>
            </Col>
        </Row>
    );
}

export default NextCustomer;