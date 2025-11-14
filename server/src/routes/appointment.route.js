import express from 'express';

import { getAppointments } from '../controllers/appointment.controller.js'

import { protectRoute, requireRole } from '../middleware/auth.middleware.js'

const router = express.Router();

router.get("/", protectRoute, getAppointments); // get appointments for doctor or patient



export default router;