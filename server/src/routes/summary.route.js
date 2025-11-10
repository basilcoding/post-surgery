import express from 'express';

import { getSummaries, updateSummaryById, getSummariesById } from '../controllers/summary.controller.js'

import { protectRoute, requireRole } from '../middleware/auth.middleware.js'
import { surgerySiteImagesUploadConfig } from "../middleware/multer.middleware.js"

const router = express.Router();

router.get("/", protectRoute, requireRole(['doctor', 'patient']), getSummaries);

router.get("/:id", protectRoute, requireRole(['doctor', 'patient']), getSummariesById);

router.patch("/:id", surgerySiteImagesUploadConfig, protectRoute, requireRole(['doctor', 'patient']), updateSummaryById); // PATCH /api/summaries/:id/view

export default router;