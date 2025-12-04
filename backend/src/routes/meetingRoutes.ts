import { Router, Request, Response } from 'express';
import dotenv from 'dotenv';
import { google } from 'googleapis';
import nodemailer from 'nodemailer';
import fs from 'fs';
import path from 'path';
import { authenticate } from '../middleware/authMiddleware';
import { requirePMOrAdmin } from '../middleware/roleMiddleware';
import { TimesheetService } from '../services/timesheetService';
import { GoogleTokenService } from '../services/googleTokenService';

dotenv.config();

const router = Router();

const loadGoogleClient = async () => {
  const oauth2Client = new google.auth.OAuth2(
    process.env.CLIENT_ID,
    process.env.CLIENT_SECRET,
    process.env.REDIRECT_URI
  );
  // Load tokens from DB (admin-level)
  try {
    const tokenSvc = new GoogleTokenService();
    const tokens = await tokenSvc.getTokens();
    if (tokens) {
      oauth2Client.setCredentials(tokens);
      // Persist refreshed tokens automatically
      oauth2Client.on('tokens', async (t) => {
        try { await tokenSvc.saveTokens({
          access_token: t.access_token || tokens.access_token,
          refresh_token: t.refresh_token || tokens.refresh_token,
          scope: t.scope || tokens.scope,
          token_type: tokens.token_type,
          expiry_date: t.expiry_date || tokens.expiry_date,
        }); } catch {}
      });
    }
  } catch {}
  return oauth2Client;
};

// Use Outlook (Office 365) SMTP for email notifications
const mailer = nodemailer.createTransport({
  host: 'smtp.office365.com',
  port: 587,
  secure: false,
  auth: {
    user: process.env.IONOS_USER,
    pass: process.env.IONOS_PASS,
  },
});

router.post('/create', authenticate, requirePMOrAdmin, async (req: Request, res: Response) => {
  try {
    const { title, date, time, durationMinutes = 60, agenda, attendees = [], timeZone = 'America/New_York' } = req.body || {};
    if (!title || !date || !time) {
      return res.status(400).json({ success: false, message: 'title, date, and time are required' });
    }

    // Combine date + time
    const startIso = new Date(`${date}T${time}:00`).toISOString();
    const endIso = new Date(new Date(startIso).getTime() + durationMinutes * 60000).toISOString();

    const auth = await loadGoogleClient();
    const calendar = google.calendar({ version: 'v3', auth });

    // Try to create event with Google Meet link
    let eventResponse;
    try {
      eventResponse = await calendar.events.insert({
        calendarId: 'primary',
        requestBody: {
          summary: title,
          description: agenda || '',
          start: { dateTime: startIso, timeZone },
          end: { dateTime: endIso, timeZone },
          attendees: attendees.map((a: any) => ({ email: a.email, displayName: a.name })),
          conferenceData: {
            createRequest: {
              requestId: `${Date.now()}`,
              conferenceSolutionKey: { type: 'hangoutsMeet' },
            },
          },
        },
        conferenceDataVersion: 1,
      });
    } catch (e: any) {
      // If auth missing/invalid, return an authorize URL so frontend can redirect
      const authUrl = (new google.auth.OAuth2(
        process.env.CLIENT_ID,
        process.env.CLIENT_SECRET,
        process.env.REDIRECT_URI
      )).generateAuthUrl({ access_type: 'offline', prompt: 'consent', include_granted_scopes: true as any, scope: ['https://www.googleapis.com/auth/calendar.events'] });
      return res.status(400).json({ success: false, authorize: true, authUrl, message: 'Google authorization required. Visit /google to authorize.' });
    }

    const event = eventResponse.data;
    const meetLink = (event.conferenceData && event.conferenceData.entryPoints && event.conferenceData.entryPoints[0]?.uri) || (event.hangoutLink as string) || '';

    // Build recipients: attendees (optional) + PM team + PM + Admin
    const pmUser = (req as any).user || {};
    const pmEmail = pmUser?.email;
    const adminEmail = process.env.ADMIN_EMAIL;
    let teamEmails: string[] = [];
    try {
      const service = new TimesheetService();
      const team = await service.getPMEmployees(pmUser.userId);
      if ((team as any).success && Array.isArray((team as any).employees)) {
        teamEmails = ((team as any).employees as any[])
          .map((e) => e.email || e.user_email || e.employee_email)
          .filter(Boolean);
      }
    } catch {}
    const toList = Array.from(new Set([
      ...attendees.map((a: any) => a.email).filter(Boolean),
      ...teamEmails,
      pmEmail,
      adminEmail,
    ].filter(Boolean)));

    // Send invitation email with ICS attachment (Outlook SMTP). Do not fail meeting creation if SMTP is blocked.
    let emailError: string | undefined;
    if (process.env.IONOS_USER && process.env.IONOS_PASS && toList.length > 0) {
      try {
        const from = process.env.IONOS_FROM || process.env.IONOS_USER!;
        const html = `
          <p>Hello,</p>
          <p>You are invited to: <b>${title}</b></p>
          <p>When: ${new Date(startIso).toLocaleString()} - ${new Date(endIso).toLocaleString()} (${timeZone})</p>
          ${agenda ? `<p>Agenda: ${agenda}</p>` : ''}
          <p>Join Google Meet: <a href="${meetLink}">${meetLink}</a></p>
        `;

        const uid = event.id || `${Date.now()}@keybusinesssolutions`;
        const dtStamp = new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
        const formatICS = (iso: string) => iso.replace(/[-:]/g, '').split('.')[0] + 'Z';
        const ics = [
          'BEGIN:VCALENDAR',
          'PRODID:-//KBS//Meeting//EN',
          'VERSION:2.0',
          'CALSCALE:GREGORIAN',
          'METHOD:REQUEST',
          'BEGIN:VEVENT',
          `UID:${uid}`,
          `DTSTAMP:${dtStamp}`,
          `DTSTART:${formatICS(startIso)}`,
          `DTEND:${formatICS(endIso)}`,
          `SUMMARY:${title}`,
          agenda ? `DESCRIPTION:${agenda}` : 'DESCRIPTION:',
          meetLink ? `LOCATION:${meetLink}` : 'LOCATION:Google Meet',
          `ORGANIZER:MAILTO:${from}`,
          ...toList.map((e) => `ATTENDEE;ROLE=REQ-PARTICIPANT:MAILTO:${e}`),
          'END:VEVENT',
          'END:VCALENDAR'
        ].join('\r\n');

        await mailer.sendMail({
          from,
          to: toList,
          subject: `Meeting: ${title}`,
          html,
          attachments: [
            { filename: 'invite.ics', content: ics, contentType: 'text/calendar; charset=UTF-8; method=REQUEST' },
          ],
        });
      } catch (e: any) {
        // Common Office 365 error when SMTP AUTH is blocked by security defaults: 535 5.7.139
        emailError = e?.message || 'Failed to send invitation email via SMTP';
        // Do not throw; users still get the Google Meet link in response
      }
    }

    return res.json({ success: true, meetLink, eventId: event.id, emailSent: !emailError, emailError });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message || 'Failed to create meeting' });
  }
});

export default router;
