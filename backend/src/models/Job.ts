import { Schema, model, Document } from 'mongoose';

export interface IJob extends Document {
  jobId: string;
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
    jobId:        { type: String, required: true, unique: true, index: true },
    tool:         { type: String, required: true },
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

export const Job = model<IJob>('Job', schema);
