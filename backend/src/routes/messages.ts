import express, { Router } from 'express';
import { getMessages, sendMessage, markAsRead, uploadAttachment } from '../controllers/messageController';
import upload from '../middleware/upload';

const router: Router = express.Router();

router.get('/:otherUserId', getMessages);
router.post('/send', sendMessage);
router.post('/upload', upload.single('file'), uploadAttachment);
router.put('/:messageId/read', markAsRead);

export default router;
