import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import { requireRole, requireSelfOrRole } from "../middleware/auth.middleware.js";
import { createRelationship, getRelationships, getRelationshipById, updateRelationshipById } from "../controllers/relationships.controller.js";

const router = express.Router();

// router.get("/", protectRoute, getMyRelationships);

// create relationship
router.post("/", protectRoute, requireRole(["admin"]), createRelationship);

router.get("/", protectRoute, requireRole(["admin", "doctor", "patient"]), getRelationships);

router.get("/:id", protectRoute, requireRole(["admin", "doctor", "patient"]), getRelationshipById);

router.patch("/:id", protectRoute, requireRole(["admin", "doctor", "patient"]), updateRelationshipById);

// update relationship (admin only)
// router.patch("/", protectRoute, requireRole(["admin"]), updateRelationship);

// doctor/patient listing helpers
// router.get("/patient/:id", protectRoute, requireRoleOrSelf(["admin"]), getRelationshipsByPatient);


export default router;