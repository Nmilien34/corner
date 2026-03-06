import { Schema, model, Document, Types } from 'mongoose';

export interface IUsageEvent extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  conversationId?: Types.ObjectId;
  toolName: string;
  success: boolean;
  fileSizeBytes: number;
  processingMs: number;
  plan: string;
  errorCode?: string;
  createdAt: Date;
  updatedAt: Date;
}

const schema = new Schema<IUsageEvent>(
  {
    userId:         { type: Schema.Types.ObjectId, ref: 'User', required: true },
    conversationId: { type: Schema.Types.ObjectId, ref: 'Conversation' },
    toolName:       { type: String, required: true },
    success:        { type: Boolean, required: true },
    fileSizeBytes:  { type: Number, required: true, default: 0 },
    processingMs:   { type: Number, required: true, default: 0 },
    plan:           { type: String, required: true, default: 'free' },
    errorCode:      { type: String },
  },
  { timestamps: true },
);

// Per-user analytics
schema.index({ userId: 1, createdAt: -1 });
// Per-user per-tool billing
schema.index({ userId: 1, toolName: 1, createdAt: -1 });
// System-wide tool analytics
schema.index({ toolName: 1, createdAt: -1 });

export const UsageEvent = model<IUsageEvent>('UsageEvent', schema);
