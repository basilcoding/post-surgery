import React from 'react'
import { Link } from 'react-router-dom';

// import { useUIStore } from '../../store/useUIStore';

const SidebarOption = ({ label, value, activeView, selectedOption, to }) => {

    // const { sidebarView, setSidebarView } = useUIStore();

    // If `to` is passed, render as a NavLink (navigation)
    if (to) {
        return (
            <Link
                to={to}
                className={`
                    card-title p-2 hover:cursor-pointer hover:bg-base-300 rounded  
                    ${activeView === value ? "bg-base-300" : ""}`}
                onClick={() => selectedOption(value)}
            >
                {label}
            </Link>
        );
    }

    // Otherwise render as a click-to-select option (state driven)
    return (
        <div className={`
            card-title p-2 bg-base-200 hover:cursor-pointer hover:bg-base-300 rounded-lg active:scale-99
            ${activeView === value ? 'bg-base-300' : ''}`}
            onClick={() => selectedOption(value)}
        >
            {label}
        </div>
    )
}

export default SidebarOption;
