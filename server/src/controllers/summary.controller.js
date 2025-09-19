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
        const [newData, recentlyViewedData, historyData] = await Promise.all([
            BotSummary.find({ doctor: doctorId, type: type, viewed: false, createdAt: { $gte: sevenDaysAgo } }).lean().populate("patient"),
            BotSummary.find({ doctor: doctorId, type: type, viewed: true, createdAt: { $gte: sevenDaysAgo } }).lean().populate("patient"),
            BotSummary.find({ doctor: doctorId, type: type, createdAt: { $lt: sevenDaysAgo } }).lean().populate("patient")
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
        const { viewedStatus = false, viewedBy } = req.body; // if it is an update for changing the viewedStatus then do !viewed, if it is for strictly making it viewed then use false for the query updation
        const summary = await BotSummary.findOne({ _id: summaryId });
        if (!summary) return res.status(404).json({ message: "Summary not found" });

        summary.viewed = !viewedStatus;

        // only push viewedby in if not already in the array viewedBy(in the db)
        if (!summary.viewedBy.some(id => id.toString() === viewedBy)) {
            summary.viewedBy.push(viewedBy);
        }
        await summary.save();

        return res.json({ summary: summary });
    } catch (err) {
        console.error("markSummaryViewed error", err);
        return res.status(500).json({ message: "Internal Server Error" });
    }
};
