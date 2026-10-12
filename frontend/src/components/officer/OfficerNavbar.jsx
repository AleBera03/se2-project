import { Button, Container, Navbar } from "react-bootstrap";

import { useOfficerContext } from "../../context/OfficerContext";

function OfficerNavbar() {
    const { user, busy, handleLogout } = useOfficerContext();

    if (!user) {
        return null;
    }

    return (
        <Navbar bg="white" className="border-bottom py-3">
            <Container className="d-flex flex-wrap gap-3">
                <Navbar.Brand className="me-auto">
                    Officer workspace
                </Navbar.Brand>

                <div className="d-flex align-items-center gap-3">
                    <span className="d-flex align-items-center gap-2 text-muted">
                        <i className="bi bi-person-circle" aria-hidden="true" />
                        <span>{user.username}</span>
                    </span>

                    <Button
                        variant="outline-primary"
                        onClick={handleLogout}
                        disabled={busy}
                    >
                        {busy ? "Logging out..." : "Log out"}
                    </Button>
                </div>
            </Container>
        </Navbar>
    );
}

export default OfficerNavbar;