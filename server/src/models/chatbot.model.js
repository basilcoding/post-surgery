import mongoose from 'mongoose';

const chatPartSchema = new mongoose.Schema({ // Gemini always has { text } in parts
    text: { 
        type: String, 
        required: true 
    },
}, { _id: false });

const chatMessageSchema = new mongoose.Schema({
    role: {
        type: String,
        enum: ['user', 'model'], // restrict roles
        required: true,
    },
    parts: {
        type: [chatPartSchema],
        required: true,
    },
    timestamp: {
        type: Date,
        default: Date.now, // optional, for ordering/history
    }
}, { _id: false });

const chatbotSchema = new mongoose.Schema({
    userId: {
        type: String,
        required: true,
        index: true,
    },
    history: {
        type: [chatMessageSchema],
        default: [],
    },
    isEmergency: {
        type: Boolean,
        default: false,
    },
    isEnd: {
        type: Boolean,
        default: false
    },
    isEndBot: {
        type: Boolean,
        default: false
    },
    createdAt: {
        type: Date,
        default: Date.now,
        expires: '30m', // auto-delete after 30 min
    }
});

// conversationType: {
//         type: String,
//         default: 'normal',
//         enum: ['normal', 'emergency'],
//     },
const Chatbot = mongoose.model('ChatbotMessages', chatbotSchema);
export default Chatbot;
