import { Routes, Route, Navigate } from "react-router-dom";

import { useAuthStore } from "./store/useAuthStore.js";

import AdminRoutes from "./routes/AdminRoutes";
import DoctorRoutes from "./routes/DoctorRoutes";
import PatientRoutes from "./routes/PatientRoutes";

import HomePage from './pages/HomePage.jsx';
import LoginPage from './pages/LoginPage'
import ChatRoom from "./pages/ChatRoom.jsx";
import SignUpPage from './pages/SignUpPage.jsx';
import PatientLoginPage from "./pages/PatientPages/PatientLoginPage.jsx";
import NotFoundPage from "./pages/NotFoundPage.jsx";

import LoginRoutes from "./routes/LoginRoutes.jsx";

export default function AppRoutes() {

  const { authUser } = useAuthStore();

  return (
    <Routes>
      {/* public routes */}
      <Route path="/" element={<HomePage />} />
      <Route path="/signup" element={<SignUpPage />} />

      {/* role based login routes */}
      {LoginRoutes()}

      {/* role-based routes */}
      {AdminRoutes()}
      {DoctorRoutes()}
      {PatientRoutes()}

      {/* fallback */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
