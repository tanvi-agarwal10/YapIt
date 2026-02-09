import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import Message from '../models/Message';
import cloudinary from '../utils/cloudinary';
import User from '../models/User';

export const getMessages = async (req: AuthRequest, res: Response) => {
  try {
    const { otherUserId } = req.params;

    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const messages = await Message.find({
      $or: [
        { senderId: req.user.userId, receiverId: otherUserId },
        { senderId: otherUserId, receiverId: req.user.userId },
      ],
    })
      .sort({ createdAt: 1 })
      .populate('senderId', 'username')
      .populate('receiverId', 'username');

    res.json({ messages });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching messages', error });
  }
};

export const sendMessage = async (req: AuthRequest, res: Response) => {
  try {
    const { receiverId, content, attachment } = req.body;

    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    const senderId = req.user.userId;

    if (!receiverId || (!content && !attachment)) {
      return res.status(400).json({ message: 'Receiver ID and content or attachment are required' });
    }

    const receiver = await User.findById(receiverId);
    if (!receiver) {
      return res.status(404).json({ message: 'Receiver not found' });
    }

    if (receiver.privacy?.whoCanMessage === 'nobody') {
      return res.status(403).json({ message: 'This user is not accepting new messages' });
    }

    const senderBlocked = (receiver.blockedUsers || []).some(
      (id) => id.toString() === senderId
    );
    if (senderBlocked) {
      return res.status(403).json({ message: 'You are blocked by this user' });
    }

    const message = new Message({
      senderId,
      receiverId,
      content: content || '',
      attachment,
    });

    await message.save();
    await message.populate('senderId', 'username');
    await message.populate('receiverId', 'username');

    res.status(201).json({ message });
  } catch (error) {
    res.status(500).json({ message: 'Error sending message', error });
  }
};

export const uploadAttachment = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    let attachment: {
      url: string;
      publicId: string;
      type: string;
      format?: string;
      width?: number;
      height?: number;
      bytes?: number;
      name?: string;
    };

    try {
      const result = await new Promise<any>((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          {
            folder: 'yapit',
            resource_type: 'image',
          },
          (error, uploadResult) => {
            if (error) reject(error);
            else resolve(uploadResult);
          }
        );

        stream.end(req.file?.buffer);
      });

      attachment = {
        url: result.secure_url,
        publicId: result.public_id,
        type: result.resource_type,
        format: result.format,
        width: result.width,
        height: result.height,
        bytes: result.bytes,
        name: req.file.originalname,
      };
    } catch (uploadError) {
      // Fallback for local/dev setups where Cloudinary might be misconfigured.
      // This keeps image messaging functional by returning a data URL.
      console.error('Cloudinary upload failed, using data URL fallback:', uploadError);

      attachment = {
        url: `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`,
        publicId: `local-${Date.now()}`,
        type: req.file.mimetype,
        format: req.file.mimetype.split('/')[1],
        bytes: req.file.size,
        name: req.file.originalname,
      };
    }

    res.json({ attachment });
  } catch (error) {
    res.status(500).json({ message: 'Upload failed', error });
  }
};

export const markAsRead = async (req: AuthRequest, res: Response) => {
  try {
    const { messageId } = req.params;

    const message = await Message.findByIdAndUpdate(messageId, { isRead: true }, { new: true });

    res.json({ message });
  } catch (error) {
    res.status(500).json({ message: 'Error marking message as read', error });
  }
};
