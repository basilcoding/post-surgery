import express from "express";

import { getAllCareCheckLists, getCareCheckListById, updateCareCheckListById, createCareCheckList, deleteCareCheckListById } from "../controllers/careCheckList.controller.js"

import { protectRoute, requireRole } from "../middleware/auth.middleware.js";

const router = express.Router();

// fetch for self
router.get("/", protectRoute, requireRole(['doctor', 'admin']), getAllCareCheckLists);

router.get("/:id", protectRoute, requireRole(['doctor', 'admin']), getCareCheckListById);

router.post("/", protectRoute, requireRole(['doctor', 'admin']), createCareCheckList);

router.patch("/:id", protectRoute, requireRole(['doctor', 'admin']), updateCareCheckListById);

router.delete("/:id", protectRoute, requireRole(['doctor', 'admin']), deleteCareCheckListById);

// router.get("/:id", protectRoute, getProfileById);

export default router;