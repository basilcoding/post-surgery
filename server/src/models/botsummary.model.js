// models/summary.model.js
import mongoose from "mongoose";

const BotSummarySchema = new mongoose.Schema(
    {
        patient: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        doctor: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        }, // doctor this summary is for
        type: {
            type: String,
            enum: ["emergency", "journal"],
            required: true,
        },
        content: {
            type: [String], // notes array from the bot
            required: true,
        },
        questionsAsked: {
            type: [String], // follow-up questions
            default: [],
        },
        delivered: {
            type: Boolean,
            default: false,
        }, // true if emitted via socket
        viewed: {
            type: Boolean,
            default: false
        },
        viewedBy: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "User"
            }
        ]

    },
    { timestamps: true }
);

// index for efficient queries by doctor + createdAt. doctor 1 means it will store the doctors in the order of a-z and it will store each summary of those doctors <newest first to oldest last>
BotSummarySchema.index({ doctor: 1, createdAt: -1 });

export default mongoose.model("BotSummary", BotSummarySchema);
