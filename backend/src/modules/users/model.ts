import { Schema, model, type HydratedDocument, type InferSchemaType } from 'mongoose';
import { BLOOD_GROUPS } from '../../utils/bloodCompatibility.js';

const userSchema = new Schema({
  email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
  name: { type: String, trim: true, maxlength: 80 },
  avatarUrl: { type: String, trim: true, maxlength: 500 },
  authProviders: { type: [{ type: String, enum: ['google', 'email'] }], default: [] },
  googleId: { type: String, unique: true, sparse: true },
  bloodGroup: { type: String, enum: BLOOD_GROUPS },
  city: { type: String, trim: true, index: true },
  available: { type: Boolean, default: true },
  lastDonatedAt: Date,
  emailAlerts: { type: Boolean, default: true },
  role: { type: String, enum: ['user', 'admin'], default: 'user' },
  isActive: { type: Boolean, default: true },
  onboardingComplete: { type: Boolean, default: false, index: true },
  consentAcceptedAt: Date,
  lastLoginAt: Date,
  pushSubscriptions: {
    type: [{
      endpoint: { type: String, required: true },
      keys: {
        p256dh: { type: String, required: true },
        auth: { type: String, required: true },
      },
      createdAt: { type: Date, default: Date.now },
    }],
    default: [],
  },
}, { timestamps: true, versionKey: false });

export type UserData = InferSchemaType<typeof userSchema>;
export type User = HydratedDocument<UserData>;
export const UserModel = model<UserData>('User', userSchema);
