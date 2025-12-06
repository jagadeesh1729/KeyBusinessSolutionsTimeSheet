import { Router, Request, Response } from 'express';
import { Client } from '@microsoft/microsoft-graph-client';
import { ClientSecretCredential } from '@azure/identity';
import 'isomorphic-fetch';
import dotenv from 'dotenv';
import { authenticate } from '../middleware/authMiddleware';
import { requirePMOrAdmin } from '../middleware/roleMiddleware';
import Logger from '../utils/logger';

const outer = Router();

const tenantId = process.env.MS_TENANT_ID || '';
const clientId = process.env.MS_CLIENT_ID || '';
const clientSecret = process.env.MS_CLIENT_SECRET || '';
const fromEmail = 'Timesheet@keybusinessglobal.com';

let credential: InstanceType<typeof ClientSecretCredential> | null = null;

function getCredential(): InstanceType<typeof ClientSecretCredential> {
  if (!credential) {
    if (!tenantId || !clientId || !clientSecret) {
      throw new Error('Azure credentials (MS_TENANT_ID, MS_CLIENT_ID, MS_CLIENT_SECRET) are not configured');
    }
    credential = new ClientSecretCredential(tenantId, clientId, clientSecret);
  }
  return credential;
}

async function getAccessToken() {
  const scope = 'https://graph.microsoft.com/.default';
  const token = await getCredential().getToken(scope);
  if (!token) throw new Error('Failed to get access token');
  return token.token;
}

async function getGraphClient() {
  const token = await getAccessToken();
  return Client.init({
    authProvider: (done: (err: Error | null, token: string | null) => void) => done(null, token),
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

    // Use Microsoft Graph API for sending emails
    await sendMail(recipients, subject || '(no subject)', html || text || '', text);

    return res.json({ success: true });
  } catch (e: any) {
    Logger.error(`Generic email send failed: ${e}`);
    return res.status(500).json({ success: false, message: e?.message || 'Failed to send email' });
  }
});
export default outer;