import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

import { useAuthStore } from "../../store/useAuthStore";
import { useChatStore } from "../../store/useChatStore";

// CreateRoomPage — redesigned page for doctors.
// NOTE: I kept the original hooks, useEffects and handler function names you provided.
// I fixed an obvious variable name bug inside handleCreateRoomButton (email -> patientId) so the page works.

export default function CreateRoomPage() {
    const [patientId, setPatientId] = useState("");
    const [roomId, setRoomId] = useState(null);
    const [createRoomButton, setCreateRoomButton] = useState(false);
    const navigate = useNavigate();
    const { createRoom } = useAuthStore();
    const { selectedUser, unsubscribeFromMessages, currentRoomId, endConversation } = useChatStore();


    // kept your commented effect in case you want to re-enable automatic navigation
    // useEffect(() => {
    //   if (currentRoomId) {
    //     navigate(`/room/${currentRoomId}`);
    //   }
    // }, [currentRoomId, navigate]);

    useEffect(() => {
        const redirectError = localStorage.getItem("redirectError");
        if (redirectError) {
            toast.error(redirectError);
            localStorage.removeItem("redirectError");
        }
    }, []);

    useEffect(() => {
        if (currentRoomId) {
            setRoomId(currentRoomId);
        }
    }, [currentRoomId]);

    const handleCreateRoomButton = async () => {
        // fixed variable from original snippet (email -> patientId) so validation works
        if (!patientId.trim()) {
            toast.error("Please enter a Patient Id");
            return;
        }
        await createRoom(patientId);

        setPatientId("");
        setCreateRoomButton(false);
    };

    const handleEnterRoom = async () => {
        if (!roomId) return;
        // await socket.emit("joinRoom", { roomId });
        navigate(`/doctor/room/${roomId}`);
    };

    return (
        <div className="min-h-screen bg-gradient-to-b from-base-200 to-base-300 p-6 pt-[80px]">
            <div className="max-w-6xl mx-auto">
                <header className="mb-6 flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-extrabold">Create Chat Room</h1>
                        <p className="text-sm text-gray-500 mt-1">Create a private chat room for a patient using their Patient Id.</p>
                    </div>
                    <div className="hidden md:flex items-center gap-3">
                        <button
                            onClick={() => setPatientId("")}
                            className="btn btn-ghost"
                        >
                            Clear
                        </button>
                    </div>
                </header>

                <main className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Left column - input / actions */}
                    <section className="col-span-1 md:col-span-2">
                        <div className="card bg-base-100 shadow-lg">
                            <div className="card-body">
                                <div className="flex items-start justify-between">
                                    <div>
                                        <h2 className="card-title">Create a Room for a Patient</h2>
                                        <p className="text-sm text-gray-500">Rooms redirect automatically when created.</p>
                                    </div>
                                </div>

                                <div className="mt-4">
                                    {createRoomButton ? (
                                        <div className="space-y-3">
                                            <label className="label">
                                                <span className="label-text">Patient Id</span>
                                            </label>
                                            <input
                                                type="text"
                                                placeholder="e.g. PAT-2025-2500"
                                                value={patientId}
                                                onChange={(e) => setPatientId(e.target.value)}
                                                className="input input-bordered w-full"
                                            />

                                            <div className="flex gap-3 mt-3">
                                                <button onClick={handleCreateRoomButton} className="btn btn-primary flex-1">
                                                    Confirm & Create
                                                </button>
                                                <button onClick={() => setCreateRoomButton(false)} className="btn btn-ghost">
                                                    Cancel
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="flex flex-row pr-6">
                                            <input
                                                type="text"
                                                placeholder="Enter Patient Id"
                                                value={patientId}
                                                onChange={(e) => setPatientId(e.target.value)}
                                                className="input input-bordered w-full mr-3"
                                            />
                                            <button
                                                onClick={() => setPatientId("")}
                                                className={`relative top-0 right-10 z-10 cursor-pointer ${patientId ? 'opacity-40' : 'hidden'}`}
                                            >
                                                <img src='../../../public/closeButton.svg' className='p-0 m-0' />
                                            </button>
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() => setCreateRoomButton(true)}
                                                    className="btn btn-primary"
                                                >
                                                    Create Room
                                                </button>
                                            </div>
                                        </div>
                                    )}

                                    <div className="mt-4 text-sm text-gray-500">
                                        <p>
                                            Tip: Use the patient ID assigned by your system (for example <span className="font-medium">PAT-2025/2500</span>).
                                            The patient will be able to join the chat using the same ID.
                                        </p>
                                    </div>
                                </div>

                                <div className="divider" />

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <div className="p-4 rounded-lg bg-base-200">
                                        <h3 className="font-semibold">Latest Room</h3>
                                        <p className="text-sm text-gray-500 mt-1">
                                            {roomId ? (
                                                <>
                                                    Room <span className="font-medium">{roomId}</span> — you can join it or wait for the patient to connect.
                                                </>
                                            ) : (
                                                "No room created in this session yet."
                                            )}
                                        </p>
                                        <div className="mt-3">
                                            <button
                                                onClick={handleEnterRoom}
                                                disabled={!roomId}
                                                className={`btn w-full ${roomId ? "btn-primary" : "btn-disabled"}`}
                                            >
                                                {currentRoomId ? "Join Room" : "No Chat Room Available"}
                                            </button>
                                        </div>
                                    </div>

                                    <div className="p-4 rounded-lg bg-base-200">
                                        <h3 className="font-semibold">Quick Actions</h3>
                                        <div className="mt-2 flex flex-col gap-2">
                                            {currentRoomId && (
                                                <button
                                                    // 1. Replaced custom classes with DaisyUI's 'btn' and 'btn-error'
                                                    // 2. 'btn-error' clearly signals this is an important (and final) action.
                                                    // 3. 'w-full' makes it fill the container, matching the "Join Room" button.
                                                    className="btn btn-error flex  p-3 w-full text-sm py-5"
                                                    onClick={() => {
                                                        endConversation();
                                                    }}
                                                >
                                                    {`Close Room with Patient:`}
                                                    <br />
                                                    {selectedUser?.patientId || ""}
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Right column - helper / info */}
                    <aside className="col-span-1">
                        <div className="card bg-base-100 shadow-md sticky top-6">
                            <div className="card-body">
                                <h4 className="font-semibold">About Rooms</h4>
                                <p className="text-sm text-gray-500 mt-2">
                                    Rooms are private, one-to-one chat spaces created for patient-doctor communication during recovery and follow-ups.
                                </p>

                                <div className="mt-4">
                                    <h5 className="font-medium">Best practices</h5>
                                    <ul className="list-disc list-inside text-sm text-gray-500 mt-2 space-y-1">
                                        <li>Use the official Patient Id (case sensitive).</li>
                                        <li>Keep patient details minimal in chat — use the record system for sensitive data.</li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </aside>
                </main>
            </div>
        </div>
    );
}
