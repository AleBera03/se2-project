import { Alert, Button, Card, Col, Form, Row, Spinner } from "react-bootstrap";

import { useOfficerContext } from "../context/OfficerContext";
import NextCustomer from "../components/officer/NextCustomer";

function OfficerPage() {
    const {
        user,
        username,
        setUsername,
        password,
        setPassword,
        checkingSession,
        busy,
        error,
        handleLogin
    } = useOfficerContext();

    if (checkingSession) {
        return (
            <div className="text-center mt-5" role="status">
                <Spinner animation="border" />
                <p className="mt-2">Checking your session...</p>
            </div>
        );
    }

    if (user) {
        return (
            <>
                {error && (
                    <Alert variant="danger" className="mt-3">
                        {error}
                    </Alert>
                )}

                <NextCustomer
                    key={user.id}
                    counterId={user.counterId}
                />
            </>
        );
    }

    return (
        <Row className="justify-content-center mt-5">
            <Col xs={12} md={6} lg={4}>
                <Card className="shadow-sm">
                    <Card.Body className="p-4">
                        <h1 className="h4 text-center mb-4">
                            Officer login
                        </h1>

                        {error && (
                            <Alert variant="danger">{error}</Alert>
                        )}

                        <Form onSubmit={handleLogin}>
                            <Form.Group controlId="officer-username" className="mb-3">
                                <Form.Label>Username</Form.Label>
                                <Form.Control
                                    value={username}
                                    onChange={(event) => setUsername(event.target.value)}
                                    autoComplete="username"
                                    required
                                    disabled={busy}
                                />
                            </Form.Group>

                            <Form.Group controlId="officer-password" className="mb-4">
                                <Form.Label>Password</Form.Label>
                                <Form.Control
                                    type="password"
                                    value={password}
                                    onChange={(event) => setPassword(event.target.value)}
                                    autoComplete="current-password"
                                    required
                                    disabled={busy}
                                />
                            </Form.Group>

                            <Button
                                type="submit"
                                className="w-100"
                                disabled={busy}
                            >
                                {busy ? "Logging in..." : "Log in"}
                            </Button>
                        </Form>
                    </Card.Body>
                </Card>
            </Col>
        </Row>
    );
}

export default OfficerPage;
