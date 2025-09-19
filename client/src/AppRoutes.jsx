import { Routes, Route, Navigate } from "react-router-dom";

import { useAuthStore } from "./store/useAuthStore.js";

import AdminRoutes from "./routes/AdminRoutes";
import DoctorRoutes from "./routes/DoctorRoutes";
import PatientRoutes from "./routes/PatientRoutes";

import HomePage from './pages/HomePage.jsx';
import LoginPage from './pages/LoginPage'
import ChatRoom from "./pages/ChatRoom.jsx";

export default function AppRoutes() {

  const { authUser } = useAuthStore();

  return (
    <Routes>
      {/* public routes */}
      <Route path="/" element={<HomePage />} />

      {/* Login */}
      <Route
        path="/login"
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

      {/* Chatroom Route - requires login */}
      <Route path='/room/:roomId' element={authUser ? <ChatRoom /> : <Navigate to='/login' />} />

      {/* role-based routes */}
      {AdminRoutes()}
      {DoctorRoutes()}
      {PatientRoutes()}

      {/* fallback */}
      {/* <Route path="*" element={<NotFound />} /> */}
    </Routes>
  );
}
