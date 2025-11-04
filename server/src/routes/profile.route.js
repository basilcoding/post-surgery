import express from "express";
import { getUserProfileById } from "../controllers/profile.controller.js"
import { protectRoute, requireRole } from "../middleware/auth.middleware.js";
import multer from "multer";
const upload = multer({ dest: "uploads/" });

const router = express.Router();

// fetch for self
router.get("/me", protectRoute, getUserProfileById);

// fetch by the admin or care team
// router.get("/patients/:id", protectRoute, requireSelfAndRole(["patient"]), getPatientProfile);

// fetch by the admin or care team
// router.get("/doctors/:id", protectRoute, requireSelfAndRole(["doctor"]), getDoctorProfile);

export default router;