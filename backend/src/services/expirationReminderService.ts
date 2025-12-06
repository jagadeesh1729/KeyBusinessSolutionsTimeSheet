import { Client } from '@microsoft/microsoft-graph-client';
import { ClientSecretCredential } from '@azure/identity';
import 'isomorphic-fetch';
import { RowDataPacket } from 'mysql2';
import database from '../config/database';
import Logger from '../utils/logger';
import { expirationTrackerService } from './expirationTrackerService';
import { RecurringFrequency } from '../models/ExpirationTracker';

interface ExpiringEmployeeRow extends RowDataPacket {
  employee_id: number;
  user_id: number;
  first_name: string;
  last_name: string;
  email: string;
  end_date: string;
  days_until_expiry: number;
  months_until_expiry: number;
}

class ExpirationReminderService {
  private timer?: NodeJS.Timeout;
  private readonly intervalMs = 24 * 60 * 60 * 1000; // daily check
  private readonly tenantId = process.env.MS_TENANT_ID;
  private readonly clientId = process.env.MS_CLIENT_ID;
  private readonly clientSecret = process.env.MS_CLIENT_SECRET;
  private readonly fromEmail = 'Timesheet@keybusinessglobal.com';

  start(): void {
    if (this.timer) return;
    Logger.info('Starting expiration reminder scheduler');
    this.run().catch((err) => Logger.warn(`Initial expiration reminder run failed: ${err?.message || err}`));
    this.timer = setInterval(() => {
      this.run().catch((err) => Logger.warn(`Scheduled expiration reminder run failed: ${err?.message || err}`));
    }, this.intervalMs);
  }

  stop(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = undefined;
    }
  }

  private formatDate(dateStr: string): string {
    if (!dateStr) return 'N/A';
    const d = new Date(dateStr);
    if (Number.isNaN(d.getTime())) return dateStr;
    return d.toISOString().split('T')[0];
  }

  private async getGraphClient() {
    if (!this.tenantId || !this.clientId || !this.clientSecret) {
      Logger.warn('Expiration reminder skipped: Azure AD env vars missing (MS_TENANT_ID, MS_CLIENT_ID, MS_CLIENT_SECRET)');
      return null;
    }
    const credential = new ClientSecretCredential(this.tenantId, this.clientId, this.clientSecret);
    const token = await credential.getToken('https://graph.microsoft.com/.default');
    if (!token) return null;
    return Client.init({
      authProvider: (done: (err: Error | null, token: string | null) => void) => done(null, token.token),
    });
  }

  private async sendMail(to: string[], subject: string, htmlBody: string): Promise<boolean> {
    if (!to.length) return false;
    try {
      const client = await this.getGraphClient();
      if (!client) return false;

      await client.api(`/users/${this.fromEmail}/sendMail`).post({
        message: {
          subject,
          body: { contentType: 'HTML', content: htmlBody },
          toRecipients: to.map((email) => ({ emailAddress: { address: email } })),
          from: { emailAddress: { address: this.fromEmail } },
        },
        saveToSentItems: true,
      });
      Logger.info(`Expiration reminder queued to ${to.join(', ')} | subject="${subject}"`);
      return true;
    } catch (err: any) {
      Logger.warn(`Failed to send expiration reminder to ${to.join(', ')}: ${err?.message || err}`);
      return false;
    }
  }

  private shouldSend(recurring: RecurringFrequency, daysUntil: number, monthsUntil: number, targetDays: number): boolean {
    if (daysUntil < 0) return false; // already expired
    if (daysUntil > targetDays) return false;

    switch (recurring) {
      case 'daily':
        return true;
      case 'weekly':
        return daysUntil % 7 === 0;
      case 'bi-weekly':
        return daysUntil % 14 === 0;
      case 'bi-monthly': {
        // every 2 months (6,4,2 months out)
        return monthsUntil >= 0 && monthsUntil <= Math.ceil(targetDays / 30) && monthsUntil % 2 === 0 && monthsUntil <= 6;
      }
      case 'quarterly': {
        // every 3 months (6,3 months out, etc.)
        return monthsUntil >= 0 && monthsUntil <= Math.ceil(targetDays / 30) && monthsUntil % 3 === 0 && monthsUntil <= 6;
      }
      case 'monthly':
      default: {
        const allowedMonths = [6, 5, 4, 3, 2, 1];
        return allowedMonths.includes(monthsUntil);
      }
    }
  }

  private buildEmail(row: ExpiringEmployeeRow, daysUntil: number): { subject: string; html: string } {
    const endDate = this.formatDate(row.end_date);
    const subject = `Reminder: Your work authorization expires on ${endDate}`;
    const html = `
      <p>Hi ${row.first_name || 'there'},</p>
      <p>Your recorded end date is <strong>${endDate}</strong>. That is ${daysUntil} day(s) from today.</p>
      <p>Please make sure your visa/work authorization paperwork is updated before this date. If renewal is already in progress, you can ignore this reminder.</p>
      <p>Thank you,<br/>Compliance Team</p>
    `;
    return { subject, html };
  }

  async run(): Promise<void> {
    // Get tracker config or create default
    const trackerResult = await expirationTrackerService.getTracker();
    if (!trackerResult.success || !trackerResult.data) {
      Logger.warn('Expiration reminder skipped: tracker settings unavailable');
      return;
    }

    const tracker = trackerResult.data;
    const rows = await database.query<ExpiringEmployeeRow[]>(
      `SELECT 
         e.id as employee_id,
         e.user_id,
         u.first_name,
         u.last_name,
         u.email,
         e.end_date,
         DATEDIFF(e.end_date, CURDATE()) as days_until_expiry,
         TIMESTAMPDIFF(MONTH, CURDATE(), e.end_date) as months_until_expiry
       FROM employees e
       JOIN users u ON e.user_id = u.id
       WHERE e.end_date IS NOT NULL
         AND u.is_active = 1`
    );

    for (const row of rows) {
      const daysUntil = Number(row.days_until_expiry);
      const monthsUntil = Number(row.months_until_expiry);
      if (!this.shouldSend(tracker.recurring, daysUntil, monthsUntil, tracker.target_days)) {
        continue;
      }

      const email = row.email ? [row.email] : [];
      if (!email.length) {
        continue;
      }

      const content = this.buildEmail(row, daysUntil);
      await this.sendMail(email, content.subject, content.html);
    }
  }
}

export const expirationReminderService = new ExpirationReminderService();
