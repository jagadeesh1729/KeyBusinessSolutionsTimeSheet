import { Router, Request, Response } from 'express';
import nodemailer from 'nodemailer';
import { authenticate } from '../middleware/authMiddleware';
import { requirePMOrAdmin } from '../middleware/roleMiddleware';
import env from '../config/env';
import Logger from '../utils/logger';

const router = Router();

const mailer = nodemailer.createTransport({
  host: env.email.host || 'smtp.ionos.com',
  port: env.email.port,
  secure: false,
  auth: { user: env.email.user, pass: env.email.pass },
});

router.post('/send', authenticate, requirePMOrAdmin, async (req: Request, res: Response) => {
  try {
    const { to, subject, body, pdfBase64, filename } = req.body || {};
    if (!to || !pdfBase64) {
      return res.status(400).json({ success: false, message: 'to and pdfBase64 are required' });
    }
    const from = env.email.from || env.email.user!;
    await mailer.sendMail({
      from,
      to,
      subject: subject || 'Your Offer Letter',
      html: body || 'Please find your offer letter attached.',
      attachments: [{ filename: filename || 'offer-letter.pdf', content: Buffer.from(pdfBase64, 'base64'), contentType: 'application/pdf' }],
    });
    return res.json({ success: true });
  } catch (e: any) {
    Logger.error(`Offer letter email failed: ${e}`);
    return res.status(500).json({ success: false, message: e?.message || 'Failed to send offer letter' });
  }
});

export default router;

