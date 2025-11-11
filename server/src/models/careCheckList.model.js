// models/surgeryProtocol.model.js
import mongoose from "mongoose";

// This is a sub-document. It's not a model, just a schema.
const checklistTopicSchema = new mongoose.Schema({
    topicName: {
        type: String,
        required: true
        // e.g., "Pain Management", "Incision Care", "Blood Clot (DVT) Warning Signs"
    },
    items: [{
        type: String,
        required: true
        // e.g., "Is pain controlled?", "Are they taking their prescribed medication?"
    }]
});

const careCheckListSchema = new mongoose.Schema({
    surgeryName: {
        type: String,
        required: true,
    },
    identifier: {
        type: String,
        required: true,
        unique: true,
        index: true
        // e.g., "total-knee-replacement-v1", "appendectomy-v1"
    },
    relatedSpecialty: {
        type: String,
    },
    description: {
        type: String
        // e.g., "Standard post-operative care checklist for TKR patients."
    },
    topics: [checklistTopicSchema] // An array of checklist topics
}, {
    timestamps: true
});

export default mongoose.model("CareCheckList", careCheckListSchema);