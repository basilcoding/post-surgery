// models/patientProfile.model.js
import mongoose from "mongoose";

const commonHistoryOptions = {
    notes: { type: String },
    // ADD THIS FIELD
    status: {
        type: String,
        enum: ["Patient-Reported", "Verified"], // "Patient-Reported" is the default
        default: "Patient-Reported"
    },
    // also track *who* verified it and *when*
    verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    verifiedAt: { type: Date }
};

const conditionSchema = new mongoose.Schema({
    conditionName: { type: String, required: true }, // e.g., "Type 2 Diabetes", "Asthma"
    diagnosisDate: { type: Date },
    notes: { type: String }, // e.g., "Controlled with diet", "Uses inhaler as needed"
    ...commonHistoryOptions
});

// Sub-document for surgeries
const surgerySchema = new mongoose.Schema({
    procedureName: { type: String, required: true }, // e.g., "Appendectomy"
    procedureDate: { type: Date },
    notes: { type: String }, // e.g., "City Hospital, Dr. Smith"
    ...commonHistoryOptions
});

// Sub-document for allergies
const allergySchema = new mongoose.Schema({
    allergen: { type: String, required: true }, // e.g., "Penicillin", "Peanuts"
    reaction: { type: String }, // e.g., "Anaphylaxis", "Rash"
    severity: {
        type: String,
        enum: ["Mild", "Moderate", "Severe"],
        default: "Mild"
    },
    ...commonHistoryOptions
});

// Sub-document for medications
const medicationSchema = new mongoose.Schema({
    medicationName: { type: String, required: true }, // e.g., "Lisinopril"
    dosage: { type: String }, // e.g., "10mg"
    frequency: { type: String }, // e.g., "Once daily"
    reason: { type: String }, // e.g., "For hypertension"
    ...commonHistoryOptions
});

// Sub-document for family history
const familyHistorySchema = new mongoose.Schema({
    relation: { type: String, required: true }, // e.g., "Mother", "Father"
    condition: { type: String, required: true }, // e.g., "Heart Disease", "Breast Cancer"
    ...commonHistoryOptions
});

const patientProfileSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    patientId: {
        type: String,
    },
    
    chronicConditions: [conditionSchema],
    pastSurgeries: [surgerySchema],
    allergies: [allergySchema],
    currentMedications: [medicationSchema],
    familyHistory: [familyHistorySchema],

    activeDoctor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
    },
    currentRoomId: {
        type: String,
        default: null,
        index: true
    }
}, { timestamps: true }); // Added timestamps, which is always a good idea

export default mongoose.model("PatientProfile", patientProfileSchema);