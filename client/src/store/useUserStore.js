import { create } from 'zustand';
import { axiosInstance } from '../lib/axios';
import { toast } from 'react-hot-toast';

import { useAuthStore } from './useAuthStore';
import { useChatStore } from './useChatStore';

export const useUserStore = create((set, get) => ({
    users: [],
    isLoading: false,
    error: null,
    userProfile: {},
    isSigningUp: false,
    // doctors: [],
    // patients: [],

    registerUser: async (formData) => {
        set({ isSigningUp: true });
        console.log(formData.email)
        try {
            const res = await axiosInstance.post("/users", formData, {
                headers: { "Content-Type": "multipart/form-data" },
            });

            toast.success("User registered successfully!");
            return res.data;
        } catch (error) {
            console.log("Error in adminRegister:", error);
            toast.error(error.response?.data?.message || "Registration failed");
        } finally {
            set({ isSigningUp: false });
        }
    },

    getUserProfile: async () => {
        const { authUser } = useAuthStore.getState();
        try {
            const res = await axiosInstance.get(`/users/${authUser._id}`);
            // console.log('active status is: ', res.data.activeRoom);

            set({ userProfile: res.data.userProfile })
            // console.log('User Profile is: ', get().userProfile);
            // if an active room exists
            if (res.data.activeRoom) {
                const { roomId, otherUser } = res.data;
                // console.log("Rejoining active session in room:", roomId);
                console.log('otherUser is: ', otherUser);
                // Use the data from the server to restore the chat state
                useChatStore.getState().setSelectedUserAndCurrentRoomId(otherUser, roomId);
            }
        } catch (error) {
            console.error(error.response?.data?.message || error);
            // If this fails, clear any potentially stale chat state
            useChatStore.getState().clearChat();
        }
    },

    // Get all the doctors
    // returns an array of doctors. signal is from AbortController
    fetchDoctors: async (query = "", signal = undefined) => {
        try {
            set({ isLoading: true })
            // const res = await axiosInstance.get(`/ users ? search = ${ encodeURIComponent(query) }`, { signal });
            // Axios uses 'params' to mean query parameters.
            const res = await axiosInstance.get("/users", {
                params: { role: "doctor", search: query },
                signal,
            });
            return res.data;
        } catch (error) {
            if (error?.code === "ERR_CANCELED" || error?.name === "CanceledError" || error?.message?.toLowerCase?.().includes("canceled")) {
                return [];
            }
            toast.error("Error loading doctors");
            console.log("Error fetching doctors:", error.response?.data?.message);
            return [];
        } finally {
            set({ isLoading: false })
        }
    },

    // Get all the patients. signal is from AbortController
    fetchPatients: async (query = "", signal = undefined) => {
        try {
            set({ isLoading: true })
            // Axios uses 'params' to mean query parameters.
            const res = await axiosInstance.get("/users", {
                params: { role: "patient", search: query },
                signal,
            });
            // const res = await axiosInstance.get(`/ users / patients ? search = ${ encodeURIComponent(query) }`, { signal });
            return res.data;
        } catch (error) {
            if (error?.code === "ERR_CANCELED" || error?.name === "CanceledError" || error?.message?.toLowerCase?.().includes("canceled")) {
                return [];
            }
            toast.error("Error loading patients");
            console.log("Error fetching patients:", error.response?.data?.message);
            return [];
        } finally {
            set({ isLoading: false })
        }
    },

    // -------------->    To do    <------------------------------
    // fetchRelations: async (query = "") => {

    // }



    // -------------->    Ask team Mates    <------------------------------
    // updateUser: async (userId, userData) => {
    //     set({ isLoading: true });
    //     try {
    //         const res = await axiosInstance.put(`/ users / ${ userId }`, userData);
    //         set((state) => ({
    //             users: state.users.map((user) => (user._id === userId ? res.data : user)),
    //         }));
    //     } catch (error) {
    //         set({ error: error.response?.data?.message || "Failed to update user" });
    //     } finally {
    //         set({ isLoading: false });
    //     }
    // },

    // deactivateUser: async (userId) => {
    //     set({ isLoading: true });
    //     try {
    //         await axiosInstance.delete(`/ users / ${ userId }`);
    //         set((state) => ({
    //             users: state.users.filter((user) => user._id !== userId),
    //         }));
    //     } catch (error) {
    //         set({ error: error.response?.data?.message || "Failed to delete user" });
    //     } finally {
    //         set({ isLoading: false });
    //     }
    // },
}))