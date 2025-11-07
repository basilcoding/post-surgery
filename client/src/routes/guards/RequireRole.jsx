import React from "react";
import { Navigate } from "react-router-dom";
import { useAuthStore } from "../../store/useAuthStore";

export default function RequireRole({ allowedRoles = [], children }) {
    const { authUser } = useAuthStore();
    const role = authUser?.role;

    if (!authUser) {
        if (authUser.role === 'patient') return <Navigate to='/patient-login' replace />
        if (authUser.role === 'doctor') return <Navigate to='/doctor-login' replace />
        if (authUser.role === 'admin') return <Navigate to='/admin-login' replace />
    }

    if (allowedRoles.includes(authUser.role)) return children;

    // fallback redirect by role
    if (authUser.role === "doctor") return <Navigate to="/doctor" replace />;
    if (authUser.role === "patient") return <Navigate to="/patient" replace />;
    return <Navigate to="/" replace />;
}