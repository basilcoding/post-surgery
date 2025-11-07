import { Routes, Route, Navigate } from "react-router-dom";

import { useAuthStore } from "../store/useAuthStore.js";

import LoginPage from '../pages/LoginPage'
import PatientLoginPage from "../pages/PatientPages/PatientLoginPage.jsx";
import DoctorLoginPage from "../pages/DoctorPages/DoctorLoginPage.jsx";

export default function LoginRoutes() {

    const { authUser } = useAuthStore();

    return (
        <Route>
            {/* Login */}
            <Route
                path="/admin-login"
                element={
                    authUser ? (
                        authUser.role === "doctor" ? (
                            <Navigate to="/doctor" />
                        ) : authUser.role === "patient" ? (
                            <Navigate to="/patient" />
                        ) : (
                            <Navigate to="/admin" />
                        )
                    ) : (
                        <LoginPage />
                    )
                }
            />
            <Route
                path="/patient-login"
                element={
                    authUser ? (
                        authUser.role === "doctor" ? (
                            <Navigate to="/doctor" />
                        ) : authUser.role === "patient" ? (
                            <Navigate to="/patient" />
                        ) : (
                            <Navigate to="/admin" />
                        )
                    ) : (
                        <PatientLoginPage />
                    )
                }
            />
            <Route
                path="/doctor-login"
                element={
                    authUser ? (
                        authUser.role === "doctor" ? (
                            <Navigate to="/doctor" />
                        ) : authUser.role === "patient" ? (
                            <Navigate to="/patient" />
                        ) : (
                            <Navigate to="/admin" />
                        )
                    ) : (
                        <DoctorLoginPage />
                    )
                }
            />
        </Route>
    );
}
