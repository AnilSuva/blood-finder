import { Schema, model, Types, type InferSchemaType } from 'mongoose';
import { BLOOD_GROUPS } from '../../utils/bloodCompatibility.js';

const requestSchema = new Schema({
  requesterId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  city: { type: String, required: true, trim: true },
  hospital: { type: String, trim: true, maxlength: 120 },
  phone: { type: String, required: true, select: false },
  patientBloodGroup: { type: String, enum: BLOOD_GROUPS, required: true },
  compatibleDonorGroups: { type: [{ type: String, enum: BLOOD_GROUPS }], required: true },
  unitsNeeded: { type: Number, required: true, min: 1, max: 10 },
  neededBy: { type: String, enum: ['asap', 'today', '48h'], required: true },
  note: { type: String, trim: true, maxlength: 200 },
  status: { type: String, enum: ['open', 'fulfilled', 'cancelled', 'expired'], default: 'open' },
  flagged: { type: Boolean, default: false, index: true },
  expiresAt: { type: Date, required: true, index: true },
}, { timestamps: true, versionKey: false });
requestSchema.index({ city: 1, status: 1, compatibleDonorGroups: 1, createdAt: -1 });
export type BloodRequest = InferSchemaType<typeof requestSchema> & { _id: Types.ObjectId };
export const BloodRequestModel = model('BloodRequest', requestSchema);

const revealSchema = new Schema({
  requestId: { type: Schema.Types.ObjectId, ref: 'BloodRequest', required: true, index: true },
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  createdAt: { type: Date, default: Date.now, expires: '90d' },
}, { versionKey: false });
export const ContactRevealModel = model('ContactReveal', revealSchema);

const reportSchema = new Schema({
  requestId: { type: Schema.Types.ObjectId, ref: 'BloodRequest', required: true, index: true },
  reporterId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  reason: { type: String, required: true, maxlength: 240 },
  createdAt: { type: Date, default: Date.now },
}, { versionKey: false });
reportSchema.index({ requestId: 1, reporterId: 1 }, { unique: true });
export const ReportModel = model('Report', reportSchema);
