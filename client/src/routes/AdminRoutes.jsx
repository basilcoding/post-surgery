import AdminLayout from "../layouts/AdminLayout";

import AssignRelationshipForm from "../components/AdminComponents/AssignRelationshipForm.jsx";
import RegisterUserForm from "../components/AdminComponents/RegisterUserForm.jsx";
import AdminHomePage from "../pages/AdminPages/AdminHomePage.jsx";

import RequireRole from "./guards/RequireRole.jsx";

import { Navigate, Route } from "react-router-dom";


export default function AdminRoutes() {

    return (
        <Route path='/admin' element={
            <RequireRole allowedRoles={['admin']}>
                {/* This syntax passes the AdminLayout component as children to the RequireRol component */}
                <AdminLayout /> 
            </RequireRole>
        }>
            {/* the index ensures that the below line will run immdediately if you go to the /admin route, there fore the route that will be rendered by going to /admin will be /admin/dashboard */}
            <Route index element={<Navigate to='dashboard' />} /> 
            <Route path="dashboard" element={<AdminHomePage />} />
            <Route path="register" element={<RegisterUserForm />} />
            <Route path="assign" element={<AssignRelationshipForm />} />
            <Route path="reports" element={<AdminHomePage />} />
        </Route>
    )
}

