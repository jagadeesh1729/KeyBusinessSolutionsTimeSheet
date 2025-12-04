import { Router, Request, Response } from 'express';
import nodemailer from 'nodemailer';
import { Client } from '@microsoft/microsoft-graph-client';
import { ClientSecretCredential } from '@azure/identity';
import 'isomorphic-fetch';
import dotenv from 'dotenv';
import { authenticate } from '../middleware/authMiddleware';
import { requirePMOrAdmin } from '../middleware/roleMiddleware';
import env from '../config/env';
import Logger from '../utils/logger';

const outer = Router();

const mailer = nodemailer.createTransport({
  host: env.email.host || 'smtp.office365.com',
  port: env.email.port || 587,
  secure: false,
  auth: { user: env.email.user, pass: env.email.pass },
});
const tenantId = process.env.MS_TENANT_ID!;
const clientId = process.env.MS_CLIENT_ID!;
const clientSecret = process.env.MS_CLIENT_SECRET!;
const fromEmail = 'Timesheet@keybusinessglobal.com'; // keep your existing from email here

const credential = new ClientSecretCredential(tenantId, clientId, clientSecret);

async function getAccessToken() {
  const scope = 'https://graph.microsoft.com/.default';
  const token = await credential.getToken(scope);
  if (!token) throw new Error('Failed to get access token');
  return token.token;
}

async function getGraphClient() {
  const token = await getAccessToken();
  return Client.init({
    authProvider: (done: (err: any, token?: string | null) => void) => done(null, token),
  });
}

async function sendMail(to: string[], subject: string, htmlBody: string, textBody?: string) {
  const client = await getGraphClient();

  const message = {
    message: {
      subject,
      body: {
        contentType: 'HTML',
        content: htmlBody,
      },
      toRecipients: to.map(email => ({ emailAddress: { address: email } })),
      from: { emailAddress: { address: fromEmail } },
    },
    saveToSentItems: true,
  };

  await client.api(`/users/${fromEmail}/sendMail`).post(message);
}

outer.post('/send', authenticate, requirePMOrAdmin, async (req: Request, res: Response) => {
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

    await sendMail(recipients, subject || '(no subject)', html || text || '', text);

    return res.json({ success: true });
  } catch (e: any) {
    Logger.error(`Generic email send failed: ${e}`);
    return res.status(500).json({ success: false, message: e?.message || 'Failed to send email' });
  }
});
export default outer;