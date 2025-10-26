import { Navigate, Route } from "react-router-dom";

import DoctorLayout from "../layouts/DoctorLayout";

import RequireRole from "./guards/RequireRole.jsx";

import PatientHomePage from "../pages/PatientPages/PatientHomePage.jsx";
import ProfilePicker from "../pages/ProfilePicker.jsx";

export default function PatientRoutes() {

    return (
        <Route path='/patient' element={
            <RequireRole allowedRoles={['patient']}>
                <DoctorLayout />
            </RequireRole>
        }>
            {/* the index ensures that the below line will run immdediately if you go to the /doctor route, there fore the route that will be rendered by going to /doctor will be /doctor/dashboard */}
            <Route index element={<Navigate to='profiles' />} />
            <Route path="profiles" element={<ProfilePicker />} />
            <Route path="dashboard" element={<PatientHomePage />} />
        </Route>
    )
}

