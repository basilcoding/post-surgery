import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import toast from "react-hot-toast";

import { useChatStore } from "../../store/useChatStore";
import { useAuthStore } from "../../store/useAuthStore";
import { useChatbotStore } from "../../store/useChatbotStore";
import ChatbotIcon from "../../components/ChatbotComponents/ChatBotIcon";

export default function PatientHomePage() {
  const [roomId, setRoomId] = useState(null);
  const navigate = useNavigate();

  const { currentRoomId } = useChatStore();
  const { connectChatbotSocketListeners } = useChatbotStore();
  const { authUser, socket, subscribeToSelfRoom } = useAuthStore();

  useEffect(() => {
    if (currentRoomId) setRoomId(currentRoomId);
  }, [currentRoomId]);

  useEffect(() => {
    subscribeToSelfRoom();
    if (socket) connectChatbotSocketListeners(socket); // keep existing important behaviour
  }, [subscribeToSelfRoom, socket]);

  const handleEnterRoom = () => {
    if (!roomId) return toast.error("No room assigned yet — please wait for your provider.");
    navigate(`/room/${roomId}`);
  };

  // small helper for initials fallback
  const initials = (name = "Patient") =>
    name
      .split(" ")
      .map((n) => n[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();

  return (
    // [CHANGE 1] Use h-screen and flex-col. Remove padding and overflow.
    <div className="h-screen w-full bg-gradient-to-b from-white to-slate-50 flex flex-col">
      {/* [CHANGE 2] Add flex-1 (to grow) and p-6 (moved from parent). Add w-full/mx-auto for centering. */}
      <div className="max-w-7xl w-full mx-auto flex-1 overflow-y-auto p-6">
        {/* Header */}
        <div className="flex items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-3xl font-extrabold tracking-tight">Welcome back{authUser?.fullName ? `, ${authUser.fullName}` : ""}</h2>
            <p className="text-sm text-gray-500 mt-1">Your care hub — messages, appointments and journal summaries in one place.</p>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden sm:flex flex-col items-end mr-4">
              <span className="text-xs text-gray-400">Account</span>
              <span className="text-sm font-medium">{authUser?.email ?? "Not signed in"}</span>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold">{authUser?.profilePic ? initials(authUser.firstName + (authUser.lastName ? " " + authUser.lastName : "")) : "U"}</div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left column - cards */}
          <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Chat Room Card */}
            <motion.div
              initial={{ y: 8, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.3 }}
              className="card bg-white shadow-md p-5 rounded-2xl"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-semibold">Chat Room</h3>
                  <p className="text-sm text-gray-500 mt-1">Join a live session with your care provider when it's available.</p>
                </div>

                <div className="text-right">
                  <span className="text-xs text-gray-400">Status</span>
                  <div className={`mt-1 badge ${roomId ? "badge-success" : "badge-ghost"}`}>{roomId ? "Ready" : "No room"}</div>
                </div>
              </div>

              <div className="mt-4 flex flex-col gap-3">
                <div className="flex items-center gap-3">
                  <div className="bg-base-200 rounded-md px-3 py-2 font-mono text-sm overflow-x-auto">{roomId ? `Room: ${roomId}` : "—"}</div>

                  {/* Added a check for navigator.clipboard */}
                  <button 
                    onClick={() => {
                      if (navigator.clipboard && roomId) {
                        navigator.clipboard.writeText(roomId).then(() => {
                          toast.success("Room ID copied");
                        });
                      }
                    }} 
                    className="btn btn-sm"
                    disabled={!roomId}
                  >
                    Copy
                  </button>
                </div>

                <div className="flex gap-3">
                  <button onClick={handleEnterRoom} disabled={!roomId} className={`btn btn-block ${roomId ? "btn-primary" : "btn-disabled"}`}> {roomId ? "Enter Chat Room" : "Waiting for provider"}</button>
                </div>

                <p className="text-xs text-gray-400 mt-2">Tip: If you expected an invite, check with your provider or refresh. Notifications will appear here when your room is ready.</p>
              </div>
            </motion.div>

            {/* Journal Summary Card */}
            <motion.div
              initial={{ y: 8, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.35 }}
              className="card bg-gradient-to-r from-white to-slate-50 shadow-md p-5 rounded-2xl"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-semibold">Journal</h3>
                  <p className="text-sm text-gray-500 mt-1">Concise summaries of your recent journal entries and trends.</p>
                </div>

                <div className="text-right">
                  <span className="text-xs text-gray-400">Auto-generated</span>
                </div>
              </div>

              <div className="mt-4">
                <div className="h-28 rounded-lg border border-dashed border-slate-100 p-4 flex items-center justify-center">
                  <div className="text-center">
                    <p className="text-sm text-gray-400">No recent entries yet</p>
                    <Link to="/journal/new" className="mt-2 inline-block btn btn-sm">Create Journal</Link>
                  </div>
                </div>

                <div className="mt-3 flex gap-2">
                  <Link to="/patient/patient-journals" className="btn btn-ghost btn-sm">View All Daily Journals</Link>
                  <Link to="/journal/settings" className="btn btn-outline btn-sm">Summary Settings</Link>
                </div>
              </div>
            </motion.div>

            {/* Recent Messages / Notifications */}
            <motion.div
              initial={{ y: 8, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.4 }}
              className="card bg-white shadow-md p-5 rounded-2xl md:col-span-2"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Recent Notifications</h3>
                <button className="text-sm btn btn-ghost btn-sm">Clear</button>
              </div>

              <ul className="mt-3 space-y-3 max-h-40 overflow-y-auto">
                <li className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-md bg-base-200 flex items-center justify-center font-semibold">MSG</div>
                  <div>
                    <div className="text-sm font-medium">New message from Dr. Sharma</div>
                    <div className="text-xs text-gray-400">"Your lab results are ready." — 2h ago</div>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-md bg-base-200 flex items-center justify-center font-semibold">AP</div>
                  <div>
                    <div className="text-sm font-medium">Upcoming appointment</div>
                    <div className="text-xs text-gray-400">Oct 20, 2025 — 10:00 AM</div>
                  </div>
                </li>
              </ul>
            </motion.div>
          </div>

          {/* Right column - quick stats + chatbot preview */}
          <div className="flex flex-col gap-6">
            <motion.div initial={{ x: 8, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ duration: 0.35 }} className="card bg-white shadow p-5 rounded-2xl">
              <h4 className="text-sm text-gray-500">Health Snapshot</h4>
              <div className="mt-3 grid grid-cols-3 gap-3">
                <div className="text-center">
                  <div className="text-2xl font-bold">72</div>
                  <div className="text-xs text-gray-400">Heart Rate</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">6.8</div>
                  <div className="text-xs text-gray-400">Mood</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">120/80</div>
                  <div className="text-xs text-gray-400">BP</div>
                </div>
              </div>

              <div className="mt-4">
                <Link to="/vitals" className="text-xs btn btn-ghost btn-sm">View Vitals</Link>
              </div>
            </motion.div>

            <motion.div initial={{ x: 8, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ duration: 0.45 }} className="card bg-white shadow p-4 rounded-2xl">
              <h4 className="text-sm text-gray-500">Quick Actions</h4>
              <div className="mt-3 grid grid-cols-2 gap-2">
                <Link to="/appointments/new" className="btn btn-sm">Book Appointment</Link>
                <Link to="/messages/new" className="btn btn-sm btn-ghost">Message Provider</Link>
                <Link to="/records" className="btn btn-sm btn-outline">Health Records</Link>
                <Link to="/support" className="btn btn-sm">Support</Link>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Inline Chatbot component at the bottom (optional) */}
        <div className="mt-8">
          <ChatbotIcon />
        </div>
      </div>
    </div>
  );
}