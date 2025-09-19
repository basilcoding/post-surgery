import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import { requireRole, requireSelfAndRole } from "../middleware/auth.middleware.js";
import {getAllDoctors, getAllPatients, getPatientProfile, getDoctorProfile} from "../controllers/user.controller.js";

const router = express.Router();


// Admin -> fetch all patients
router.get("/doctors", protectRoute, requireRole(["admin"]), getAllDoctors);

// Admin -> fetch all patients
router.get("/patients", protectRoute, requireRole(["admin"]), getAllPatients);

// Patient -> fetch their own profile
router.get("/patients/:id", protectRoute, requireSelfAndRole(["patient"]), getPatientProfile);

// Doctor -> fetch their own profile
router.get("/doctors/:id", protectRoute, requireSelfAndRole(["doctor"]), getDoctorProfile);



export default router;
