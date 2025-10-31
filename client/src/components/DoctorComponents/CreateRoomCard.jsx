import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

import { useAuthStore } from "../../store/useAuthStore";
import { useChatStore } from "../../store/useChatStore";

export default function CreateRoomCard() {
  const [email, setEmail] = useState("");
  const [roomId, setRoomId] = useState(null);
  const [createRoomButton, setCreateRoomButton] = useState(false);
  const navigate = useNavigate();
  const { createRoom } = useAuthStore();
  const { currentRoomId } = useChatStore();

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
    if (!email.trim()) {
      toast.error("Please enter an email");
      return;
    }
    await createRoom(email);

    setEmail("");
    setCreateRoomButton(false);
  };

  const handleEnterRoom = async () => {
    if (!roomId) return;
    // await socket.emit("joinRoom", { roomId });
    navigate(`/room/${roomId}`);
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

        <div className="card-actions mt-1">
          <button
            onClick={handleEnterRoom}
            disabled={!roomId}
            className={`btn btn-block py-6 text-lg font-semibold transition-all duration-200
                ${roomId ? "btn-primary" : "btn-disabled"}`}
          >
            {roomId ? "Join Room" : "No Chat Room Available"}
          </button>
        </div>
      </div>
    </div>
  );
}
