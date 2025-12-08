import { Navigate, Route } from "react-router-dom";

import PatientLayout from "../layouts/PatientLayout.jsx";

import RequireRole from "./guards/RequireRole.jsx";

import PatientHomePage from "../pages/PatientPages/PatientHomePage.jsx";
import ProfilePicker from "../pages/ProfilePicker.jsx";
import JournalbotPage from "../pages/ChatbotPages/JournalbotPage.jsx";
import SymptomConcernbotPage from "../pages/ChatbotPages/SymptomConcernbotPage.jsx";
import ChatRoom from "../pages/ChatRoom.jsx";
import PatientJournalViewPage from "../pages/PatientPages/PatientJournalViewPage.jsx";
import PatientRoomStatusPage from "../pages/PatientPages/RoomStatusPage.jsx";
import PatientProfileUpdatePage from "../pages/PatientPages/PatientProfileUpdatePage.jsx";
import ViewSelectedSummaryPage from "../pages/PatientPages/ViewSelectedSummaryPage.jsx";
import PatientAppointmentHomePage from "../pages/PatientPages/PatientAppointmentHomePage.jsx";
import CreateAppointmentPage from "../pages/PatientPages/CreateAppointmentPage.jsx";

import { useUserStore } from '../store/useUserStore.js'


export default function PatientRoutes() {

    const { userProfile } = useUserStore();
    const activeDoctor = userProfile?.activeDoctor;
    // console.log('activedoctor is: ', activeDoctor)
    return (
        <Route path='/patient' element={
            <RequireRole allowedRoles={['patient']}>
                <PatientLayout />
            </RequireRole>
        }>
            {/* the index ensures that the below line will run immdediately if you go to the /doctor route, there fore the route that will be rendered by going to /doctor will be /doctor/dashboard */}
            {activeDoctor
                ? <Route index element={<Navigate to='dashboard' />} />
                : <Route index element={<Navigate to='profiles' />} />
            }
            <Route path="profiles" element={<ProfilePicker />} />
            <Route path="dashboard" element={<PatientHomePage />} />
            <Route path="journal" element={<JournalbotPage />} />
            <Route path="symptom-concern" element={<SymptomConcernbotPage />} />
            <Route path="view-journals" element={<PatientJournalViewPage />} />
            <Route path='view-journals/:summaryId' element={<ViewSelectedSummaryPage />} />
            <Route path='room-status' element={<PatientRoomStatusPage />} />
            <Route path='room/:roomId' element={<ChatRoom />} />
            <Route path='update-profile' element={<PatientProfileUpdatePage />} />
            <Route path='appointments' element={<PatientAppointmentHomePage />} />
            <Route path='appointments/create' element={<CreateAppointmentPage />} />
        </Route>
    )
}

