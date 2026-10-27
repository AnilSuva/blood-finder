import { OAuth2Client, type TokenPayload } from 'google-auth-library';
import type { Request, Response } from 'express';
import { env } from '../../config/env.js';
import { OtpModel, RefreshTokenModel } from './model.js';
import { UserModel, type User } from '../users/model.js';
import { generateOtp, hashOtp, safeOtpEquals } from '../../utils/otp.js';
import { createRefreshToken, hashToken, newFamilyId, setSessionCookies } from '../../utils/tokens.js';
import { sendOtpEmail } from '../../utils/mailer.js';
import { ApiError } from '../../middleware/error.js';

const googleClient = new OAuth2Client();
export const publicUser = (user: User & { _id: { toString(): string } }) => ({
  id: user._id.toString(), email: user.email, name: user.name ?? null, avatarUrl: user.avatarUrl ?? null,
  bloodGroup: user.bloodGroup ?? null, city: user.city ?? null, available: user.available,
  lastDonatedAt: user.lastDonatedAt ?? null, emailAlerts: user.emailAlerts, onboardingComplete: user.onboardingComplete,
  role: user.role,
});

async function createSession(res: Response, user: User & { _id: { toString(): string } }, req: Request): Promise<void> {
  const raw = createRefreshToken();
  await RefreshTokenModel.create({
    userId: user._id, tokenHash: hashToken(raw), familyId: newFamilyId(),
    expiresAt: new Date(Date.now() + env.REFRESH_TOKEN_TTL_DAYS * 86400000),
    userAgent: req.get('user-agent')?.slice(0, 300), ip: req.ip,
  });
  user.lastLoginAt = new Date();
  await user.save();
  setSessionCookies(res, user._id.toString(), raw);
}

export async function requestOtp(email: string): Promise<void> {
  const recent = await OtpModel.findOne({ email }).sort({ createdAt: -1 });
  if (recent && recent.createdAt.getTime() + env.OTP_RESEND_COOLDOWN_SECONDS * 1000 > Date.now()) return;
  const code = generateOtp();
  await OtpModel.deleteMany({ email });
  await OtpModel.create({ email, codeHash: hashOtp(email, code), expiresAt: new Date(Date.now() + env.OTP_TTL_MINUTES * 60000) });
  await sendOtpEmail(email, code);
}

async function findOrCreateEmailUser(email: string): Promise<User & { _id: { toString(): string } }> {
  let user = await UserModel.findOne({ email });
  if (!user) user = await UserModel.create({ email, authProviders: ['email'] });
  else if (!user.authProviders.includes('email')) { user.authProviders.push('email'); await user.save(); }
  if (!user.isActive) throw new ApiError(401, 'UNAUTHENTICATED', 'Sign in is unavailable');
  return user;
}

export async function verifyOtpAndSignIn(email: string, code: string, req: Request, res: Response): Promise<ReturnType<typeof publicUser>> {
  const otp = await OtpModel.findOne({ email }).select('+codeHash').sort({ createdAt: -1 });
  if (!otp || otp.expiresAt <= new Date()) throw new ApiError(401, 'INVALID_OTP', 'Invalid or expired code');
  if (otp.attempts >= env.OTP_MAX_ATTEMPTS) { await otp.deleteOne(); throw new ApiError(401, 'INVALID_OTP', 'Invalid or expired code'); }
  if (!safeOtpEquals(otp.codeHash, email, code)) {
    otp.attempts += 1;
    if (otp.attempts >= env.OTP_MAX_ATTEMPTS) await otp.deleteOne(); else await otp.save();
    throw new ApiError(401, 'INVALID_OTP', 'Invalid or expired code');
  }
  await otp.deleteOne();
  const user = await findOrCreateEmailUser(email);
  await createSession(res, user, req);
  return publicUser(user);
}

export async function googleSignIn(credential: string, req: Request, res: Response): Promise<ReturnType<typeof publicUser>> {
  if (!env.GOOGLE_CLIENT_ID) throw new ApiError(503, 'GOOGLE_NOT_CONFIGURED', 'Google sign-in is unavailable');
  let payload: TokenPayload | undefined;
  try { payload = (await googleClient.verifyIdToken({ idToken: credential, audience: env.GOOGLE_CLIENT_ID })).getPayload(); }
  catch { throw new ApiError(401, 'INVALID_GOOGLE_TOKEN', 'Google sign-in could not be verified'); }
  if (!payload?.email || !payload.email_verified || !payload.sub || !['accounts.google.com', 'https://accounts.google.com'].includes(payload.iss ?? '')) throw new ApiError(401, 'INVALID_GOOGLE_TOKEN', 'Google sign-in could not be verified');
  const email = payload.email.toLowerCase();
  let user = await UserModel.findOne({ $or: [{ googleId: payload.sub }, { email }] });
  if (!user) user = await UserModel.create({ email, googleId: payload.sub, name: payload.name?.slice(0, 80), avatarUrl: payload.picture, authProviders: ['google'] });
  else {
    if (!user.googleId) user.googleId = payload.sub;
    if (!user.authProviders.includes('google')) user.authProviders.push('google');
    if (!user.name && payload.name) user.name = payload.name.slice(0, 80);
    if (!user.isActive) throw new ApiError(401, 'UNAUTHENTICATED', 'Sign in is unavailable');
    await user.save();
  }
  await createSession(res, user, req);
  return publicUser(user);
}

export async function rotateRefresh(req: Request, res: Response): Promise<ReturnType<typeof publicUser>> {
  const raw = req.cookies?.refresh_token;
  if (!raw) throw new ApiError(401, 'UNAUTHENTICATED', 'Session expired');
  const token = await RefreshTokenModel.findOne({ tokenHash: hashToken(raw) }).select('+tokenHash');
  if (!token) throw new ApiError(401, 'UNAUTHENTICATED', 'Session expired');
  if (token.revokedAt || token.expiresAt <= new Date()) {
    await RefreshTokenModel.updateMany({ familyId: token.familyId }, { $set: { revokedAt: new Date() } });
    throw new ApiError(401, 'UNAUTHENTICATED', 'Session expired');
  }
  const user = await UserModel.findById(token.userId);
  if (!user || !user.isActive) throw new ApiError(401, 'UNAUTHENTICATED', 'Session expired');
  token.revokedAt = new Date(); await token.save();
  const replacement = createRefreshToken();
  await RefreshTokenModel.create({ userId: user._id, tokenHash: hashToken(replacement), familyId: token.familyId, expiresAt: new Date(Date.now() + env.REFRESH_TOKEN_TTL_DAYS * 86400000), userAgent: req.get('user-agent')?.slice(0, 300), ip: req.ip });
  setSessionCookies(res, user._id.toString(), replacement);
  return publicUser(user);
}
