import { Container } from "react-bootstrap";
import { Outlet } from "react-router-dom";

function Layout() {
    return (
        <main className="app-layout">
            <Container className="content py-4">
                <Outlet />
            </Container>
        </main>
    );
}

export default Layout;