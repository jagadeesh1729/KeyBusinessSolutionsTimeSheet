import { Client } from '@microsoft/microsoft-graph-client';
import { ClientSecretCredential } from '@azure/identity';
import 'isomorphic-fetch';
import { RowDataPacket } from 'mysql2';
import database from '../config/database';
import Logger from '../utils/logger';

interface ReminderCandidate extends RowDataPacket {
  id: number;
  employee_id: number;
  project_id: number;
  status: 'draft' | 'pending';
  period_start: string;
  period_end: string;
  reminder_count: number;
  last_reminder_at: string | null;
  escalated: number;
  project_name: string;
  project_code: string;
  auto_approve: number;
  employee_name: string;
  employee_email: string;
}

interface ProjectManagerContact {
  email: string;
  name: string;
}

class TimesheetReminderService {
  private timer?: NodeJS.Timeout;
  private readonly intervalMs = 60 * 60 * 1000; // hourly to recover after restarts
  private readonly reminderLimit = 3;
  private readonly tenantId = process.env.MS_TENANT_ID;
  private readonly clientId = process.env.MS_CLIENT_ID;
  private readonly clientSecret = process.env.MS_CLIENT_SECRET;
  private readonly fromEmail = 'Timesheet@keybusinessglobal.com';

  start(): void {
    if (this.timer) return;
    Logger.info('Starting timesheet reminder scheduler (Pacific working days only)');
    this.run().catch((err) => Logger.warn(`Initial reminder run failed: ${err?.message || err}`));
    this.timer = setInterval(() => {
      this.run().catch((err) => Logger.warn(`Scheduled reminder run failed: ${err?.message || err}`));
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

  private formatTimestamp(date: Date): string {
    return date.toISOString().slice(0, 19).replace('T', ' ');
  }

  private getPacificContext(): { now: Date; dateLabel: string; isWorkingDay: boolean } {
    const pacificString = new Date().toLocaleString('en-US', { timeZone: 'America/Los_Angeles' });
    const pacificNow = new Date(pacificString);
    const month = String(pacificNow.getMonth() + 1).padStart(2, '0');
    const day = String(pacificNow.getDate()).padStart(2, '0');
    const dateLabel = `${pacificNow.getFullYear()}-${month}-${day}`;
    const weekday = pacificNow.getDay(); // 0 = Sunday, 6 = Saturday
    const isWorkingDay = weekday >= 1 && weekday <= 5;
    return { now: pacificNow, dateLabel, isWorkingDay };
  }

  private async getGraphClient() {
    if (!this.tenantId || !this.clientId || !this.clientSecret) {
      Logger.warn('Reminder email skipped: Azure AD env vars missing (MS_TENANT_ID, MS_CLIENT_ID, MS_CLIENT_SECRET)');
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
    if (!to.length) {
      return false;
    }

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

      Logger.info(`Reminder email queued to ${to.join(', ')} | subject="${subject}"`);
      return true;
    } catch (err: any) {
      Logger.warn(`Failed to send reminder email to ${to.join(', ')}: ${err?.message || err}`);
      return false;
    }
  }

  private async fetchReminderCandidates(targetDate: string): Promise<ReminderCandidate[]> {
    const rows = (await database.query(
      `SELECT 
         t.id,
         t.employee_id,
         t.project_id,
         t.status,
         t.period_start,
         t.period_end,
         COALESCE(t.reminder_count, 0) as reminder_count,
         t.last_reminder_at,
         COALESCE(t.escalated, 0) as escalated,
         p.name as project_name,
         p.code as project_code,
         p.auto_approve,
         CONCAT(u.first_name,' ',u.last_name) as employee_name,
         u.email as employee_email
       FROM timesheets t
       JOIN employees e ON t.employee_id = e.id
       JOIN users u ON e.user_id = u.id
       JOIN projects p ON t.project_id = p.id
       WHERE t.status IN ('draft','pending')
         AND t.period_end <= ?
         AND (t.last_reminder_at IS NULL OR DATE(t.last_reminder_at) < ?)`,
      [targetDate, targetDate],
    )) as RowDataPacket[];

    return rows as ReminderCandidate[];
  }

  private async fetchProjectManagers(projectId: number): Promise<ProjectManagerContact[]> {
    const rows = (await database.query(
      `SELECT DISTINCT u.email, CONCAT(u.first_name,' ',u.last_name) as name
       FROM user_projects up
       JOIN users u ON up.user_id = u.id
       WHERE up.project_id = ?
         AND u.role IN ('project_manager','admin','pm')
         AND u.is_active = 1
         AND u.email IS NOT NULL`,
      [projectId],
    )) as RowDataPacket[];

    return rows.map((r: any) => ({ email: r.email, name: r.name || 'Project Manager' }));
  }

  private buildEmployeeEmail(ts: ReminderCandidate): { subject: string; html: string } {
    const projectLabel = ts.project_code || ts.project_name || 'Project';
    const periodStart = this.formatDate(ts.period_start);
    const periodEnd = this.formatDate(ts.period_end);
    const statusCopy =
      ts.status === 'draft'
        ? 'Your timesheet is still in draft and has not been submitted.'
        : 'Your timesheet is pending approval.';

    const actionCopy =
      ts.status === 'draft'
        ? 'Please log in, complete any missing details, and submit the timesheet.'
        : 'Please double-check your submission and coordinate with your project manager if approval is delayed.';

    const subject = `Reminder: Timesheet for ${projectLabel} (${periodStart} to ${periodEnd})`;
    const html = `
      <p>Hi ${ts.employee_name || 'there'},</p>
      <p>${statusCopy}</p>
      <p><strong>Project:</strong> ${projectLabel}<br/>
         <strong>Period:</strong> ${periodStart} to ${periodEnd}<br/>
         <strong>Status:</strong> ${ts.status === 'draft' ? 'Draft (not submitted)' : 'Pending approval'}</p>
      <p>${actionCopy}</p>
      <p>We’ll continue to send reminders on Pacific working days until this is approved.</p>
      <p>Thank you,<br/>Timesheet Automation</p>
    `;

    return { subject, html };
  }

  private buildPmReminderEmail(ts: ReminderCandidate): { subject: string; html: string } {
    const projectLabel = ts.project_code || ts.project_name || 'Project';
    const periodStart = this.formatDate(ts.period_start);
    const periodEnd = this.formatDate(ts.period_end);
    const subject = `Action needed: Timesheet pending for ${ts.employee_name} (${projectLabel})`;
    const html = `
      <p>Hi,</p>
      <p>${ts.employee_name || 'This employee'} has a timesheet waiting for approval.</p>
      <p><strong>Project:</strong> ${projectLabel}<br/>
         <strong>Period:</strong> ${periodStart} to ${periodEnd}<br/>
         <strong>Status:</strong> Pending approval</p>
      <p>Please review and approve/reject the timesheet to keep payroll on schedule.</p>
      <p>Thank you,<br/>Timesheet Automation</p>
    `;
    return { subject, html };
  }

  private buildEscalationEmail(ts: ReminderCandidate): { subject: string; html: string } {
    const projectLabel = ts.project_code || ts.project_name || 'Project';
    const periodStart = this.formatDate(ts.period_start);
    const periodEnd = this.formatDate(ts.period_end);
    const subject =
      ts.status === 'draft'
        ? `Escalation: ${ts.employee_name} has not submitted a timesheet (${projectLabel})`
        : `Escalation: Timesheet still pending for ${ts.employee_name} (${projectLabel})`;
    const html = `
      <p>Hi,</p>
      <p>This is the third reminder for <strong>${ts.employee_name || 'the employee'}</strong>.</p>
      <p><strong>Project:</strong> ${projectLabel}<br/>
         <strong>Period:</strong> ${periodStart} to ${periodEnd}<br/>
         <strong>Status:</strong> ${ts.status === 'draft' ? 'Draft (not submitted)' : 'Pending approval'}</p>
      <p>Please reach out and assist in getting this timesheet ${ts.status === 'draft' ? 'submitted' : 'approved'}.</p>
      <p>Thank you,<br/>Timesheet Automation</p>
    `;
    return { subject, html };
  }

  private async updateReminderState(timesheetId: number, newCount: number, escalated: boolean, sentAt: Date) {
    await database.query(
      'UPDATE timesheets SET reminder_count = ?, last_reminder_at = ?, escalated = ? WHERE id = ?',
      [newCount, this.formatTimestamp(sentAt), escalated ? 1 : 0, timesheetId],
    );
  }

  async run(): Promise<void> {
    const context = this.getPacificContext();
    if (!context.isWorkingDay) {
      Logger.debug('Timesheet reminders skipped today (weekend in America/Los_Angeles).');
      return;
    }

    const candidates = await this.fetchReminderCandidates(context.dateLabel);
    if (!candidates.length) {
      return;
    }

    for (const ts of candidates) {
      const employeeEmail = ts.employee_email ? [ts.employee_email] : [];
      const pmContacts = await this.fetchProjectManagers(ts.project_id);
      const pmEmails = pmContacts.map((c) => c.email).filter(Boolean);
      const autoApprove = Boolean(ts.auto_approve);

      const employeeContent = this.buildEmployeeEmail(ts);
      const employeeSent = await this.sendMail(employeeEmail, employeeContent.subject, employeeContent.html);

      const shouldNotifyPm = ts.status === 'pending' && !autoApprove && pmEmails.length > 0;
      let pmReminderSent = false;
      if (shouldNotifyPm) {
        const pmContent = this.buildPmReminderEmail(ts);
        pmReminderSent = await this.sendMail(pmEmails, pmContent.subject, pmContent.html);
      }

      const delivered = employeeSent || pmReminderSent;
      if (!delivered) {
        continue; // try again on next run
      }

      const newCount = (Number(ts.reminder_count) || 0) + 1;
      let escalated = Boolean(ts.escalated);
      const shouldEscalate = !escalated && newCount >= this.reminderLimit && pmEmails.length > 0;

      if (shouldEscalate) {
        const escalationContent = this.buildEscalationEmail(ts);
        const escalatedSent = await this.sendMail(pmEmails, escalationContent.subject, escalationContent.html);
        if (escalatedSent) {
          escalated = true;
        }
      }

      await this.updateReminderState(ts.id, newCount, escalated, context.now);
    }
  }
}

export const timesheetReminderService = new TimesheetReminderService();
