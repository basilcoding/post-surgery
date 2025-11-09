
import User from '../models/user.model.js';
import PatientProfile from '../models/patientProfile.model.js'
import DoctorProfile from '../models/doctorProfile.model.js'

import bcrypt from 'bcryptjs';
import { generateToken } from '../utils/generateToken.util.js';
import cloudinary from '../lib/cloudinary.js';
import fs from 'fs';
import jwt from 'jsonwebtoken';

export const login = async (req, res) => {
    const { email, doctorId, patientId, password } = req.body;
    try {
        let profile; let user;
        if (patientId) {
            profile = await PatientProfile.findOne({ patientId }).populate('user');
            if (!profile || !profile.user) {
                return res.status(401).json({ message: "Invalid Credentials!" });
            }
        } else if (doctorId) {
            profile = await DoctorProfile.findOne({ doctorId }).populate('user');
            if (!profile || !profile.user) {
                return res.status(401).json({ message: "Invalid Credentials!" });
            }
        } else {
            user = await User.findOne({ email });
            if (!user) {
                return res.status(401).json({ message: "Invalid Credentials!" });
            }
        }


        if (profile) {
            const isPasswordCorrect = await bcrypt.compare(password, profile.user.password);
            if (!isPasswordCorrect) return res.status(400).json({ message: "Invalid Credentials!" });

            generateToken(profile.user._id, profile.user.role, profile.user.email, res);

            res.status(200).json({
                _id: profile.user._id,
                fullName: profile.user.fullName,
                email: profile.user.email,
                role: profile.user.role,
                profilePic: profile.user.image?.url || "",

            });
        } else {
            const isPasswordCorrect = await bcrypt.compare(password, user.password);
            if (!isPasswordCorrect) return res.status(400).json({ message: "Invalid Credentials!" });

            generateToken(user._id, user.role, user.email, res);

            res.status(200).json({
                _id: user._id,
                fullName: user.fullName,
                email: user.email,
                role: user.role,
                profilePic: user.image?.url || "",

            });
        }

    } catch (error) {
        console.log("Error in login:", error.message);
        res.status(500).json({ message: "Internal Server Error" });
    }
};


export const logout = (req, res) => {
    try {
        res.cookie("jwt", "", { maxAge: 0 });
        const token = req.cookies.roomToken; // read from cookies
        if (token) {
            res.cookie('roomToken', "", { maxAge: 0 });
        }
        res.status(200).json({ message: "Logged Out Successfully!" });
    } catch (error) {
        console.log("Error in logout:", error.message);
        res.status(500).json({ message: "Internal Server Error" });
    }
};


export const updateProfile = async (req, res) => {
    try {
        const userId = req.user._id;
        const user = await User.findById(userId).select("-password");

        if (user.image?.url) {
            await cloudinary.uploader.destroy(user.image?.url);
            user.image.url = ""; // newly updated
        }

        if (!req.file) {
            return res.status(400).json({ message: "Profile pic is required!" });
        }

        const uploadResponse = await cloudinary.uploader.upload(req.file.path, {
            folder: "chatout-profile-pics",
        });

        if (uploadResponse) {
            user.image.url = uploadResponse.secure_url;
            user.image.public_id = uploadResponse.public_id;
            await user.save();
        }
        fs.unlinkSync(req.file.path);
        res.status(200).json(user);
    } catch (error) {
        console.log("Error in updateProfile:", error.message);
        res.status(500).json({ message: "Internal Server Error!" });
    }
};


export const checkAuth = (req, res) => {
    try {
        res.status(200).json({
            _id: req.user._id,
            fullName: req.user.fullName,
            email: req.user.email,
            role: req.user.role,
            profilePic: req.user.image?.url || "",
        });
    } catch (error) {
        console.log("Error in checkAuth:", error.message);
        res.status(500).json({ message: "Internal Server Error!" });
    }
};

