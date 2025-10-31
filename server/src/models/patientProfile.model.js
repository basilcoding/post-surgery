// models/patientProfile.model.js
import mongoose from "mongoose";

const patientProfileSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    primaryRequiredSpecialty: {
        type: String,
        enum: ["cardiology", "psychiatry", "general", "other"]
    },
    medicalHistory: [
        {
            title: String,
            details: String,
            date: Date
        }
    ],
    activeDoctor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
    },
    currentRoomId: {
        type: String,
        default: null,
        index: true
    }
});

export default mongoose.model("PatientProfile", patientProfileSchema);
