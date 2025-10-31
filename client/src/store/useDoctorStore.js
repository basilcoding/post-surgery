import { create } from 'zustand';
import { axiosInstance } from '../lib/axios';
import { toast } from 'react-hot-toast';
import { io } from 'socket.io-client';
import { useChatStore } from './useChatStore.js';
import { useSummaryStore } from './useSummaryStore.js';
import { useUIStore } from './useUIStore.js';
import { useChatbotStore } from './useChatbotStore.js';
import { useAuthStore } from './useAuthStore.js';

export const useDoctorStore = create((set, get) => ({

    markViewed: async (summaryId, viewedStatus) => {
        const { authUser } = useAuthStore.getState();
        const { newSummaries, recentlyViewedSummaries, summariesHistory } = useSummaryStore.getState();
        // const recentlyViewedSummaries = useSummaryStore.getState().recentlyViewedSummaries;
        // const summariesHistory = useSummaryStore.getState().summariesHistory;

        try {
            const all = [
                // all 3 of these is an array which has summary objects in each of it, where each of them are spreaded/copied into this new 'all' array
                ...newSummaries,
                ...recentlyViewedSummaries,
                ...summariesHistory,
            ];
            // in this whole..... array called 'all' (which has all the summaries object i.e new, viewed and history) find one summary object whose ._id = summaryId (summaryId we pass in through the function argument)
            const clickedSummary = all.find((s) => s._id === summaryId)

            const res = await axiosInstance.patch(`/summaries/${summaryId}`, { viewedStatus: viewedStatus }, { withCredentials: true });

            const updated = res.data.summary; // the single updated summary returned by server
            const updatedId = String(updated._id)

            // Find this doctor's deliveredTo entry (safely)
            const myDelivery = (updated.deliveredTo || []).find(d => {
                const entryId = (d?.doctor?._id || d?.doctor)?.toString?.();
                return entryId === authUser._id?.toString();
            });

            // useSummaryStore.setState(prev => {

            //     // remove any existing copies of this summary from all buckets
            //     let flag;
            //     for (let doc of prev.newSummaries || []) {
            //         if (String(doc._id) === updatedId) { flag = 'newSummary' }
            //     }
            //     for (let doc of prev.recentlyViewedSummaries || []) {
            //         if (String(doc._id) === updatedId) { flag = 'recentlyViewedSummary'; }
            //     }
            //     for (let doc of prev.summariesHistory || []) {
            //         if (String(doc._id) === updatedId) { flag = 'summaryHistory'; }
            //     }


            //     const withoutId = (arr) => (arr || []).filter(s => String(s._id) !== updatedId);
            //     const newNewSummaries = withoutId(prev.newSummaries);
            //     const newRecentlyViewed = withoutId(prev.recentlyViewedSummaries);
            //     const newHistory = withoutId(prev.summariesHistory);

            //     if (flag === 'newSummary') {
            //         return {
            //             ...prev,
            //             newSummaries: [updated, ...newNewSummaries],
            //             recentlyViewedSummaries: newRecentlyViewed,
            //             summariesHistory: newHistory,
            //         };
            //     } else if (flag === 'recentlyViewedSummary') {
            //         return {
            //             ...prev,
            //             newSummaries: newNewSummaries,
            //             recentlyViewedSummaries: [updated, ...newRecentlyViewed],
            //             summariesHistory: newHistory,
            //         };
            //     } else {
            //         return {
            //             ...prev,
            //             newSummaries: newNewSummaries,
            //             recentlyViewedSummaries: newRecentlyViewed,
            //             summariesHistory: [updated, ...newHistory],
            //         }
            //     }
            // })
            useSummaryStore.setState(prev => {

                // remove any existing copies of this summary from all buckets
                const withoutId = (arr) => arr.filter(s => s._id !== updatedId);

                const newNewSummaries = withoutId(prev.newSummaries);
                const newRecentlyViewed = withoutId(prev.recentlyViewedSummaries);
                const newHistory = withoutId(prev.summariesHistory);

                const isViewed = !!myDelivery?.viewed;

                // place updated summary at the front of the appropriate bucket
                if (isViewed) {
                    return {
                        ...prev,
                        newSummaries: newNewSummaries,
                        recentlyViewedSummaries: [updated, ...newRecentlyViewed],
                        summariesHistory: newHistory,
                    };
                } else {
                    return {
                        ...prev,
                        newSummaries: [updated, ...newNewSummaries],
                        recentlyViewedSummaries: newRecentlyViewed,
                        summariesHistory: newHistory,
                    };
                }
            })

            // const newSummary = newSummaries.find(s => (s._id === res.data.summary._id))
            // const recentlyViewedSummary = recentlyViewedSummary.find(s => (s._id === res.data.summary._id))
            // const summaryhistory = summariesHistory.find(s => (s._id === res.data.summary._id))

            // update local state
            // await get.fetchSummaries(allSummaries.type);
        } catch (err) {
            toast.error(err?.response?.data?.message || "Failed to mark as viewed");
            console.log(err)
        }
    },

}));