export const checkRoomStatus = async (req, res) => {
    try {
        const userId = req.user._id;
        const roomId = req.user.currentRoomId;

        if (!roomId) {
            // It's normal for a user to have no active room.
            return res.status(200).json({ activeRoom: false });
        }

        // If they have a room, find the other participant to send their info back
        let otherUser;
        if (req.user.role === 'doctor') {
            otherUser = await PatientProfile.findOne({
                currentRoomId: roomId,
                user: { $ne: userId } // Find the user in the same room who is NOT me
            }).populate('user').select("-user.password");

            if (!otherUser) {
                return;
            }

            return res.status(200).json({
                activeRoom: true,
                roomId: roomId,
                userId: req.user?._id?.toString?.() || null,
                otherUser: {
                    _id: otherUser.user._id,
                    fullName: otherUser.user.fullName,
                    email: otherUser.user.email,
                    role: otherUser.user.role,
                    profilePic: otherUser.user.image?.url|| "",
                    doctorId: otherUser.doctorId,
                }
            });
        } else {
            otherUser = await DoctorProfile.findOne({
                currentRoomId: roomId,
                user: { $ne: userId } // Find the user in the same room who is NOT me
            }).populate('user').select("-user.password");

            if (!otherUser) {
                return;
            }

            return res.status(200).json({
                activeRoom: true,
                roomId: roomId,
                userId: req.user?._id?.toString?.() || null,
                otherUser: {
                    _id: otherUser.user._id,
                    fullName: otherUser.user.fullName,
                    email: otherUser.user.email,
                    role: otherUser.user.role,
                    profilePic: otherUser.user.image?.url|| "",
                    patientId: otherUser.patientId,
                }
            });
        }


    } catch (error) {
        console.error("Error in session-status route:", error.message);
        res.status(500).json({ message: "Internal Server Error" });
    }
}

export const createRoomToken = async (req, res) => {
    try {
        const id = req.user._id.toString(); // userId from the url
        const { roomId } = req.params;
        const { selectedUser } = req.body; // frontend generates or gets roomId
        if (!roomId) {
            return res.status(400).json({ message: "Room ID is required!" });
        }
        // sign a room-specific token
        const roomToken = jwt.sign({ roomId, userId: id, selectedUser: selectedUser }, process.env.JWT_SECRET, {
            expiresIn: "1h", // token valid for 1 hour
        });
        // return token to client

        if (req.user.role === 'doctor') {
            await Promise.all([
                DoctorProfile.findOneAndUpdate({ user: id }, { currentRoomId: roomId }),
                PatientProfile.findOneAndUpdate({ user: selectedUser._id }, { currentRoomId: roomId })
            ])
        } else {
            await Promise.all([
                PatientProfile.findOneAndUpdate({ user: id }, { currentRoomId: roomId }),
                DoctorProfile.findOneAndUpdate({ user: selectedUser._id }, { currentRoomId: roomId })
            ])
        }

        // set server-side canonical state
        // await User.findByIdAndUpdate(req.user._id, { currentRoomId: roomId });
        // await User.findByIdAndUpdate(selectedUser._id, { currentRoomId: roomId });

        res.cookie('roomToken', roomToken, {
            maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
            httpOnly: true, // prevent XSS attacks cross-site scripting attacks (http cookie)
            sameSite: 'strict', // CSRF attacks cross-site request forgery attacks
            secure: process.env.NODE_ENV === 'production'
        })

        return res.status(200).json({
            roomId: roomId,
            userId: id,
            selectedUser: {
                _id: selectedUser._id.toString(),
                fullName: selectedUser.fullName,
                email: selectedUser.email,
                role: selectedUser.role,
                profilePic: selectedUser.image?.url || "",
            },
        })
    } catch (err) {
        console.error("Error in createRoomToken:", err.message);
        res.status(500).json({ message: "Internal Server Error" });
    }
};

export const clearRoomToken = async (req, res) => {
    try {
        const { roomId } = req.params;
        res.cookie("roomToken", "", { maxAge: 0 });

        await Promise.all([
            DoctorProfile.updateMany(
                { currentRoomId: roomId },
                { $set: { currentRoomId: null } }
            ),
            PatientProfile.updateMany(
                { currentRoomId: roomId },
                { $set: { currentRoomId: null } }
            ),
        ])

        // await User.updateMany(
        //     { currentRoomId: roomId },
        //     { $set: { currentRoomId: null } }
        // );
        res.status(200).json({ message: "Conversation has Ended." });
    } catch (error) {
        console.log("Error in clearRoomToken:", error.message);
        res.status(500).json({ message: "Internal Server Error" });
    }
};

export const checkRoomAuth = (req, res) => {
    try {
        return res.status(200).json({
            roomId: req.roomId,
            userId: req.user?._id?.toString?.() || null,
            selectedUser: {
                _id: req.selectedUser._id,
                fullName: req.selectedUser.fullName,
                email: req.selectedUser.email,
                role: req.selectedUser.role,
                profilePic: req.selectedUser.image?.url || "",
            }
        });
    } catch (error) {
        console.log("Error in checkRoomAuth controller:", error.message);
        res.status(500).json({ message: "Internal Server Error!" });
    }
};

