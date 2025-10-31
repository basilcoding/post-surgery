import User from '../models/user.model.js';
import bcrypt from 'bcryptjs';
import cloudinary from '../lib/cloudinary.js';
import fs from 'fs';
import jwt from 'jsonwebtoken';
import { chatbot } from '../utils/chatbotUtils/chatbotCore.util.js'

import Chatbot from '../models/chatbot.model.js';
import Relationship from '../models/relationship.model.js';

export const sendMessage = async (req, res) => {
    try {
        // const { userId, message } = req.body;
        const userId = req.user._id; // from the verified token
        const { message, activeDoctor } = req.body; // from the client request body
        // Find the relationship document with current activeDoctor ONLY!
        const relationship = await Relationship.findOne({ patient: userId, doctor: activeDoctor, status: true }).populate(["patient", "doctor"]);

        const isEnd = /^(?:quit|quite|quitt|quti|qit|qut|quyt|kwit|qiut|qiot|qujt|cuit|q|quuit|kuit|qwit|qu\s?it|qutit|qwiut|\/quit|syut|quik|qutting|kuite|qauit|:q|:wq|wuit|qq|done|send|sent|sen|sends)$/i.test(message.trim());

        if (!relationship) {
            res.status(400).json("No relationship found! Please select a valid doctor profile!");
            return;
        }

        // The relationship with the current ACTIVEDOCTOR is given to chatbot
        chatbot(userId, message, isEnd, relationship);

        return res.status(200).json({ message: 'sendMessage Controller called successfully' });

    } catch (error) {
        console.log("Chatbot sendMessage in the server had a problem!")
    }
}

export const getMessages = async (req, res) => {
    try {
        const userId = req.user._id;
        const chatbotDoc = await Chatbot.findOne({ userId })
        if (!chatbotDoc) {
            res.json("No chat found for this user!");
            return;
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