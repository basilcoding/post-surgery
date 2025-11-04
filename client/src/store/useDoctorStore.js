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

    // changeStatus: async (summaryId, status) => {
    //     const { authUser } = useAuthStore.getState();
    //     const { newSummaries, underReviewSummaries, resolvedSummaries } = useSummaryStore.getState();
    //     // const underReviewSummaries = useSummaryStore.getState().underReviewSummaries;
    //     // const resolvedSummaries = useSummaryStore.getState().resolvedSummaries;

    //     try {
    //         const all = [
    //             // all 3 of these is an array which has summary objects in each of it, where each of them are spreaded/copied into this new 'all' array
    //             ...newSummaries,
    //             ...underReviewSummaries,
    //             ...resolvedSummaries,
    //         ];
    //         // in this whole..... array called 'all' (which has all the summaries object i.e new, viewed and history) find one summary object whose ._id = summaryId (summaryId we pass in through the function argument)
    //         // const clickedSummary = all.find((s) => s._id === summaryId)

    //         const res = await axiosInstance.patch(`/summaries/${summaryId}`, { status: status }, { withCredentials: true });

    //         const updated = res.data.summary; // the single updated summary returned by server
    //         const updatedId = String(updated._id)

    //         // Find this doctor's deliveredTo entry (safely)
    //         const myDelivery = (updated.deliveredTo || []).find(d => {
    //             const entryId = (d?.doctor?._id || d?.doctor)?.toString?.();
    //             return entryId === authUser._id?.toString();
    //         });

    //         useSummaryStore.setState(prev => {

    //             // remove any existing copies of this summary from all buckets
    //             const withoutId = (arr) => arr.filter(s => s._id !== updatedId);

    //             const newNewSummaries = withoutId(prev.newSummaries);
    //             const newUnderReview = withoutId(prev.underReviewSummaries);
    //             const newResolved = withoutId(prev.resolvedSummaries);

    //             const status = res.summary.status;

    //             // place updated summary at the front of the appropriate bucket
    //             if (status === 'UnderReview') {
    //                 return {
    //                     ...prev,
    //                     newSummaries: newNewSummaries,
    //                     underReviewSummaries: [updated, ...newUnderReview],
    //                     resolvedSummaries: newResolved,
    //                 };
    //             } else if (status === 'Resolved') {
    //                 return {
    //                     ...prev,
    //                     newSummaries: newNewSummaries,
    //                     underReviewSummaries: newUnderReview,
    //                     resolvedSummaries: [updated, ...newResolved],
    //                 };
    //             }
    //         })
            
    //     } catch (err) {
    //         toast.error(err?.response?.data?.message || "Failed to mark as viewed");
    //         console.log(err)
    //     }
    // },

}));