import crypto from 'node:crypto';
import { env } from '../config/env.js';

export function generateOtp(): string {
  return crypto.randomInt(0, 1_000_000).toString().padStart(6, '0');
}

export function hashOtp(email: string, code: string): string {
  return crypto.createHmac('sha256', env.OTP_PEPPER).update(`${email.toLowerCase()}:${code}`).digest('hex');
}

export function safeOtpEquals(storedHash: string, email: string, code: string): boolean {
  const a = Buffer.from(storedHash, 'hex');
  const b = Buffer.from(hashOtp(email, code), 'hex');
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}
