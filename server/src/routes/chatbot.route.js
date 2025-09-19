import express from "express";
import { sendMessage } from "../controllers/chatbot.controller.js"
import { protectRoute } from "../middleware/auth.middleware.js";

const router = express.Router();

router.post('/sendMessage', protectRoute, sendMessage);

export default router;