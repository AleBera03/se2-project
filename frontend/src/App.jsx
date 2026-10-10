import { Navigate, Route, Routes } from "react-router-dom";

import Layout from "./components/layout/Layout";
import CustomerPage from "./pages/CustomerPage";
import NextCustomer from "./components/officer/NextCustomer";

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
                    path="/counter"
                    element={<NextCustomer />}
                />

                <Route
                    path="*"
                    element={<Navigate to="/" replace />}
                />

            </Route>
        </Routes>
    );
}

export default App;