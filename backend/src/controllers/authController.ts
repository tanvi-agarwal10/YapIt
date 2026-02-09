import { Response } from 'express';
import jwt from 'jsonwebtoken';
import { AuthRequest } from '../middleware/auth';
import User, { IUser } from '../models/User';
import mongoose from 'mongoose';

const generateToken = (userId: string): string => {
  return jwt.sign(
    { userId },
    process.env.JWT_SECRET || 'secret',
    { expiresIn: process.env.JWT_EXPIRE || '7d' } as any
  );
};

const sanitizeUser = (user: IUser) => ({
  id: user._id,
  username: user.username,
  displayName: user.displayName || user.username,
  email: user.email,
  avatar: user.avatar,
  bio: user.bio || '',
  isOnline: user.isOnline,
  lastSeen: user.lastSeen,
  privacy: user.privacy,
  notifications: user.notifications,
  appearance: user.appearance,
  storage: user.storage,
  blockedUsers: user.blockedUsers,
  activeSessions: user.activeSessions,
});

export const register = async (req: AuthRequest, res: Response) => {
  try {
    const { username, email, password, confirmPassword } = req.body;

    if (!username || !email || !password || !confirmPassword) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ message: 'Passwords do not match' });
    }

    const existingUser = await User.findOne({
      $or: [{ email }, { username }],
    });

    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const user = new User({
      username,
      displayName: username,
      email,
      password,
      activeSessions: [
        {
          sessionId: new mongoose.Types.ObjectId().toString(),
          device: req.headers['user-agent'] || 'Unknown device',
          createdAt: new Date(),
          lastActiveAt: new Date(),
        },
      ],
    });

    await user.save();

    const token = generateToken(user._id.toString());

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: sanitizeUser(user),
    });
  } catch (error) {
    res.status(500).json({ message: 'Registration failed', error });
  }
};

export const login = async (req: AuthRequest, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const isPasswordValid = await user.comparePassword(password);

    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = generateToken(user._id.toString());

    user.activeSessions = [
      ...(user.activeSessions || []).slice(-4),
      {
        sessionId: new mongoose.Types.ObjectId().toString(),
        device: req.headers['user-agent'] || 'Unknown device',
        createdAt: new Date(),
        lastActiveAt: new Date(),
      },
    ];
    await user.save();

    res.json({
      message: 'Login successful',
      token,
      user: sanitizeUser(user),
    });
  } catch (error) {
    res.status(500).json({ message: 'Login failed', error });
  }
};

export const getProfile = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const user = await User.findById(req.user.userId);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ user: sanitizeUser(user) });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching profile', error });
  }
};

export const getAllUsers = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const users = await User.find().select('-password');

    const me = users.find((u) => u._id.toString() === req.user?.userId);
    const myBlocked = new Set((me?.blockedUsers || []).map((id) => id.toString()));

    res.json({
      users: users
        .filter((user) => !myBlocked.has(user._id.toString()))
        .map((user) => ({
          id: user._id,
          username: user.username,
          displayName: user.displayName || user.username,
          avatar: user.avatar,
          bio: user.bio || '',
          email: user.email,
          isOnline: user.privacy?.showOnlineStatus ? user.isOnline : false,
          lastSeen: user.privacy?.showLastSeen ? user.lastSeen : null,
        })),
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching users', error });
  }
};

export const getSettings = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ message: 'Unauthorized' });

    const user = await User.findById(req.user.userId).populate('blockedUsers', 'username displayName avatar');
    if (!user) return res.status(404).json({ message: 'User not found' });

    res.json({
      profile: {
        username: user.username,
        displayName: user.displayName,
        avatar: user.avatar,
        bio: user.bio || '',
        email: user.email,
      },
      privacy: user.privacy,
      notifications: user.notifications,
      appearance: user.appearance,
      storage: user.storage,
      blockedUsers: user.blockedUsers,
      activeSessions: user.activeSessions,
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching settings', error });
  }
};

export const checkUsernameAvailability = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ message: 'Unauthorized' });
    const { username } = req.params;
    if (!username || username.length < 3) {
      return res.status(400).json({ message: 'Username too short', available: false });
    }

    const existing = await User.findOne({ username: username.trim() });
    const available = !existing || existing._id.toString() === req.user.userId;
    return res.json({ available });
  } catch (error) {
    res.status(500).json({ message: 'Failed to validate username', error });
  }
};

export const updateProfile = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ message: 'Unauthorized' });

    const { username, displayName, bio, avatar } = req.body;
    const user = await User.findById(req.user.userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (typeof username === 'string' && username.trim() && username.trim() !== user.username) {
      const existing = await User.findOne({ username: username.trim() });
      if (existing && existing._id.toString() !== user._id.toString()) {
        return res.status(409).json({ message: 'Username is already taken' });
      }
      user.username = username.trim();
    }

    if (typeof displayName === 'string') user.displayName = displayName.trim().slice(0, 40);
    if (typeof bio === 'string') user.bio = bio.slice(0, 180);
    if (typeof avatar === 'string') user.avatar = avatar;

    await user.save();
    return res.json({ message: 'Profile updated', user: sanitizeUser(user) });
  } catch (error) {
    return res.status(500).json({ message: 'Profile update failed', error });
  }
};

