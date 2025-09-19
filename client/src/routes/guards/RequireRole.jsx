import React from "react";
import { Navigate } from "react-router-dom";
import { useAuthStore } from "../../store/useAuthStore";

export default function RequireRole({ allowedRoles = [], children }) {
    const { authUser } = useAuthStore();
    if (!authUser) return <Navigate to='/login' replace />

    if (allowedRoles.includes(authUser.role)) return children;

    // fallback redirect by role
    if (authUser.role === "doctor") return <Navigate to="/doctor" replace />;
    if (authUser.role === "patient") return <Navigate to="/patient" replace />;
    return <Navigate to="/" replace />;
}