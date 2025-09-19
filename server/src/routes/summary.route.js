import express from 'express';

import { getSummariesForDoctor, markSummaryViewed } from '../controllers/summary.controller.js'

import { protectRoute, requireRole } from '../middleware/auth.middleware.js'

const router = express.Router();

router.get("/", protectRoute, requireRole(['doctor']), getSummariesForDoctor);

router.patch("/:summaryId", protectRoute, requireRole(['doctor']), markSummaryViewed); // PATCH /api/summaries/:id/view

export default router;