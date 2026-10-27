import { Router } from 'express';
import { requireAuth, requireOnboarding } from '../../middleware/auth.js';
import { csrfProtection } from '../../middleware/csrf.js';
import { contactLimiter, requestCreateLimiter } from '../../middleware/rateLimit.js';
import { validate } from '../../middleware/validate.js';
import { verifyTurnstile } from '../../utils/turnstile.js';
import { ApiError } from '../../middleware/error.js';
import { createRequestSchema, feedQuerySchema, idParamSchema, reportSchema, statusSchema } from './schema.js';
import { createRequest, listFeed, reportRequest, revealContact, updateStatus } from './service.js';

export const requestsRouter = Router();
requestsRouter.get('/requests', requireAuth, requireOnboarding, validate(feedQuerySchema, 'query'), async (req, res, next) => {
  try { res.json(await listFeed(req.user!, req.query.cursor as string | undefined, req.query.limit as unknown as number)); } catch (error) { next(error); }
});
requestsRouter.post('/requests', requireAuth, requireOnboarding, csrfProtection, requestCreateLimiter, validate(createRequestSchema), async (req, res, next) => {
  try {
    if (!await verifyTurnstile(req.body.turnstileToken, req.ip)) throw new ApiError(400, 'BOT_CHECK_FAILED', 'Verification failed');
    const request = await createRequest(req.user!, req.body);
    res.status(201).json({ request: { id: request._id.toString() } });
  } catch (error) { next(error); }
});
requestsRouter.patch('/requests/:id/status', requireAuth, requireOnboarding, csrfProtection, validate(idParamSchema, 'params'), validate(statusSchema), async (req, res, next) => {
  try { await updateStatus(req.user!, String(req.params.id), req.body.status); res.status(204).send(); } catch (error) { next(error); }
});
requestsRouter.get('/requests/:id/contact', requireAuth, requireOnboarding, contactLimiter, validate(idParamSchema, 'params'), async (req, res, next) => {
  try { res.json({ phone: await revealContact(req.user!, String(req.params.id)) }); } catch (error) { next(error); }
});
requestsRouter.post('/requests/:id/report', requireAuth, requireOnboarding, csrfProtection, validate(idParamSchema, 'params'), validate(reportSchema), async (req, res, next) => {
  try { await reportRequest(req.user!, String(req.params.id), req.body.reason); res.status(204).send(); } catch (error) { next(error); }
});
