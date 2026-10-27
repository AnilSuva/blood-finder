import { Router } from 'express';
import { validate } from '../../middleware/validate.js';
import { requireAuth, requireOnboarding } from '../../middleware/auth.js';
import { csrfProtection } from '../../middleware/csrf.js';
import { ApiError } from '../../middleware/error.js';
import { CityModel } from '../cities/model.js';
import { ContactRevealModel, BloodRequestModel, ReportModel } from '../requests/model.js';
import { RefreshTokenModel, OtpModel } from '../auth/model.js';
import { publicUser } from '../auth/service.js';
import { onboardingSchema, profileSchema } from './schema.js';
import { cleanText } from '../../utils/text.js';

export const usersRouter = Router();
usersRouter.get('/me', requireAuth, (req, res) => res.json({ user: publicUser(req.user!) }));
async function assertCity(slug: string): Promise<void> {
  if (!await CityModel.exists({ slug })) throw new ApiError(400, 'INVALID_CITY', 'Choose a city from the list');
}
usersRouter.patch('/me/onboarding', requireAuth, csrfProtection, validate(onboardingSchema), async (req, res, next) => {
  try {
    await assertCity(req.body.city);
    const user = req.user!;
    user.name = cleanText(req.body.name); user.bloodGroup = req.body.bloodGroup; user.city = req.body.city;
    user.consentAcceptedAt = new Date(); user.onboardingComplete = true;
    await user.save(); res.json({ user: publicUser(user) });
  } catch (error) { next(error); }
});
usersRouter.patch('/me', requireAuth, requireOnboarding, csrfProtection, validate(profileSchema), async (req, res, next) => {
  try {
    if (req.body.city) await assertCity(req.body.city);
    const user = req.user!;
    if (req.body.name !== undefined) user.name = cleanText(req.body.name);
    if (req.body.bloodGroup !== undefined) user.bloodGroup = req.body.bloodGroup;
    if (req.body.city !== undefined) user.city = req.body.city;
    if (req.body.available !== undefined) user.available = req.body.available;
    if (req.body.lastDonatedAt !== undefined) user.lastDonatedAt = req.body.lastDonatedAt;
    if (req.body.emailAlerts !== undefined) user.emailAlerts = req.body.emailAlerts;
    await user.save(); res.json({ user: publicUser(user) });
  } catch (error) { next(error); }
});
usersRouter.delete('/me', requireAuth, csrfProtection, async (req, res, next) => {
  try {
    const userId = req.user!._id;
    const requests = await BloodRequestModel.find({ requesterId: userId }).select('_id').lean();
    const ids = requests.map((request) => request._id);
    await Promise.all([
      ContactRevealModel.deleteMany({ $or: [{ userId }, { requestId: { $in: ids } }] }),
      ReportModel.deleteMany({ $or: [{ reporterId: userId }, { requestId: { $in: ids } }] }),
      BloodRequestModel.deleteMany({ requesterId: userId }), RefreshTokenModel.deleteMany({ userId }),
      OtpModel.deleteMany({ email: req.user!.email }), req.user!.deleteOne(),
    ]);
    res.clearCookie('access_token', { path: '/' });
    res.clearCookie('refresh_token', { path: '/api/auth' });
    res.status(204).send();
  } catch (error) { next(error); }
});
