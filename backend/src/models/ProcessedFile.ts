import { Schema, model, Document, Types } from 'mongoose';

export interface IProcessedFile extends Document {
  fileId: string;
  userId?: Types.ObjectId;
  toolName: string;
  params: Record<string, unknown>;
  filePath: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  status: 'pending' | 'done' | 'error';
  errorMessage?: string;
  createdAt: Date;
  expiresAt: Date;
}

const schema = new Schema<IProcessedFile>(
  {
    fileId:       { type: String, required: true, unique: true, index: true },
    userId:       { type: Schema.Types.ObjectId, ref: 'User' },
    toolName:     { type: String, required: true },
    params:       { type: Schema.Types.Mixed, default: {} },
    filePath:     { type: String, required: true },
    fileName:     { type: String, required: true },
    mimeType:     { type: String, required: true },
    sizeBytes:    { type: Number, required: true },
    status:       { type: String, enum: ['pending', 'done', 'error'], default: 'pending' },
    errorMessage: { type: String },
    expiresAt:    { type: Date, required: true },
  },
  { timestamps: true },
);

// TTL index — MongoDB will auto-delete documents once expiresAt is reached
schema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
// User's file history
schema.index({ userId: 1, createdAt: -1 });

export const ProcessedFile = model<IProcessedFile>('ProcessedFile', schema);
