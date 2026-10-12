import { Navigate, Route, Routes } from "react-router-dom";

import OfficerProvider from "./context/OfficerProvider";
import Layout from "./components/layout/Layout";
import OfficerNavbar from "./components/officer/OfficerNavbar";
import CustomerPage from "./pages/CustomerPage";
import OfficerPage from "./pages/OfficerPage";

function App() {
    return (
        <Routes>
            <Route element={<Layout />}>
                <Route
                    path="/"
                    element={<CustomerPage />}
                />

                <Route
                    path="/customer"
                    element={<CustomerPage />}
                />

                <Route
                    path="*"
                    element={<Navigate to="/" replace />}
                />
            </Route>

            <Route
                element={
                    <OfficerProvider>
                        <Layout navbar={<OfficerNavbar />} />
                    </OfficerProvider>
                }
            >
                <Route
                    path="/counter"
                    element={<OfficerPage />}
                />
            </Route>
        </Routes>
    );
}

export default App;