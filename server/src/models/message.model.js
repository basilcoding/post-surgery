import mongoose from 'mongoose';

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
        image: {
            type: String,
        },
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

