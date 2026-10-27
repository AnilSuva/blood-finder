import pino from 'pino';
import { env } from '../config/env.js';

export const logger = pino({
  level: env.NODE_ENV === 'production' ? 'info' : 'debug',
  redact: {
    paths: [
      'req.headers.cookie', 'req.headers.authorization', 'req.body.code', 'req.body.credential',
      'req.body.email', 'req.body.phone', 'res.headers.set-cookie', 'email', 'phone', 'token',
    ],
    censor: '[REDACTED]',
  },
});
