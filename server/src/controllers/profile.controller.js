import User from '../models/user.model.js';
import bcrypt from 'bcryptjs';
import cloudinary from '../lib/cloudinary.js';
import fs from 'fs';

import Relationship from "../models/relationship.model.js";
import DoctorProfile from '../models/doctorProfile.model.js';
import PatientProfile from '../models/patientProfile.model.js';

export const getUserProfileById = async (req, res) => {
    // console.log('getUserById controller is being triggered!')
    try {
        const userId = req.user._id;
        const role = req.user.role;

        let userProfile;
        if (role === 'doctor') {
            userProfile = await DoctorProfile.findOne({ user: userId }).lean()
        } else if (role === 'patient') {
            userProfile = await PatientProfile.findOne({ user: userId }).lean();
        }

        // console.log('profile is: ', profile);

        if (!userProfile) {
            return res.status(200).json({
                userProfile: null,
                activeRoom: false,
                roomId: null,
                otherUser: null,
            });
        }

        let otherUser;
        if (role === 'doctor') {
            // if the role is doctor find the patient who has the same room
            let candidate = await PatientProfile.findOne({ currentRoomId: userProfile.currentRoomId }).populate({ path: "user" })
            if (candidate) {
                otherUser = {
                    _id: candidate.user._id,
                    fullName: candidate.user.fullName,
                    email: candidate.user.email,
                    role: candidate.user.role,
                    profilePic: candidate.user.image?.[0]?.profilePic || "",
                    patientId: candidate.patientId,
                }
            }
            return res.status(200).json({
                userProfile,
                activeRoom: !!userProfile.currentRoomId,
                roomId: userProfile.currentRoomId || null,
                otherUser,
            });
        } else if (role === 'patient') {
            // if the role is patient find the doctor who has the same room
            let candidate = await DoctorProfile.findOne({ currentRoomId: userProfile.currentRoomId }).populate("user")
            // console.log('candidate is: ', candidate)
            if (candidate) {
                otherUser = {
                    _id: candidate.user._id,
                    fullName: candidate.user.fullName,
                    email: candidate.user.email,
                    role: candidate.user.role,
                    profilePic: candidate.user.image?.[0]?.profilePic || "",
                    doctorId: candidate.patientId,
                };
            }
            return res.status(200).json({
                userProfile,
                activeRoom: !!userProfile.currentRoomId,
                roomId: userProfile.currentRoomId || null,
                otherUser,
            });
        }
    } catch (error) {
        console.error("Error in getUserById controller:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
};

export const registerUser = async (req, res) => {
    try {
        console.log('fullname is: ', req.body.fullName)
        const { fullName, email, password, role, specialty } = req.body;

        if (!["doctor", "patient"].includes(role)) {
            return res.status(400).json({ message: "Role must be doctor or patient" });
        }

        if (!fullName || !email || !password) {
            return res.status(400).json({ message: "All the fields must be present!" });
        }

        const existingUser = await User.findOne({ email });
        if (existingUser) return res.status(400).json({ message: "Email already exists" });

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create base User
        const newUser = await User.create({
            fullName,
            email,
            password: hashedPassword,
            role,
        });

        // Create role-specific profile
        if (role === "doctor") {
            if (!specialty) return res.status(400).json({ message: "Doctor specialty required" });
            await DoctorProfile.create({
                user: newUser._id,
                specialty,
            });
        } else if (role === "patient") {
            await PatientProfile.create({
                user: newUser._id,
            });
        }

        return res.status(201).json({
            message: `${role} registered successfully`,
            user: newUser,
        });
    } catch (err) {
        console.error("Error in registerUser:", err);
        res.status(500).json({ message: "Internal Server Error" });
    }
};
