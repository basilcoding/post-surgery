import React, { useState } from "react";
import { Link } from "react-router-dom";

import RegisterUserForm from "../../components/AdminComponents/RegisterUserForm.jsx";
import AssignRelationshipForm from "../../components/AdminComponents/AssignRelationshipForm.jsx";

const AdminHomePage = () => {

    return (
        <div className="p-6 h-screen overflow-y-auto">
            <div className="min-h-screen grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                <div className="card bg-base-200 shadow-md h-full w-full">
                    <div className="card-body">

                        

                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminHomePage;
