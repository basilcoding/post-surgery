import BotSummary from "../models/botsummary.model.js";
import { ioInstance } from "../lib/socket.js";


export const getSummariesForDoctor = async (req, res) => {
    try {
        // don't get confused, here type is either journal or emergency
        const { type } = req.query;
        const doctorId = req.user._id; // protectRoute runs before
        const now = new Date();
        // know that current time is always larger than the time that was seven days ago
        const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

        // Run all database queries in parallel so that is why we are using await Promise.all here
        // const [newData, recentlyViewedData, historyData] = await Promise.all([
        //     BotSummary.find({ doctor: doctorId, type: type, viewed: false, createdAt: { $gte: sevenDaysAgo } }).lean().populate("patient"),
        //     BotSummary.find({ doctor: doctorId, type: type, viewed: true, createdAt: { $gte: sevenDaysAgo } }).lean().populate("patient"),
        //     BotSummary.find({ doctor: doctorId, type: type, createdAt: { $lt: sevenDaysAgo } }).lean().populate("patient")
        // ]);

        // Only return the first matching deliveredTo entry for this doctor via positional projection
        // const baseProjection = {
        //     patient: 1,
        //     content: 1,
        //     questionsAsked: 1,
        //     type: 1,
        //     createdAt: 1,
        //     "deliveredTo.$": 1, // **positional projection** – returns only this doctor's subdoc
        // };

        // only the documents where it has --> the given type, createdAt specific days ago, and the deliveredTo array must contain the given doctorId (viewed: true/false also depending on the query)
        const [newData, recentlyViewedData, historyData] = await Promise.all([
            // New (last 7 days, not viewed by this doctor)
            BotSummary.find({
                type,
                createdAt: { $gte: sevenDaysAgo },
                deliveredTo: { $elemMatch: { doctor: doctorId, viewed: false } },
            }).populate("patient").lean(),

            // Recently viewed (last 7 days, viewed by this doctor)
            BotSummary.find({
                type,
                createdAt: { $gte: sevenDaysAgo },
                deliveredTo: { $elemMatch: { doctor: doctorId, viewed: true } },
            }).populate("patient").lean(),

            // History (older than 7 days, regardless of viewed state for this doctor — but must have an entry for them)
            BotSummary.find({
                type,
                createdAt: { $lt: sevenDaysAgo },
                deliveredTo: { $elemMatch: { doctor: doctorId } },
            }).populate("patient").lean(),
        ]);

        return res.json({
            summaries: {
                type: type,
                new: newData,
                recentlyViewed: recentlyViewedData,
                history: historyData,
            }
        });

    } catch (err) {
        console.error("getSummariesForDoctor error", err);
        return res.status(500).json({ message: "Internal Server Error" });
    }
};

export const markSummaryViewed = async (req, res) => {
    try {
        // const doctorId = req.user._id;
        // console.log('markSummaryViewed controller is being called right Now')
        const { summaryId } = req.params; // summary id
        const { viewedStatus = false } = req.body; // if it is an update for changing the viewedStatus then do !viewed, if it is for strictly making it viewed then use false for the query updation
        // const summary = await BotSummary.findOne({ _id: summaryId });
        // if (!summary) return res.status(404).json({ message: "Summary not found" });
        // summary.viewed = !viewedStatus;

        // Toggle to the opposite of the incoming viewedStatus (same as your old logic)
        const nextViewed = !viewedStatus;

        const summary = await BotSummary.findOneAndUpdate(
            // "deliveredTo.doctor must be included in the query so mongodb will know which element inside that array to update(since deliveredTo array contains multiple doctor objects)"
            { _id: summaryId, "deliveredTo.doctor": req.user._id },
            {
                $set: {
                    // This $ means: “Find the element in the deliveredTo array that matched the query and update that one.
                    "deliveredTo.$.viewed": nextViewed,
                    "deliveredTo.$.viewedAt": nextViewed ? new Date() : null,
                },
            },
            {
                new: true,
            }
        ).populate("patient");

        //Loop through summary.deliveredTo. For each entry, check if its doctor id matches current doctor's id. Return that one matching object
        // const summaryStatus = summary.deliveredTo.find(
        //     (entry) => entry.doctor.toString() === req.user._id.toString()
        // );

        if (!summary) {
            return res.status(404).json({ message: "Summary not found" });
        }

        // await summary.save();

        return res.json({ summary: summary });
    } catch (err) {
        console.error("markSummaryViewed error", err);
        return res.status(500).json({ message: "Internal Server Error" });
    }
};
