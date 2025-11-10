// models/summary.model.js
import mongoose from "mongoose";

const DeliveredToSchema = new mongoose.Schema({
    doctor: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    doctorProfile: { type: mongoose.Schema.Types.ObjectId, ref: "DoctorProfile" },
    delivered: { type: Boolean, default: false },
    deliveredAt: { type: Date },
    // viewed: { type: Boolean, default: false },
    // viewedAt: { type: Date },
}, { _id: false });

const imageSchema = new mongoose.Schema({
    fileId: {
        type: String,
        default: "",
    },
    cid: {
        type: String,
        default: "",
    },
    url: {
        type: String,
        default: "",
    },
})

const BotSummarySchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    patient: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "PatientProfile",
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
    surgerySiteImages: {
        type: [imageSchema],
        default: [],
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
    assignedDoctorProfile: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "DoctorProfile"
    },
    status: {
        type: String,
        enum: ["New", "UnderReview", "Resolved"],
        index: true,
        default: "New"
    },
    formattedTimestamps: [String],
    resolvedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    },
    resolvedAt: { type: Date },
    revision: { type: Number, default: 0 }, // keep track of how many updates the patient did...
}, { timestamps: true });

// For queries filtering by user and status (e.g., new/recentlyViewed)
BotSummarySchema.index({ user: 1, status: 1 });

//  For queries on deliveredTo.doctor and status
BotSummarySchema.index({ "deliveredTo.doctor": 1, status: 1 });

// For sorting or fetching by user + _id (useful for pagination)
BotSummarySchema.index({ user: 1, _id: 1 });

// BotSummarySchema.index({ "deliveredTo.doctor": 1, patient: 1, type: 1, createdAt: -1 });
// BotSummarySchema.index({ "deliveredTo.doctor": 1, createdAt: -1 });

BotSummarySchema.pre("save", function (next) {
    if (this.isModified("content") || this.isModified("questionsAsked")) {
        this.revision = (this.revision || 0) + 1;
    }
    next();
});

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

