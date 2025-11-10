import User from '../models/user.model.js';
import bcrypt from 'bcryptjs';
import cloudinary from '../lib/cloudinary.js';
import fs from 'fs';

import Relationship from "../models/relationship.model.js";
import DoctorProfile from '../models/doctorProfile.model.js';
import PatientProfile from '../models/patientProfile.model.js';
import CareCheckList from '../models/careCheckList.model.js';

export const getAllCareCheckLists = async () => {
    try {
        // Get all carechecklists related to the doctors field only
        if (req.role === 'doctor') {
            const profile = await DoctorProfile.findOne({ user: req.user._id })
            const doctorRelatedCareCheckLists = await CareCheckList.find({ relatedSpecialty: profile.specialty })
            if (!doctorRelatedCareCheckLists) return res.status(404).json({ message: 'No Care Check Lists found!' });

            return res.status(200).json(doctorRelatedCareCheckLists);
        }
    } catch (error) {
        console.log("An Error occured in getAllCareCheckLists controller: ", error);
        res.status(500).json({ message: "Internal Server Error!" })
    }
}



export const getCareCheckListById = async () => {
    try {
        const { id } = req.params;
        if (req.role === 'doctor') {
            // doctor fetching lists starts here <---------------------------------------------

            const profile = await DoctorProfile.findOne({ user: req.user._id });
            const careCheckList = await CareCheckList.findOne({ _id: id, relatedSpecialty: profile.specialty })
            if (!careCheckList) return res.status(404).json({ message: 'No Care Check Lists found!' });

            return res.status(200).json(careCheckList);
            // doctor fetching lists ENDS HERE <---------------------------------------------

        }
    } catch (error) {
        console.log("An Error occured in getAllCareCheckLists controller: ", error);
        res.status(500).json({ message: "Internal Server Error!" })
    }
}



export const updateCareCheckListById = async () => {
    try {
        // Get all carechecklists related to the doctors field only
        const { id } = req.params;
        const updates = req.body;
        if (req.role === 'doctor') {
            // doctor updating lists starts here <---------------------------------------------

            const profile = await DoctorProfile.findOne({ user: req.user._id });
            const careCheckList = await CareCheckList.findOneAndUpdate({
                _id: id, relatedSpecialty: profile.specialty
            }, {
                $set: updates
            }, { new: true })
            if (!careCheckList) return res.status(404).json({ message: 'No Care Check Lists found!' });

            return res.status(200).json(careCheckList);
            // doctor updating lists ENDS HERE <---------------------------------------------

        }
    } catch (error) {
        console.log("An Error occured in getAllCareCheckLists controller: ", error);
        res.status(500).json({ message: "Internal Server Error!" })
    }
}