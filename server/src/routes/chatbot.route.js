import express from "express";
import { sendMessage, getMessages } from "../controllers/chatbot.controller.js"
import { protectRoute } from "../middleware/auth.middleware.js";

const router = express.Router();

router.get('/message/:id', protectRoute, getMessages);
router.post('/message', protectRoute, sendMessage);

export default router;