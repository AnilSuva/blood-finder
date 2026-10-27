import { z } from 'zod';
import { BLOOD_GROUPS } from '../../utils/bloodCompatibility.js';
const city = z.string().trim().regex(/^[a-z0-9-]{2,80}$/);
const date = z.string().datetime().transform((value) => new Date(value));
export const onboardingSchema = z.object({
  name: z.string().trim().min(2).max(80),
  bloodGroup: z.enum(BLOOD_GROUPS),
  city,
  consent: z.literal(true),
}).strict();
export const profileSchema = z.object({
  name: z.string().trim().min(2).max(80).optional(),
  bloodGroup: z.enum(BLOOD_GROUPS).optional(),
  city: city.optional(),
  available: z.boolean().optional(),
  lastDonatedAt: z.union([date, z.null()]).optional(),
  emailAlerts: z.boolean().optional(),
}).strict().refine((value) => Object.keys(value).length > 0, 'At least one field is required');
