import mongoose from "mongoose";

const clinicAddressSchema = new mongoose.Schema({
    street: { type: String, trim: true },
    city: { type: String, trim: true },
    state: { type: String, trim: true },
    zipCode: { type: String, trim: true },
    country: { type: String, trim: true }
}, { _id: false }); // Prevent Mongoose from creating an _id for the subdocument

const doctorProfileSchema = new mongoose.Schema({
    // --- Authentication & Core References ---
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    // --- Identification & Specialization ---
    doctorId: {
        type: String,
        unique: true,
        trim: true,
        required: true // Can be displayed on a profile card
    },
    specialty: {
        type: String,
        enum: ["cardiology", "psychiatry", "general", "neurology", "orthopedics"],
        trim: true,
        lowercase: true,
        required: true
    },
    licenseNumber: {
        type: String,
    },
    yearsOfExperience: {
        type: Number,
        min: 0,
        default: 0 
    },
    bio: {
        type: String,
        maxlength: 500,
        trim: true 
    },
    currentRoomId: {
        type: String,
        default: null,
    },
    clinicAddress: {
        type: clinicAddressSchema, 
    },
    education: [
        {
            degree: String,
            institution: String,
            graduationYear: Number
        }
    ],
    documents: [
        {
            url: String,
            public_id: String,
            documentType: String // e.g., "License Scan"
        }
    ],
    languages: {
        type: [String],
        default: []
    },
}, { timestamps: true }); // Automatically adds createdAt and updatedAt fields

export default mongoose.model("DoctorProfile", doctorProfileSchema);

// const doctorProfileSchema = new mongoose.Schema({
//     user: {
//         type: mongoose.Schema.Types.ObjectId,
//         ref: "User",
//         required: true
//     },
//     doctorId: {
//         type: String,
//     },
//     specialty: {
//         type: String,
//         enum: ["cardiology", "psychiatry", "general", "other"]
//     },
//     documents: [
//         {
//             url: String,
//             publicId: String
//         }
//     ],
//     currentRoomId: {
//         type: String,
//         default: null,
//         index: true
//     }
// });

// export default mongoose.model("DoctorProfile", doctorProfileSchema);
