// RJ FASHION COLLECTION - Email Service (Nodemailer)
const nodemailer = require('nodemailer');

const EMAIL_ENABLED = process.env.EMAIL_ENABLED === 'true';

let transporter = null;

function getTransporter() {
  if (transporter) return transporter;
  transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: Number(process.env.EMAIL_PORT) || 587,
    secure: process.env.EMAIL_SECURE === 'true',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });
  return transporter;
}

async function sendOrderConfirmation(order, items) {
  if (!EMAIL_ENABLED) {
    console.log(`[Email Service] EMAIL_ENABLED=false — Skipping order confirmation email for ${order.order_number}`);
    return { success: true, skipped: true };
  }

  const itemsHtml = items.map(item => `
    <tr style="border-bottom: 1px solid #f0e6e6;">
      <td style="padding: 10px 8px; font-size: 14px;">${item.product_name}</td>
      <td style="padding: 10px 8px; font-size: 14px; text-align: center;">${item.size || '-'}</td>
      <td style="padding: 10px 8px; font-size: 14px; text-align: center;">${item.quantity}</td>
      <td style="padding: 10px 8px; font-size: 14px; text-align: right;">₹${Number(item.price).toLocaleString('en-IN')}</td>
      <td style="padding: 10px 8px; font-size: 14px; font-weight: 600; text-align: right;">₹${Number(item.total).toLocaleString('en-IN')}</td>
    </tr>
  `).join('');

  const html = `
  <!DOCTYPE html>
  <html>
  <head><meta charset="utf-8"><title>Order Confirmation - RJ Fashion Collection</title></head>
  <body style="margin: 0; padding: 0; background-color: #f9f5f5; font-family: 'Segoe UI', Arial, sans-serif;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f9f5f5; padding: 30px 0;">
      <tr><td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 12px rgba(0,0,0,0.08);">
          <!-- Header -->
          <tr><td style="background: linear-gradient(135deg, #7a003c, #a0004e); padding: 32px 40px; text-align: center;">
            <h1 style="color: #c59b27; font-size: 26px; margin: 0 0 4px; font-family: Georgia, serif;">RJ Fashion Collection</h1>
            <p style="color: #fff; margin: 0; font-size: 13px; opacity: 0.85;">Your Style, Your Story</p>
          </td></tr>

          <!-- Order Confirmed Banner -->
          <tr><td style="background: #f0f9f0; padding: 20px 40px; text-align: center; border-bottom: 1px solid #d4edda;">
            <p style="font-size: 24px; margin: 0;">✅</p>
            <h2 style="color: #1a7a3c; margin: 8px 0 4px; font-size: 20px;">Order Confirmed!</h2>
            <p style="color: #4a5568; margin: 0; font-size: 14px;">Thank you, <strong>${order.customer_name}</strong>! Your order has been placed successfully.</p>
          </td></tr>

          <!-- Order Details -->
          <tr><td style="padding: 28px 40px;">
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td style="width: 50%; vertical-align: top; padding-right: 12px;">
                  <p style="font-size: 12px; color: #888; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 4px;">Order Number</p>
                  <p style="font-size: 18px; font-weight: 700; color: #7a003c; margin: 0;">${order.order_number}</p>
                </td>
                <td style="width: 50%; vertical-align: top; padding-left: 12px;">
                  <p style="font-size: 12px; color: #888; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 4px;">Payment Method</p>
                  <p style="font-size: 15px; font-weight: 600; color: #333; margin: 0;">${order.payment_method}</p>
                </td>
              </tr>
            </table>

            <!-- Items Table -->
            <h3 style="font-size: 15px; color: #7a003c; margin: 24px 0 12px; border-bottom: 2px solid #f0e6e6; padding-bottom: 8px;">Items Ordered</h3>
            <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse: collapse;">
              <thead>
                <tr style="background: #fdf0f5;">
                  <th style="padding: 8px; font-size: 12px; text-align: left; color: #7a003c;">Product</th>
                  <th style="padding: 8px; font-size: 12px; text-align: center; color: #7a003c;">Size</th>
                  <th style="padding: 8px; font-size: 12px; text-align: center; color: #7a003c;">Qty</th>
                  <th style="padding: 8px; font-size: 12px; text-align: right; color: #7a003c;">Price</th>
                  <th style="padding: 8px; font-size: 12px; text-align: right; color: #7a003c;">Total</th>
                </tr>
              </thead>
              <tbody>
                ${itemsHtml}
              </tbody>
            </table>

            <!-- Order Summary -->
            <table width="100%" cellpadding="0" cellspacing="0" style="margin-top: 16px; border-top: 2px solid #f0e6e6; padding-top: 16px;">
              <tr><td style="padding: 4px 0; color: #666; font-size: 14px;">Subtotal</td><td style="text-align: right; font-size: 14px;">₹${Number(order.subtotal).toLocaleString('en-IN')}</td></tr>
              ${order.discount > 0 ? `<tr><td style="padding: 4px 0; color: #16a34a; font-size: 14px;">Discount</td><td style="text-align: right; color: #16a34a; font-size: 14px;">-₹${Number(order.discount).toLocaleString('en-IN')}</td></tr>` : ''}
              <tr><td style="padding: 4px 0; color: #666; font-size: 14px;">Shipping</td><td style="text-align: right; font-size: 14px;">${order.shipping === 0 ? '<span style="color: #16a34a;">FREE</span>' : `₹${order.shipping}`}</td></tr>
              <tr style="border-top: 1px solid #f0e6e6;"><td style="padding: 10px 0 4px; font-size: 18px; font-weight: 700; color: #7a003c;">Total Paid</td><td style="text-align: right; font-size: 18px; font-weight: 700; color: #7a003c; padding-top: 10px;">₹${Number(order.total).toLocaleString('en-IN')}</td></tr>
            </table>

            <!-- Delivery Address -->
            <h3 style="font-size: 15px; color: #7a003c; margin: 24px 0 10px; border-bottom: 2px solid #f0e6e6; padding-bottom: 8px;">Delivery Address</h3>
            <p style="font-size: 14px; color: #4a5568; line-height: 1.7; margin: 0;">${order.delivery_address.replace(/\n/g, '<br>')}</p>

            <!-- CTA -->
            <div style="text-align: center; margin: 30px 0 10px;">
              <a href="http://localhost:3000/orders.html" style="background: #7a003c; color: #fff; padding: 13px 32px; border-radius: 6px; text-decoration: none; font-weight: 700; font-size: 14px; letter-spacing: 0.5px;">TRACK MY ORDER</a>
            </div>
          </td></tr>

          <!-- Footer -->
          <tr><td style="background: #fdf0f5; padding: 20px 40px; text-align: center; border-top: 1px solid #f0e6e6;">
            <p style="font-size: 13px; color: #888; margin: 0;">Questions? Contact us at <a href="mailto:support@rjfashion.com" style="color: #7a003c;">support@rjfashion.com</a></p>
            <p style="font-size: 12px; color: #aaa; margin: 6px 0 0;">© 2026 RJ Fashion Collection. All rights reserved.</p>
          </td></tr>
        </table>
      </td></tr>
    </table>
  </body>
  </html>
  `;

  try {
    await getTransporter().sendMail({
      from: process.env.EMAIL_FROM || 'RJ Fashion Collection <noreply@rjfashion.com>',
      to: order.customer_email,
      subject: `✅ Order Confirmed — ${order.order_number} | RJ Fashion Collection`,
      html
    });
    console.log(`[Email Service] Order confirmation sent to ${order.customer_email}`);
    return { success: true };
  } catch (err) {
    console.error('[Email Service] Failed to send email:', err.message);
    return { success: false, error: err.message };
  }
}

