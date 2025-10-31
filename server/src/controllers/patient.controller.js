import bcrypt from 'bcryptjs';
import cloudinary from '../lib/cloudinary.js';
import fs from 'fs';

import User from '../models/user.model.js';
import Relationship from "../models/relationship.model.js";
import DoctorProfile from '../models/doctorProfile.model.js';
import PatientProfile from '../models/patientProfile.model.js';

export const updatePatient = async (req, res) => {
    try {
        // console.log('updatePatient controller has been triggered!')
        const { id } = req.params;
        const updates = req.body; // This contains { "activeDoctor": "..." } OR { "name": "..." } OR both!

        // Find the patient and update *only* the fields present in 'updates'
        const updatedPatient = await PatientProfile.findOneAndUpdate({
            user: id
        },
            { $set: updates }, // $set tells MongoDB to only update the fields in the 'updates' object
            { new: true }      // This returns the new, updated document
        );

        if (!updatedPatient) {
            return res.status(404).send({ message: "Patient not found" });
        }

        res.status(200).send({ updates }); // Send back the updated patient

    } catch (err) {
        res.status(500).send({ message: "Error in update patient controller", error: err });
    }
}