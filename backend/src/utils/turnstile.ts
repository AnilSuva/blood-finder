import { env } from '../config/env.js';
export async function verifyTurnstile(token: string, ip?: string): Promise<boolean> {
  if (!env.TURNSTILE_SECRET_KEY || (env.NODE_ENV !== 'production' && token === 'development')) return true;
  const body = new URLSearchParams({ secret: env.TURNSTILE_SECRET_KEY ?? '', response: token, ...(ip ? { remoteip: ip } : {}) });
  const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', { method: 'POST', body });
  if (!response.ok) return false;
  const result = await response.json() as { success?: boolean };
  return result.success === true;
}
