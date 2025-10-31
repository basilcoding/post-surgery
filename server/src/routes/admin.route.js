import express from "express";
import { registerAdmin } from "../controllers/admin.controller.js"
import { protectRoute, requireRole } from "../middleware/auth.middleware.js";
import multer from "multer";
const upload = multer({ dest: "uploads/" });

const router = express.Router();

// register the admin
router.post('/', registerAdmin);

// router.post('/', upload.single("profilePic"), protectRoute, requireRole(['admin']), adminRegister);

// router.post("/assign-relationship", protectRoute, requireRole(['admin']), assignRelationship);

export default router;