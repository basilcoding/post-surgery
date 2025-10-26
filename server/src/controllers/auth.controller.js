
import User from '../models/user.model.js';
import PatientProfile from '../models/patientProfile.model.js'
import DoctorProfile from '../models/doctorProfile.model.js'

import bcrypt from 'bcryptjs';
import { generateToken } from '../utils/generateToken.util.js';
import cloudinary from '../lib/cloudinary.js';
import fs from 'fs';
import jwt from 'jsonwebtoken';


export const signup = async (req, res) => {
    const { fullName, email, password, adminCode } = req.body;
    // console.log(req.body);
    try {
        // Only the person with the admin code can register which is written in the .env file

        if (!fullName || !email || !password || !adminCode) {
            return res.status(400).json({ message: "All fields are required!" })
        }
        if (password.length < 6) {
            return res.status(400).json({ message: "Password must be at least 6 characters" })
        }

        const user = await User.findOne({ email }) // check if a user aldready exits with the same email
        if (user) {
            return res.status(400).json({ message: "Email aldready exits" })
        }

        const salt = await bcrypt.genSalt(10); // generate salt to be combined with password
        const hashedPassword = await bcrypt.hash(password, salt); // hash the password with the salt
        const isAdmin = await bcrypt.compare(adminCode, process.env.ADMIN_CODE);

        if (!isAdmin) {
            return res.status(400).json({ message: 'Sorry, You are not an Admin!' })
        }

        const newUser = new User({
            fullName,
            email,
            password: hashedPassword,
            role: 'admin',
        })


        if (newUser) {
            // generate JWT token here
            // generateToken(newUser._id, res); // generate token and set it in the cookie (function written in utils.js)
            await newUser.save();

            res.status(201).json({
                _id: newUser._id,
                fullName: newUser.fullName,
                email: newUser.email,
                profilePic: newUser.profilePic,
            });

        } else {// If user is not successfully created
            res.status(400).json({ message: 'Invalid user data' })
        }

    } catch (error) {
        console.log('Error in signup:', error.message);
        res.status(500).json({ message: 'Internal Server Error' })
    }
}
// export const adminRegister = async (req, res) => {
//     try {
//         const { fullName, email, password, role } = req.body;

//         if (!fullName || !email || !password || !role) {
//             return res.status(400).json({ message: "All fields are required!" });
//         }
//         if (!["doctor", "patient"].includes(role)) {
//             return res.status(400).json({ message: "Role must be doctor or patient" });
//         }
//         if (password.length < 6) {
//             return res.status(400).json({ message: "Password must be at least 6 characters" });
//         }

//         const existingUser = await User.findOne({ email });
//         if (existingUser) {
//             return res.status(400).json({ message: "Email already exists" });
//         }

//         const salt = await bcrypt.genSalt(10);
//         const hashedPassword = await bcrypt.hash(password, salt);

//         // Handle profilePic upload if provided
//         let profilePic = "";
//         let profilePicId = "";
//         if (req.file) {
//             const uploadResponse = await cloudinary.uploader.upload(req.file.path, {
//                 folder: "chatout-profile-pics",
//             });
//             profilePic = uploadResponse.secure_url;
//             profilePicId = uploadResponse.public_id;
//             fs.unlinkSync(req.file.path);
//         }

//         const newUser = new User({
//             fullName,
//             email,
//             password: hashedPassword,
//             role,
//             image: [{ profilePic, profilePicId }],
//         });

//         await newUser.save();

//         return res.status(201).json({
//             _id: newUser._id,
//             fullName: newUser.fullName,
//             email: newUser.email,
//             role: newUser.role,
//             profilePic: newUser.image?.[0]?.profilePic || "",
//         });
//     } catch (error) {
//         console.error("Error in adminRegister:", error.message);
//         res.status(500).json({ message: "Internal Server Error" });
//     }
// };


export const login = async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await User.findOne({ email });
        let profile;
        if (!user) return res.status(400).json({ message: "Invalid Credentials!" });

        const isPasswordCorrect = await bcrypt.compare(password, user.password);
        if (!isPasswordCorrect) return res.status(400).json({ message: "Invalid Credentials!" });

        generateToken(user._id, user.role, res);

        res.status(200).json({
            _id: user._id,
            fullName: user.fullName,
            email: user.email,
            role: user.role,
            profilePic: user.image?.[0]?.profilePic || "",
            
        });
    } catch (error) {
        console.log("Error in login:", error.message);
        res.status(500).json({ message: "Internal Server Error" });
    }
};


export const logout = (req, res) => {
    try {
        res.cookie("jwt", "", { maxAge: 0 });
        res.cookie("roomToken")
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

        if (user.image?.[0]?.profilePicId) {
            await cloudinary.uploader.destroy(user.image?.[0]?.profilePicId);
            user.image[0].profilePic = ""; // newly updated
        }

        if (!req.file) {
            return res.status(400).json({ message: "Profile pic is required!" });
        }

        const uploadResponse = await cloudinary.uploader.upload(req.file.path, {
            folder: "chatout-profile-pics",
        });

        if (uploadResponse) {
            user.image[0].profilePic = uploadResponse.secure_url;
            user.image[0].profilePicId = uploadResponse.public_id;
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
            profilePic: req.user.image?.[0]?.profilePic || "",
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
        const otherUser = await User.findOne({
            currentRoomId: roomId,
            _id: { $ne: userId } // Find the user in the same room who is NOT me
        }).select("-password");

        return res.status(200).json({
            activeRoom: true,
            roomId: roomId,
            userId: req.user?._id?.toString?.() || null,
            otherUser: {
                _id: otherUser._id,
                fullName: otherUser.fullName,
                email: otherUser.email,
                role: otherUser.role,
                profilePic: otherUser.image?.[0]?.profilePic || "",
            }
        });

    } catch (error) {
        console.error("Error in session-status route:", error.message);
        res.status(500).json({ message: "Internal Server Error" });
    }
}

export const createRoomToken = async (req, res) => {
    try {
        const id = req.user._id; // userId from the url
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

        // set server-side canonical state
        await User.findByIdAndUpdate(req.user._id, { currentRoomId: roomId });
        await User.findByIdAndUpdate(selectedUser._id, { currentRoomId: roomId });

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
                profilePic: selectedUser.image?.[0]?.profilePic || "",
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
        // clear DB canonical state for all participants
        await User.updateMany(
            { currentRoomId: roomId },
            { $set: { currentRoomId: null } }
        );
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
                profilePic: req.selectedUser.image?.[0]?.profilePic || "",
            }
        });
    } catch (error) {
        console.log("Error in checkRoomAuth controller:", error.message);
        res.status(500).json({ message: "Internal Server Error!" });
    }
};

