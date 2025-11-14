import User from '../models/user.model.js';
import PatientProfile from '../models/patientProfile.model.js'
import DoctorProfile from '../models/doctorProfile.model.js'
import Appointment from '../models/appointment.model.js';

import bcrypt from 'bcryptjs';
import { generateToken } from '../utils/generateToken.util.js';
import cloudinary from '../lib/cloudinary.js';
import fs from 'fs';
import jwt from 'jsonwebtoken';

export const getAppointments = async () => {
    try {
        let appointments;
        if (req.user.role === 'patient') {
            appointments = Appointment.find({ patient: req.user._id })
            if (!appointments) return res.status(404).json({ message: 'No Appointments Found!' })
        } else if (req.user.role === 'patient') {
            appointments = Appointment.find({ doctor: req.user._id })
            if (!appointments) return res.status(404).json({ message: 'No Appointments Found!' })
        }
        return res.status(200).json(appointments);
    } catch (error) {
        console.log('An error occurred in getAppointments Controller!', error);
        return res.status(500).json({ message: 'Internal Server Error!' });
    }
}

export const getDoctorAvailabilityForAppointment = async () => {
    try {
        const doctor = req.query.doctor;
        const date = req.query.date;

        const bookedAppointments = await Appointment.find({
            doctor: doctor,
            appointmentDate: date,
            status: { $in: ['scheduled', 'confirmed'] }
        }).select('slot').lean();
        const doctorWorkingSlotsPerDay = DoctorProfile.findOne({ user: doctor })
            .select('workingSlots').lean();

        const day = date.getDay();
        const doctorWorkingSlotsSpecificDay = doctorWorkingSlotsPerDay.filter((s) => {
            return s.day === day;
        })

        const available = templateSlots.filter(s => !bookedSet.has(s));


    } catch (error) {
        console.log('An error occurred in getAppointments Controller!', error);
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

export const cancelAppointmentById = async () => {
    try {
        let appointment;
        const appointmentId = req.params.id;
        if (req.user.role === 'patient') {
            appointment = Appointment.findOne({ patient: req.user._id, _id: appointmentId })
            if (!appointments) return res.status(404).json({ message: 'No Appointment Found!' });

            appointment.status === 'cancelled';
            appointment.save();
            res.status(204).json({ message: 'Appointment Cancelled Successfully!' })
        }
        // else if (req.user.role === 'patient') {
        //         appointment = Appointment.findOne({ doctor: req.user._id, _id: appointmentId })
        //         if (!appointment) return res.status(404).json({ message: 'No Appointment Found!' })
        //     }
        return res.status(200).json(appointment);
    } catch (error) {
        console.log('An error occurred in cancelAppointmentById Controller!', error);
        return res.status(500).json({ message: 'Internal Server Error!' });
    }
}