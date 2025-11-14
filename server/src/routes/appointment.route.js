import express from 'express';

import { cancelAppointmentById, createAppointment, getAppointments, getDoctorAvailabilityForAppointment, updateAppointmentById } from '../controllers/appointment.controller.js'

import { protectRoute, requireRole } from '../middleware/auth.middleware.js'

const router = express.Router();

router.get("/", protectRoute, getAppointments); // get appointments for doctor or patient

router.get("/availability", protectRoute, getDoctorAvailabilityForAppointment)

router.post("/", protectRoute, createAppointment);

router.patch("/:id", protectRoute, updateAppointmentById);

router.delete("/:id", protectRoute, cancelAppointmentById);

export default router;