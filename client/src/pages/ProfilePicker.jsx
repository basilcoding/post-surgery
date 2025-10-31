// pages/ProfilePicker.jsx
import React, { useEffect, useState } from "react";
import { axiosInstance } from "../lib/axios";
import { useNavigate } from "react-router-dom";

import { useChatStore } from "../store/useChatStore";
import { useAuthStore } from "../store/useAuthStore";
import { useUserStore } from "../store/useUserStore";
import { usePatientStore } from "../store/usePatientStore";
import { useRelationshipsStore } from "../store/useRelationshipsStore";

export default function ProfilePicker() {
    const [loading, setLoading] = useState(true);

    const navigate = useNavigate();

    const { authUser } = useAuthStore();
    const { setActiveDoctor } = usePatientStore();
    const { getRelationships, userRelationships, isFetchingRelationships } = useRelationshipsStore();

    useEffect(() => {
        (async () => {
            try {
                await getRelationships('patient')
            } catch (err) {
                console.error("Failed to load doctors", err);
            }
        })();
    }, []);

    const handleSelect = async (doctorId) => {
        await setActiveDoctor(doctorId || null);
        navigate("/patient/dashboard");
    };

    if (isFetchingRelationships) return <div className="p-6">Loading...</div>;

    return (
        <div className="min-h-screen flex items-center justify-center p-6">
            <div className="w-full max-w-4xl">
                <h2 className="text-2xl font-semibold mb-4">Choose a doctor profile</h2>

                {userRelationships.length === 0 ? (
                    <div className="card p-6">
                        <p>No linked doctors found. You can continue without selecting a doctor, or contact your provider.</p>
                        <div className="mt-4">
                            <button className="btn btn-primary" onClick={() => handleSelect(null)}>Continue</button>
                        </div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {userRelationships.map((r) => (
                            <div key={r._id} className="card p-4 shadow">
                                <div className="flex items-center space-x-4">
                                    <img src={r.doctor?.image?.[0]?.profilePic || "/avatar.png"} alt="" className="w-14 h-14 rounded-full object-cover" />
                                    <div>
                                        <div className="font-semibold">{r.doctor.fullName}</div>
                                        <div className="text-sm text-gray-500">{r.specialty || "general"}</div>
                                        <div className="text-xs text-gray-400">{r.notes || ""}</div>
                                    </div>
                                </div>
                                <div className="mt-4 flex space-x-2">
                                    <button onClick={() => handleSelect(r.doctor._id)} className="btn btn-primary">Use this profile</button>
                                    <button onClick={() => handleSelect(null)} className="btn btn-ghost">Choose later</button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
