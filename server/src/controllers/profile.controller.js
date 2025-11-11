import User from '../models/user.model.js';
import bcrypt from 'bcryptjs';
import cloudinary from '../lib/cloudinary.js';
import fs from 'fs';

import Relationship from "../models/relationship.model.js";
import DoctorProfile from '../models/doctorProfile.model.js';
import PatientProfile from '../models/patientProfile.model.js';

export const getSelfProfile = async (req, res) => {
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
            let candidate;
            if (userProfile.currentRoomId) {
                candidate = await PatientProfile.findOne({
                    currentRoomId: userProfile.currentRoomId,
                }).populate("user");
            }
            if (candidate) {
                otherUser = {
                    _id: candidate.user._id,
                    fullName: candidate.user.fullName,
                    email: candidate.user.email,
                    role: candidate.user.role,
                    profilePic: candidate.user.image?.url || "",
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
            // console.log('req.user is: ', req.user);
            let candidate;
            if (userProfile.currentRoomId) {
                candidate = await DoctorProfile.findOne({
                    currentRoomId: userProfile.currentRoomId,
                }).populate("user");
            }
            if (candidate) {
                otherUser = {
                    _id: candidate.user._id,
                    fullName: candidate.user.fullName,
                    email: candidate.user.email,
                    role: candidate.user.role,
                    profilePic: candidate.user.image.url || "",
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
        console.error("Error in getSelfProfile controller:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
};


// export const getProfileById = async (req, res) => {
//     try {
//         // console.log('getProfileById controller is working...')
//         const { id } = req.params;
//         if (req.user.role === 'doctor') {

//             const userProfile = await PatientProfile.findById(id)
//             .populate([
//                 {path: 'user', select: 'fullName' },
//             ]).lean();
//             console.log('Found Profile is', userProfile)

//             res.status(200).json({ userProfile })


//         } else {
//             return;
//         }
//     } catch (error) {
//         console.error("Error in getProfileById controller:", error);
//         res.status(500).json({ message: "Internal Server Error" });
//     }
// }

// 1) doctors can only update patient profile related to them
// ** future note: doctors can update their own profile with a controller like update self profile, with a route like router.post('/me', protectRoute);
export const updateProfileById = async (req, res) => {
    try {
        // console.log('updatePatient controller has been triggered!')
        const { id } = req.params;
        const updates = req.body; // This contains { "activeDoctor": "..." } OR { "name": "..." } OR both!
        // console.log('updates needed to be done are: ', updates);
        if (req.user.role === 'doctor') {
            // Find the patient and update *only* the fields present in 'updates'
            // Dynamically build the $set object
            const fieldsToUpdate = {};
            if (updates.hasOwnProperty('chronicConditions')) {
                fieldsToUpdate.chronicConditions = updates.chronicConditions;
            }
            if (updates.hasOwnProperty('allergies')) {
                fieldsToUpdate.allergies = updates.allergies;
            }
            if (updates.hasOwnProperty('currentMedications')) {
                fieldsToUpdate.currentMedications = updates.currentMedications;
            }

            // checking if a relationship between doctor and patient is actually there,
            const relationshipCheck = await Relationship.findOne({ doctor: req.user._id, patientProfile: id });
            // if check fails then return
            if (!relationshipCheck) return res.status(404).send({ message: "Doctors can only update profiles of patient's with whom they are related with!" });

            // console.log('patientprofileDbId is: ', id);
            // console.log('doctorid is: ', req.user._id)
            const updatedProfile = await PatientProfile.findOneAndUpdate({
                _id: id,
            },
                {
                    $set: fieldsToUpdate,
                },
                { new: true }
            ).populate([
                { path: 'user', select: 'fullName email' },
            ]);
            // console.log('updatedProfile is', updatedProfile);

            if (!updatedProfile) {
                return res.status(404).send({ message: "Patient not found" });
            }
            res.status(200).send(updatedProfile); // Send back the updated patient
        }
    } catch (err) {
        console.log('Error in update profile controller', err);
        res.status(500).send({ message: "Error in update profile controller", error: err });
    }
}

export const updateSelfProfile = async (req, res) => {
    try {
        // console.log('updateSelfProfile controller has been triggered!')
        const id = req.user._id;
        const updates = req.body;

        const userFieldsToUpdate = {};
        const profileFieldsToUpdate = {};

        // console.log('req.body is: ', req.body);
        // console.log('req.file is: ', req.file);

        if (req.user.role === 'patient') {
            if (req.files && req.files.profilePic.length > 0) {

                const profileFile = req.files.profilePic[0];

                if (req.user?.image?.public_id) {
                    await cloudinary.uploader.destroy(req.user.image.public_id);
                }
                // 1. Convert the buffer from req.file.buffer into a Data URI
                const b64 = Buffer.from(profileFile.buffer).toString('base64');
                let dataURI = "data:" + profileFile.mimetype + ";base64," + b64;

                // 2. Upload the Data URI string to Cloudinary
                const uploadResponse = await cloudinary.uploader.upload(dataURI, {
                    folder: 'SRMS-patient-profile-pics',
                });

                // Add image to the user update $set object
                userFieldsToUpdate.image = {
                    url: uploadResponse.secure_url,
                    public_id: uploadResponse.public_id,
                };

                // --- 2. Parse FormData Text Fields ---

                if (updates.user) {
                    if (updates.user.fullName) userFieldsToUpdate.fullName = updates.user.fullName;
                    if (updates.user.email) userFieldsToUpdate.email = updates.user.email;
                }
                // Profile fields (are JSON strings and must be parsed)
                console.log('this is how udpates.familyHistory looks like: ', updates.familyHistory);
                if (updates.familyHistory) profileFieldsToUpdate.familyHistory = JSON.parse(updates.familyHistory);
                if (updates.allergies) profileFieldsToUpdate.allergies = JSON.parse(updates.allergies);
                if (updates.currentMedications) profileFieldsToUpdate.currentMedications = JSON.parse(updates.currentMedications);
            } else {
                // --- No file is present, so we are in JSON mode ---

                // User fields (are nested in 'user' object)
                if (updates.user) {
                    if (updates.user.fullName) userFieldsToUpdate.fullName = updates.user.fullName;
                    if (updates.user.email) userFieldsToUpdate.email = updates.user.email;
                }

                // Profile fields (are already proper arrays)
                if (updates.familyHistory) profileFieldsToUpdate.familyHistory = updates.familyHistory;
                if (updates.allergies) profileFieldsToUpdate.allergies = updates.allergies;
                if (updates.currentMedications) profileFieldsToUpdate.currentMedications = updates.currentMedications;
            }

            // console.log('patientprofileDbId is: ', id);
            // console.log('doctorid is: ', req.user._id)
            const [updatedSelfProfile, updatedUser] = await Promise.all([
                PatientProfile.findOneAndUpdate(
                    { user: req.user._id },
                    { $set: profileFieldsToUpdate },
                    { new: true, runValidators: true } // runValidators is good practice
                ),
                User.findByIdAndUpdate(
                    req.user._id,
                    { $set: userFieldsToUpdate },
                    { new: true, runValidators: true } // runValidators is good practice
                ).select('-password') // IMPORTANT: Don't send the password hash back
            ]);
            // console.log('updatedProfile is', updatedProfile);

            if (!updatedSelfProfile) {
                return res.status(404).send({ message: "Patient not found" });
            }
            if (!updatedUser) {
                return res.status(404).send({ message: "User info not found" });
            }

            res.status(200).send({
                profile: updatedSelfProfile,
                user: {
                    _id: updatedUser._id,
                    fullName: updatedUser.fullName,
                    email: updatedUser.email,
                    role: updatedUser.role,
                    profilePic: updatedUser?.image?.url || "",
                }
            });
        }
    } catch (err) {
        console.log('Error in update self profile controller', err);
        res.status(500).send({ message: "Error in update self profile controller", error: err });
    }
}

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
