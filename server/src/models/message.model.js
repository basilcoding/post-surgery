import mongoose from 'mongoose';

const imageSchema = new mongoose.Schema({
    url: {
        type: String,
        default: "",
    },
    public_id: {
        type: String,
        default: "",
    }
});

const messageSchema = new mongoose.Schema(
    {
        roomId: {
            type: String, // roomId will be generated like "room_12345"
            required: true,
        },
        senderId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        receiverId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        text: {
            type: String,
        },
        image: imageSchema,
        expireAt: {
            type: Date,
            default: () => Date.now() + 24 * 60 * 60 * 1000, // expire in 24h
            index: { expires: 0 }, // TTL index
        },
    },
    { timestamps: true }
);

const Message = mongoose.model('Message', messageSchema);

export default Message;

