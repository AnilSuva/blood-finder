import crypto from 'node:crypto';
import jwt from 'jsonwebtoken';
import type { Response } from 'express';
import { env } from '../config/env.js';

export type AccessPayload = { sub: string; type: 'access' };
const baseCookie = {
  httpOnly: true,
  secure: env.NODE_ENV === 'production',
  sameSite: (env.NODE_ENV === 'production' ? 'none' : 'lax') as 'none' | 'lax',
  domain: env.COOKIE_DOMAIN === 'localhost' || !env.COOKIE_DOMAIN ? undefined : env.COOKIE_DOMAIN,
};

export function signAccessToken(userId: string): string {
  return jwt.sign({ sub: userId, type: 'access' }, env.JWT_ACCESS_SECRET, { expiresIn: env.ACCESS_TOKEN_TTL as jwt.SignOptions['expiresIn'] });
}
export function verifyAccessToken(token: string): AccessPayload {
  return jwt.verify(token, env.JWT_ACCESS_SECRET) as AccessPayload;
}
export function createRefreshToken(): string {
  return crypto.randomBytes(48).toString('base64url');
}
export function hashToken(token: string): string {
  return crypto.createHmac('sha256', env.JWT_REFRESH_SECRET).update(token).digest('hex');
}
export function newFamilyId(): string { return crypto.randomUUID(); }
export function setSessionCookies(res: Response, userId: string, refreshToken: string): void {
  res.cookie('access_token', signAccessToken(userId), { ...baseCookie, maxAge: 15 * 60 * 1000, path: '/' });
  res.cookie('refresh_token', refreshToken, { ...baseCookie, maxAge: env.REFRESH_TOKEN_TTL_DAYS * 86400000, path: '/api/auth' });
}
export function clearSessionCookies(res: Response): void {
  res.clearCookie('access_token', { ...baseCookie, path: '/' });
  res.clearCookie('refresh_token', { ...baseCookie, path: '/api/auth' });
}
export function csrfToken(): string {
  const nonce = crypto.randomBytes(32).toString('base64url');
  return `${nonce}.${crypto.createHmac('sha256', env.CSRF_SECRET).update(nonce).digest('base64url')}`;
}
