import express from "express";
import { signup, login, logout, updateProfile, checkAuth, createRoomToken, clearRoomToken, checkRoomAuth, checkRoomStatus} from "../controllers/auth.controller.js"
import { protectRoute, protectRoom } from "../middleware/auth.middleware.js";
import multer from "multer";
import { requireRole } from "../middleware/auth.middleware.js";
const upload = multer({ dest: "uploads/" });

const router = express.Router();

// router.post('/admin/register', upload.single("profilePic"), protectRoute, adminRegister)

router.post('/signup', signup);

router.post('/login', login)

router.post('/logout', protectRoute, logout) // no need to protect this route because a user can only invalidate his own token and not others token (unless one user gets some other logged in persons token).

// to update the database, the user must be authenticated using protectRoute
router.put('/update-profile', protectRoute, requireRole(['admin']), upload.single("profilePic"), updateProfile);

router.get('/check', protectRoute, checkAuth);

// This endpoint will check the database for an active room
// No need to do /room-status/:userId because protectRoute will attach req object with .user taken from the token (i.e if a malicious user does not have the token of another user, the malicious user can't get the active session of another user)
router.get('/room-status', protectRoute, checkRoomStatus);

router.post('/create-room-token/:roomId', protectRoute, createRoomToken);

router.post('/clear-room-token/:roomId', protectRoute, protectRoom, clearRoomToken)

router.get('/check-room-auth/:roomId', protectRoute, protectRoom, checkRoomAuth);

export default router;