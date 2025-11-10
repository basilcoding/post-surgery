import express from "express";



import { protectRoute, requireRole } from "../middleware/auth.middleware.js";

const router = express.Router();

// fetch for self
router.get("/", protectRoute, getAllCareCheckLists);

router.get("/:id", profileUploadConfig, protectRoute, getCareCheckListById);

router.patch('/:id', protectRoute, requireRole(['doctor', 'admin']), updateCareCheckListById);

// router.get("/:id", protectRoute, getProfileById);

export default router;