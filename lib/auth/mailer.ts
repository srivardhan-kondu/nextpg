import nodemailer from 'nodemailer';
import { siteConfig } from '@/config/site';
import { features } from '@/lib/env';
import { OTP_TTL_MINUTES } from './otp';

function transport() {
  return nodemailer.createTransport({
    host: process.env.EMAIL_SERVER_HOST,
    port: Number(process.env.EMAIL_SERVER_PORT ?? 587),
    secure: Number(process.env.EMAIL_SERVER_PORT ?? 587) === 465,
    auth:
      process.env.EMAIL_SERVER_USER && process.env.EMAIL_SERVER_PASSWORD
        ? { user: process.env.EMAIL_SERVER_USER, pass: process.env.EMAIL_SERVER_PASSWORD }
        : undefined,
  });
}

function otpTemplate(otp: string) {
  return `<!doctype html><html><body style="margin:0;background:#f7f9fc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;padding:32px 16px">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center">
    <table role="presentation" width="100%" style="max-width:480px;background:#fff;border:1px solid #e2e8f0;border-radius:14px;overflow:hidden">
      <tr><td style="padding:28px 32px 8px">
        <div style="font-size:20px;font-weight:700;color:#2563eb;letter-spacing:-0.02em">${siteConfig.brand}</div>
      </td></tr>
      <tr><td style="padding:8px 32px 0">
        <h1 style="margin:0 0 6px;font-size:19px;color:#0f172a">Your sign-in code</h1>
        <p style="margin:0 0 20px;font-size:14px;color:#64748b;line-height:1.6">Enter this code to sign in. It expires in ${OTP_TTL_MINUTES} minutes.</p>
      </td></tr>
      <tr><td style="padding:0 32px">
        <div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:10px;padding:18px;text-align:center">
          <span style="font-size:32px;font-weight:700;letter-spacing:10px;color:#1d4ed8;font-family:ui-monospace,SFMono-Regular,monospace">${otp}</span>
        </div>
      </td></tr>
      <tr><td style="padding:20px 32px 30px">
        <p style="margin:0;font-size:12px;color:#94a3b8;line-height:1.6">If you didn't request this code, you can safely ignore this email — no one can sign in without it.</p>
      </td></tr>
    </table>
    <p style="margin:16px 0 0;font-size:11px;color:#94a3b8">${siteConfig.brand} · ${siteConfig.tagline}</p>
  </td></tr></table></body></html>`;
}

export async function sendOtpEmail(email: string, otp: string): Promise<void> {
  if (!features.emailOtp) {
    // Dev fallback: surface the code in the server log instead of failing signup.
    console.info(`[dev] OTP for ${email}: ${otp}`);
    return;
  }
  await transport().sendMail({
    to: email,
    from: process.env.EMAIL_FROM,
    subject: `${otp} is your ${siteConfig.brand} sign-in code`,
    text: `Your ${siteConfig.brand} sign-in code is ${otp}. It expires in ${OTP_TTL_MINUTES} minutes.`,
    html: otpTemplate(otp),
  });
}
