import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import mongoose from 'mongoose';
import request from 'supertest';
import { app } from '../src/app.js';
import { connectDatabase } from '../src/config/db.js';
import * as mailer from '../src/utils/mailer.js';
import { OtpModel, RefreshTokenModel } from '../src/modules/auth/model.js';
import { UserModel } from '../src/modules/users/model.js';

/** Uses an explicitly supplied disposable MongoDB: RUN_INTEGRATION=1 MONGODB_URI=... npm test. */
describe.skipIf(process.env.RUN_INTEGRATION !== '1')('passwordless auth integration', () => {
  const agent = request.agent(app);
  let csrf = '';
  beforeAll(async () => {
    await connectDatabase();
    await Promise.all([OtpModel.deleteMany({}), RefreshTokenModel.deleteMany({}), UserModel.deleteMany({})]);
    csrf = (await agent.get('/api/csrf')).body.csrfToken;
  });
  afterAll(async () => { await mongoose.disconnect(); });
  it('issues an OTP, consumes it once, and establishes a session', async () => {
    let sentCode = '';
    vi.spyOn(mailer, 'sendOtpEmail').mockImplementation(async (_email, code) => { sentCode = code; });
    await agent.post('/api/auth/otp/request').set('Origin', 'http://localhost:3001').set('X-CSRF-Token', csrf).send({ email: 'donor@example.com', turnstileToken: 'test' }).expect(202);
    const signIn = await agent.post('/api/auth/otp/verify').set('Origin', 'http://localhost:3001').set('X-CSRF-Token', csrf).send({ email: 'donor@example.com', code: sentCode }).expect(200);
    expect(signIn.body.user.email).toBe('donor@example.com');
    expect(signIn.body.user.onboardingComplete).toBe(false);
    await agent.get('/api/me').expect(200);
    await agent.post('/api/auth/otp/verify').set('Origin', 'http://localhost:3001').set('X-CSRF-Token', csrf).send({ email: 'donor@example.com', code: sentCode }).expect(401);
  });
});
