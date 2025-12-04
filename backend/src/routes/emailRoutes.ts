import { Router, Request, Response } from 'express';
import nodemailer from 'nodemailer';
import { authenticate } from '../middleware/authMiddleware';
import { requirePMOrAdmin } from '../middleware/roleMiddleware';
import env from '../config/env';
import Logger from '../utils/logger';

const router = Router();

const mailer = nodemailer.createTransport({
  host: env.email.host || 'smtp.office365.com',
  port: env.email.port || 587,
  secure: false,
  auth: { user: env.email.user, pass: env.email.pass },
});

router.post('/send', authenticate, requirePMOrAdmin, async (req: Request, res: Response) => {
  try {
    const { to, subject, html, text } = req.body || {};
    const recipients: string[] = Array.isArray(to)
      ? to
      : typeof to === 'string'
      ? to.split(',').map((s) => s.trim()).filter(Boolean)
      : [];
    if (!recipients.length) {
      return res.status(400).json({ success: false, message: 'Recipient list (to) is required' });
    }
    const from = env.email.from || env.email.user!;
    await mailer.sendMail({ from, to: recipients.join(','), subject: subject || '(no subject)', html: html || text || '' , text });
    return res.json({ success: true });
  } catch (e: any) {
    Logger.error(`Generic email send failed: ${e}`);
    return res.status(500).json({ success: false, message: e?.message || 'Failed to send email' });
  }
});

export default router;
