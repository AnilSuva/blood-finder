import { z } from 'zod';
export const citiesQuerySchema = z.object({ q: z.string().trim().max(80).optional().default('') }).strict();
