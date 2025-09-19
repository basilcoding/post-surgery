import express from "express";
import { adminRegister, assignRelationship } from "../controllers/admin.controller.js"
import { protectRoute, requireRole } from "../middleware/auth.middleware.js";
import multer from "multer";
const upload = multer({ dest: "uploads/" });

const router = express.Router();

router.post('/register', upload.single("profilePic"), protectRoute, requireRole(['admin']), adminRegister);

router.post("/assign-relationship", protectRoute, requireRole(['admin']), assignRelationship);

export default router;