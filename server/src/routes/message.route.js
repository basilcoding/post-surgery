import express from 'express';
import { getMessages, sendMessage} from '../controllers/message.controller.js';
import { protectRoute, protectRoom } from '../middleware/auth.middleware.js';
import multer from 'multer';
const upload = multer({ dest: 'uploads/' }); // store the file in the uploads directory

const router = express.Router();

router.get('/room/:roomId', protectRoute, protectRoom, getMessages);

router.post('/room/:roomId/send', protectRoute, protectRoom, upload.single('image'), sendMessage);

export default router;