import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IMessage extends Document {
  senderId: Types.ObjectId;
  receiverId: Types.ObjectId;
  content: string;
  attachment?: {
    url: string;
    publicId: string;
    type: string;
    format?: string;
    width?: number;
    height?: number;
    bytes?: number;
    name?: string;
  };
  timestamp?: Date;
  isRead: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

const messageSchema = new Schema<IMessage>(
  {
    senderId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    receiverId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    content: {
      type: String,
      trim: true,
      default: '',
    },
    attachment: {
      url: { type: String },
      publicId: { type: String },
      type: { type: String },
      format: { type: String },
      width: { type: Number },
      height: { type: Number },
      bytes: { type: Number },
      name: { type: String },
    },
    isRead: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

// Index for efficient querying
messageSchema.index({ senderId: 1, receiverId: 1 });
messageSchema.index({ receiverId: 1, isRead: 1 });

export default mongoose.model<IMessage>('Message', messageSchema);
