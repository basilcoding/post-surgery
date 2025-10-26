import mongoose from "mongoose";

const relationshipSchema = new mongoose.Schema({
    doctor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    patient: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    surgeryName: {
        type: String,
        default: null
    },
    specialty: {
        type: String,
        enum: ['cardiology', 'general', 'psychiatry'],
        required: true
    },
    active: { type: Boolean, default: true },
    notes: { type: String, default: "" },
    assignedAt: { type: Date, default: Date.now },
});

const Relationship = mongoose.model("Relationship", relationshipSchema);

export default Relationship;
