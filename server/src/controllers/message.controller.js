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
        const { text, receiverId } = req.body; // receiverId comes from frontend
        const { roomId } = req.params;
        const senderId = req.user._id;
        console.log('req.files is: ', req?.files);

        const file = (req?.files?.image?.[0]);

        let imageUrl;
        let public_id;
        if (req.files && req.files?.image) {
            if (file && file.buffer) {
                const base64 = file.buffer.toString('base64');
                const dataUri = `data:${file.mimetype};base64,${base64}`;

                const uploadResponse = await cloudinary.uploader.upload(dataUri, {
                    folder: 'srms-chat-images',
                });
                console.log('upload Response is: ', uploadResponse);
                imageUrl = uploadResponse.secure_url;
                public_id = uploadResponse.public_id;
            }
            // fs.unlinkSync(req.file.path);
        }

        const newMessage = new Message({
            senderId,
            receiverId,
            roomId,
            text,
            image: { url: imageUrl, public_id: public_id },
        });

        await newMessage.save();
        // broadcast to the room so both sender + receiver see it
        // console.log("roomId is: ", roomId); //working
        // console.log("sockets in roomId from sendMessage controller are: ", await ioInstance().in(roomId).fetchSockets())
        ioInstance().to(roomId).emit("newMessage", newMessage); // newMessage is an object and not a string

        res.status(201).json(newMessage);
    } catch (err) {
        console.error("Error in sendMessage:", err);
        res.status(500).json({ message: "Internal Server Error" });
    }
};
