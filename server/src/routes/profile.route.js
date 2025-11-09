import express from "express";
import { getSelfProfile, updateProfileById, updateSelfProfile } from "../controllers/profile.controller.js"
import { protectRoute, requireRole } from "../middleware/auth.middleware.js";

import upload from "../middleware/multer.middleware.js";
import multer from "multer";

const router = express.Router();

// fetch for self
router.get("/me", protectRoute, getSelfProfile);

router.patch("/me", upload.single("profilePic"), protectRoute, updateSelfProfile);

router.patch('/:id', protectRoute, requireRole(['doctor']), updateProfileById);

// router.get("/:id", protectRoute, getProfileById);

export default router;