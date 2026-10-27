import { z } from 'zod';
export const emailSchema = z.string().trim().toLowerCase().email().max(254);
export const otpRequestSchema = z.object({ email: emailSchema, turnstileToken: z.string().min(1).max(4096) }).strict();
export const otpVerifySchema = z.object({ email: emailSchema, code: z.string().regex(/^\d{6}$/) }).strict();
export const googleSchema = z.object({ credential: z.string().min(20).max(5000) }).strict();
