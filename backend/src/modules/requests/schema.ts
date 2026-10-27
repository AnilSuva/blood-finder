import { z } from 'zod';
import { BLOOD_GROUPS } from '../../utils/bloodCompatibility.js';
export const createRequestSchema = z.object({
  city: z.string().trim().regex(/^[a-z0-9-]{2,80}$/),
  hospital: z.string().trim().min(1).max(120).optional(),
  phone: z.string().regex(/^[6-9]\d{9}$/, 'Enter a valid 10-digit Indian mobile number'),
  patientBloodGroup: z.enum(BLOOD_GROUPS),
  unitsNeeded: z.number().int().min(1).max(10).default(1),
  neededBy: z.enum(['asap', 'today', '48h']).default('asap'),
  note: z.string().trim().min(1).max(200).optional(),
  turnstileToken: z.string().min(1).max(4096),
}).strict();
export const feedQuerySchema = z.object({
  cursor: z.string().max(200).optional(),
  limit: z.coerce.number().int().min(1).max(50).default(20),
}).strict();
export const idParamSchema = z.object({ id: z.string().regex(/^[a-f\d]{24}$/i) }).strict();
export const statusSchema = z.object({ status: z.enum(['fulfilled', 'cancelled']) }).strict();
export const reportSchema = z.object({ reason: z.string().trim().min(3).max(240) }).strict();
