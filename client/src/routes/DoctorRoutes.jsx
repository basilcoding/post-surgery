import { Navigate, Route } from "react-router-dom";

import DoctorLayout from "../layouts/DoctorLayout";

import RequireRole from "./guards/RequireRole.jsx";

import DoctorHomePage from "../pages/DoctorPages/DoctorHomePage.jsx";
import EmergencySummaryPage from "../pages/DoctorPages/EmergencySummaryPage.jsx";
import JournalSummaryPage from "../pages/DoctorPages/JournalSummaryPage.jsx";
import CreateRoomPage from "../pages/DoctorPages/CreateRoomPage.jsx";
import ChatRoom from "../pages/ChatRoom.jsx";
import DoctorRelationshipsPage from "../pages/DoctorPages/DoctorRelationshipsPage.jsx";
import ViewIndividualPatient from "../pages/DoctorPages/ViewIndividualPatient.jsx";
import ShowAllCareCheckListsPage from "../pages/CareCheckListPages/ShowAllCareCheckListsPage.jsx";
import CreateCareCheckListPage from "../pages/CareCheckListPages/CreateCareCheckListPage.jsx";
import UpdateCareCheckListPage from "../pages/CareCheckListPages/UpdateCareCheckListPage.jsx";
import DoctorViewSummaryPage from "../pages/DoctorPages/DoctorViewSelectedSummaryPage.jsx";
import DoctorProfileUpdatePage from "../pages/DoctorPages/DoctorProfileUpdatePage.jsx";

export default function DoctorRoutes() {

    return (
        <Route path='/doctor' element={
            <RequireRole allowedRoles={['doctor']}>
                <DoctorLayout />
            </RequireRole>
        }>
            {/* the index ensures that the below line will run immdediately if you go to the /doctor route, there fore the route that will be rendered by going to /doctor will be /doctor/dashboard */}
            <Route index element={<Navigate to='dashboard' />} />
            <Route path="dashboard" element={<DoctorHomePage />} />
            <Route path="update-profile" element={<DoctorProfileUpdatePage />} />
            <Route path="view-journals" element={<JournalSummaryPage />} />
            <Route path="view-journals/:summaryId" element={<DoctorViewSummaryPage />} />
            <Route path="emergency-summaries" element={<EmergencySummaryPage />} />
            <Route path="create-room" element={<CreateRoomPage />} />
            <Route path="related-patients" element={<DoctorRelationshipsPage />} />
            <Route path="care-check-lists" element={<ShowAllCareCheckListsPage />} />
            <Route path="create-care-check-list" element={<CreateCareCheckListPage />} />
            <Route path="care-check-list/:careCheckListId" element={<UpdateCareCheckListPage />} />
            <Route path="relationships/:relationshipId" element={<ViewIndividualPatient />} />
            <Route path='room/:roomId' element={<ChatRoom />} />
        </Route>
    )
}

