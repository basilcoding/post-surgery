import { create } from 'zustand';
import toast from 'react-hot-toast';
import { axiosInstance } from '../lib/axios.js';
import { useAuthStore } from './useAuthStore.js';

export const useChatStore = create((set, get) => ({
    messages: [],
    users: [],
    selectedUser: null,// the person you're chatting with
    currentRoomId: null, // store active roomId //localStorage.getItem("currentRoomId") || 
    isUsersLoading: false,
    isMessagesLoading: false,
    // chatNavigationTarget: null, // state flag for navigation, holds the destination path (eg: doctor or patient)
    navigationTarget: null,

    connectChatSocketListeners: (socket) => {

        // const { socket } = useAuthStore.getState();
        if (!socket) return;

        // remove any previous listeners to avoid duplicates
        // socket.off('roomCreated');
        socket.off('roomNotify');
        socket.off('roomEnded');

        // socket.on("roomCreated", async ({ roomId, invitee }) => {
        //     try {
        //         const { authUser } = useAuthStore.getState();
        //         await axiosInstance.post(`/auth/create-room-token/${authUser._id}`, { roomId });
        //         get().setSelectedUser(invitee, roomId);
        //     } catch (error) {
        //         console.error("Error in roomCreated:", error?.message);
        //     }
        // });

        socket.on("roomNotify", async ({ roomId, otherUser }) => {
            const { authUser } = useAuthStore.getState();
            const path = authUser?.role === "doctor" ? "/doctor" : "/patient";
            try {
                const res = await axiosInstance.post(`/auth/create-room-token/${authUser._id}`, { roomId, selectedUser: otherUser });

                get().setSelectedUserAndCurrentRoomId(otherUser, roomId);
                toast.success(otherUser.role === 'creator' ? 'Room created' : 'You were invited');

            } catch (error) {
                console.log("Error in roomNotify socket Listener: ", error?.message);
            }
        });

        socket.on("roomEnded", async ({ roomId }) => {
            const { authUser } = useAuthStore.getState();
            const path = authUser?.role === "doctor" ? "/doctor" : "/patient";

            try {
                // Tell backend to clean up tokens
                await axiosInstance.post(`/auth/clear-room-token/${roomId}`);

                // Clear chat state
                get().clearChat();

                // Show toast
                toast.success("Room has closed");
            } catch (error) {
                console.log("Error in roomEnded:", error?.message);
                // toast.error("Error handling room close");
            } finally {
                // Patient should be redirected
                set({ navigationTarget: path });
            }
        });
    },

    disconnectChatSocketListeners: (socket) => {
        // const { socket } = useAuthStore.getState();
        if (!socket) return;
        // socket.off('roomCreated');
        socket.off('roomNotify');
        socket.off('roomEnded');
        socket.off('newMessage');
    },

    subscribeToRoom: (roomId) => { // This is done to ensure that the user joins back (socket room) to the correct room even if the user reloads the browser. (since when the user reloads the socket address changes each time) (i think it happens because when the broswer is reloaded the socket is disconnected which makes it to leave the room, so we have to force the user to join back to the room if the user reloads...)
        const { socket } = useAuthStore.getState();
        if (socket && roomId) {
            socket.emit("joinRoom", { roomId: roomId });
        }
    },

    // Load messages for a room
    getMessages: async (roomId) => {
        set({ isMessagesLoading: true });

        try {
            const res = await axiosInstance.get(`/messages/room/${roomId}`, { withCredentials: true });
            set({ messages: res.data });
        } catch (error) {
            console.log(error?.response?.data?.message || "Failed to load messages");
        } finally {
            set({ isMessagesLoading: false });
        }
    },

    sendMessage: async (roomId, formData) => {
        const { messages } = get();

        try {
            
            const res = await axiosInstance.post(
                `/messages/room/${roomId}/send`, formData,
                { headers: { "Content-Type": "multipart/form-data" }, withCredentials: true }
            );
            console.log("res is: ", res.data);
            set({ messages: [...messages, res.data] });
        } catch (error) {
            console.log(error?.response?.data?.message || "Failed to load messages");
        }
    },

    // Listen for incoming socket messages
    subscribeToMessages: () => {
        if (!get().currentRoomId) return;

        const socket = useAuthStore.getState().socket;
        if (!socket) return;

        // ensure we don't register duplicates
        // socket.off("newMessage");

        // newMessage is an object and not a string
        socket.on("newMessage", (newMessage) => {
            // if newMessage's roomId is not equal to the current users roomId then do set the messages (the currentUser can be anyone, any doc or patient)
            const currentRoomId = get().currentRoomId; // <-- read latest
            console.log("newMessage is: ", newMessage);
            if (newMessage.roomId !== currentRoomId) return;
            console.log('newmessage is: ', newMessage);
            set({ messages: [...get().messages, newMessage] });
            // console.log(get().messages);
        });
    },

    unsubscribeFromMessages: () => {
        const socket = useAuthStore.getState().socket;
        if (!socket) return;
        socket.off("newMessage");
    },

    endConversation: async () => {
        const { socket, authUser } = useAuthStore.getState();
        const path = authUser?.role === "doctor" ? "/doctor" : "/patient";
        const { currentRoomId, selectedUser } = get();
        if (!socket || !currentRoomId) return;
        // only emit to server
        socket.emit("endRoom", { roomId: currentRoomId, creator: authUser, invitee: selectedUser });


        // get().clearChat();
    },

    // When starting a chat
    setSelectedUserAndCurrentRoomId: (otherUser, roomId) => {
        // console.log("Setting selected user:", user, "with roomId:", roomId); // working
        set({ selectedUser: otherUser, currentRoomId: roomId });
        // localStorage.setItem("selectedUser", JSON.stringify(user));
        // localStorage.setItem("currentRoomId", roomId); // persist roomId
    },

    clearNavigationTarget: () => {
        set({ navigationTarget: null });
    },

    clearChat: () => {
        set({ messages: [], selectedUser: null, currentRoomId: null });
        // localStorage.removeItem("selectedUser");
        // localStorage.removeItem("currentRoomId");
    },
}));
