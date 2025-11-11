import { useState } from "react";
import { Outlet } from "react-router-dom";

import SidebarOption from "../components/CommonComponents/SidebarOption.jsx";
import Navbar from "../components/Navbar.jsx";

export default function DoctorLayout() {

  const [viewType, setViewType] = useState('');

  return (

    <>
      <div className="drawer lg:drawer-open">
        <input id="my-drawer-3" type="checkbox" className="drawer-toggle" />
        <div className="drawer-content flex flex-col items-center justify-center">
          {/* Page content here */}
          <Outlet /> {/* This is where nested admin pages will render */}

        </div>
        <div className="drawer-side pt-[65px]">
          <label htmlFor="my-drawer-3" aria-label="close sidebar" className="drawer-overlay"></label>
          <ul className="menu bg-base-200 min-h-full w-80 p-4">
            {/* Sidebar content here */}
            <SidebarOption
              label="Dashboard"
              to="/doctor/dashboard"
              value='dashboard'
              activeView={viewType}
              selectedOption={(value) => setViewType(value)}
            />
            <SidebarOption
              label="View Patient Journals"
              to="/doctor/view-journals"
              value='view-journals'
              activeView={viewType}
              selectedOption={(value) => setViewType(value)}
            />
            <SidebarOption
              label="Communicate with the Patient"
              to="/doctor/create-room"
              value='create-room'
              activeView={viewType}
              selectedOption={(value) => setViewType(value)}
            />
            <SidebarOption
              label="Your Patients"
              to="/doctor/related-patients"
              value='related-patients'
              activeView={viewType}
              selectedOption={(value) => setViewType(value)}
            />
            <SidebarOption
              label="Care Check Lists"
              to="/doctor/care-check-lists"
              value='care-check-lists'
              activeView={viewType}
              selectedOption={(value) => setViewType(value)}
            />

            <SidebarOption
              label="Your Profile"
              to="/doctor/update-profile"
              value='update-profile'
              activeView={viewType}
              selectedOption={(value) => setViewType(value)}
            />
          </ul>
        </div>
      </div>
    </>
  );
}
