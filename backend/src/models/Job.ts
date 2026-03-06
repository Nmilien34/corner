import { Schema, model, Document, Types } from 'mongoose';

export interface IJob extends Document {
  jobId: string;
  userId?: Types.ObjectId;
  conversationId?: Types.ObjectId;
  tool: string;
  status: 'queued' | 'running' | 'done' | 'error';
  progress: number;
  inputFileIds: string[];
  outputFileId?: string;
  error?: string;
  startedAt?: Date;
  completedAt?: Date;
}

const schema = new Schema<IJob>(
  {
    jobId:          { type: String, required: true, unique: true, index: true },
    userId:         { type: Schema.Types.ObjectId, ref: 'User' },
    conversationId: { type: Schema.Types.ObjectId, ref: 'Conversation' },
    tool:           { type: String, required: true },
    status:       { type: String, enum: ['queued', 'running', 'done', 'error'], default: 'queued' },
    progress:     { type: Number, default: 0, min: 0, max: 100 },
    inputFileIds: [{ type: String }],
    outputFileId: { type: String },
    error:        { type: String },
    startedAt:    { type: Date },
    completedAt:  { type: Date },
  },
  { timestamps: true },
);

schema.index({ userId: 1, status: 1 });

export const Job = model<IJob>('Job', schema);
