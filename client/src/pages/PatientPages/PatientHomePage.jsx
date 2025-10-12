import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

import Chatbot from "../../components/ChatBotComponents/ChatBot";
// import { useAuthStore } from "../../store/useAuthStore";
import { useChatStore } from "../../store/useChatStore";
// import { useUIStore } from "../../store/useUIStore";

export default function PatientHomePage() {
    const [roomId, setRoomId] = useState(null);
    const navigate = useNavigate();
    // const { socket, checkRoomAuth } = useAuthStore();
    const { currentRoomId } = useChatStore();

    useEffect(() => {
        if (currentRoomId) {
            setRoomId(currentRoomId);
        }
    }, [currentRoomId]);

    // useEffect(() => {

    //     const redirectError = localStorage.getItem("redirectError");
    //     if (redirectError) {
    //         toast.error(redirectError);
    //         localStorage.removeItem("redirectError");
    //     }
    // }, []);

    const handleEnterRoom = async () => {
        if (!roomId) return;
        // await socket.emit("joinRoom", { roomId });
        navigate(`/room/${roomId}`);
    };

    return (
        <div className="min-h-screen p-6 overflow-y-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 auto-rows-[300px] gap-6">
                <div className="card bg-base-200 shadow-xl h-full overflow-hidden">
                    <div className="card-body">
                        <h1 className="card-title text-2xl">Chat Room</h1>
                        <p className="text-sm text-gray-600 ">
                            Join the chat room when it's available. If you don't see a room yet, wait for your provider to create one.
                        </p>

                        {/* Room badge */}
                        <div className="mt-1">
                            {roomId ? (
                                <div className="badge bg-base-300 badge-lg p-6 max-w-xs overflow-y-auto">
                                    <span className="ml-2 font-mono">Room ID: {roomId}</span>
                                </div>
                            ) : (
                                <div className="badge badge-outline">No room assigned</div>
                            )}
                        </div>

                        {/* Actions */}
                        <div className="card-actions mt-1">
                            <button
                                onClick={handleEnterRoom}
                                disabled={!roomId}
                                className={`btn btn-block py-6 text-lg font-semibold transition-all duration-200
                ${roomId ? "btn-primary" : "btn-disabled"}`}
                            >
                                {roomId ? "Enter Chat Room" : "No Chat Room Available"}
                            </button>
                        </div>

                        {/* Helpful hint */}
                        <div className="pb-4">
                            <p className="text-xs text-gray-500">
                                Tip: If you were expecting an invite and don't see it, check with your provider or refresh.
                            </p>
                        </div>

                        {/* Chatbot */}
                        <div className="mt-1">
                            <Chatbot />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
