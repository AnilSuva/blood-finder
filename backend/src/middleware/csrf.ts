import crypto from 'node:crypto';
import type { RequestHandler } from 'express';
import { env } from '../config/env.js';
import { csrfToken } from '../utils/tokens.js';
import { ApiError } from './error.js';

const cookieOptions = {
  httpOnly: false,
  secure: env.NODE_ENV === 'production',
  sameSite: (env.NODE_ENV === 'production' ? 'none' : 'lax') as 'none' | 'lax',
  domain: env.COOKIE_DOMAIN === 'localhost' || !env.COOKIE_DOMAIN ? undefined : env.COOKIE_DOMAIN,
  path: '/',
};
export const issueCsrf: RequestHandler = (req, res, next) => {
  if (!req.cookies?.csrf_token) {
    const token = csrfToken();
    res.locals.csrfToken = token;
    res.cookie('csrf_token', token, cookieOptions);
  }
  next();
};
export const getCsrf: RequestHandler = (req, res) => {
  const token = (res.locals.csrfToken as string | undefined) ?? req.cookies?.csrf_token;
  if (!token) {
    const freshToken = csrfToken();
    res.cookie('csrf_token', freshToken, cookieOptions);
    res.json({ csrfToken: freshToken });
    return;
  }
  res.json({ csrfToken: token });
};
export const csrfProtection: RequestHandler = (req, _res, next) => {
  const origin = req.get('origin') ?? req.get('referer') ?? '';
  const cleanOrigin = origin.replace(/\/+$/, '');
  const allowed = env.CORS_ORIGINS.split(',').map((value) => value.trim().replace(/\/+$/, ''));
  const isAllowed =
    !origin ||
    allowed.some((value) => cleanOrigin.startsWith(value) || value.startsWith(cleanOrigin)) ||
    cleanOrigin.endsWith('.vercel.app') ||
    cleanOrigin.startsWith('http://localhost:');

  if (!isAllowed) return next(new ApiError(403, 'CSRF_REJECTED', 'Invalid request origin'));
  const cookie = req.cookies?.csrf_token;
  const header = req.get('x-csrf-token');
  if (!cookie || !header || cookie.length !== header.length || !crypto.timingSafeEqual(Buffer.from(cookie), Buffer.from(header))) return next(new ApiError(403, 'CSRF_REJECTED', 'CSRF token is invalid'));
  next();
};
