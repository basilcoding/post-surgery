import React, { useState } from "react";
import { Link } from "react-router-dom";

import RegisterUserForm from "../../components/AdminComponents/RegisterUserForm.jsx";
import AssignRelationshipForm from "../../components/AdminComponents/AssignRelationshipForm.jsx";
import SidebarOption from "../../components/CommonComponents/SidebarOption.jsx";


const AdminHomePage = () => {

    const [viewType, setViewType] = useState('new');

    return (
        <div className="p-6 h-screen overflow-y-auto">
            <h1 className='text-5xl'>What to add in this page?</h1>
            <h1 className='text-2xl mt-10'>For now only register and assign pages are there...</h1>
            {/* <div className="min-h-screen grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3"> */}

                {/* <h1 className="text-3xl font-bold">Admin Control Panel</h1> */}

                {/* <SidebarOption
                    label='Register Users'
                    value='new'
                    activeView={viewType}
                    to='/admin/register'
                />
                <div className="w-full max-w-2xl space-y-12">
                    <RegisterUserForm />
                    <AssignRelationshipForm />
                </div>

                <div className="text-center">
                    <p className="text-base-content/60">
                        Back to{" "}
                        <Link to="/" className="link link-primary">
                            Home
                        </Link>
                    </p>
                </div> */}
            {/* </div> */}
        </div>
    );
};

export default AdminHomePage;
