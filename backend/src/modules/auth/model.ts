import { Schema, model, type InferSchemaType } from 'mongoose';

const otpSchema = new Schema({
  email: { type: String, required: true, lowercase: true, trim: true, index: true },
  codeHash: { type: String, required: true, select: false },
  attempts: { type: Number, default: 0 },
  expiresAt: { type: Date, required: true, expires: 0 },
  createdAt: { type: Date, default: Date.now },
}, { versionKey: false });
otpSchema.index({ email: 1, createdAt: -1 });
export type Otp = InferSchemaType<typeof otpSchema>;
export const OtpModel = model('Otp', otpSchema);

const refreshSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  tokenHash: { type: String, required: true, unique: true, select: false },
  familyId: { type: String, required: true, index: true },
  expiresAt: { type: Date, required: true, expires: 0 },
  revokedAt: Date,
  userAgent: { type: String, maxlength: 300 },
  ip: { type: String, maxlength: 80 },
}, { timestamps: true, versionKey: false });
export type RefreshToken = InferSchemaType<typeof refreshSchema>;
export const RefreshTokenModel = model('RefreshToken', refreshSchema);
