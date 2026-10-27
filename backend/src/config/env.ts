import 'dotenv/config';
import { z } from 'zod';

const secret = z.string().min(32, 'must be at least 32 characters');
const schema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(4001),
  MONGODB_URI: z.string().min(1),
  FRONTEND_URL: z.string().url(),
  CORS_ORIGINS: z.string().min(1),
  COOKIE_DOMAIN: z.string().optional(),
  JWT_ACCESS_SECRET: secret,
  JWT_REFRESH_SECRET: secret,
  CSRF_SECRET: secret,
  OTP_PEPPER: secret,
  ACCESS_TOKEN_TTL: z.string().default('15m'),
  REFRESH_TOKEN_TTL_DAYS: z.coerce.number().int().positive().max(90).default(30),
  OTP_TTL_MINUTES: z.coerce.number().int().positive().max(30).default(10),
  OTP_MAX_ATTEMPTS: z.coerce.number().int().positive().max(10).default(5),
  OTP_RESEND_COOLDOWN_SECONDS: z.coerce.number().int().positive().default(60),
  GOOGLE_CLIENT_ID: z.string().optional(),
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().int().positive().default(587),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  EMAIL_FROM: z.string().default('BloodFinder <no-reply@example.com>'),
  TURNSTILE_SECRET_KEY: z.string().optional(),
  REQUEST_EXPIRY_HOURS: z.coerce.number().int().positive().max(168).default(48),
  MAX_ACTIVE_REQUESTS_PER_USER: z.coerce.number().int().positive().max(10).default(3),
  DEFAULT_COUNTRY_CODE: z.string().regex(/^\+\d{1,3}$/).default('+91'),
  RATE_LIMIT_WINDOW_MS: z.coerce.number().int().positive().default(900000),
  RATE_LIMIT_MAX: z.coerce.number().int().positive().default(300),
  VAPID_PUBLIC_KEY: z.string().optional(),
  VAPID_PRIVATE_KEY: z.string().optional(),
  VAPID_SUBJECT: z.string().default('mailto:admin@bloodfinder.org'),
});

const parsed = schema.safeParse(process.env);
if (!parsed.success) {
  console.error('Invalid environment:', parsed.error.flatten().fieldErrors);
  throw new Error('Invalid environment configuration');
}
if (parsed.data.NODE_ENV === 'production' && (!parsed.data.SMTP_HOST || !parsed.data.SMTP_USER || !parsed.data.SMTP_PASS || !parsed.data.TURNSTILE_SECRET_KEY || !parsed.data.GOOGLE_CLIENT_ID)) {
  throw new Error('Production requires SMTP, Turnstile, and Google configuration');
}
export const env = parsed.data;
