import { create } from 'zustand';
import { axiosInstance } from '../lib/axios';
import { toast } from 'react-hot-toast';

import { useAuthStore } from './useAuthStore';
import { useChatStore } from './useChatStore';

export const useProfileStore = create((set, get) => ({
    isLoading: false,
    careCheckLists: [],
    selectedCareCheckList: {},
    isUpdatingProfile: false,

    getCareCheckLists: async () => {
        try {
            const res = await axiosInstance("/care-check-lists/");
            set({ careCheckLists: res.data })
        } catch (error) {
            console.log("Error occured in getCareCheckLists zustand store: ", error);
        }
    },

    getCareCheckListById: async (careCheckListId) => {
        try {
            const res = await axiosInstance(`/care-check-lists/${careCheckListId}`);
            set({ careCheckLists: res.data })
        } catch (error) {
            console.log("Error occured in getCareCheckLists zustand store: ", error);
        }
    },

    
    updateCareCheckListById: async (careCheckListId) => {
        try {
            const res = await axiosInstance(`/care-check-lists/${careCheckListId}`);
            set({ careCheckLists: res.data })
        } catch (error) {
            console.log("Error occured in getCareCheckLists zustand store: ", error);
        }
    },


}))