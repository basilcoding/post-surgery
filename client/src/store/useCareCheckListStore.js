import { create } from 'zustand';
import { axiosInstance } from '../lib/axios';
import { toast } from 'react-hot-toast';

import { useAuthStore } from './useAuthStore';
import { useChatStore } from './useChatStore';

export const useCareCheckListStore = create((set, get) => ({
    isLoading: false,
    careCheckLists: [],
    selectedCareCheckList: {},
    isUpdatingProfile: false,

    getCareCheckLists: async () => {
        try {
            const res = await axiosInstance.get("/care-check-lists/");
            set({ careCheckLists: res.data })
        } catch (error) {
            console.log("Error occured in getCareCheckLists zustand store: ", error);
        }
    },

    createCareCheckList: async (formData) => {
        try {
            const res = await axiosInstance.post("/care-check-lists/", formData);
            set((prev) => { [...prev.careCheckLists, ...res.data] })
            toast.success("Care checklist created Successfully!");
        } catch (error) {
            console.log("Error occured in getCareCheckLists zustand store: ", error);
        }
    },

    getCareCheckListById: async (careCheckListId) => {
        try {
            const res = await axiosInstance.get(`/care-check-lists/${careCheckListId}`);
            set({ selectedCareCheckList: res.data })
        } catch (error) {
            console.log("Error occured in getCareCheckLists zustand store: ", error);
        }
    },

    updateCareCheckListById: async (careCheckListId, formData) => {
        try {
            const res = await axiosInstance.patch(`/care-check-lists/${careCheckListId}`, formData);
            set({ selectedCareCheckList: res.data })
        } catch (error) {
            console.log("Error occured in getCareCheckLists zustand store: ", error);
        }
    },

    deleteCareCheckListById: async (careCheckListId) => {
        try {
            const res = await axiosInstance.delete(`/care-check-lists/${careCheckListId}`);
            set({ selectedCareCheckLists: res.data });
            toast.success("Deleted care checklist successfully");
        } catch (error) {
            console.log("Error occured in getCareCheckLists zustand store: ", error);
        }
    },


}))