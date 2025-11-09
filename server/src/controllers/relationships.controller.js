import User from '../models/user.model.js';
import Relationship from "../models/relationship.model.js";
import DoctorProfile from '../models/doctorProfile.model.js';
import PatientProfile from '../models/patientProfile.model.js';

export const createRelationship = async (req, res) => {
    try {
        const { doctorId, patientId, notes, surgeryName } = req.body;

        // Validate doctor and patient
        const doctor = await DoctorProfile.findOne({ user: doctorId });
        const patient = await PatientProfile.findOne({ user: patientId });

        if (!doctor) {
            return res.status(400).json({ message: "Invalid doctor ID" });
        }
        if (!patient) {
            return res.status(400).json({ message: "Invalid patient ID" });
        }

        // Prevent duplicate relationship
        const existing = await Relationship.findOne({ doctor: doctorId, patient: patientId });
        if (existing) {
            return res.status(400).json({ message: "This doctor is already assigned to this patient" });
        }

        // Create relationship
        const relationship = new Relationship({
            doctor: doctorId,
            doctorProfile: doctor,
            patient: patientId,
            patientProfile: patient,
            notes,
            surgeryName,
            careType: doctor.specialty
        });

        await relationship.save();

        res.status(201).json({
            message: "Doctor assigned to patient successfully",
            relationship,
        });
    } catch (error) {
        console.error("Error in assignRelationship:", error.message);
        res.status(500).json({ message: "Internal Server Error" });
    }
};

export const getRelationships = async (req, res) => {
    // console.log('getRelationships controller is being triggered!')
    const userId = req.user._id
    const { search = "", role } = req.query; // get search query from frontend

    let relationships;

    if (role === 'patient') {
        relationships = await Relationship.find({ patient: userId })
            .populate({ path: 'doctor' })
            .populate({ path: 'doctorProfile' })
            .lean()
            .limit(25)
    } else if (role === 'doctor') {
        relationships = await Relationship.find({ doctor: userId })
            .populate({ path: 'patient' })
            .populate({ path: 'patientProfile' })
            .lean()
            .limit(25)
    }

    return res.status(200).json({
        relationships
    });
}

// 1) any doctor can get any patients relations.
export const getRelationshipById = async (req, res) => {
    try {
        // console.log('getRelationshipById controller is working...')
        const { id } = req.params;

        if (req.user.role === 'doctor') {

            const relationship = await Relationship.findOne({ _id: id })
                .populate([
                    { path: 'patient', select: 'fullName email' },
                    { path: 'patientProfile' },
                ]).lean();

            // console.log('Found Profile is', relationship);
            res.status(200).json({ relationship });


        } else {
            return;
        }
    } catch (error) {
        console.error("Error in getProfileById controller:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
}

// 1) doctors can only update patient profile related to them
export const updateRelationshipById = async (req, res) => {
    try {
        // console.log('updatePatient controller has been triggered!')
        const { id } = req.params;
        const updates = req.body; // This contains { "activeDoctor": "..." } OR { "name": "..." } OR both!

        if (req.user.role === 'doctor') {
            // Find the patient and update *only* the fields present in 'updates'
            // Dynamically build the $set object
            const fieldsToUpdate = {};
            if (updates.hasOwnProperty('notes')) {
                fieldsToUpdate.notes = updates.notes;
            }
            if (updates.hasOwnProperty('surgeryIdentifier')) {
                fieldsToUpdate.surgeryIdentifier = updates.surgeryIdentifier;
            }
            const updatedRelationship = await Relationship.findOneAndUpdate({
                _id: id,
                doctor: req.user._id,
            },
                {
                    $set: fieldsToUpdate,
                },
                { new: true }
            );
            // console.log('updatedRelationship is', updatedRelationship);
            if (!updatedRelationship) {
                return res.status(404).send({ message: "Patient not found" });
            }
            res.status(200).send(updatedRelationship); // Send back the updated patient
        }
    } catch (err) {
        res.status(500).send({ message: "Error in update relationship controller", error: err });
    }
}
