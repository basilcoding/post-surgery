import mongoose from "mongoose";

const counterSchema = new mongoose.Schema({
    type: { type: String, required: true, unique: true }, // example, 'patient', 'doctor' and so on...
    seq: { type: Number, default: 0 },
});

export const Counter = mongoose.model("Counter", counterSchema);


// Example ids,
// PAT-2025-0001
// PAT-2025-0002
// DOC-2025-0001
// DOC-2025-0002
