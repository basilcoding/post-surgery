import { Outlet } from "react-router-dom";
import SidebarOption from "../components/CommonComponents/SidebarOption.jsx";

export default function DoctorLayout() {
  return (
      
      <>
      {/* Page content Only*/}
        <Outlet /> {/* This is where nested admin pages will render */}
      </>
  );
}
