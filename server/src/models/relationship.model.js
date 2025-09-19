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
    notes: { type: String, default: "" },
    assignedAt: { type: Date, default: Date.now },
});

const Relationship = mongoose.model("Relationship", relationshipSchema);

export default Relationship;
