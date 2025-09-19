import { useState } from 'react';
import { Outlet } from "react-router-dom";
import SidebarOption from "../components/CommonComponents/SidebarOption.jsx";

export default function AdminLayout() {

  const [viewType, setViewType] = useState('dashboard');


  return (
    <div className="drawer md:drawer-open">
      <input id="my-drawer-2" type="checkbox" className="drawer-toggle" />
      <div className="drawer-content flex flex-col items-center justify-left relative">
        {/* Page content here */}
        <label htmlFor="my-drawer-2" className="btn btn-primary drawer-button md:hidden flex justify-left w-full mb-3">
          Menu
        </label>
        <Outlet />
      </div>
      <div className="drawer-side">
        <label htmlFor="my-drawer-2" aria-label="close sidebar" className="drawer-overlay"></label>
        <ul className="menu bg-base-200 text-base-content min-h-full w-80 p1">
          <div className='flex justify-between'>
          <h1 className='p-1 text-2xl'>Menu</h1>
          <label
            htmlFor="my-drawer-2"
            aria-label="close sidebar"
            className="btn btn-ghost lg:hidden mb-4"
          >
            Close
          </label>
          </div>
          
          {/* Sidebar content here */}
          <SidebarOption
            label="Dashboard"
            to="/admin/dashboard"
            value='dashboard'
            activeView={viewType}
            selectedOption={(value) => setViewType(value)}
          />
          <SidebarOption
            label="Register Users"
            to="/admin/register"
            value='register'
            activeView={viewType}
            selectedOption={(value) => setViewType(value)}
          />
          <SidebarOption
            label="Assign Users"
            to="/admin/assign"
            value='assign'
            activeView={viewType}
            selectedOption={(value) => setViewType(value)}
          />
          <SidebarOption
            label="Reports"
            to="/admin/reports"
            value='reports'
            activeView={viewType}
            selectedOption={(value) => setViewType(value)}
          />
        </ul>
      </div>
    </div>

    // <div className="flex min-h-screen">
    //   {/* Sidebar */}
    //   {/* <div className="w-64 bg-base-200 p-4">
    //     <h2 className="text-lg font-bold mb-4">Admin Panel</h2>
    //     <div className="flex flex-col gap-2">
    //       <SidebarOption label="Dashboard" to="/admin/dashboard" />
    //       <SidebarOption label="Register Users" to="/admin/register" />
    //       <SidebarOption label="Assign Users" to="/admin/assign" />
    //       <SidebarOption label="Reports" to="/admin/reports" />
    //     </div>
    //   </div> */}



    //   {/* Page content */}
    //   <div className="flex-1 p-6">
    //     <Outlet /> {/* This is where nested admin pages will render */}
    //   </div>
    // </div>
  );
}
