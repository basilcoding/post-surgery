import { create } from 'zustand';
import { axiosInstance } from '../lib/axios';
import { toast } from 'react-hot-toast';
import { io } from 'socket.io-client';
import { useChatStore } from './useChatStore.js';
import { useSummaryStore } from './useSummaryStore.js';
import { useUIStore } from './useUIStore.js';
import { useChatbotStore } from './useChatbotStore.js';

const BASE_URL = 'http://localhost:5000';

export const useAuthStore = create((set, get) => ({
    authUser: null,
    isSigningUp: false,
    isLoggingIng: false,
    isUpdatingProfile: false, // for showing loading ...
    isCheckingAuth: true, // for showing loading spinner
    onlineUsers: [],
    socket: null,
    isRoomChecking: true,

    checkAuth: async () => { // this is a function used to modify the states
        try {
            const res = await axiosInstance.get('/auth/check');

            set({ authUser: res.data }); // res.data contains user info
            get().connectSocket();
        } catch (error) {
            console.log('Error in checkAuth:', error);
            set({ authUser: null })
        } finally {
            set({ isCheckingAuth: false });
        }
    },

    // This function will be called after the initial auth check
    checkActiveRoom: async () => {
        try {
            const res = await axiosInstance.get('/auth/room-status');
            console.log('active status is: ', res.data.activeRoom);
            if (res.data.activeRoom) {
                const { roomId, otherUser } = res.data;
                console.log("Rejoining active session in room:", roomId);

                // Use the data from the server to restore the chat state
                useChatStore.getState().setSelectedUserAndCurrentRoomId(otherUser, roomId);
            } else {
                console.log("No active session to rejoin.");
            }
        } catch (error) {
            console.error("Failed to check for active session:", error);
            // If this fails, clear any potentially stale chat state
            useChatStore.getState().clearChat();
        }
    },

    signup: async (data) => {
        set({ isSigningUp: true });
        try {
            const res = await axiosInstance.post('/auth/signup', data);
            set({ authUser: res.data }); // res.data contains user info
            toast.success('Signup Successful!');
            get().connectSocket();

            // return true; // return true on success
        } catch (error) {
            toast.error(error.response.data.message);
        } finally {
            set({ isSigningUp: false });
        }
    },

    login: async (data) => {
        set({ isLoggingIng: true });
        try {
            const res = await axiosInstance.post('/auth/login', data);
            set({ authUser: res.data });
            toast.success('Logged in Successfully!');
            await get().connectSocket();

        } catch (error) {
            toast.error(error.response.data.message);
        } finally {
            set({ isLoggingIng: false });
        }
    },

    logout: async () => {
        try {
            const res = await axiosInstance.post('/auth/logout');
            set({ authUser: null });
            toast.success('Logged Out Successfully!');
            get().disconnectSocket();
        } catch (error) {
            toast.error(error.response.data.message);
        }
    },

    updateProfile: async (formData) => { // modified params name from data to formData
        set({ isUpdatingProfile: true });
        // try {
        //     const res = await axiosInstance.put('/auth/update-profile', data);
        //     set({ authUser: res.data });
        //     toast.success('Profile updated Successfully!');
        // } catch (error) {
        //     console.log('Error in updateProfile: ', error);
        //     toast.error(error.response.data.message);
        // } finally {
        //     set({ isUpdatingProfile: false })
        // }

        try {
            const res = await axiosInstance.put('/auth/update-profile', formData, {
                headers: { "Content-Type": "multipart/form-data" },
            });
            set({ authUser: res.data });
            toast.success("Profile updated Successfully!");
        } catch (error) {
            console.log("Error in updateProfile: ", error);
            toast.error(error.response?.data?.message || "Upload failed");
        } finally {
            set({ isUpdatingProfile: false });
        }
    },

    connectSocket: () => {
        const { authUser, socket } = get();
        if (!authUser) return;

        // If there's already a connected socket, don't reconnect
        if (socket && socket.connected) return;

        // If there's an old disconnected socket, disconnect it fully
        if (socket) {
            socket.removeAllListeners();
            socket.disconnect();

            // Tell other stores to remove their past listeners also AND reset their state also
            // useChatStore.getState().disconnectChatSocketListeners(socket);
            // useSummaryStore.getState().disconnectChatSocketListeners(socket);
        }

        const newSocket = io(BASE_URL, { withCredentials: true });

        set({ socket: newSocket });

        // Always reset listeners for the new socket
        newSocket.on("connect", () => {
            console.log("Socket connected:", newSocket.id);
        });

        newSocket.on("disconnect", () => {
            console.log("Socket disconnected");
        });

        newSocket.on("getOnlineUsers", ({ userIds }) => {
            set({ onlineUsers: userIds });
        });

        useChatStore.getState().connectChatSocketListeners(newSocket);
        useSummaryStore.getState().connectSummarySocketListeners(newSocket);
        useChatbotStore.getState().connectChatbotSocketListeners(newSocket);
    },

    disconnectSocket: () => {
        if (get().socket) {
            get().socket.removeAllListeners();
            get().socket.disconnect();
            set({ socket: null });
        }
    },

    // For creator
    createRoom: (email) => {

        const { socket } = get();
        if (!email) return;
        socket.emit("createRoom", { inviteeEmail: email });
    },

    getOnlineUsers: (roomId) => {
        const { socket } = get();
        if (!socket || !roomId) return;
        socket.emit('getOnlineUsers', { roomId });
    },

    checkRoomAuth: async (roomId, navigate) => { //used in chatroom
        const { authUser } = get();
        const socket = useAuthStore.getState().socket;
        const { setSelectedUserAndCurrentRoomId } = useChatStore.getState();
        // if (!currentRoomId) return;

        // for navigation to respective user page if there is an error
        const path = authUser?.role === "doctor" ? "/doctor" : "/patient";

        try {
            set({ isRoomChecking: true })
            // console.log('roomId is: ', roomId);
            const res = await axiosInstance.get(`/auth/check-room-auth/${roomId}`);
            setSelectedUserAndCurrentRoomId(res.data?.selectedUser, res.data?.roomId)
            return true;
        } catch (error) {

            // socket.emit("endRoom", { roomId: currentRoomId || "" });
            // toast.error(error?.response?.data?.message || "Failed to send message");
            useChatStore.getState().clearChat();
            navigate(path);

            return false;
        } finally {
            set({ isRoomChecking: false })
            // return false;
        }
    },

}));