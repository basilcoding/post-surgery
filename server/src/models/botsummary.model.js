// models/summary.model.js
import mongoose from "mongoose";

const DeliveredToSchema = new mongoose.Schema({
    doctor: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    delivered: { type: Boolean, default: false },
    deliveredAt: { type: Date },
    viewed: { type: Boolean, default: false },
    viewedAt: { type: Date },
}, { _id: false });

const BotSummarySchema = new mongoose.Schema({
    patient: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    type: {
        type: String,
        enum: ["emergency", "journal"],
        required: true
    },
    content: {
        type: [String],
        required: true
    },          // bot notes array
    questionsAsked: {
        type: [String],
        default: []
    },
    deliveredTo: {
        type: [DeliveredToSchema],
        default: []
    }, // per-doctor status
    // optional: canonical doctor (assigned doctor) for quick access:
    assignedDoctor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    },
}, { timestamps: true });

BotSummarySchema.index({ patient: 1, createdAt: -1 });
BotSummarySchema.index({ "deliveredTo.doctor": 1, createdAt: -1 });

export default mongoose.model("BotSummary", BotSummarySchema);


// // models/summary.model.js
// import mongoose from "mongoose";

// const BotSummarySchema = new mongoose.Schema(
//     {
//         patient: {
//             type: mongoose.Schema.Types.ObjectId,
//             ref: "User",
//             required: true,
//         },
//         doctor: {
//             type: mongoose.Schema.Types.ObjectId,
//             ref: "User",
//             required: true,
//         }, // doctor this summary is for
//         type: {
//             type: String,
//             enum: ["emergency", "journal"],
//             required: true,
//         },
//         content: {
//             type: [String], // notes array from the bot
//             required: true,
//         },
//         questionsAsked: {
//             type: [String], // follow-up questions
//             default: [],
//         },
//         delivered: {
//             type: Boolean,
//             default: false,
//         }, // true if emitted via socket
//         viewed: {
//             type: Boolean,
//             default: false
//         },
//         viewedBy: [
//             {
//                 type: mongoose.Schema.Types.ObjectId,
//                 ref: "User"
//             }
//         ]

//     },
//     { timestamps: true }
// );

// // index for efficient queries by doctor + createdAt. doctor 1 means it will store the doctors in the order of a-z and it will store each summary of those doctors <newest first to oldest last>
// BotSummarySchema.index({ doctor: 1, createdAt: -1 });

// export default mongoose.model("BotSummary", BotSummarySchema);

