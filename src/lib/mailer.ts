// 📁 src/lib/mailer.ts
import nodemailer from "nodemailer";

// ✅ Gmail SMTP Transporter
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: { 
    user: process.env.SMTP_USER, 
    pass: process.env.SMTP_PASS 
  },
});

// ✅ PKR Formatter (existing)
function formatPKR(amount: number) {
  return `Rs. ${Math.round(amount).toLocaleString("en-PK")}`;
}

// ── Types (existing + new) ──────────────────────────────────
interface OrderItem {
  productName: string;
  quantity: number;
  price: number;
  size: string;
  color: string;
}

interface ShippingAddress {
  fullName: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  zip: string;
  country: string;
}

interface OrderEmailData {
  orderId: number;
  toEmail: string;
  toName: string;
  items: OrderItem[];
  subtotal: number;
  shippingCost: number;
  total: number;
  shippingAddress: ShippingAddress;
}

// ── Email: Order Confirmation (existing) ─────────────────────
export async function sendOrderConfirmation(data: OrderEmailData): Promise<void> {
  const itemsHtml = data.items
    .map(
      (item) => `
      <tr>
        <td style="padding:12px 0;border-bottom:1px solid #f0f0f0;">
          <strong>${item.productName}</strong><br/>
          <span style="color:#888;font-size:13px;">${item.color} / Size ${item.size} × ${item.quantity}</span>
        </td>
        <td style="padding:12px 0;border-bottom:1px solid #f0f0f0;text-align:right;font-weight:600;">
          ${formatPKR(item.price * item.quantity)}
        </td>
      </tr>`
    )
    .join("");

  const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8"/></head>
<body style="margin:0;padding:0;background:#f9f9f9;font-family:'Helvetica Neue',Arial,sans-serif;">
  <div style="max-width:600px;margin:40px auto;background:#fff;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
    <div style="background:#111;padding:32px 40px;">
      <h1 style="margin:0;color:#fff;font-size:22px;letter-spacing:1px;">Soft Chappal</h1>
      <p style="margin:6px 0 0;color:#aaa;font-size:13px;">Order Confirmed</p>
    </div>
    <div style="padding:36px 40px;">
      <h2 style="margin:0 0 8px;color:#111;">Thankyou, ${data.toName}!</h2>
      <p style="color:#555;margin:0 0 24px;">Order #${data.orderId} is done.</p>
      <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
        <thead><tr>
          <th style="text-align:left;padding-bottom:12px;color:#888;font-size:11px;text-transform:uppercase;border-bottom:2px solid #eee;">Product</th>
          <th style="text-align:right;padding-bottom:12px;color:#888;font-size:11px;text-transform:uppercase;border-bottom:2px solid #eee;">Price</th>
        </tr></thead>
        <tbody>${itemsHtml}</tbody>
      </table>
      <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:20px;">
        <tr><td style="padding:6px 0;color:#555;">Subtotal</td><td style="text-align:right;color:#555;">${formatPKR(data.subtotal)}</td></tr>
        <tr><td style="padding:6px 0;color:#555;">Shipping</td><td style="text-align:right;color:#555;">${data.shippingCost === 0 ? "Free" : formatPKR(data.shippingCost)}</td></tr>
        <tr style="border-top:2px solid #111;">
          <td style="padding:12px 0 0;font-weight:700;font-size:16px;color:#111;">Total</td>
          <td style="padding:12px 0 0;text-align:right;font-weight:700;font-size:16px;color:#111;">${formatPKR(data.total)}</td>
        </tr>
      </table>
      <div style="margin-top:32px;padding:20px;background:#f9f9f9;">
        <p style="margin:0 0 8px;font-size:11px;text-transform:uppercase;color:#888;font-weight:600;">Delivery Address</p>
        <p style="margin:0;color:#333;line-height:1.7;">
          ${data.shippingAddress.fullName}<br/>
          ${data.shippingAddress.line1}${data.shippingAddress.line2 ? ", " + data.shippingAddress.line2 : ""}<br/>
          ${data.shippingAddress.city}, ${data.shippingAddress.state} ${data.shippingAddress.zip}<br/>
          ${data.shippingAddress.country}
        </p>
      </div>
    </div>
    <div style="background:#f4f4f4;padding:24px 40px;text-align:center;">
      <p style="margin:0;color:#999;font-size:12px;">Soft Chappal · Premium Pakistani Footwear</p>
    </div>
  </div>
</body></html>`;

  await transporter.sendMail({
    from: `"Soft Chappal" <${process.env.SMTP_USER}>`,
    to: data.toEmail,
    subject: `Order Confirmed #${data.orderId} — Soft Chappal`,
    html,
  });
}

