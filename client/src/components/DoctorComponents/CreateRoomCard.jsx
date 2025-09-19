import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

import { useAuthStore } from "../../store/useAuthStore";
import { useChatStore } from "../../store/useChatStore";

export default function CreateRoomCard() {
  const [email, setEmail] = useState("");
  const [createRoomButton, setCreateRoomButton] = useState(false);
  const navigate = useNavigate();
  const { createRoom, journalSummaries, emergencySummaries } = useAuthStore();
  const { currentRoomId } = useChatStore();

  useEffect(() => {
    if (currentRoomId) {
      navigate(`/room/${currentRoomId}`);
    }
  }, [currentRoomId, navigate]);

  useEffect(() => {
    const redirectError = localStorage.getItem("redirectError");
    if (redirectError) {
      toast.error(redirectError);
      localStorage.removeItem("redirectError");
    }
  }, []);

  const handleCreateRoomButton = async () => {
    if (!email.trim()) {
      toast.error("Please enter an email");
      return;
    }
    await createRoom(email);
    setEmail("");
    setCreateRoomButton(false);
  };

  return (

        <div className="card bg-base-200 shadow-md h-full">
          <div className="card-body">
            <h2 className="card-title">Create Chat Room</h2>

            {createRoomButton ? (
              <>
                <input
                  type="email"
                  placeholder="Enter user's email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input input-bordered w-full"
                />
                <div className="card-actions mt-2">
                  <button onClick={handleCreateRoomButton} className="btn btn-primary w-full">
                    Confirm
                  </button>
                </div>
                <div className="card-actions mt-2">
                  <button onClick={() => setCreateRoomButton(false)} className="btn btn-ghost w-full">
                    Cancel
                  </button>
                </div>
              </>
            ) : (
              <div className="card-actions">
                <button onClick={() => setCreateRoomButton(true)} className="btn btn-primary w-full">
                  Create Room
                </button>
              </div>
            )}

            <p className="text-sm text-gray-500 mt-3">
              Create a private chat room for a patient by using their email. Rooms redirect automatically when
              created.
            </p>
          </div>
        </div>
  );
}
