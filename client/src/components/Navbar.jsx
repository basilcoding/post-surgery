import React from 'react'
import { useAuthStore } from '../store/useAuthStore';
import { Link } from 'react-router-dom';
import { MessageSquare, Settings, User, LogOut } from 'lucide-react';

const Navbar = ({ }) => {
    const { logout, authUser } = useAuthStore();

    const role = authUser?.role;
    return (
        <>
            <header
                className="border-b border-base-300 w-full
            bg-primary fixed overflow-hidden z-70">
                <div className="container px-4 h-15">
                    <div className="flex items-center justify-between h-full">
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
                                                <Link to="/patient/dashboard" className="transition-all hover:bg-primary/30 p-4 rounded-4xl">
                                                    <h2 className="card-title">Dashboard</h2>
                                                </Link>
                                                <Link to="/patient/symptom-concern" className="transition-all hover:bg-primary/30 p-4 rounded-4xl">
                                                    <h2 className="card-title">Worried About A Symptom?</h2>
                                                </Link>
                                                <Link to="/patient/journal" className="transition-all hover:bg-primary/30 p-4 rounded-4xl">
                                                    <h2 className="card-title">Take Your Daily Survery</h2>
                                                </Link>
                                                <Link to="/patient/patient-journals" className="transition-all hover:bg-primary/30 p-4 rounded-4xl">
                                                    <h2 className="card-title">Past Journals</h2>
                                                </Link>
                                            </ul>
                                        </div>
                                    </div>
                                </div>}
                            <Link to="/" className="flex items-center gap-2.5 hover:opacity-80 transition-all">
                                <h1 className="text-lg font-bold text-base-100 hidden md:block">Surgery-Recovery-Management-System</h1>
                                <h1 className="text-lg font-bold text-base-100 block md:hidden">SRMS</h1>
                            </Link>
                        </div>
                        {/* rightside */}
                        <div className="flex items-center gap-2">
                            {authUser && (
                                <>
                                    <Link to={"/patient/profiles"} className={`btn btn-sm gap-2`}>
                                        <User className="size-5" />
                                        <span className="hidden sm:inline">Profile</span>
                                    </Link>

                                    <button className="btn btn-sm flex gap-2 items-center p-2" onClick={logout}>
                                        <LogOut className="size-5" />
                                        <span className="hidden sm:block">
                                            Logout
                                        </span>
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </header>
        </>
    )
}

export default Navbar;