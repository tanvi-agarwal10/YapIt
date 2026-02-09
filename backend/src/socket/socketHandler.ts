import { Server, Socket } from 'socket.io';
import User from '../models/User';
import Message from '../models/Message';

interface UserSocket {
  userId: string;
  socketId: string;
}

const userSockets: Map<string, UserSocket> = new Map();

export const setupSocketIO = (io: Server) => {
  io.on('connection', async (socket: Socket) => {
    console.log(`✓ User connected: ${socket.id}`);

    // User login event
    socket.on('user:login', async (userId: string) => {
      userSockets.set(userId, { userId, socketId: socket.id });

      // Mark user as online in database
      await User.findByIdAndUpdate(userId, {
        isOnline: true,
        lastSeen: new Date(),
      });

      // Broadcast user online status
      io.emit('user:online', { userId, isOnline: true });
      console.log(`✓ User ${userId} is online`);
    });

    // Send message event
    socket.on('message:send', async (data: any) => {
      const { senderId, receiverId, content, attachment } = data;

      try {
        if (!receiverId || (!content && !attachment)) {
          socket.emit('message:error', { error: 'Receiver and content or attachment required' });
          return;
        }

        // Save message to database
        const message = new Message({
          senderId,
          receiverId,
          content: content || '',
          attachment,
        });
        await message.save();

        // Send to receiver if online
        const receiverSocket = userSockets.get(receiverId);
        if (receiverSocket) {
          io.to(receiverSocket.socketId).emit('message:receive', {
            id: message._id,
            senderId,
            receiverId,
            content,
            attachment,
            timestamp: message.createdAt,
          });
        }

        // Acknowledge to sender
        socket.emit('message:sent', {
          id: message._id,
          senderId,
          receiverId,
          content,
          attachment,
          timestamp: message.createdAt,
          status: 'delivered',
        });
      } catch (error) {
        socket.emit('message:error', { error: 'Failed to send message' });
      }
    });

    // Typing indicator
    socket.on('user:typing', (data: any) => {
      const { receiverId, senderName, senderId } = data;
      const receiverSocket = userSockets.get(receiverId);
      if (receiverSocket) {
        io.to(receiverSocket.socketId).emit('user:typing', { senderName, senderId });
      }
    });

    socket.on('user:stopTyping', (data: any) => {
      const { receiverId, senderId } = data;
      const receiverSocket = userSockets.get(receiverId);
      if (receiverSocket) {
        io.to(receiverSocket.socketId).emit('user:stopTyping', { senderId });
      }
    });

    socket.on('settings:profileUpdated', (data: any) => {
      const { userId, profile } = data || {};
      if (!userId || !profile) return;
      io.emit('user:profileUpdated', { userId, profile });
    });

    socket.on('settings:privacyUpdated', (data: any) => {
      const { userId, privacy } = data || {};
      if (!userId || !privacy) return;
      io.emit('user:privacyUpdated', { userId, privacy });
    });

    // User logout event
    socket.on('user:logout', async (userId: string) => {
      userSockets.delete(userId);

      // Mark user as offline in database
      await User.findByIdAndUpdate(userId, {
        isOnline: false,
        lastSeen: new Date(),
      });

      // Broadcast user offline status
      io.emit('user:offline', { userId, isOnline: false });
      console.log(`✓ User ${userId} is offline`);
    });

    // Disconnect event
    socket.on('disconnect', async () => {
      // Find and remove user from userSockets
      for (const [userId, userSocket] of userSockets.entries()) {
        if (userSocket.socketId === socket.id) {
          userSockets.delete(userId);

          await User.findByIdAndUpdate(userId, {
            isOnline: false,
            lastSeen: new Date(),
          });

          io.emit('user:offline', { userId, isOnline: false });
          console.log(`✓ User ${userId} disconnected`);
          break;
        }
      }
    });
  });
};
