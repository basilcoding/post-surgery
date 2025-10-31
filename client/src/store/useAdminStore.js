import { create } from 'zustand';
import { axiosInstance } from '../lib/axios';
import { toast } from 'react-hot-toast';
import { io } from 'socket.io-client';
import { useChatStore } from './useChatStore';

export const useAdminStore = create((set, get) => ({
    // isSigningUp: false,
    // isAssigning: false,
    isRegistering: false,

    registerAdmin: async (data) => {
        set({ isRegistering: true });
        try {
            const res = await axiosInstance.post('/admin/', data);
            set({ authUser: res.data }); // res.data contains user info
            toast.success('Signup Successful!');
            get().connectSocket();

            // return true; // return true on success
        } catch (error) {
            toast.error(error.response.data.message);
        } finally {
            set({ isRegistering: false });
        }
    },

    // adminRegister: async (formData) => {
    //     set({ isSigningUp: true });
    //     try {
    //         const res = await axiosInstance.post("/admin/register", formData, {
    //             headers: { "Content-Type": "multipart/form-data" },
    //         });

    //         toast.success("User registered successfully!");
    //         return res.data;
    //     } catch (error) {
    //         console.log("Error in adminRegister:", error);
    //         toast.error(error.response?.data?.message || "Registration failed");
    //     } finally {
    //         set({ isSigningUp: false });
    //     }
    // },

    // assignRelationship: async (data) => {
    //     try {
    //         set({ isAssigning: true });

    //         const res = await axiosInstance.post("/admin/assign-relationship", data);
    //         toast.success("Doctor assigned successfully!");

    //         return res.data;
    //     } catch (err) {
    //         toast.error(err.response?.data?.message || "Error assigning doctor");
    //         return null;
    //     } finally {
    //         set({ isAssigning: false });
    //     }
    // },

}));