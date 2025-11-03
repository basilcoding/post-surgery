import { Navigate, Route } from "react-router-dom";

import PatientLayout from "../layouts/PatientLayout.jsx";

import RequireRole from "./guards/RequireRole.jsx";

import PatientHomePage from "../pages/PatientPages/PatientHomePage.jsx";
import ProfilePicker from "../pages/ProfilePicker.jsx";
import JournalbotPage from "../pages/ChatbotPages/JournalbotPage.jsx";
import SymptomConcernbotPage from "../pages/ChatbotPages/SymptomConcernbotPage.jsx";

import Chatbot from "../components/ChatbotComponents/Chatbot.jsx";

export default function PatientRoutes() {

    return (
        <Route path='/patient' element={
            <RequireRole allowedRoles={['patient']}>
                <PatientLayout />
            </RequireRole>
        }>
            {/* the index ensures that the below line will run immdediately if you go to the /doctor route, there fore the route that will be rendered by going to /doctor will be /doctor/dashboard */}
            <Route index element={<Navigate to='profiles' />} />
            <Route path="profiles" element={<ProfilePicker />} />
            <Route path="dashboard" element={<PatientHomePage />} />
            <Route path="journal" element={<JournalbotPage />} />
            <Route path="symptom-concern" element={<SymptomConcernbotPage />} />
        </Route>
    )
}

