const express = require('express');
const router = express.Router();
const db = require('../database/db');
const nodemailer = require('nodemailer');

// Universal Nodemailer Transport (Supports Custom Domain SMTP and Gmail)
let transporter = null;
if (process.env.EMAIL_USER && process.env.EMAIL_PASS && process.env.EMAIL_PASS !== 'your-app-password') {
  const isCustomHost = Boolean(process.env.EMAIL_HOST && process.env.EMAIL_HOST !== 'smtp.gmail.com');
  const transportConfig = isCustomHost ? {
    host: process.env.EMAIL_HOST,
    port: Number(process.env.EMAIL_PORT) || 587,
    secure: process.env.EMAIL_SECURE === 'true' || Number(process.env.EMAIL_PORT) === 465,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  } : {
    service: process.env.EMAIL_SERVICE || 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  };
  transporter = nodemailer.createTransport(transportConfig);
}

function escapeEmailHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function sanitizeHeader(str) {
  if (!str) return '';
  return String(str).replace(/[\r\n]/g, ' ').trim();
}

// POST /api/contact - Public inquiry submission
router.post('/', async (req, res) => {
  try {
    const { name, email, phone, subject, message } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Please provide your full name.' });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email.trim())) {
      return res.status(400).json({ success: false, message: 'Please provide a valid email address.' });
    }

    if (!message || message.trim().length < 5) {
      return res.status(400).json({ success: false, message: 'Please provide a message (minimum 5 characters).' });
    }

    const ip = req.headers['x-forwarded-for']?.split(',')[0].trim() || req.socket.remoteAddress || 'unknown';

    // Store in database
    const insert = db.prepare(`
      INSERT INTO contact_inquiries (name, email, phone, subject, message, ip_address)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    const result = insert.run(
      name.trim(),
      email.trim().toLowerCase(),
      phone ? phone.trim() : null,
      subject ? subject.trim() : 'Customer Boutique Inquiry',
      message.trim(),
      ip
    );

    const cleanName = sanitizeHeader(name);
    const cleanEmail = sanitizeHeader(email).toLowerCase();
    const cleanPhone = phone ? sanitizeHeader(phone) : null;
    const cleanSubject = subject ? sanitizeHeader(subject) : 'Customer Boutique Inquiry';
    const cleanMessage = message.trim().slice(0, 5000);

    // If SMTP configured, send notification email to boutique owner
    if (transporter) {
      try {
        const safeName = escapeEmailHtml(cleanName);
        const safeEmail = escapeEmailHtml(cleanEmail);
        const safePhone = escapeEmailHtml(cleanPhone || 'Not provided');
        const safeSubject = escapeEmailHtml(cleanSubject);
        const safeMessage = escapeEmailHtml(cleanMessage).replace(/\n/g, '<br>');

        await transporter.sendMail({
          from: `"RJ Fashion Concierge" <${process.env.EMAIL_USER}>`,
          to: process.env.ADMIN_NOTIFY_EMAIL || 'rjfashioncollection@gmail.com',
          replyTo: cleanEmail,
          subject: `✨ New Inquiry from ${cleanName.slice(0, 50)} - RJ Fashion Collection`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
              <h2 style="color: #72132A; margin-top: 0;">👑 New Customer Inquiry</h2>
              <p><strong>Name:</strong> ${safeName}</p>
              <p><strong>Email:</strong> <a href="mailto:${safeEmail}">${safeEmail}</a></p>
              <p><strong>Phone:</strong> ${safePhone}</p>
              <p><strong>Subject:</strong> ${safeSubject}</p>
              <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 16px 0;">
              <p><strong>Message:</strong></p>
              <div style="background: #f8fafc; padding: 14px; border-radius: 6px; font-style: italic;">
                ${safeMessage}
              </div>
            </div>
          `
        });
      } catch (mailErr) {
        console.warn('SMTP delivery notice: Failed to send email alert, but inquiry was safely saved to DB:', mailErr.message);
      }
    }

    res.status(201).json({
      success: true,
      message: 'Thank you! Your message has been received. Our concierge team will reach out to you within 24 hours.'
    });
  } catch (error) {
    console.error('Error handling contact submission:', error);
    res.status(500).json({ success: false, message: 'Unable to submit your inquiry at this moment. Please try again or WhatsApp us directly.' });
  }
});

// GET /api/contact - View inquiries (Admin only)
router.get('/', (req, res) => {
  if (!req.session?.user || req.session.user.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Forbidden' });
  }

  try {
    const inquiries = db.prepare('SELECT * FROM contact_inquiries ORDER BY created_at DESC LIMIT 100').all();
    res.json({ success: true, inquiries });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to retrieve inquiries' });
  }
});

module.exports = router;
