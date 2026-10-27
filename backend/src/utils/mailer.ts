import nodemailer from 'nodemailer';
import { env } from '../config/env.js';

const transport = env.SMTP_HOST
  ? nodemailer.createTransport({ host: env.SMTP_HOST, port: env.SMTP_PORT, secure: env.SMTP_PORT === 465, auth: { user: env.SMTP_USER, pass: env.SMTP_PASS } })
  : nodemailer.createTransport({ jsonTransport: true });

export async function sendOtpEmail(email: string, code: string): Promise<void> {
  await transport.sendMail({
    from: env.EMAIL_FROM,
    to: email,
    subject: 'Your BloodFinder sign-in code',
    text: `Your BloodFinder code is ${code}. It expires in ${env.OTP_TTL_MINUTES} minutes. Do not share it.`,
  });
}
