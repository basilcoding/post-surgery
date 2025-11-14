import User from '../models/user.model.js';
import PatientProfile from '../models/patientProfile.model.js'
import DoctorProfile from '../models/doctorProfile.model.js'
import Appointment from '../models/appointment.model.js';

import bcrypt from 'bcryptjs';
import { generateToken } from '../utils/generateToken.util.js';
import cloudinary from '../lib/cloudinary.js';
import fs from 'fs';
import jwt from 'jsonwebtoken';

export const getAppointments = async (req, res) => {
    try {
        let appointments = [];
        if (req.user.role === 'patient') {
            appointments = await Appointment.find({ patient: req.user._id }).populate([
                { path: 'doctor', select: 'fullName' },
                { path: 'doctorProfile', select: 'specialty doctorId yearsOfExperience clinicAddress' },
            ]).lean();
            if (!appointments) return res.status(404).json({ message: 'No Appointments Found!' })
        } else if (req.user.role === 'doctor') {
            appointments = await Appointment.find({ doctor: req.user._id }).populate([
                { path: 'patient', select: 'fullName image' },
                { path: 'patientProfile', select: 'patientId chronicConditions pastSurgeries allergies currentMedications familyHistory' },
            ]);

            if (!appointments) return res.status(404).json({ message: 'No Appointments Found!' })
        }
        return res.status(200).json(appointments);
    } catch (error) {
        console.log('An error occurred in getAppointments Controller!', error);
        return res.status(500).json({ message: 'Internal Server Error!' });
    }
}

export const createAppointment = async (req, res) => {
    try {
        if (req.user.role === 'patient') {
            // console.log("req.body is: ", req.body);
            const doctor = req.body.doctor;
            const date = req.body.appointmentDate;
            const slot = req.body.slot;
            const patientNotes = req.body.patientNotes || null;

            if (!slot) return res.status(400).json({ message: 'slot is required' });
            if (!date) return res.status(400).json({ message: 'Date query param required (YYYY-MM-DD)' });
            if (!doctor) return res.status(400).json({ message: 'Doctor query param required' });

            // Validate date string -> Date
            const dateObj = new Date(date);
            if (Number.isNaN(dateObj.getTime())) {
                return res.status(400).json({ message: 'invalid date format (use YYYY-MM-DD)' });
            }
            const weekday = dateObj.getDay();

            const bookedAppointments = await Appointment.find({
                doctor: doctor,
                appointmentDate: date,
                status: { $in: ['scheduled', 'confirmed'] }
            }).select('slot').lean();
            const booked = bookedAppointments.map(b => String(b.slot));
            const patientProfile = await PatientProfile.findOne({ user: req.user._id }).select('_id')
            if (!patientProfile) return res.status(404).json({ message: 'Patient profile not found' });
            const doctorProfile = await DoctorProfile.findOne({ user: doctor }).select('workingSlots _id');
            if (!doctorProfile) return res.status(404).json({ message: 'Doctor profile not found' });

            const entriesForDay = (doctorProfile.workingSlots || []).filter((ws) => {
                return (ws.day === weekday || ws.day === null || ws.day === undefined);
            });
            // const templateSlots = entriesForDay.slots.map((s) => s);
            // flatten to an array of "HH:mm" strings (keep arrays only)
            const templateSlots = (entriesForDay || []).flatMap(e => Array.isArray(e.slots) ? e.slots.map(s => String(s)) : []);
            const availableSlots = (templateSlots || []).filter(s => !booked.includes(String(s)));

            if (!availableSlots.includes(slot)) return res.status(400).json({ message: 'This time slot is not available!' });

            const newAppointment = await Appointment.create({
                patient: req.user._id,
                patientProfile: patientProfile._id,
                doctor,
                doctorProfile: doctorProfile._id,
                appointmentDate: date,
                slot: slot,
                status: 'scheduled',
                patientNotes
            })
            if (newAppointment) return res.status(201).json({ message: 'Successfully Created an Appointment!' });
        }
    } catch (error) {
        console.log('An error occurred in createAppointment Controller!', error);
        return res.status(500).json({ message: 'Internal Server Error!' });
    }
}

