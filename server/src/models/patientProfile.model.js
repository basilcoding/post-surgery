// models/patientProfile.model.js
import mongoose from "mongoose";

// Sub-document for patient documents (bills, consultation notes, lab reports, etc.)
const patientDocumentSchema = new mongoose.Schema(
    {
        // ---- Pinata / storage info (similar to your imageSchema) ----
        fileId: {
            type: String,
            default: "",   // e.g. Pinata upload ID or your own UUID
        },
        cid: {
            type: String,
            default: "",   // IPFS CID
        },
        url: {
            type: String,
            default: "",   // Gateway URL (pinata gateway / ipfs.io / your own)
        },

        // ---- High-level categorization ----
        category: {
            type: String,
            enum: [
                "consultation",      // OPD visit notes, summaries
                "bill",              // hospital / pharmacy / lab bills
                "lab_report",        // blood tests, pathology
                "imaging",           // X-ray, MRI, CT, etc.
                "discharge_summary", // after admission / surgery
                "prescription",
                "other"
            ],
            required: true,
        },

        // ---- Human-friendly labels shown on frontend ----
        title: {
            type: String,
            trim: true,
            // e.g. "Orthopedics Follow-up – 12 Nov 2025"
        },

        // any extra notes by doctor or patient
        notes: { type: String },

        // basic flags you might want for UI
        isImportant: { type: Boolean, default: false },  // allows "pinning" in UI
    },
    { timestamps: true }
);


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
        // enum: ["Mild", "Moderate", "Severe"],
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

    documents: [patientDocumentSchema],

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