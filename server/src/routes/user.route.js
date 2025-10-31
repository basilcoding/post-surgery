import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import { requireRole, requireSelfAndRole } from "../middleware/auth.middleware.js";
import { getAllUsers, getUserById, registerUser } from "../controllers/user.controller.js";
import multer from "multer";
const upload = multer({ dest: "uploads/" });

const router = express.Router();

router.get("/", protectRoute, requireRole(["admin"]), getAllUsers);

router.post('/', upload.single("profilePic"), protectRoute, requireRole(['admin']), registerUser);

router.get("/:id", protectRoute, requireSelfAndRole(["patient", "doctor"]), getUserById);

// Patient -> fetch their own profile
// router.get("/patients/:id", protectRoute, requireSelfAndRole(["patient"]), getPatientProfile);

// Doctor -> fetch their own profile
// router.get("/doctors/:id", protectRoute, requireSelfAndRole(["doctor"]), getDoctorProfile);



export default router;
