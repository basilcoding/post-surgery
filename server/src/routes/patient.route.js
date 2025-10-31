import express from "express";
import { updatePatient } from "../controllers/patient.controller.js"
import { protectRoute, requireRole, requireSelfAndRole } from "../middleware/auth.middleware.js";
import multer from "multer";
const upload = multer({ dest: "uploads/" });

const router = express.Router();

router.patch('/:id',protectRoute, requireSelfAndRole(['patient']), updatePatient);

export default router;