import { create } from 'zustand';
import { axiosInstance } from '../lib/axios';
import { toast } from 'react-hot-toast';

export const useUserStore = create((set) => ({
    users: [],
    isLoading: false,
    error: null,
    // doctors: [],
    // patients: [],

    // Get all the doctors
    // returns an array of doctors. signal is from AbortController
    fetchDoctors: async (query = "", signal = undefined) => {
        try {
            set({ isLoading: true })
            const res = await axiosInstance.get(`/users/doctors?search=${encodeURIComponent(query)}`, { signal });
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
            const res = await axiosInstance.get(`/users/patients?search=${encodeURIComponent(query)}`, { signal });
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
    //         const res = await axiosInstance.put(`/users/${userId}`, userData);
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
    //         await axiosInstance.delete(`/users/${userId}`);
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