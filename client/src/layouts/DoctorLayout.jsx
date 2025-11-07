import { Outlet } from "react-router-dom";
import SidebarOption from "../components/CommonComponents/SidebarOption.jsx";
import Navbar from "../components/Navbar.jsx";

export default function DoctorLayout() {
  return (

    <>
      <Navbar />
      {/* Page content Only*/}
      <Outlet /> {/* This is where nested admin pages will render */}
    </>
  );
}
