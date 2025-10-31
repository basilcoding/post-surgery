import User from '../models/user.model.js';
import bcrypt from 'bcryptjs';
import cloudinary from '../lib/cloudinary.js';
import fs from 'fs';

import Relationship from "../models/relationship.model.js";
import DoctorProfile from '../models/doctorProfile.model.js';
import PatientProfile from '../models/patientProfile.model.js';


export const registerAdmin = async (req, res) => {
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

// export const adminRegister = async (req, res) => {
//     try {
//         const { fullName, email, password, role, specialty } = req.body;

//         if (!["doctor", "patient"].includes(role)) {
//             return res.status(400).json({ message: "Role must be doctor or patient" });
//         }

//         if (!fullname || !email || !password || !role) {
//             return res.status(400).json({ message: "All the fields must be present!" });
//         }

//         const existingUser = await User.findOne({ email });
//         if (existingUser) return res.status(400).json({ message: "Email already exists" });

//         // Hash password
//         const hashedPassword = await bcrypt.hash(password, 10);

//         // Create base User
//         const newUser = await User.create({
//             fullName,
//             email,
//             password: hashedPassword,
//             role,
//         });

//         // Create role-specific profile
//         if (role === "doctor") {
//             if (!specialty) return res.status(400).json({ message: "Doctor specialty required" });
//             await DoctorProfile.create({
//                 user: newUser._id,
//                 specialty,
//             });
//         } else if (role === "patient") {
//             await PatientProfile.create({
//                 user: newUser._id,
//             });
//         }

//         return res.status(201).json({
//             message: `${role} registered successfully`,
//             user: newUser,
//         });
//     } catch (err) {
//         console.error("Error in adminRegister:", err);
//         res.status(500).json({ message: "Internal Server Error" });
//     }
// };

// export const assignRelationship = async (req, res) => {
//     try {
//         const { doctorId, patientId, notes, surgeryName } = req.body;

//         // Validate doctor and patient
//         const doctor = await User.findById(doctorId);
//         const patient = await User.findById(patientId);

//         if (!doctor || doctor.role !== "doctor") {
//             return res.status(400).json({ message: "Invalid doctor ID" });
//         }
//         if (!patient || patient.role !== "patient") {
//             return res.status(400).json({ message: "Invalid patient ID" });
//         }

//         // Prevent duplicate relationship
//         const existing = await Relationship.findOne({ doctor: doctorId, patient: patientId });
//         if (existing) {
//             return res.status(400).json({ message: "This doctor is already assigned to this patient" });
//         }

//         // Create relationship
//         const relationship = new Relationship({
//             doctor: doctorId,
//             patient: patientId,
//             notes,
//             surgeryName,
//             specialty: doctor.specialty
//         });

//         await relationship.save();

//         res.status(201).json({
//             message: "Doctor assigned to patient successfully",
//             relationship,
//         });
//     } catch (error) {
//         console.error("Error in assignRelationship:", error.message);
//         res.status(500).json({ message: "Internal Server Error" });
//     }
// };
