import User from '../models/user.model.js';
import bcrypt from 'bcryptjs';
import cloudinary from '../lib/cloudinary.js';
import fs from 'fs';

import Relationship from "../models/relationship.model.js";
import DoctorProfile from '../models/doctorProfile.model.js';
import PatientProfile from '../models/patientProfile.model.js';
import CareCheckList from '../models/careCheckList.model.js';

export const getAllCareCheckLists = async (req, res) => {
    try {
        // Get all carechecklists related to the doctors field only
        if (req.user.role === 'doctor') {
            const profile = await DoctorProfile.findOne({ user: req.user._id })
            const doctorRelatedCareCheckLists = await CareCheckList.find({ relatedSpecialty: profile?.specialty })
            if (doctorRelatedCareCheckLists.length === 0) return res.status(404).json({ message: 'No Care Check Lists found!' });

            return res.status(200).json(doctorRelatedCareCheckLists);
        }
    } catch (error) {
        console.log("An Error occured in getAllCareCheckLists controller: ", error);
        res.status(500).json({ message: "Internal Server Error!" })
    }
}

export const createCareCheckList = async (req, res) => {
    try {
        // create carechecklists related to the doctors field only
        console.log('createCareCheckList controller is working!')
        const careCheckListData = req.body;
        if (req.user.role === 'doctor') {
            const profile = await DoctorProfile.findOne({ user: req.user._id })
            careCheckListData.relatedSpecialty = profile.specialty;
            const newCareCheckList = new CareCheckList(careCheckListData);
            await newCareCheckList.save();
            if (!newCareCheckList) return res.status(500).json({ message: 'Could Not create a Care Check List!' });

            return res.status(201).json(newCareCheckList);
        }
    } catch (error) {
        console.log("An Error occured in createCareCheckList controller: ", error);
        res.status(500).json({ message: "Internal Server Error!" })
    }
}



export const getCareCheckListById = async (req, res) => {
    try {
        const { id } = req.params;
        if (req.user.role === 'doctor') {
            // doctor fetching lists starts here <---------------------------------------------

            const profile = await DoctorProfile.findOne({ user: req.user._id });
            const careCheckList = await CareCheckList.findOne({ _id: id, relatedSpecialty: profile.specialty })
            if (!careCheckList) return res.status(404).json({ message: 'No Care Check Lists found!' });

            return res.status(200).json(careCheckList);
            // doctor fetching lists ENDS HERE <---------------------------------------------

        }
    } catch (error) {
        console.log("An Error occured in getCareCheckListById controller: ", error);
        res.status(500).json({ message: "Internal Server Error!" })
    }
}



export const updateCareCheckListById = async (req, res) => {
    try {
        // update all carechecklists related to the doctors field only
        const { id } = req.params;
        const updates = req.body;
        if (req.user.role === 'doctor') {
            // doctor updating lists starts here <---------------------------------------------

            const profile = await DoctorProfile.findOne({ user: req.user._id });
            const careCheckList = await CareCheckList.findOneAndUpdate(
                { _id: id, relatedSpecialty: profile.specialty },
                { $set: updates },
                { new: true })
            if (!careCheckList) return res.status(404).json({ message: 'No Care Check Lists found!' });

            return res.status(200).json(careCheckList);
            // doctor updating lists ENDS HERE <---------------------------------------------

        }
    } catch (error) {
        console.log("An Error occured in updateCareCheckListById controller: ", error);
        res.status(500).json({ message: "Internal Server Error!" })
    }
}


export const deleteCareCheckListById = async (req, res) => {
    try {
        // delete all carechecklists related to the doctors field only
        const { id } = req.params;
        if (req.user.role === 'doctor') {
            // doctor deleting lists starts here <---------------------------------------------

            const profile = await DoctorProfile.findOne({ user: req.user._id });
            const careCheckList = await CareCheckList.findOneAndDelete({ _id: id, relatedSpecialty: profile.specialty })
            if (!careCheckList) return res.status(404).json({ message: 'No Care Check Lists found!' });

            return res.status(200).json({ message: 'Deleted Care Check List Successfully!' });
            // doctor deleting lists ENDS HERE <---------------------------------------------

        }
    } catch (error) {
        console.log("An Error occured in deleteCareCheckListById controller: ", error);
        res.status(500).json({ message: "Internal Server Error!" })
    }
}