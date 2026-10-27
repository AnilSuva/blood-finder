import { Router } from 'express';
import { validate } from '../../middleware/validate.js';
import { authLimiter } from '../../middleware/rateLimit.js';
import { csrfProtection } from '../../middleware/csrf.js';
import { requireAuth } from '../../middleware/auth.js';
import { clearSessionCookies, hashToken } from '../../utils/tokens.js';
import { RefreshTokenModel } from './model.js';
import { googleSchema, otpRequestSchema, otpVerifySchema } from './schema.js';
import { googleSignIn, requestOtp, rotateRefresh, verifyOtpAndSignIn } from './service.js';
import { verifyTurnstile } from '../../utils/turnstile.js';
import { ApiError } from '../../middleware/error.js';

export const authRouter = Router();
authRouter.post('/otp/request', authLimiter, csrfProtection, validate(otpRequestSchema), async (req, res, next) => {
  try {
    if (!await verifyTurnstile(req.body.turnstileToken, req.ip)) throw new ApiError(400, 'BOT_CHECK_FAILED', 'Verification failed');
    await requestOtp(req.body.email);
    res.status(202).json({ message: 'If this address can receive email, a code has been sent.' });
  } catch (error) { next(error); }
});
authRouter.post('/otp/verify', authLimiter, csrfProtection, validate(otpVerifySchema), async (req, res, next) => {
  try { res.json({ user: await verifyOtpAndSignIn(req.body.email, req.body.code, req, res) }); } catch (error) { next(error); }
});
authRouter.post('/google', authLimiter, csrfProtection, validate(googleSchema), async (req, res, next) => {
  try { res.json({ user: await googleSignIn(req.body.credential, req, res) }); } catch (error) { next(error); }
});
authRouter.post('/refresh', csrfProtection, async (req, res, next) => {
  try { res.json({ user: await rotateRefresh(req, res) }); } catch (error) { next(error); }
});
authRouter.post('/logout', csrfProtection, requireAuth, async (req, res, next) => {
  try {
    const raw = req.cookies?.refresh_token;
    if (raw) await RefreshTokenModel.updateOne({ tokenHash: hashToken(raw) }, { $set: { revokedAt: new Date() } });
    clearSessionCookies(res); res.status(204).send();
  } catch (error) { next(error); }
});
authRouter.post('/logout-all', csrfProtection, requireAuth, async (req, res, next) => {
  try { await RefreshTokenModel.updateMany({ userId: req.user!._id }, { $set: { revokedAt: new Date() } }); clearSessionCookies(res); res.status(204).send(); } catch (error) { next(error); }
});
