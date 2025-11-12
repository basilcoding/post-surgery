import { create } from 'zustand';
import { axiosInstance } from '../lib/axios';
import { toast } from 'react-hot-toast';
import { useAuthStore } from './useAuthStore';

export const useSummaryStore = create((set, get) => ({
    newSummaries: [],
    underReviewSummaries: [],
    resolvedSummaries: [],
    selectedSummary: {},

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
            const { authUser } = useAuthStore.getState();
            const { newSummaries, underReviewSummaries, resolvedSummaries } = useSummaryStore.getState();
            useSummaryStore.setState(prev => {

                const updated = summary; // the single updated summary returned by server
                const updatedId = String(updated._id);

                // remove any existing copies of this summary from all buckets
                const withoutId = (arr) => arr.filter(s => s._id !== updatedId);

                const newNewSummaries = withoutId(prev.newSummaries);
                const newUnderReview = withoutId(prev.underReviewSummaries);
                const newResolved = withoutId(prev.resolvedSummaries);

                const status = summary.status;

                // place updated summary at the front of the appropriate bucket
                if (status === 'New') {
                    return {
                        ...prev,
                        newSummaries: [updated, ...newNewSummaries],
                        underReviewSummaries: newUnderReview,
                        resolvedSummaries: newResolved,
                    };
                } else if (status === 'UnderReview') {
                    return {
                        ...prev,
                        newSummaries: newNewSummaries,
                        underReviewSummaries: [updated, ...newUnderReview],
                        resolvedSummaries: newResolved,
                    };
                } else {
                    return {
                        ...prev,
                        newSummaries: newNewSummaries,
                        underReviewSummaries: newUnderReview,
                        resolvedSummaries: [updated, ...newResolved],
                    };
                }
            })
            toast.success("New journal summary received");
        });

        socket.on("emergencySummaryCreated", ({ summary }) => {
            // set({ newSocketSummary: data });
            const { authUser } = useAuthStore.getState();
            const { newSummaries, underReviewSummaries, resolvedSummaries } = useSummaryStore.getState();
            useSummaryStore.setState(prev => {

                const updated = summary; // the single updated summary returned by server
                const updatedId = String(updated._id);

                // remove any existing copies of this summary from all buckets
                const withoutId = (arr) => arr.filter(s => s._id !== updatedId);

                const newNewSummaries = withoutId(prev.newSummaries);
                const newUnderReview = withoutId(prev.underReviewSummaries);
                const newResolved = withoutId(prev.resolvedSummaries);

                const status = summary.status;

                // place updated summary at the front of the appropriate bucket
                if (status === 'New') {
                    return {
                        ...prev,
                        newSummaries: [updated, ...newNewSummaries],
                        underReviewSummaries: newUnderReview,
                        resolvedSummaries: newResolved,
                    };
                } else if (status === 'UnderReview') {
                    return {
                        ...prev,
                        newSummaries: newNewSummaries,
                        underReviewSummaries: [updated, ...newUnderReview],
                        resolvedSummaries: newResolved,
                    };
                } else {
                    return {
                        ...prev,
                        newSummaries: newNewSummaries,
                        underReviewSummaries: newUnderReview,
                        resolvedSummaries: [updated, ...newResolved],
                    };
                }
            })
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
            toast.success("Status updated");
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

    getSummaryById: async (summaryId) => {
        try {
            const res = await axiosInstance.get(`/summaries/${summaryId}`)
            set({ selectedSummary: res.data.summary })
            // set((prev) => {
            //     return { ...prev.selectedSummary, ...res.data.summary }
            // })
        } catch (error) {
            console.log("Error occured in updateSummaryById zustand store function: ", error);
        }
    },

    updateSurgeryImages: async (formData, summaryId) => {
        try {
            const res = await axiosInstance.patch(`/summaries/${summaryId}`, formData);
            set({ selectedSummary: res.data.summary })
            toast.success("Images updated");
            // set((prev) => {
            //     return { ...prev.selectedSummary, ...res.data.summary }
            // })
        } catch (error) {
            console.log("Error occured in updateSummaryById zustand store function: ", error);
        }
    }

}));