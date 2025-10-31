import mongoose from 'mongoose';

const imageSchema = new mongoose.Schema({
    profilePic: {
        type: String,
        default: "",
    },
    profilePicId: {
        type: String,
        default: "",
    }
})

const userSchema = new mongoose.Schema(
    {
        email: {
            type: String,
            required: true,
            unique: true
        },
        fullName: {
            type: String,
            required: true
        },
        password: {
            type: String,
            required: true,
            minlength: 6,
        },
        image: [imageSchema],
        role: {
            type: String,
            enum: ["doctor", "patient", "admin"],
            required: true
        },
    },
    { timestamps: true } // Automatically adds createdAt and updatedAt fields
)

const User = mongoose.model('User', userSchema);

export default User;