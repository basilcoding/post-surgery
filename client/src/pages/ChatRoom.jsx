import { useEffect } from "react";
import { useChatStore } from "../store/useChatStore";
import { useAuthStore } from "../store/useAuthStore";
import { useParams, useNavigate } from "react-router-dom";

import ChatContainer from '../components/ChatRoomComponents/ChatContainer'
import NoChatSelected from '../components/ChatRoomComponents/NoChatSelected'

const ChatRoom = () => {
    const { roomId } = useParams(); // get roomId directly from URL
    const { selectedUser, currentRoomId, subscribeToRoom } = useChatStore();
    const { checkRoomAuth, authUser, isCheckingAuth, isRoomChecking } = useAuthStore();

    const navigate = useNavigate();

    // Effect 1: Authorize the room, but only if needed.
    // VERY VERY IMPORTANT, THIS STUFF CAUSED A LOT OF BUGS :(
    useEffect(() => {
        // If the room from the URL is already the active room in our state, do nothing.
        // This prevents redundant API calls and re-renders.
        if (currentRoomId && currentRoomId === roomId) {
            return;
        }

        // Otherwise, authorize the room specified in the URL.
        checkRoomAuth(roomId, navigate);

    }, [roomId, navigate, checkRoomAuth, currentRoomId]); // Depend on the URL and the current state

    // Effect 2: Subscribe to the socket room once the room ID is confirmed.
    useEffect(() => {
        // This effect will run ONLY when `currentRoomId` receives a valid value.
        if (currentRoomId) {
            subscribeToRoom(currentRoomId);
        }
    }, [currentRoomId, subscribeToRoom]); // This is the correct dependency array

    return (
        <div className="h-full bg-base-200">
            <div className="flex items-center justify-center pt-5 px-4">
                <div className='bg-base-100 rounded-lg shadow-xl w-full max-w-6xl h-[calc(100vh-8rem)]'>
                    <div className='flex h-full rounded-lg overflow-hidden'>
                        {selectedUser ? <ChatContainer /> : ""}
                    </div>
                </div>
            </div>
        </div>
    )

}

export default ChatRoom;


// IMPORTANT: PLEASE READ THESE COMMENTS FOR UNDERSTAND THIS PAGE
// ----- HOW TO THE CYCLE WORKS ------
// ## How currentRoomId Gets Its Value
// There are two distinct paths that lead to currentRoomId being set in your useChatStore.

// 1. Real-Time Room Creation (The roomNotify Event)
// This happens when a user is actively using the app and a doctor initiates a new chat.

// Trigger: A doctor clicks a button to start a chat, which emits a "createRoom" event to your server.

// Server Action: Your server's "createRoom" handler creates a unique roomId, saves it to the database for both the doctor and patient, and then emits a "roomNotify" event to both users.

// Client Action: Your useChatStore is always listening for "roomNotify". When it receives this event, it calls axiosInstance.post('/auth/create-room-token/...') and, upon success, it executes this line:

// JavaScript

// // In useChatStore.js -> socket.on("roomNotify", ...)
// get().setSelectedUserAndCurrentRoomId(otherUser, roomId);
// This updates the state with the otherUser's info and the new currentRoomId.

// 2. Rejoining a Session on Page Reload (The checkActiveRoom Flow)
// This is the flow that makes your app persistent. It happens automatically when you open or refresh the app.

// Trigger: The main App.jsx component mounts.

// Step A: Authentication (checkAuth)

// The first useEffect in App.jsx calls checkAuth().

// This function sends a request to your server's /auth/check endpoint.

// If successful, it sets the authUser in your useAuthStore.

// Step B: Active Room Check (checkActiveRoom)

// The second useEffect in App.jsx is waiting for authUser to be set. As soon as it is, this effect fires and calls checkActiveRoom().

// This function sends a request to your server's /auth/room-status endpoint.

// The server checks the database for the user's currentRoomId. If one exists, it sends it back along with the otherUser's data.

// Step C: Setting the State

// Back on the client, checkActiveRoom receives the response from the server and, if activeRoom is true, it runs the exact same function as before:

// JavaScript

// // In useAuthStore.js -> checkActiveRoom()
// useChatStore.getState().setSelectedUserAndCurrentRoomId(otherUser, roomId);
// This restores the chat state, including currentRoomId, allowing the user to seamlessly continue their session.

// ## Why the ChatRoom.jsx Logic Works Now
// Your ChatRoom component's useEffect hooks are the final piece of the puzzle. They act as the "glue" between the global state and the component's actions.

// Here is the exact sequence on a page reload of /chat/room-123:

// Load: The app loads, authUser and currentRoomId are null.

// Auth: checkAuth() runs, finishes, and sets authUser.

// Rejoin: checkActiveRoom() runs, gets the session data from the server, and calls setSelectedUserAndCurrentRoomId(). The useChatStore now has currentRoomId: 'room-123'.

// Render ChatRoom: The ChatRoom component renders. It sees that the roomId from the URL ('room-123') now matches the currentRoomId from the store ('room-123').

// Authorize Effect: The first useEffect in ChatRoom runs. Its condition if (currentRoomId && currentRoomId === roomId) is now true, so it correctly does nothing, preventing a redundant API call.

// Subscribe Effect: The second useEffect runs. Its condition if (currentRoomId) is also true. It calls subscribeToRoom('room-123'), and the socket successfully joins the room on the server.

// This clean, step-by-step process ensures that state is restored from the server before the component tries to act on it, which is why your previous race conditions are now solved.