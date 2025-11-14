import { create } from 'zustand';
import { axiosInstance } from '../lib/axios';
import { toast } from 'react-hot-toast';

import { useAuthStore } from './useAuthStore';
import { useChatStore } from './useChatStore';

export const useProfileStore = create((set, get) => ({
    isLoading: false,
    userProfile: {},
    isUpdatingProfile: false,



    getSelfProfile: async () => {
        const { authUser } = useAuthStore.getState();
        try {
            const res = await axiosInstance.get(`/profiles/me`);
            // console.log('active status is: ', res.data.activeRoom);

            set({ userProfile: res.data.userProfile })
            // console.log('User Profile is: ', get().userProfile);
            // if an active room exists
            if (res.data.activeRoom) {
                const { roomId, otherUser } = res.data;
                // console.log("Rejoining active session in room:", roomId);
                // console.log('otherUser is: ', otherUser);
                // Use the data from the server to restore the chat state
                useChatStore.getState().setSelectedUserAndCurrentRoomId(otherUser, roomId);
            }
        } catch (error) {
            console.error(error?.response?.data?.message || error);
            toast.error(error?.response?.data?.message);

            // If this fails, clear any potentially stale chat state
            useChatStore.getState().clearChat();
        }
    },

    getProfileById: async (profileDbId) => {
        const { authUser } = useAuthStore.getState();
        if (authUser?.role === 'doctor') {
            const res = await axiosInstance.get(`/profiles/${profileDbId}`);
            return res.data;
        }
    },

    updateProfileById: async (patientDbId, formData) => {
        const { authUser } = useAuthStore.getState();
        if (authUser?.role === 'doctor') {
            const res = await axiosInstance.patch(`/profiles/${patientDbId}`, formData);
            // console.log('returned updateProfileById axios res is', res.data);
            return res.data;
        }
    },

    updateSelfProfile: async (formData) => {
        const { authUser } = useAuthStore.getState();
        const res = await axiosInstance.patch(`/profiles/me/`, formData);
        // console.log('The returned res object of updateSelfProfile function is: ', res.data);
        toast.success("Profile updated successfully.");
        return res.data;
    },

    setUpdatedProfile: (updatedPatientProfile) => {
        set({ userProfile: updatedPatientProfile });
        // console.log('Updated Profile is: ', get().userProfile);
    },
}))