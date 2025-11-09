import { useState } from "react";
import { Outlet, Link } from "react-router-dom";

import SidebarOption from "../components/CommonComponents/SidebarOption.jsx";

import Navbar from "../components/Navbar.jsx";

export default function PatientLayout() {

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
                            to="/patient/dashboard"
                            value='dashboard'
                            activeView={viewType}
                            selectedOption={(value) => setViewType(value)}
                        />
                        <SidebarOption
                            label="Take your Daily Journal"
                            to="/patient/journal"
                            value='journal'
                            activeView={viewType}
                            selectedOption={(value) => setViewType(value)}
                        />
                        {/* <SidebarOption
                            label="Worried About a Symptom?"
                            to="/patient/symptom-concern"
                            value='symptom-concern'
                            activeView={viewType}
                            selectedOption={(value) => setViewType(value)}
                        /> */}
                        <SidebarOption
                            label="All Journals"
                            to="/patient/view-journals"
                            value='view-journals'
                            activeView={viewType}
                            selectedOption={(value) => setViewType(value)}
                        />
                        <SidebarOption
                            label="Room Status"
                            to="/patient/room-status"
                            value='room-status'
                            activeView={viewType}
                            selectedOption={(value) => setViewType(value)}
                        />
                        <SidebarOption
                            label="Update Your Profile"
                            to="/patient/update-profile"
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