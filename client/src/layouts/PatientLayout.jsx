import { Outlet } from "react-router-dom";
import { Link } from "react-router-dom";
import SidebarOption from "../components/CommonComponents/SidebarOption.jsx";
import Navbar from "../components/Navbar.jsx";

export default function PatientLayout() {
    const drawerToggle = () => {
        return (
            <div>
                <label htmlFor="my-drawer-1" className="py-3 px-4 drawer-button rounded-4xl bg-primary/70 text-base-300 border-none hover:bg-secondary cursor-pointer">☰</label>
            </div>
        )
    }
    return (

        <>
            <Navbar drawerToggle={drawerToggle} />
            <div className=''>
                <div className="">
                    <input id="my-drawer-1" type="checkbox" className="drawer-toggle" />
                    <div className="drawer-content ">
                        {/* Page content here */}
                        <Outlet /> {/* This is where nested admin pages will render */}
                    </div>
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
            </div>

        </>
    );
}