import express from "express";

import { getAllCareCheckLists, getCareCheckListById, updateCareCheckListById } from "../controllers/careCheckList.controller.js"

import { protectRoute, requireRole } from "../middleware/auth.middleware.js";

const router = express.Router();

// fetch for self
router.get("/", protectRoute, requireRole(['doctor', 'admin']), getAllCareCheckLists);

router.get("/:id", requireRole(['doctor', 'admin']), protectRoute, getCareCheckListById);

router.patch('/:id', protectRoute, requireRole(['doctor', 'admin']), updateCareCheckListById);

// router.get("/:id", protectRoute, getProfileById);

export default router;