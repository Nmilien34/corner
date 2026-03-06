import { Schema, model, Document, Types } from 'mongoose';

export interface IConversation extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  title: string;
  lastMessageAt: Date;
  archived: boolean;
  pinned: boolean;
  toolsUsed: string[];
  messageCount: number;
  createdAt: Date;
  updatedAt: Date;
}

const schema = new Schema<IConversation>(
  {
    userId:        { type: Schema.Types.ObjectId, ref: 'User', required: true },
    title:         { type: String, required: true, trim: true, maxlength: 200, default: 'New Conversation' },
    lastMessageAt: { type: Date, default: Date.now },
    archived:      { type: Boolean, default: false },
    pinned:        { type: Boolean, default: false },
    toolsUsed:     [{ type: String }],
    messageCount:  { type: Number, default: 0, min: 0 },
  },
  { timestamps: true },
);

// Primary: list conversations for a user, newest first
schema.index({ userId: 1, lastMessageAt: -1 });
// Filtered list: archived/pinned views
schema.index({ userId: 1, archived: 1, pinned: -1, lastMessageAt: -1 });

export const Conversation = model<IConversation>('Conversation', schema);
