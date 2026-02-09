import mongoose, { Schema, Document } from 'mongoose';
import bcryptjs from 'bcryptjs';

export interface IUser extends Document {
  username: string;
  displayName: string;
  email: string;
  password: string;
  avatar?: string;
  bio?: string;
  isOnline: boolean;
  lastSeen: Date;
  privacy: {
    showOnlineStatus: boolean;
    showReadReceipts: boolean;
    showLastSeen: boolean;
    whoCanMessage: 'everyone' | 'friends' | 'nobody';
  };
  notifications: {
    messages: boolean;
    sound: boolean;
    pushPlaceholder: boolean;
    mutedChats: string[];
  };
  appearance: {
    theme: 'dark' | 'neon' | 'system';
    accentColor: string;
    fontSize: number;
    compactLayout: boolean;
    reduceMotion: boolean;
  };
  storage: {
    mediaAutoDownload: boolean;
    cacheVersion: number;
  };
  blockedUsers: mongoose.Types.ObjectId[];
  activeSessions: {
    sessionId: string;
    device: string;
    createdAt: Date;
    lastActiveAt: Date;
  }[];
  createdAt: Date;
  updareatedAt: Date;
  comparePassword(password: string): Promise<boolean>;
}

const userSchema = new Schema<IUser>(
  {
    username: {
      type: String,
      required: [true, 'Please provide a username'],
      unique: true,
      trim: true,
      minlength: [3, 'Username must be at least 3 characters'],
    },
    displayName: {
      type: String,
      trim: true,
      maxlength: 40,
      default: '',
    },
    email: {
      type: String,
      required: [true, 'Please provide an email'],
      unique: true,
      match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please provide a valid email'],
    },
    password: {
      type: String,
      required: [true, 'Please provide a password'],
      minlength: 6,
      select: false,
    },
    avatar: {
      type: String,
      default: null,
    },
    bio: {
      type: String,
      trim: true,
      maxlength: 180,
      default: '',
    },
    isOnline: {
      type: Boolean,
      default: false,
    },
    lastSeen: {
      type: Date,
      default: Date.now,
    },
    privacy: {
      showOnlineStatus: { type: Boolean, default: true },
      showReadReceipts: { type: Boolean, default: true },
      showLastSeen: { type: Boolean, default: true },
      whoCanMessage: {
        type: String,
        enum: ['everyone', 'friends', 'nobody'],
        default: 'everyone',
      },
    },
    notifications: {
      messages: { type: Boolean, default: true },
      sound: { type: Boolean, default: true },
      pushPlaceholder: { type: Boolean, default: false },
      mutedChats: { type: [String], default: [] },
    },
    appearance: {
      theme: {
        type: String,
        enum: ['dark', 'neon', 'system'],
        default: 'neon',
      },
      accentColor: { type: String, default: '#7c5cff' },
      fontSize: { type: Number, default: 16 },
      compactLayout: { type: Boolean, default: false },
      reduceMotion: { type: Boolean, default: false },
    },
    storage: {
      mediaAutoDownload: { type: Boolean, default: true },
      cacheVersion: { type: Number, default: 1 },
    },
    blockedUsers: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    activeSessions: [
      {
        sessionId: { type: String, required: true },
        device: { type: String, default: 'Unknown device' },
        createdAt: { type: Date, default: Date.now },
        lastActiveAt: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

userSchema.pre('validate', function (next) {
  if (!this.displayName) {
    this.displayName = this.username;
  }
  next();
});

// Hash password before saving
userSchema.pre<IUser>('save', async function (next) {
  if (!this.isModified('password')) return next();

  try {
    const salt = await bcryptjs.genSalt(10);
    this.password = await bcryptjs.hash(this.password, salt);
    next();
  } catch (error) {
    next(error as Error);
  }
});

// Method to compare password
userSchema.methods.comparePassword = async function (password: string): Promise<boolean> {
  return await bcryptjs.compare(password, this.password);
};

export default mongoose.model<IUser>('User', userSchema);
