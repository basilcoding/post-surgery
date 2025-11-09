import React from "react";
import { Navigate } from "react-router-dom";
import { useAuthStore } from "../../store/useAuthStore";

export default function RequireRole({ allowedRoles = [], children }) {
    const { authUser } = useAuthStore();
    const role = authUser?.role;

    if (!authUser) {
        if (role === 'patient') return <Navigate to='/patient-login' replace />
        if (role === 'doctor') return <Navigate to='/doctor-login' replace />
        if (role === 'admin') return <Navigate to='/admin-login' replace />
    }

    if (allowedRoles.includes(role)) return children;

    // fallback redirect by role
    if (role === "doctor") return <Navigate to="/doctor" replace />;
    if (role === "patient") return <Navigate to="/patient" replace />;
    return <Navigate to="/" replace />;
}