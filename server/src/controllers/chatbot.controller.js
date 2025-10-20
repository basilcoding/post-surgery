import User from '../models/user.model.js';
import bcrypt from 'bcryptjs';
import cloudinary from '../lib/cloudinary.js';
import fs from 'fs';
import jwt from 'jsonwebtoken';
import { chatbot } from '../utils/chatbotCore.util.js'
import Chatbot from '../models/chatbot.model.js';

export const sendMessage = async (req, res) => {
    try {
        // const { userId, message } = req.body;
        const userId = req.user._id; // from the verified token
        const { message } = req.body; // from the client request body

        // console.log(chats[userId]) // undefined
        const isEnd = /^(?:quit|quite|quitt|quti|qit|qut|quyt|kwit|qiut|qiot|qujt|cuit|q|quuit|kuit|qwit|qu\s?it|qutit|qwiut|\/quit|syut|quik|qutting|kuite|qauit|:q|:wq|wuit|qq|done|send|sent|sen|sends)$/i.test(message.trim());
        chatbot(userId, message, isEnd, req, res);
    } catch (error) {
        console.log("Chatbot sendMessage in the server had a problem!")
    }
}

export const getMessages = async (req, res) => {
    try {
        const userId = req.user._id;
        const chatbotDoc = await Chatbot.findOne({ userId })
        if (!chatbotDoc) {
            console.log("No chat found for this user");
        }
        
        const formattedMessages = (chatbotDoc.history || []).map((message) => {
            // parts is an array of { text: string } — join them (or pick first) depending on your needs
            return {
                role: message.role,
                message: message.parts[0].text,
            };
        });


        return res.json({ messages: formattedMessages });
    } catch (error) {
        console.log("getMessages in chatbot controller had a problem: ", error)
    }
}