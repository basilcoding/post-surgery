import User from '../models/user.model.js';
import Relationship from "../models/relationship.model.js";
import DoctorProfile from '../models/doctorProfile.model.js';
import PatientProfile from '../models/patientProfile.model.js';

import bcrypt from 'bcryptjs';
import cloudinary from '../lib/cloudinary.js';
import pinata from "../lib/pinata.js";
import fs from 'fs';



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

        console.log('req.body is: ', req.body);
        console.log('req.files is: ', req.files);
        // console.log('req.body is: ', req.body);
        // console.log('req.file is: ', req.file);

        if (req.user.role === 'patient') {

            const updates = req.body;
            const deleteImages = req.body.deleteImages;
            const userFieldsToUpdate = {};
            const profileFieldsToUpdate = {};
            let newPatientDocuments = [];

            const hasProfilePic = req.files?.profilePic && req.files?.profilePic?.length > 0;
            const hasDocuments = req.files?.documents && req.files?.documents?.length > 0;

            if (hasProfilePic || hasDocuments) {

                if (req.files && req.files?.profilePic?.length > 0) {
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
                }


                if (deleteImages) {
                    const profile = await PatientProfile.findOne({ user: req.user._id }).select('documents');
                    let urlsToDelete = [];
                    urlsToDelete = deleteImages;
                    // Get all matching images from DB
                    const matchedImages = profile.documents.filter(img =>
                        urlsToDelete.includes(img.url)
                    );

                    // Extract their CIDs for unpinning
                    const fileIdsToDelete = matchedImages.map(img => img.fileId);

                    let unpin;
                    try {
                        // const file = await pinata.groups.public.get({ groupId: process.env.PINATA_GROUP_ID });
                        // console.log('Group details: ', file);
                        unpin = await pinata.files.public.delete(fileIdsToDelete);
                        // console.log(`Unpinned ${JSON.stringify(unpin)}`);
                    } catch (err) {
                        console.warn(`Failed to unpin ${unpin}:`, err.message);
                    }

                    // Remove the matching images from DB
                    if (unpin) {
                        profile.documents = profile.documents.filter(img =>
                            !urlsToDelete.includes(img.url)
                        );
                    }

                    await profile.save();
                }

                if (req.files?.documents?.length > 0) {
                    // Handle new uploads
                    const uploadPromises = req.files.documents.map(async (f) => {
                        // In Node, File may not exist; if you're using web-File via some polyfill, keep this.
                        const file = new File([f.buffer], f.originalname, { type: f.mimetype });

                        const result = await pinata.upload.public
                            .file(file)
                            .group(process.env.PINATA_GROUP_ID);

                        const fileId = result.id;
                        const cid = result.cid || result.IpfsHash;
                        const url = `https://${process.env.PINATA_GATEWAY}/ipfs/${cid}`;

                        return { fileId, cid, url };
                    });

                    const uploadedImages = await Promise.all(uploadPromises);

                    // documentMeta arrives from frontend as JSON string or object array
                    // Each element corresponds to same index as req.files.documents
                    let documentMeta = [];
                    if (updates.documentMeta) {
                        documentMeta = typeof updates.documentMeta === 'string'
                            ? JSON.parse(updates.documentMeta)
                            : updates.documentMeta;
                    }

                    // build patientDocumentSchema objects
                    newPatientDocuments = uploadedImages.map((img, idx) => {
                        const meta = documentMeta[idx] || {};
                        return {
                            fileId: img.fileId,
                            cid: img.cid,
                            url: img.url,
                            category: meta.category || 'other',  // required on schema
                            title: meta.title || '',
                            notes: meta.notes || '',
                            isImportant: !!meta.isImportant,
                        };
                    });
                }

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

                if (deleteImages) {
                    const profile = await PatientProfile.findOne({ user: req.user._id }).select('documents');
                    let urlsToDelete = [];
                    urlsToDelete = deleteImages;
                    // Get all matching images from DB
                    const matchedImages = profile.documents.filter(img =>
                        urlsToDelete.includes(img.url)
                    );

                    // Extract their CIDs for unpinning
                    const fileIdsToDelete = matchedImages.map(img => img.fileId);

                    let unpin;
                    try {
                        // const file = await pinata.groups.public.get({ groupId: process.env.PINATA_GROUP_ID });
                        // console.log('Group details: ', file);
                        unpin = await pinata.files.public.delete(fileIdsToDelete);
                        // console.log(`Unpinned ${JSON.stringify(unpin)}`);
                    } catch (err) {
                        console.warn(`Failed to unpin ${unpin}:`, err.message);
                    }

                    // Remove the matching images from DB
                    if (unpin) {
                        profile.documents = profile.documents.filter(img =>
                            !urlsToDelete.includes(img.url)
                        );
                    }

                    await profile.save();
                }

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

            // Build update object
            const profileUpdate = { $set: profileFieldsToUpdate };

            if (newPatientDocuments.length > 0) {
                profileUpdate.$push = {
                    documents: { $each: newPatientDocuments }
                };
            }

            const [updatedSelfProfile, updatedUser] = await Promise.all([
                PatientProfile.findOneAndUpdate(
                    { user: req.user._id },
                    profileUpdate,
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


        // If patient branch already exists above, keep it. Below: doctor branch.
        else if (req.user.role === 'doctor') {

            const documentsToUpdate = {};
            const userFieldsToUpdate = {};
            const profileFieldsToUpdate = {};
            let updates = typeof req.body.jsonData === 'string' ? JSON.parse(req.body.jsonData) : req.body.jsonData;
            const deleteImages = updates.deleteImages;

            const hasProfilePic = req.files && Array.isArray(req.files.profilePic) && req.files.profilePic.length > 0;
            const hasDocuments = req.files && Array.isArray(req.files.documents) && req.files.documents.length > 0;
            // const doctorProfile = await DoctorProfile.findOne({ user: req.user._id });
            // Helper: convert buffer -> data URI
            function bufferToDataURI(buffer, mimetype) {
                const b64 = buffer.toString('base64');
                return `data:${mimetype};base64,${b64}`;
            }

            if (hasProfilePic || hasDocuments || updates) {
                if (hasProfilePic) {
                    const profileFile = req.files.profilePic[0];

                    if (req.user?.image?.public_id) {
                        try {
                            await cloudinary.uploader.destroy(req.user.image.public_id);
                        } catch (error) {
                            console.log('Error deleting profile picture: ', error);
                        }
                    }
                    const dataURI = bufferToDataURI(profileFile.buffer, profileFile.mimetype);
                    const uploadResponse = await cloudinary.uploader.upload(dataURI, {
                        folder: 'SRMS-doctor-profile-pics',
                    });
                    // Add image to the user update $set object
                    userFieldsToUpdate.image = {
                        url: uploadResponse.secure_url,
                        public_id: uploadResponse.public_id,
                    };
                }

                // DOCUMENTS: convert each buffer -> dataURI and upload
                if (hasDocuments || deleteImages && Array.isArray(deleteImages) && deleteImages.length > 0) {
                    let uploadedDocs = [];
                    if (hasDocuments) {
                        const uploadPromises = req.files?.documents?.map(async (f) => {
                            const dataURI = bufferToDataURI(f.buffer, f.mimetype);
                            const res = await cloudinary.uploader.upload(dataURI, {
                                folder: 'SRMS-doctor-documents',
                            });
                            return {
                                url: res.secure_url,
                                public_id: res.public_id,
                                documentType: f.fieldname || 'document'
                            };
                        });
                        uploadedDocs = await Promise.all(uploadPromises);
                    }

                    let deletedPublicIds = [];
                    if (deleteImages && Array.isArray(deleteImages) && deleteImages.length > 0) {
                        const destroyPromises = deleteImages.map(async (public_id) => {
                            await cloudinary.uploader.destroy(public_id);
                            deletedPublicIds.push(public_id);
                        });
                        await Promise.all(destroyPromises);
                    }

                    // make sure doctorProfile is loaded earlier:
                    const doctorProfile = await DoctorProfile.findOne({ user: req.user._id });
                    if (!doctorProfile) return res.status(404).send({ message: 'Doctor profile not found' });
                    const existingDocs = Array.isArray(doctorProfile.documents) ? doctorProfile.documents : [];
                    const remaining = existingDocs.filter(d => !deletedPublicIds.includes(d.public_id));

                    // final documents array = remaining + newly uploaded
                    const finalDocuments = remaining.concat(uploadedDocs || []);
                    profileFieldsToUpdate.documents = finalDocuments;

                    // Use $push to append documents atomically in DB (avoid local mutation + save race)
                    // if (!documentsToUpdate.$push) documentsToUpdate.$push = {};
                    // documentsToUpdate.$push.documents = { $each: uploadedDocs };
                }

                // Parse text fields present in multipart/form-data (they are strings)
                if (updates?.user) {
                    if (updates.user.fullName) userFieldsToUpdate.fullName = updates.user.fullName;
                    if (updates.user.email) userFieldsToUpdate.email = updates.user.email;
                }
                if (updates?.doctorId) profileFieldsToUpdate.doctorId = updates.doctorId; // treat as string
                if (updates?.specialty) profileFieldsToUpdate.specialty = updates.specialty;
                // if (updates?.licenseNumber) profileFieldsToUpdate.licenseNumber = updates.licenseNumber;
                if (updates?.yearsOfExperience) profileFieldsToUpdate.yearsOfExperience = Number(updates.yearsOfExperience);
                // if (updates?.languages) profileFieldsToUpdate.languages = updates.languages;
                // if (updates?.education.length > 0) profileFieldsToUpdate.education = updates.education;
                // if (updates?.clinicAddress)  profileFieldsToUpdate.clinicAddress = updates.clinicAddress; 
                if (updates?.bio) profileFieldsToUpdate.bio = updates.bio;
                if (updates.workingSlots) profileFieldsToUpdate.workingSlots = updates.workingSlots;

            }



            const updateDoc = {};
            if (Object.keys(profileFieldsToUpdate).length > 0) {
                updateDoc.$set = profileFieldsToUpdate; // if profileFieldsToUpdate is empty, so we don't want to do set values to null in the db
            }
            // copy $push/$pull through
            if (documentsToUpdate.$push) updateDoc.$push = documentsToUpdate.$push;
            if (documentsToUpdate.$pull) updateDoc.$pull = documentsToUpdate.$pull;
            // console.log('patientprofileDbId is: ', id);
            // console.log('doctorid is: ', req.user._id)
            const [updatedSelfProfile, updatedUser] = await Promise.all([
                DoctorProfile.findOneAndUpdate(
                    { user: req.user._id },
                    updateDoc,
                    { new: true, runValidators: true } // runValidators is good practice
                ),
                User.findByIdAndUpdate(
                    req.user._id,
                    { $set: userFieldsToUpdate },
                    { new: true, runValidators: true } // runValidators is good practice
                ).select('-password') // IMPORTANT: Don't send the password hash back
            ]);
            // console.log('updatedProfile is', updatedProfile);

            if (!updatedSelfProfile) return res.status(404).send({ message: 'Doctor profile not found' });
            if (!updatedUser) return res.status(404).send({ message: 'User info not found' });

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
