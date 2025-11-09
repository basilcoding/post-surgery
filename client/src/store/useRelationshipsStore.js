import { create } from 'zustand';
import { axiosInstance } from '../lib/axios';
import { toast } from 'react-hot-toast';
import { io } from 'socket.io-client';

import { useChatStore } from './useChatStore';
import { useAuthStore } from './useAuthStore';

export const useRelationshipsStore = create((set, get) => ({
    isAssigning: false,
    isFetchingRelationships: false,
    userRelationships: [],

    createRelationship: async (data) => {
        try {
            set({ isAssigning: true });

            const res = await axiosInstance.post("/relationships", data);
            toast.success("Doctor assigned successfully!");

            return res.data;
        } catch (err) {
            toast.error(err.response?.data?.message || "Error assigning doctor");
            return null;
        } finally {
            set({ isAssigning: false });
        }
    },

    getRelationships: async (role) => {
        const { authUser } = useAuthStore.getState();
        try {
            set({ isFetchingRelationships: true });

            const res = await axiosInstance.get(`/relationships`, {
                params: { role: role },
            });
            set({ userRelationships: res.data.relationships || [] })
        } catch (err) {
            console.log(err)
            toast.error(err.response?.data?.message || "Error assigning doctor");
            return null;
        } finally {
            set({ isFetchingRelationships: false });
        }
    },

    getRelationshipById: async (relationshipId) => {
        const { authUser } = useAuthStore.getState();
        if (authUser?.role === 'doctor') {
            const res = await axiosInstance.get(`/relationships/${relationshipId}`);
            return res.data;
        }
    },

    updateRelationshipById: async (relationshipId, formData) => {
        const { authUser } = useAuthStore.getState();
        if (authUser?.role === 'doctor') {
            const res = await axiosInstance.patch(`/relationships/${relationshipId}`, formData);
            return res.data;
        }
    },
}));