async function sendAdmin2faOtp(email, otp, ip = '') {
  const subject = `🛡️ RJ Fashion Collection — Admin 2-Step Verification Code [${otp}]`;
  const html = `
  <!DOCTYPE html>
  <html>
  <head><meta charset="utf-8"><title>Admin 2-Step Verification</title></head>
  <body style="margin: 0; padding: 0; background-color: #070d1e; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #ffffff;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #070d1e; padding: 40px 0;">
      <tr><td align="center">
        <table width="560" cellpadding="0" cellspacing="0" style="background: #0b1426; border: 1px solid rgba(212, 175, 55, 0.4); border-radius: 12px; overflow: hidden; box-shadow: 0 10px 40px rgba(0,0,0,0.6);">
          <tr><td style="background: #060b18; padding: 28px 36px; text-align: center; border-bottom: 1px solid rgba(212, 175, 55, 0.2);">
            <div style="font-size: 20px; font-weight: 800; color: #d4af37; letter-spacing: 2px;">RJ FASHION COLLECTION</div>
            <div style="font-size: 11px; color: #94a3b8; letter-spacing: 1.5px; text-transform: uppercase; margin-top: 4px;">Private Administrative Security Gateway</div>
          </td></tr>
          <tr><td style="padding: 36px 40px; text-align: center;">
            <div style="display: inline-block; padding: 8px 16px; background: rgba(212, 175, 55, 0.1); border: 1px solid rgba(212, 175, 55, 0.3); border-radius: 20px; color: #d4af37; font-size: 12px; font-weight: 700; letter-spacing: 1px; text-transform: uppercase; margin-bottom: 20px;">2-Step Verification</div>
            <h2 style="color: #ffffff; font-size: 22px; margin: 0 0 12px; font-weight: 700;">Sign-In Security Code</h2>
            <p style="color: #cbd5e1; font-size: 14px; line-height: 1.6; margin: 0 0 28px;">Use the 6-digit verification code below to complete your administrator sign-in. This code is valid for <strong>5 minutes</strong>.</p>
            <div style="background: #060b18; border: 1px solid #d4af37; border-radius: 8px; padding: 18px 24px; font-size: 34px; letter-spacing: 8px; font-weight: 800; color: #ffffff; font-family: monospace; display: inline-block; margin-bottom: 24px;">${otp}</div>
            <p style="color: #94a3b8; font-size: 12px; line-height: 1.5; margin: 0;">Request originated from IP: <strong>${ip || 'Protected Gateway'}</strong>.<br>If you did not initiate this administrator sign-in, please reset your password immediately.</p>
          </td></tr>
          <tr><td style="background: #060b18; padding: 16px 20px; text-align: center; border-top: 1px solid rgba(255,255,255,0.05); font-size: 11px; color: #64748b;">
            © 2026 RJ Fashion Collection. Confidential Administrative Communication.
          </td></tr>
        </table>
      </td></tr>
    </table>
  </body>
  </html>
  `;

  console.log(`[RJFC-SECURITY] 🛡️ 2-Step Verification Code for Admin (${email}): ${otp}`);

  if (!EMAIL_ENABLED) {
    return { success: true, logged: true, code: otp };
  }

  try {
    const t = getTransporter();
    await t.sendMail({
      from: `"RJ Fashion Security" <${process.env.EMAIL_FROM || process.env.EMAIL_USER || 'security@rj-fashion-collection.web.app'}>`,
      to: email,
      subject,
      html
    });
    return { success: true, sent: true };
  } catch (err) {
    console.error('[Email Service] Failed to send 2FA email:', err.message);
    return { success: true, fallbackLogged: true, code: otp };
  }
}

module.exports = { sendOrderConfirmation, sendAdmin2faOtp };
