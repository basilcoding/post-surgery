import Message from '../models/message.model.js';
import User from '../models/user.model.js';
import cloudinary from '../lib/cloudinary.js';
import fs from 'fs';
import { ioInstance } from '../lib/socket.js';

export const getMessages = async (req, res) => {
    try {
        const { roomId } = req.params;
        const messages = await Message.find({ roomId }).sort({ createdAt: 1 });
        res.status(200).json(messages);
    } catch (err) {
        console.error("Error in getMessages:", err.message);
        res.status(500).json({ message: "Internal Server Error" });
    }
};

export const sendMessage = async (req, res) => {
    try {
        const { text, receiverId } = req.body; // ✅ receiverId comes from frontend
        const { roomId } = req.params;
        const senderId = req.user._id;

        let imageUrl;
        if (req.file) {
            const uploadResponse = await cloudinary.uploader.upload(req.file.path, {
                folder: "chatOut-chat-images",
            });
            imageUrl = uploadResponse.secure_url;
            fs.unlinkSync(req.file.path);
        }

        const newMessage = new Message({
            senderId,
            receiverId,
            roomId,
            text,
            image: imageUrl,
        });

        await newMessage.save();
        // broadcast to the room so both sender + receiver see it
        // console.log("roomId is: ", roomId); //working
        // console.log("sockets in roomId from sendMessage controller are: ", await ioInstance().in(roomId).fetchSockets())
        ioInstance().to(roomId).emit("newMessage", newMessage); // newMessage is an object and not a string

        res.status(201).json(newMessage);
    } catch (err) {
        console.error("Error in sendMessage:", err.message);
        res.status(500).json({ message: "Internal Server Error" });
    }
};
