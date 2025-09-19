import { create } from 'zustand';
import { axiosInstance } from '../lib/axios';
import { toast } from 'react-hot-toast';
import { useAuthStore } from './useAuthStore';

export const useSummaryStore = create((set, get) => ({
    newSummaries: [],
    recentlyViewedSummaries: [],
    summariesHistory: [],

    newSocketSummary: {},

    connectSummarySocketListeners: (socket) => {
        // const { socket } = useAuthStore.getState();
        if (!socket) return;

        // remove any previous listeners to avoid duplicates
        socket.off('journalSummaryCreated');
        socket.off('emergencySummaryCreated');
        socket.off('noDoctorAvailable');

        socket.on("journalSummaryCreated", (data) => {
            set({ newSocketSummary: data });
            set((prev) => ({
                newSummaries: [get().newSocketSummary, ...prev.newSummaries]
            }));
            toast.success("New journal summary received");
        });

        socket.on("emergencySummaryCreated", (data) => {
            set({ newSocketSummary: data });
            set((prev) => ({
                newSummaries: [get().newSocketSummary, ...prev.newSummaries]
            }));
            toast.error("New Emergency summary received!", { duration: 12000 });
        });

        socket.on("noDoctorAvailable", (data) => {
            toast.error(data.message, { duration: 10000 });
        });
    },

    disconnectSummarySocketListeners: (socket) => {
        if (!socket) return;
        socket.off('journalSummaryCreated');
        socket.off('emergencySummaryCreated');
        socket.off('noDoctorAvailable');
    },

    fetchSummaries: async (query) => {
        const { authUser } = useAuthStore.getState();

        try {
            // const res = await axiosInstance.get(`/summaries/${authUser._id}`);
            const res = await axiosInstance.get(`/summaries?type=${encodeURIComponent(query)}`);

            // The response data will be an object like { new: [...], viewed: [...], history: [...] }
            const summaries = res.data?.summaries;
            set({
                newSummaries: summaries.new || [],
                recentlyViewedSummaries: summaries.recentlyViewed || [],
                summariesHistory: summaries.history || [],
            })
        } catch (err) {
            toast.error("Failed to load all summaries");
            set({ newSummaries: [], recentlyViewedSummaries: [], summariesHistory: [] })

        }
    },

    // USE THIS DURING DEPLOYMENT
    // if this function is called once then it can't change the viewed status back to true for a particular summary
    // markViewed: async (summaryId, viewedBy) => {
    //     try {
    //         const res = await axiosInstance.patch(`/summaries/${summaryId}`, { viewedBy }, { withCredentials: true });
    //     } catch (err) {
    //         toast.error(err?.response?.data?.message || "Failed to mark as viewed");
    //     }
    // },

    // toggleViewedStatus
    // if this function is called once then it CAN toggle the viewed status in the backend

    markViewed: async (summaryId, viewedBy) => {
        const { authUser } = useAuthStore.getState();
        const newSummaries = get().newSummaries;
        const viewedSummaries = get().recentlyViewedSummaries;
        const summariesHistory = get().summariesHistory;

        try {
            const all = [
                // all 3 of these is an array which has summary objects in each of it, where each of them are spreaded/copied into this new 'all' array
                ...get().newSummaries,
                ...get().recentlyViewedSummaries,
                ...get().summariesHistory,
            ];
            // in this whole..... array called 'all' (which has all the summaries object i.e new, viewed and history) find one summary object whose ._id = summaryId (summaryId we pass in through the function argument)
            const clickedSummary = all.find((s) => s._id === summaryId)

            const res = await axiosInstance.patch(`/summaries/${summaryId}`, { viewedStatus: clickedSummary.viewed, viewedBy }, { withCredentials: true });
            // update local state
            // await get.fetchSummaries(allSummaries.type);
        } catch (err) {
            toast.error(err?.response?.data?.message || "Failed to mark as viewed");
        }
    },

}));