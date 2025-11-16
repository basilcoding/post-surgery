import express from 'express';
import { getMessages, sendMessage} from '../controllers/message.controller.js';
import { protectRoute, protectRoom } from '../middleware/auth.middleware.js';
import multer from 'multer';
import { messageImageUploadConfig } from '../middleware/multer.middleware.js';
// const upload = multer({ dest: 'uploads/' }); // store the file in the uploads directory

const router = express.Router();

router.get('/room/:roomId', protectRoute, protectRoom, getMessages);

router.post('/room/:roomId/send', messageImageUploadConfig, protectRoute, protectRoom, sendMessage);

export default router;