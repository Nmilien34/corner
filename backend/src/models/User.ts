import { Schema, model, Document, Types } from 'mongoose';

export type PlanTier = 'free' | 'pro';

export interface IUser extends Document {
  _id: Types.ObjectId;
  email: string;
  passwordHash: string;
  displayName: string;
  avatarUrl?: string;
  plan: PlanTier;
  emailVerified: boolean;
  lastLoginAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const schema = new Schema<IUser>(
  {
    email:         { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash:  { type: String, required: true, select: false },
    displayName:   { type: String, required: true, trim: true, maxlength: 80 },
    avatarUrl:     { type: String },
    plan:          { type: String, enum: ['free', 'pro'], default: 'free' },
    emailVerified: { type: Boolean, default: false },
    lastLoginAt:   { type: Date },
  },
  { timestamps: true },
);

export const User = model<IUser>('User', schema);
