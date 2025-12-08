import { React, useState } from 'react'
import { useAuthStore } from '../store/useAuthStore';
import { Link } from 'react-router-dom';
import { MessageSquare, Settings, User, LogOut } from 'lucide-react';

import SidebarOption from './CommonComponents/SidebarOption';

const Navbar = ({ }) => {
    const { logout, authUser } = useAuthStore();

    const [viewType, setViewType] = useState('');

    const role = authUser?.role;
    return (
        <>
            <header
                className="border-b border-base-300 w-full
            bg-primary fixed overflow-hidden z-70">
                <div className="container px-4 h-16 w-full">
                    <div className="flex items-center justify-between h-full w-full">
                        {/* leftside */}
                        <div className="flex">
                            {role === 'patient' &&
                                <div className=''>
                                    <div className="">
                                        <div>
                                            <label htmlFor="my-drawer-1" className="py-3 px-4 mr-2 drawer-button rounded-4xl bg-primary/70 text-base-300 border-none hover:bg-black/10 cursor-pointer block lg:hidden">☰</label>
                                        </div>
                                        <input id="my-drawer-1" type="checkbox" className="drawer-toggle" />
                                        <div className="drawer-side">
                                            <label htmlFor="my-drawer-1" aria-label="close sidebar" className="drawer-overlay"></label>
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
                                                    label="Appointments"
                                                    to="/patient/appointments"
                                                    value='appointments'
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
                                </div>}
                            {role === 'doctor' &&
                                <div className=''>
                                    <div className="">
                                        <div>
                                            <label htmlFor="my-drawer-1" className="py-3 px-4 mr-2 drawer-button rounded-4xl bg-primary/70 text-base-300 border-none hover:bg-black/10 cursor-pointer block lg:hidden">☰</label>
                                        </div>
                                        <input id="my-drawer-1" type="checkbox" className="drawer-toggle" />
                                        <div className="drawer-side">
                                            <label htmlFor="my-drawer-1" aria-label="close sidebar" className="drawer-overlay"></label>
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
                                                    label="Appointments"
                                                    to="/doctor/appointments"
                                                    value='appointments'
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
                                </div>}
                            <Link to="/" className="flex items-center gap-2.5 hover:opacity-80 transition-all">
                                <h1 className="text-lg font-bold text-base-100 hidden md:block">SRMS</h1>
                                <h1 className="text-lg font-bold text-base-100 block md:hidden">SRMS</h1>
                            </Link>
                        </div>
                        {/* rightside */}
                        <div className="flex items-center justify-center gap-2">
                            {authUser && (
                                <>
                                    {authUser?.role === 'patient' &&
                                        <Link to={"/patient/profiles"} className={`btn btn-lg btn-circle `}>
                                            <User className="size-5" />
                                        </Link>
                                    }
                                    <button className="btn btn-lg rounded-full flex gap-2 items-center p-2" onClick={logout}>
                                        <LogOut className="size-5" />
                                        <span className="hidden sm:block">
                                            Logout
                                        </span>
                                    </button>
                                </>
                            )}
                            {!authUser && (
                                <div className='flex gap-7'>
                                    <Link to={"/contact"} className={`btn btn-lg btn-circle `}>
                                        <button className="btn btn-lg rounded-full flex gap-2 items-center p-2">
                                              <span className="hidden sm:block">
                                                Contact
                                            </span>
                                        </button>
                                    </Link>
                                    <Link to={"/help"} className={`btn btn-lg btn-circle `}>
                                        <button className="btn btn-lg rounded-3xl flex gap-2 items-center p-2">
                                            <span className="hidden sm:block">
                                                Help
                                            </span>
                                        </button>
                                    </Link>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </header>
        </>
    )
}

export default Navbar;