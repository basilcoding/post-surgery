import { create } from 'zustand';
import { axiosInstance } from '../lib/axios';
import { toast } from 'react-hot-toast';
import { io } from 'socket.io-client';

import { useUserStore } from './useUserStore.js';
import { useAuthStore } from './useAuthStore.js';

export const usePatientStore = create((set, get) => ({

    isSettingActiveDoctor: false,

    setActiveDoctor: async (doctorId) => {
        const { authUser } = useAuthStore.getState();
        try {
            console.log(doctorId)
            set({ isSettingActiveDoctor: true });
            const res = await axiosInstance.patch(`/patients/${authUser._id}`, { activeDoctor: doctorId || null });
            const patch = res.data || null;

            // merge server patch (authoritative)
            useUserStore.setState((state) => ({
                userProfile: { ...state.userProfile, ...patch.updates }
            }));
            console.log('User Profile is: ', useUserStore.getState().userProfile);
            toast.success("Active doctor set");
            return res.data;
        } catch (error) {
            toast.error("Failed to set active doctor");
            console.log(error.response?.data?.message || error);
        } finally {
            set({ isSettingActiveDoctor: false });
        }
    },

}));