export const getDoctorAvailabilityForAppointment = async (req, res) => {
    try {
        const doctor = req.query.doctor;
        const date = req.query.date;
        if (!date) return res.status(400).json({ message: 'Date query param required (YYYY-MM-DD)' });
        if (!doctor) return res.status(400).json({ message: 'Doctor query param required' });

        // Validate date string -> Date
        const dateObj = new Date(date);
        if (Number.isNaN(dateObj.getTime())) {
            return res.status(400).json({ message: 'Invalid date format (use YYYY-MM-DD)' });
        }
        const weekday = dateObj.getDay();


        const bookedAppointments = await Appointment.find({
            doctor: doctor,
            appointmentDate: date,
            status: { $in: ['scheduled', 'confirmed'] }
        }).select('slot').lean();

        const booked = bookedAppointments.map(b => String(b.slot));

        const doctorProfile = await DoctorProfile.findOne({ user: doctor })
            .select('workingSlots').lean();
        if (!doctorProfile) return res.status(404).json({ message: 'Doctor profile not found' });


        const entriesForDay = (doctorProfile?.workingSlots || []).filter((ws) => {
            return (ws.day === weekday || ws.day === null || ws.day === undefined);
        });

        // const templateSlots = entriesForDay.slots.map((s) => s);
        // flatten to an array of "HH:mm" strings (keep arrays only)
        const templateSlots = (entriesForDay || []).flatMap(e => Array.isArray(e.slots) ? e.slots.map(s => String(s)) : []);

        const availableSlots = (templateSlots || []).filter(s => !booked.includes(String(s)));

        return res.json({
            availableSlots: availableSlots,
            meta: {
                doctor,
                date,
                // timezone,
                templateCount: templateSlots.length,
                // bookedCount: bookedSet.size,
                availableCount: availableSlots.length
            }
        });

    } catch (error) {
        console.log('An error occurred in getAppgetDoctorAvailabilityForAppointmentointments Controller!', error);
        return res.status(500).json({ message: 'Internal Server Error!' });
    }
}


// export const getAppointmentById = async () => {
//     try {
//         let appointment;
//         const appointmentId = req.params.id;
//         if (req.user.role === 'patient') {
//             appointment = Appointment.findOne({ patient: req.user._id, _id: appointmentId })
//             if (!appointments) return res.status(404).json({ message: 'No Appointment Found!' })
//         } else if (req.user.role === 'patient') {
//             appointment = Appointment.findOne({ doctor: req.user._id, _id: appointmentId })
//             if (!appointment) return res.status(404).json({ message: 'No Appointment Found!' })
//         }
//         return res.status(200).json(appointment);
//     } catch (error) {
//         console.log('An error occurred in getAppointmentById Controller!', error);
//         return res.status(500).json({ message: 'Internal Server Error!' });
//     }
// }

export const updateAppointmentById = async (req, res) => {
    try {
        const appointmentId = req.params.id;
        if (!appointmentId) res.status(400).json({ message: 'Appointment id is required!' })
        console.log('req.body is: ', req.body);
        const updates = req.body;

        if (req.user.role === 'doctor') {
            const appointment = await Appointment.findOneAndUpdate(
                { doctor: req.user._id, _id: appointmentId },
                { $set: updates },
                { new: true }
            ).populate([
                { path: 'patient', select: 'fullName image' },
                { path: 'patientProfile', select: 'patientId chronicConditions pastSurgeries allergies currentMedications familyHistory' },
            ]);

            res.status(200).json({ message: 'Appointment Status Updated Successfully!', appointment });
        }
    } catch (error) {
        console.log('An error occurred in updateAppointmentById Controller!', error);
        return res.status(500).json({ message: 'Internal Server Error!' });
    }
}

export const cancelAppointmentById = async (req, res) => {
    try {
        const appointmentId = req.params.id;
        if (!appointmentId) res.status(400).json({ message: 'Appointment id is required!' })
        // console.log("req.body is: ", refq.body);
        if (req.user.role === 'patient') {
            const cancelReason = req.body?.cancelReason;
            // validate
            if (!cancelReason || String(cancelReason).trim().length === 0) return res.status(400).json({ message: "cancelReason is required" });

            const appointment = await Appointment.findOne({ patient: req.user._id, _id: appointmentId }).populate([
                { path: 'doctor', select: 'fullName' },
                { path: 'doctorProfile', select: 'specialty doctorId yearsOfExperience clinicAddress' },
            ]);

            if (!appointment) return res.status(404).json({ message: 'No Appointment Found for cancellation!' });
            if (appointment.status === "cancelled") return res.status(400).json({ message: "Appointment is already cancelled", appointment });

            appointment.status = 'cancelled';
            appointment.cancelledAt = Date.now();
            appointment.cancelReason = String(cancelReason).trim();
            appointment.save();
            console.log('appointment is: ', appointment);
            res.status(200).json({ message: 'Appointment Cancelled Successfully!', appointment })
        }
        // else if (req.user.role === 'patient') {
        //         appointment = Appointment.findOne({ doctor: req.user._id, _id: appointmentId })
        //         if (!appointment) return res.status(404).json({ message: 'No Appointment Found!' })
        //     }
        // return res.status(200).json(appointment);
    } catch (error) {
        console.log('An error occurred in cancelAppointmentById Controller!', error);
        return res.status(500).json({ message: 'Internal Server Error!' });
    }
}