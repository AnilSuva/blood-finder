import { describe, expect, it } from 'vitest';
import { generateOtp, hashOtp, safeOtpEquals } from '../src/utils/otp.js';
describe('OTP primitives', () => {
  it('creates a six-digit code and verifies only the right code/email pair', () => {
    const code = generateOtp(); const hash = hashOtp('donor@example.com', code);
    expect(code).toMatch(/^\d{6}$/); expect(safeOtpEquals(hash, 'donor@example.com', code)).toBe(true); expect(safeOtpEquals(hash, 'other@example.com', code)).toBe(false);
  });
});
