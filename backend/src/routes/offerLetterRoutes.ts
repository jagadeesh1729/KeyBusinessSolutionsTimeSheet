import { Router, Request, Response } from 'express';
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import { authenticate } from '../middleware/authMiddleware';
import { requirePMOrAdmin } from '../middleware/roleMiddleware';

dotenv.config();

const router = Router();

const mailer = nodemailer.createTransport({
  host: process.env.IONOS_HOST || 'smtp.ionos.com',
  port: parseInt(process.env.IONOS_PORT || '587', 10),
  secure: false,
  auth: { user: process.env.IONOS_USER, pass: process.env.IONOS_PASS },
});

router.post('/send', authenticate, requirePMOrAdmin, async (req: Request, res: Response) => {
  try {
    const { to, subject, body, pdfBase64, filename } = req.body || {};
    if (!to || !pdfBase64) {
      return res.status(400).json({ success: false, message: 'to and pdfBase64 are required' });
    }
    const from = process.env.IONOS_FROM || process.env.IONOS_USER!;
    await mailer.sendMail({
      from,
      to,
      subject: subject || 'Your Offer Letter',
      html: body || 'Please find your offer letter attached.',
      attachments: [{ filename: filename || 'offer-letter.pdf', content: Buffer.from(pdfBase64, 'base64'), contentType: 'application/pdf' }],
    });
    return res.json({ success: true });
  } catch (e: any) {
    console.error('Offer letter email failed:', e);
    return res.status(500).json({ success: false, message: e?.message || 'Failed to send offer letter' });
  }
});

export default router;

