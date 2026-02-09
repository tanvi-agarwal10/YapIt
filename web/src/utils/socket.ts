import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuthStore, useChatStore, useSettingsStore } from './store';

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:5000';

let socket: Socket | null = null;

export const useSocket = () => {
  const [isConnected, setIsConnected] = useState(false);
  const { userId, setProfile } = useAuthStore();
  const { addMessage, setOnlineUsers, setTypingUsers, setUsers, updateUser } = useChatStore();
  const { mergeSection } = useSettingsStore();

  useEffect(() => {
    if (!userId) return;

    socket = io(SOCKET_URL, {
      auth: {
        userId,
      },
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5,
    });

    socket.on('connect', () => {
      console.log('✓ Connected to WebSocket');
      socket?.emit('user:login', userId);
      setIsConnected(true);
    });

    socket.on('message:receive', (data) => {
      addMessage({
        ...data,
        isOwn: false,
      });
    });

    socket.on('message:sent', () => {
      // Acknowledgement only; message already optimistically added on send.
    });

    socket.on('user:typing', ({ senderId }: { senderId: string }) => {
      setTypingUsers((users: Set<string>) => {
        const next = new Set(users);
        if (senderId) next.add(senderId);
        return next;
      });
    });

    socket.on('user:stopTyping', ({ senderId }: { senderId: string }) => {
      setTypingUsers((users: Set<string>) => {
        const next = new Set(users);
        if (senderId) next.delete(senderId);
        return next;
      });
    });

    socket.on('user:online', ({ userId, isOnline }) => {
      setOnlineUsers((users: Set<string>) => {
        const newUsers = new Set(users);
        if (isOnline) newUsers.add(userId);
        else newUsers.delete(userId);
        return newUsers;
      });
    });

    socket.on('disconnect', () => {
      console.log('✗ Disconnected from WebSocket');
      setIsConnected(false);
    });

    socket.on('user:profileUpdated', ({ userId: updatedId, profile }) => {
      if (!updatedId || !profile) return;
      if (updatedId === userId) {
        setProfile({
          username: profile.username,
          displayName: profile.displayName,
          avatar: profile.avatar,
          bio: profile.bio,
        });
        mergeSection('profile', (prev: any) => ({ ...prev, ...profile }));
      }

      updateUser(String(updatedId), profile);
    });

    socket.on('user:privacyUpdated', ({ userId: updatedId, privacy }) => {
      if (!updatedId || !privacy) return;
      if (updatedId === userId) {
        mergeSection('privacy', privacy);
      }
    });

    return () => {
      if (socket) {
        socket.emit('user:logout', userId);
        socket.disconnect();
      }
    };
  }, [userId, addMessage, setOnlineUsers, setTypingUsers, setUsers, updateUser, setProfile, mergeSection]);

  const sendMessage = (receiverId: string, content: string, attachment?: any) => {
    if (socket) {
      socket.emit('message:send', {
        senderId: userId,
        receiverId,
        content,
        attachment,
      });
    }
  };

  const emitTyping = (receiverId: string, senderName: string) => {
    if (socket) {
      socket.emit('user:typing', { receiverId, senderName, senderId: userId });
    }
  };

  const emitStopTyping = (receiverId: string) => {
    if (socket) {
      socket.emit('user:stopTyping', { receiverId, senderId: userId });
    }
  };

  const emitProfileUpdated = (profile: any) => {
    if (socket && userId) {
      socket.emit('settings:profileUpdated', { userId, profile });
    }
  };

  const emitPrivacyUpdated = (privacy: any) => {
    if (socket && userId) {
      socket.emit('settings:privacyUpdated', { userId, privacy });
    }
  };

  return { isConnected, sendMessage, emitTyping, emitStopTyping, emitProfileUpdated, emitPrivacyUpdated };
};

export const getSocket = () => socket;
