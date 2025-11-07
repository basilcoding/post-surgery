import { Outlet } from "react-router-dom";
import { Link } from "react-router-dom";
import SidebarOption from "../components/CommonComponents/SidebarOption.jsx";
import Navbar from "../components/Navbar.jsx";

export default function PatientLayout() {

    return (

        <>

            {/* Page content here */}
            <Outlet /> {/* This is where nested admin pages will render */}
        </>
    );
}