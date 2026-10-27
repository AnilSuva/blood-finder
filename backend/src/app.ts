import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import hpp from 'hpp';
import pinoHttp from 'pino-http';
import { env } from './config/env.js';
import { logger } from './utils/logger.js';
import { globalLimiter } from './middleware/rateLimit.js';
import { errorHandler, notFound } from './middleware/error.js';
import { getCsrf, issueCsrf } from './middleware/csrf.js';
import { authRouter } from './modules/auth/routes.js';
import { usersRouter } from './modules/users/routes.js';
import { citiesRouter } from './modules/cities/routes.js';
import { requestsRouter } from './modules/requests/routes.js';
import { notificationsRouter } from './modules/notifications/routes.js';

function sanitize(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sanitize);
  if (value && typeof value === 'object' && Object.getPrototypeOf(value) === Object.prototype) {
    return Object.fromEntries(Object.entries(value as Record<string, unknown>).filter(([key]) => !key.includes('$') && !key.includes('.')).map(([key, nested]) => [key, sanitize(nested)]));
  }
  return value;
}
export const app = express();
app.set('trust proxy', 1);
app.disable('x-powered-by');
app.use(pinoHttp({ logger }));
app.use(helmet({
  contentSecurityPolicy: { directives: { defaultSrc: ["'none'"], frameAncestors: ["'none'"], baseUri: ["'none'"], formAction: ["'none'"] } },
  hsts: env.NODE_ENV === 'production' ? undefined : false,
}));
const allowedOrigins = env.CORS_ORIGINS.split(',').map((origin) => origin.trim());
app.use(cors({ origin(origin, callback) { if (!origin || allowedOrigins.includes(origin)) callback(null, true); else callback(new Error('CORS origin denied')); }, credentials: true, methods: ['GET', 'POST', 'PATCH', 'DELETE'], allowedHeaders: ['Content-Type', 'X-CSRF-Token'] }));
app.use(express.json({ limit: '10kb', strict: true }));
app.use(cookieParser());
app.use((req, _res, next) => { req.body = sanitize(req.body); req.query = sanitize(req.query) as typeof req.query; req.params = sanitize(req.params) as typeof req.params; next(); });
app.use(hpp());
app.use('/api', globalLimiter, issueCsrf);
app.get('/', (_req, res) => res.json({ service: 'BloodFinder API', status: 'online', health: '/api/health' }));
app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));
app.get('/api/csrf', getCsrf);
app.use('/api/auth', authRouter);
app.use('/api', usersRouter, citiesRouter, requestsRouter, notificationsRouter);
app.use(notFound);
app.use(errorHandler);
