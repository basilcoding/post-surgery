import User from '../models/user.model.js';
import bcrypt from 'bcryptjs';
import cloudinary from '../lib/cloudinary.js';
import fs from 'fs';
import jwt from 'jsonwebtoken';
import { chatbot } from '../utils/chatbotCore.util.js'

export const sendMessage = async (req, res) => {

    // const { userId, message } = req.body;
    const userId = req.user._id; // from the verified token
    const { message } = req.body; // from the client request body

    // console.log(chats[userId]) // undefined
    const isEnd = /^(?:quit|quite|quitt|quti|qit|qut|quyt|kwit|qiut|qiot|qujt|cuit|q|quuit|kuit|qwit|qu\s?it|qutit|qwiut|\/quit|syut|quik|qutting|kuite|qauit|:q|:wq|wuit|qq|done|send|sent|sen|sends)$/i.test(message.trim());
    chatbot(userId, message, isEnd, req, res);
}