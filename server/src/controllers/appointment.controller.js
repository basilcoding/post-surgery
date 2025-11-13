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


export const getAppointmentById = async () => {
    try {
        let appointment;
        const appointmentId = req.params.id;
        if (req.user.role === 'patient') {
            appointment = Appointment.findOne({ patient: req.user._id, _id: appointmentId })
            if (!appointments) return res.status(404).json({ message: 'No Appointment Found!' })
        } else if (req.user.role === 'patient') {
            appointment = Appointment.findOne({ doctor: req.user._id, _id: appointmentId })
            if (!appointment) return res.status(404).json({ message: 'No Appointment Found!' })
        }
        return res.status(200).json(appointment);
    } catch (error) {
        console.log('An error occurred in getAppointmentById Controller!', error);
        return res.status(500).json({ message: 'Internal Server Error!' });
    }
}

export const updateAppointmentById = async () => {
    try {
        let appointment;
        const appointmentId = req.params.id;
        if (req.user.role === 'patient') {
            appointment = Appointment.findOne({ patient: req.user._id, _id: appointmentId })
            if (!appointments) return res.status(404).json({ message: 'No Appointment Found!' })
        } else if (req.user.role === 'patient') {
            appointment = Appointment.findOne({ doctor: req.user._id, _id: appointmentId })
            if (!appointment) return res.status(404).json({ message: 'No Appointment Found!' })
        }
        return res.status(200).json(appointment);
    } catch (error) {
        console.log('An error occurred in updateAppointmentById Controller!', error);
        return res.status(500).json({ message: 'Internal Server Error!' });
    }
}