// ── Email: Verification (NEW for NextAuth) ───────────────────
export async function sendVerificationEmail(email: string, userId: string): Promise<void> {
  // Generate token (simple hash for demo; use crypto in production)
  const token = Buffer.from(`${userId}:${Date.now()}`).toString("base64");
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
  const verifyUrl = `${baseUrl}/api/auth/verify-email?token=${token}`;

  const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8"/></head>
<body style="margin:0;padding:0;background:#f9f9f9;font-family:'Helvetica Neue',Arial,sans-serif;">
  <div style="max-width:600px;margin:40px auto;background:#fff;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
    <div style="background:#111;padding:32px 40px;text-align:center;">
      <h1 style="margin:0;color:#fff;font-size:22px;letter-spacing:1px;">Soft Chappal</h1>
    </div>
    <div style="padding:36px 40px;text-align:center;">
      <h2 style="margin:0 0 16px;color:#111;">Verify Your Email</h2>
      <p style="color:#555;margin:0 0 24px;line-height:1.6;">
        Thank you for signing up! Please click the button below to verify your email address and activate your account.
      </p>
      <a href="${verifyUrl}" style="display:inline-block;padding:14px 32px;background:#111;color:#fff;text-decoration:none;border-radius:4px;font-weight:600;">
        Verify Email Address
      </a>
      <p style="color:#888;font-size:13px;margin:24px 0 0;">
        Or copy and paste this link in your browser:<br/>
        <a href="${verifyUrl}" style="color:#111;">${verifyUrl}</a>
      </p>
      <p style="color:#999;font-size:12px;margin:32px 0 0;">
        This link will expire in 24 hours. If you didn't create an account, please ignore this email.
      </p>
    </div>
    <div style="background:#f4f4f4;padding:24px 40px;text-align:center;">
      <p style="margin:0;color:#999;font-size:12px;">Soft Chappal · Premium Pakistani Footwear</p>
    </div>
  </div>
</body></html>`;

  await transporter.sendMail({
    from: `"Soft Chappal" <${process.env.SMTP_USER}>`,
    to: email,
    subject: "Verify Your Email — Soft Chappal",
    html,
  });
}

// ── Email: Password Reset (NEW for NextAuth) ─────────────────
export async function sendPasswordResetEmail(email: string, token: string): Promise<void> {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
  const resetUrl = `${baseUrl}/auth/reset-password?token=${token}`;

  const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8"/></head>
<body style="margin:0;padding:0;background:#f9f9f9;font-family:'Helvetica Neue',Arial,sans-serif;">
  <div style="max-width:600px;margin:40px auto;background:#fff;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
    <div style="background:#111;padding:32px 40px;text-align:center;">
      <h1 style="margin:0;color:#fff;font-size:22px;letter-spacing:1px;">Soft Chappal</h1>
    </div>
    <div style="padding:36px 40px;text-align:center;">
      <h2 style="margin:0 0 16px;color:#111;">Reset Your Password</h2>
      <p style="color:#555;margin:0 0 24px;line-height:1.6;">
        We received a request to reset your password. Click the button below to choose a new password.
      </p>
      <a href="${resetUrl}" style="display:inline-block;padding:14px 32px;background:#111;color:#fff;text-decoration:none;border-radius:4px;font-weight:600;">
        Reset Password
      </a>
      <p style="color:#888;font-size:13px;margin:24px 0 0;">
        Or copy and paste this link in your browser:<br/>
        <a href="${resetUrl}" style="color:#111;">${resetUrl}</a>
      </p>
      <p style="color:#999;font-size:12px;margin:32px 0 0;">
        This link will expire in 1 hour. If you didn't request this, please ignore this email.
      </p>
    </div>
    <div style="background:#f4f4f4;padding:24px 40px;text-align:center;">
      <p style="margin:0;color:#999;font-size:12px;">Soft Chappal · Premium Pakistani Footwear</p>
    </div>
  </div>
</body></html>`;

  await transporter.sendMail({
    from: `"Soft Chappal" <${process.env.SMTP_USER}>`,
    to: email,
    subject: "Reset Your Password — Soft Chappal",
    html,
  });
}

// 📁 src/lib/mailer.ts (end mein add karein)

import { formatOtp } from "@/lib/otp";

// ── Email: OTP Verification (NEW) ───────────────────────────
export async function sendOtpVerificationEmail(email: string, otp: string): Promise<void> {
  const formattedOtp = formatOtp(otp);
  
  const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8"/></head>
<body style="margin:0;padding:0;background:#f9f9f9;font-family:'Helvetica Neue',Arial,sans-serif;">
  <div style="max-width:600px;margin:40px auto;background:#fff;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
    <div style="background:#111;padding:32px 40px;text-align:center;">
      <h1 style="margin:0;color:#fff;font-size:22px;letter-spacing:1px;">Soft Chappal</h1>
    </div>
    <div style="padding:36px 40px;text-align:center;">
      <h2 style="margin:0 0 16px;color:#111;">Verify Your Email</h2>
      <p style="color:#555;margin:0 0 24px;line-height:1.6;">
        Thank you for signing up! Please enter the following OTP code to verify your email address:
      </p>
      
      <!-- OTP Code Box -->
      <div style="background:#f4f4f4;padding:20px;border-radius:8px;margin:24px 0;display:inline-block;">
        <span style="font-size:32px;font-weight:700;letter-spacing:8px;color:#111;">${formattedOtp}</span>
      </div>
      
      <p style="color:#888;font-size:13px;margin:24px 0 0;">
        This code will expire in <strong>10 minutes</strong>.<br/>
        If you didn't create an account, please ignore this email.
      </p>
      
      <p style="color:#999;font-size:12px;margin:32px 0 0;">
        For security reasons, this OTP can only be used 3 times.
      </p>
    </div>
    <div style="background:#f4f4f4;padding:24px 40px;text-align:center;">
      <p style="margin:0;color:#999;font-size:12px;">Soft Chappal · Premium Pakistani Footwear</p>
    </div>
  </div>
</body></html>`;

  await transporter.sendMail({
    from: `"Soft Chappal" <${process.env.SMTP_USER}>`,
    to: email,
    subject: "Your Verification Code — Soft Chappal",
    html,
    text: `Your verification code is: ${otp}`, // Plain text fallback
  });
}