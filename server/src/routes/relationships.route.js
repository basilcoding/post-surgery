import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import { requireRole, requireSelfOrRole } from "../middleware/auth.middleware.js";
import { createRelationship, getRelationships } from "../controllers/relationships.controller.js";

const router = express.Router();

// router.get("/", protectRoute, getMyRelationships);

// create relationship
router.post("/", protectRoute, requireRole(["admin"]), createRelationship);

router.get("/:id", protectRoute, requireSelfOrRole(["admin"]), getRelationships);

// update relationship (admin only)
// router.patch("/", protectRoute, requireRole(["admin"]), updateRelationship);

// doctor/patient listing helpers
// router.get("/patient/:id", protectRoute, requireRoleOrSelf(["admin"]), getRelationshipsByPatient);


export default router;