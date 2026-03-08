import { Schema, model, Document, Types } from 'mongoose';

export type MessageRole = 'user' | 'assistant' | 'system';

export interface IAttachment {
  fileId: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
}

export interface IToolCall {
  toolName: string;
  params: Record<string, unknown>;
  resultFileId?: string;
  resultFileName?: string;
  resultMimeType?: string;
  resultSizeBytes?: number;
  isStub: boolean;
  durationMs?: number;
}

export interface IMessage extends Document {
  _id: Types.ObjectId;
  conversationId: Types.ObjectId;
  userId: Types.ObjectId;
  role: MessageRole;
  content: string;
  attachments: IAttachment[];
  toolCall?: IToolCall;
  createdAt: Date;
  updatedAt: Date;
}

const AttachmentSchema = new Schema<IAttachment>(
  {
    fileId:    { type: String, required: true },
    fileName:  { type: String, required: true },
    mimeType:  { type: String, required: true },
    sizeBytes: { type: Number, required: true },
  },
  { _id: false },
);

const ToolCallSchema = new Schema<IToolCall>(
  {
    toolName:        { type: String, required: true },
    params:          { type: Schema.Types.Mixed, default: {} },
    resultFileId:   { type: String },
    resultFileName: { type: String },
    resultMimeType: { type: String },
    resultSizeBytes: { type: Number },
    isStub:         { type: Boolean, default: false },
    durationMs:      { type: Number },
  },
  { _id: false },
);

const schema = new Schema<IMessage>(
  {
    conversationId: { type: Schema.Types.ObjectId, ref: 'Conversation', required: true },
    userId:         { type: Schema.Types.ObjectId, ref: 'User', required: true },
    role:           { type: String, enum: ['user', 'assistant', 'system'], required: true },
    content:        { type: String, required: true, maxlength: 50_000 },
    attachments:    { type: [AttachmentSchema], default: [] },
    toolCall:       { type: ToolCallSchema },
  },
  { timestamps: true },
);

// Primary: load all messages in a conversation chronologically
schema.index({ conversationId: 1, createdAt: 1 });
// Analytics: all messages by user
schema.index({ userId: 1, createdAt: -1 });

export const Message = model<IMessage>('Message', schema);
