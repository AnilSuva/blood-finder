import { z } from 'zod';
export const bloodGroups = ['O-', 'O+', 'A-', 'A+', 'B-', 'B+', 'AB-', 'AB+'] as const;
export const onboardingSchema = z.object({ name: z.string().trim().min(2, 'Enter your name').max(80), bloodGroup: z.enum(bloodGroups), city: z.string().min(2, 'Choose your city'), consent: z.boolean().refine((value) => value, 'Consent is required') });
export const profileSchema = z.object({ name: z.string().trim().min(2).max(80), bloodGroup: z.enum(bloodGroups), city: z.string().min(2), available: z.boolean(), lastDonatedAt: z.string().optional(), emailAlerts: z.boolean() });
export const requestSchema = z.object({ city: z.string().min(2), hospital: z.string().trim().max(120).optional(), phone: z.string().regex(/^[6-9]\d{9}$/, 'Use a 10-digit Indian number starting with 6–9'), patientBloodGroup: z.enum(bloodGroups), unitsNeeded: z.coerce.number().int().min(1).max(10), neededBy: z.enum(['asap', 'today', '48h']), note: z.string().trim().max(200).optional() });
