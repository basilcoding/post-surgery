import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Copy, User, BellRing, Hourglass } from "lucide-react";
import toast from "react-hot-toast";

import { useChatStore } from "../../store/useChatStore";
import { useAuthStore } from "../../store/useAuthStore";
import { useChatbotStore } from "../../store/useChatbotStore";

import ChatbotIcon from "../../components/ChatbotComponents/ChatbotIcon.jsx";
import CopyButtonComponent from "../../components/CommonComponents/CopyButtonComponent.jsx";

export default function PatientRoomStatusPage() {
  const [roomId, setRoomId] = useState(null);
  const [copied, setCopied] = useState(false);
  const [waitingSince, setWaitingSince] = useState(null);
  const navigate = useNavigate();

  const { currentRoomId } = useChatStore();
  const { connectChatbotSocketListeners } = useChatbotStore();
  const { authUser, socket, subscribeToSelfRoom } = useAuthStore();

  // Keep the same behaviour: update local roomId when currentRoomId changes
  useEffect(() => {
    if (currentRoomId) setRoomId(currentRoomId);
  }, [currentRoomId]);

  // Keep the same subscription behaviour — subscribe and attach chatbot listeners when socket is available
  useEffect(() => {
    subscribeToSelfRoom();
    if (socket) connectChatbotSocketListeners(socket); // keep existing important behaviour
  }, [subscribeToSelfRoom, socket]);

  useEffect(() => {
    if (currentRoomId) setWaitingSince(new Date());
  }, [currentRoomId]);

  const handleEnterRoom = () => {
    if (!roomId)
      return toast.error(
        "No room assigned yet — please wait for your provider."
      );
    navigate(`/patient/room/${roomId}`);
  };

  const initials = (name = "Patient") =>
    name
      .split(" ")
      .map((n) => n[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white pt-[65px]">
      <div className="max-w-4xl mx-auto p-6 pb-28">
        {/* extra bottom padding for sticky action */}
        <header className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-extrabold">Room Status</h1>
            <p className="text-sm text-gray-500 mt-1">
              Real-time status of your current chat room with your provider.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex flex-col items-end mr-4">
              <span className="text-xs text-gray-400">Signed in as</span>
              <span className="text-sm font-medium">
                {authUser?.email ?? "Not signed in"}
              </span>
            </div>
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center font-semibold text-primary">
              {authUser?.firstName
                ? initials(
                  authUser.firstName +
                  (authUser.lastName ? " " + authUser.lastName : "")
                )
                : "U"}
            </div>
          </div>
        </header>

        <main className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <section className="lg:col-span-2">
            <div className="card bg-white shadow-md rounded-2xl p-6">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-lg font-semibold">Current Room</h2>
                  <p className="text-sm text-gray-500 mt-1">
                    Status and quick actions for the room assigned to you.
                  </p>
                </div>

                <div className="text-right flex justify-center items-center">
                  <span className="text-sm text-gray-400">Room:</span>
                  <div
                    className={`mt-1 badge ml-3 ${roomId ? "badge-success" : "badge-ghost"
                      }`}
                  >
                    {roomId ? "Assigned" : "Waiting"}
                  </div>
                </div>
              </div>

              {/* --- I HAVE REBUILT THIS SECTION ---
                - Removed the 'sm:grid-cols-2' which wasn't needed.
                - Created a clean layout:
                  1. Top row: Label on left, "Join Room" button on right.
                  2. Bottom row: Room ID and Copy Button grouped together.
              */}
              <div className="mt-6">
                <div className="rounded-lg bg-base-100">

                  {/* Top row: ID and Copy Button */}
                  <div className="flex flex-col">
                    <div className="font-mono text-sm truncate mb-4">
                      Room: {roomId ? '' : '—'}
                      {roomId && (
                        <CopyButtonComponent
                          value={roomId}
                        />
                      )}
                    </div>
                    {/* Bottom row: Label and Join Button */}
                    <div className="flex items-center w-full mb-2">
                      <button
                        onClick={handleEnterRoom}
                        className={`btn btn-md w-full ${roomId ? "btn-primary" : "btn-disabled"
                          }`}
                      >
                        {roomId ? "Join Room" : "No Rooms Available currently."}
                      </button>
                    </div>


                  </div>

                  {/* Waiting status */}
                  <div className="mt-3 text-xs text-gray-500 flex items-center gap-2">
                    <Hourglass size={14} />
                    <span>
                      {roomId ? (
                        waitingSince ? (
                          <>
                            Room open since: {" "}
                            <span className="font-medium">
                              {waitingSince.toLocaleTimeString()}
                            </span>
                          </>
                        ) : (
                          "Ready"
                        )
                      ) : (
                        "Your provider will create a room and invite you shortly."
                      )}
                    </span>
                  </div>
                </div>
              </div>
              {/* --- END OF REBUILT SECTION --- */}

              <div className="divider mt-6" />

              <div>
                <h3 className="text-sm font-semibold">What to expect</h3>
                <ul className="mt-2 list-disc list-inside text-sm text-gray-500 space-y-1">
                  <li>
                    When your provider joins, the room will go live and you'll
                    be able to chat and share files.
                  </li>
                  <li>
                    If you don't see the invite after 10 minutes, try refreshing
                    or contact support.
                  </li>
                  <li>
                    All messages are private and associated with your medical
                    record.
                  </li>
                </ul>
              </div>

              {/* --- I HAVE REMOVED THIS SECTION ---
                The large, duplicate "Join Room" button at the
                bottom of the card has been removed as requested.
              */}
            </div>

            <div className="card bg-white shadow-md rounded-2xl p-4 mt-6">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold">Recent Activity</h4>
                <button className="btn btn-ghost btn-sm">Clear</button>
              </div>

              <ul className="mt-3 space-y-3 text-sm text-gray-600">
                <li className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-md bg-base-200 flex items-center justify-center font-semibold">
                    MSG
                  </div>
                  <div>
                    <div className="font-medium">Message from Dr. Kumar</div>
                    <div className="text-xs text-gray-400">
                      "I'll be with you in 5 minutes." — 9m ago
                    </div>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-md bg-base-200 flex items-center justify-center font-semibold">
                    SYS
                  </div>
                  <div>
                    <div className="font-medium">System</div>
                    <div className="text-xs text-gray-400">
                      Room created for your session — waiting for provider.
                    </div>
                  </div>
                </li>
              </ul>
            </div>
          </section>

          <aside>
            <div className="card bg-white shadow-md rounded-2xl p-4 sticky top-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-md bg-base-200 flex items-center justify-center font-semibold">
                    U
                  </div>
                  <div>
                    <div className="text-sm font-medium">
                      {authUser?.fullName ?? authUser?.email ?? "You"}
                    </div>
                    <div className="text-xs text-gray-400">Patient</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-gray-400">Status</div>
                  <div
                    className={`mt-1 badge ${roomId ? "badge-success" : "badge-ghost"
                      }`}
                  >
                    {roomId ? "Ready" : "Waiting"}
                  </div>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-1 gap-2">
                <Link to="/support" className="btn btn-sm">
                  Support
                </Link>
                <Link to="/patient/overview" className="btn btn-sm btn-outline">
                  Overview
                </Link>
              </div>

              <div className="mt-4">
                <ChatbotIcon />
              </div>
            </div>
          </aside>
        </main>
      </div>
    </div>
  );
}