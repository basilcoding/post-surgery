import { create } from 'zustand';
import { axiosInstance } from '../lib/axios';
import { toast } from 'react-hot-toast';
import { useAuthStore } from './useAuthStore';

export const useSummaryStore = create((set, get) => ({
    newSummaries: [],
    underReviewSummaries: [],
    resolvedSummaries: [],

    newSocketSummary: {},

    connectSummarySocketListeners: (socket) => {
        // const { socket } = useAuthStore.getState();
        if (!socket) return;

        // remove any previous listeners to avoid duplicates
        socket.off('journalSummaryCreated');
        socket.off('emergencySummaryCreated');
        socket.off('noDoctorAvailable');

        socket.on("journalSummaryCreated", ({ summary }) => {
            // set({ newSocketSummary: data });
            set((prev) => ({
                newSummaries: [summary, ...prev.newSummaries]
            }));
            toast.success("New journal summary received");
        });

        socket.on("emergencySummaryCreated", ({ summary }) => {
            // set({ newSocketSummary: data });
            set((prev) => ({
                newSummaries: [summary, ...prev.newSummaries]
            }));
            toast.error("New Emergency summary received!", { duration: 5000 });
        });

        socket.on("emergencySummaryUpdated", ({ summary }) => {
            set((prev) => {
                // remove any existing copy of this summary from newSummaries
                const filtered = prev.newSummaries.filter((s) => {
                    const id = s?._id?.toString?.();
                    return id !== summary._id;
                });

                // add incoming summary to the front
                return {
                    newSummaries: [summary, ...filtered],
                };
            });
            toast.error("An Updated Emergency summary has arrived!", { duration: 5000 });
        })

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

    // If doctor is in emergency summary page, then the variables will only be filled with emergency summaries, and vice versa.
    fetchSummaries: async (query) => {
        const { authUser } = useAuthStore.getState();

        try {
            // const res = await axiosInstance.get(`/summaries/${authUser._id}`);
            const res = await axiosInstance.get(`/summaries?type=${encodeURIComponent(query)}`);

            // The response data will be an object like { new: [...], viewed: [...], history: [...] }
            const summaries = res.data?.summaries;
            set({
                newSummaries: summaries.newSummaries || [],
                underReviewSummaries: summaries.underReviewSummaries || [],
                resolvedSummaries: summaries.resolvedSummaries || [],
            })
        } catch (err) {
            toast.error("Failed to load all summaries");
            set({ newSummaries: [], underReviewSummaries: [], resolvedSummaries: [] })

        }
    },

    changeStatus: async (summaryId, status) => {
        const { authUser } = useAuthStore.getState();
        const { newSummaries, underReviewSummaries, resolvedSummaries } = useSummaryStore.getState();
        // const underReviewSummaries = useSummaryStore.getState().underReviewSummaries;
        // const resolvedSummaries = useSummaryStore.getState().resolvedSummaries;

        try {
            const all = [
                // all 3 of these is an array which has summary objects in each of it, where each of them are spreaded/copied into this new 'all' array
                ...newSummaries,
                ...underReviewSummaries,
                ...resolvedSummaries,
            ];
            // in this whole..... array called 'all' (which has all the summaries object i.e new, viewed and history) find one summary object whose ._id = summaryId (summaryId we pass in through the function argument)
            // const clickedSummary = all.find((s) => s._id === summaryId)

            const res = await axiosInstance.patch(`/summaries/${summaryId}`, { status: status }, { withCredentials: true });

            const updated = res.data.summary; // the single updated summary returned by server
            const updatedId = String(updated._id)

            // Find this doctor's deliveredTo entry (safely)
            const myDelivery = (updated.deliveredTo || []).find(d => {
                const entryId = (d?.doctor?._id || d?.doctor)?.toString?.();
                return entryId === authUser._id?.toString();
            });

            useSummaryStore.setState(prev => {

                // remove any existing copies of this summary from all buckets
                const withoutId = (arr) => arr.filter(s => s._id !== updatedId);

                const newNewSummaries = withoutId(prev.newSummaries);
                const newUnderReview = withoutId(prev.underReviewSummaries);
                const newResolved = withoutId(prev.resolvedSummaries);

                const status = res.data.summary.status;

                // place updated summary at the front of the appropriate bucket
                if (status === 'UnderReview') {
                    return {
                        ...prev,
                        newSummaries: newNewSummaries,
                        underReviewSummaries: [updated, ...newUnderReview],
                        resolvedSummaries: newResolved,
                    };
                } else if (status === 'Resolved') {
                    return {
                        ...prev,
                        newSummaries: newNewSummaries,
                        underReviewSummaries: newUnderReview,
                        resolvedSummaries: [updated, ...newResolved],
                    };
                }
            })

        } catch (err) {
            toast.error(err?.response?.data?.message || "Failed to mark as viewed");
            console.log(err)
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

    // markViewed: async (summaryId, viewedBy) => {
    //     const { authUser } = useAuthStore.getState();
    //     const newSummaries = get().newSummaries;
    //     const viewedSummaries = get().recentlyViewedSummaries;
    //     const summariesHistory = get().summariesHistory;

    //     try {
    //         const all = [
    //             // all 3 of these is an array which has summary objects in each of it, where each of them are spreaded/copied into this new 'all' array
    //             ...get().newSummaries,
    //             ...get().recentlyViewedSummaries,
    //             ...get().summariesHistory,
    //         ];
    //         // in this whole..... array called 'all' (which has all the summaries object i.e new, viewed and history) find one summary object whose ._id = summaryId (summaryId we pass in through the function argument)
    //         const clickedSummary = all.find((s) => s._id === summaryId)

    //         const res = await axiosInstance.patch(`/summaries/${summaryId}`, { viewedStatus: clickedSummary.viewed, viewedBy }, { withCredentials: true });
    //         // update local state
    //         // await get.fetchSummaries(allSummaries.type);
    //     } catch (err) {
    //         toast.error(err?.response?.data?.message || "Failed to mark as viewed");
    //     }
    // },

}));