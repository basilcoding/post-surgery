import mongoose from "mongoose";

const doctorProfileSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    specialty: {
        type: String,
        enum: ["cardiology", "psychiatry", "general", "other"]
    },
    documents: [
        {
            url: String,
            publicId: String
        }
    ],
    currentRoomId: {
        type: String,
        default: null,
        index: true
    }
});

export default mongoose.model("DoctorProfile", doctorProfileSchema);
