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
            patient: patientId,
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
            .lean()
            .limit(25)
    } else if (role === 'doctor') {
        relationships = await Relationship.find({ doctor: userId })
            .populate({ path: 'doctor' })
            .lean()
            .limit(25)
    }

    return res.status(200).json({
        relationships
    });
}