export const updatePrivacy = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ message: 'Unauthorized' });
    const user = await User.findById(req.user.userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    user.privacy = { ...user.privacy, ...req.body };
    await user.save();
    return res.json({ message: 'Privacy settings updated', privacy: user.privacy });
  } catch (error) {
    return res.status(500).json({ message: 'Privacy update failed', error });
  }
};

export const updateNotifications = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ message: 'Unauthorized' });
    const user = await User.findById(req.user.userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    user.notifications = { ...user.notifications, ...req.body };
    await user.save();
    return res.json({ message: 'Notification settings updated', notifications: user.notifications });
  } catch (error) {
    return res.status(500).json({ message: 'Notification update failed', error });
  }
};

export const updateAppearance = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ message: 'Unauthorized' });
    const user = await User.findById(req.user.userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    user.appearance = { ...user.appearance, ...req.body };
    await user.save();
    return res.json({ message: 'Appearance updated', appearance: user.appearance });
  } catch (error) {
    return res.status(500).json({ message: 'Appearance update failed', error });
  }
};

export const updateStorage = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ message: 'Unauthorized' });
    const user = await User.findById(req.user.userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    user.storage = { ...user.storage, ...req.body };
    await user.save();
    return res.json({ message: 'Storage settings updated', storage: user.storage });
  } catch (error) {
    return res.status(500).json({ message: 'Storage update failed', error });
  }
};

export const changePassword = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ message: 'Unauthorized' });
    const { oldPassword, newPassword, confirmPassword } = req.body;
    if (!oldPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({ message: 'All password fields are required' });
    }
    if (newPassword !== confirmPassword) {
      return res.status(400).json({ message: 'New passwords do not match' });
    }

    const user = await User.findById(req.user.userId).select('+password');
    if (!user) return res.status(404).json({ message: 'User not found' });

    const ok = await user.comparePassword(oldPassword);
    if (!ok) return res.status(400).json({ message: 'Current password is incorrect' });

    user.password = newPassword;
    await user.save();
    return res.json({ message: 'Password updated successfully' });
  } catch (error) {
    return res.status(500).json({ message: 'Password update failed', error });
  }
};

export const updateEmail = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ message: 'Unauthorized' });
    const { newEmail, password } = req.body;
    if (!newEmail || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const user = await User.findById(req.user.userId).select('+password');
    if (!user) return res.status(404).json({ message: 'User not found' });

    const ok = await user.comparePassword(password);
    if (!ok) return res.status(400).json({ message: 'Password confirmation failed' });

    const existing = await User.findOne({ email: newEmail.trim() });
    if (existing && existing._id.toString() !== user._id.toString()) {
      return res.status(409).json({ message: 'Email is already in use' });
    }

    user.email = newEmail.trim();
    await user.save();
    return res.json({
      message: 'Email updated. Verification flow placeholder complete.',
      email: user.email,
      verificationRequired: true,
    });
  } catch (error) {
    return res.status(500).json({ message: 'Email update failed', error });
  }
};

export const logoutAllDevices = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ message: 'Unauthorized' });
    const user = await User.findById(req.user.userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    user.activeSessions = [];
    await user.save();
    return res.json({ message: 'Logged out from all devices' });
  } catch (error) {
    return res.status(500).json({ message: 'Could not logout all devices', error });
  }
};

export const deleteAccount = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ message: 'Unauthorized' });
    const { password } = req.body;
    if (!password) return res.status(400).json({ message: 'Password confirmation is required' });

    const user = await User.findById(req.user.userId).select('+password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    const ok = await user.comparePassword(password);
    if (!ok) return res.status(400).json({ message: 'Password confirmation failed' });

    await User.findByIdAndDelete(req.user.userId);
    return res.json({ message: 'Account deleted successfully' });
  } catch (error) {
    return res.status(500).json({ message: 'Account deletion failed', error });
  }
};

export const blockUser = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ message: 'Unauthorized' });
    const { targetUserId } = req.params;
    const user = await User.findById(req.user.userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const has = (user.blockedUsers || []).some((id) => id.toString() === targetUserId);
    if (!has) user.blockedUsers.push(new mongoose.Types.ObjectId(targetUserId));
    await user.save();
    return res.json({ message: 'User blocked', blockedUsers: user.blockedUsers });
  } catch (error) {
    return res.status(500).json({ message: 'Block user failed', error });
  }
};

export const unblockUser = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ message: 'Unauthorized' });
    const { targetUserId } = req.params;
    const user = await User.findById(req.user.userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    user.blockedUsers = (user.blockedUsers || []).filter((id) => id.toString() !== targetUserId);
    await user.save();
    return res.json({ message: 'User unblocked', blockedUsers: user.blockedUsers });
  } catch (error) {
    return res.status(500).json({ message: 'Unblock user failed', error });
  }
};
