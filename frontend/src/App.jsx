import { Navigate, Route, Routes } from "react-router-dom";

import Layout from "./components/layout/Layout";
import CustomerPage from "./pages/CustomerPage";

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
        </Routes>
    );
}

export default App;