import type { RequestHandler } from 'express';
import { UserModel } from '../modules/users/model.js';
import { verifyAccessToken } from '../utils/tokens.js';
import { ApiError } from './error.js';

export const requireAuth: RequestHandler = async (req, _res, next) => {
  try {
    const token = req.cookies?.access_token;
    if (!token) throw new ApiError(401, 'UNAUTHENTICATED', 'Sign in is required');
    const payload = verifyAccessToken(token);
    if (payload.type !== 'access') throw new ApiError(401, 'UNAUTHENTICATED', 'Sign in is required');
    const user = await UserModel.findById(payload.sub);
    if (!user || !user.isActive) throw new ApiError(401, 'UNAUTHENTICATED', 'Sign in is required');
    req.user = user;
    return next();
  } catch (error) { return next(error instanceof ApiError ? error : new ApiError(401, 'UNAUTHENTICATED', 'Sign in is required')); }
};
export const requireOnboarding: RequestHandler = (req, _res, next) => req.user?.onboardingComplete ? next() : next(new ApiError(403, 'ONBOARDING_REQUIRED', 'Complete your profile first'));
