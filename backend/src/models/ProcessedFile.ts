import { Schema, model, Document } from 'mongoose';

export interface IProcessedFile extends Document {
  fileId: string;
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

export const ProcessedFile = model<IProcessedFile>('ProcessedFile', schema);
