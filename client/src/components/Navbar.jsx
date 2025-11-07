import React from 'react'
import { useAuthStore } from '../store/useAuthStore';
import { Link } from 'react-router-dom';
import { MessageSquare, Settings, User, LogOut } from 'lucide-react';

const Navbar = ({ drawerToggle }) => {
    const { logout, authUser } = useAuthStore();

    return (
        <>
            <header
                className="border-b border-base-300 w-full
            bg-primary">
                <div className="container mx-auto px-4 h-15">
                    <div className="flex items-center justify-between h-full">
                        {/* leftside */}
                        <div className="flex">
                            {authUser?.role && drawerToggle()}
                            <Link to="/" className="flex items-center gap-2.5 hover:opacity-80 transition-all">
                                <h1 className="text-lg font-bold text-base-100">Post-Surgery-Recovery</h1>
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