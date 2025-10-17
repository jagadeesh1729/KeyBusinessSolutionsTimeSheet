import { Router, Request, Response } from 'express';
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import { authenticate } from '../middleware/authMiddleware';
import { requirePMOrAdmin } from '../middleware/roleMiddleware';

dotenv.config();

const router = Router();

const mailer = nodemailer.createTransport({
  host: 'smtp.office365.com',
  port: 587,
  secure: false,
  auth: { user: 'Timesheet@keybusinessglobal.com', pass: 'DucK@5637' },
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
    const from = process.env.IONOS_FROM || process.env.IONOS_USER!;
    await mailer.sendMail({ from, to: recipients.join(','), subject: subject || '(no subject)', html: html || text || '' , text });
    return res.json({ success: true });
  } catch (e: any) {
    console.error('Generic email send failed:', e);
    return res.status(500).json({ success: false, message: e?.message || 'Failed to send email' });
  }
});

export default router;
