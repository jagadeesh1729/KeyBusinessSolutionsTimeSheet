import database from '../config/database';
import {
  AuthResponse,
  CreatePMRequest,
  LoginRequest,
  RegisterEmployeeRequest,
  UserRole,
  AssignProjectsRequest,
} from '../models/User';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import Logger from '../utils/logger';
import { ResultSetHeader, RowDataPacket } from 'mysql2';
import env from '../config/env';
import { Client } from '@microsoft/microsoft-graph-client';
import { ClientSecretCredential } from '@azure/identity';
import 'isomorphic-fetch';
import { changeLogService, ChangeLogInput } from './changeLogService';
import { UserChangeLog, UserProjectChangeLog, EmployeeChangeLog } from '../models/ChangeLog';
import dotenv from 'dotenv';
dotenv.config();

export class AuthService {
  private readonly saltrounds = 12;
  private fromEmail = 'Timesheet@keybusinessglobal.com';

  private async getGraphClient() {
    const tenantId = process.env.MS_TENANT_ID;
    const clientId = process.env.MS_CLIENT_ID;
    const clientSecret = process.env.MS_CLIENT_SECRET;
    
    if (!tenantId || !clientId || !clientSecret) {
      console.warn('Email env vars missing; skip sending email.');
      console.warn('MS_TENANT_ID:', tenantId ? 'SET' : 'NOT SET');
      console.warn('MS_CLIENT_ID:', clientId ? 'SET' : 'NOT SET');
      console.warn('MS_CLIENT_SECRET:', clientSecret ? 'SET' : 'NOT SET');
      return null;
    }
    
    try {
      const credential = new ClientSecretCredential(tenantId, clientId, clientSecret);
      const token = await credential.getToken('https://graph.microsoft.com/.default');
      if (!token) {
        console.warn('Failed to get token from Azure');
        return null;
      }
      return Client.init({
        authProvider: (done: (err: any, token?: string | null) => void) => done(null, token.token),
      });
    } catch (error: any) {
      console.error('Error creating Graph client:', error?.message || error);
      return null;
    }
  }

  private async sendPasswordResetEmail(email: string, username: string, resetCode: string): Promise<boolean> {
    try {
      console.log('sendPasswordResetEmail called for:', email);
      const client = await this.getGraphClient();
      if (!client) {
        Logger.warn('Graph client unavailable, cannot send password reset email');
        return false;
      }

      console.log('Graph client obtained, preparing email...');
      const htmlBody = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f4;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 0;">
        <table role="presentation" style="width: 600px; border-collapse: collapse; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="padding: 40px 40px 20px 40px; text-align: center; background: linear-gradient(135deg, #0066A4 0%, #004e7c 100%); border-radius: 8px 8px 0 0;">
              <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 600;">Reset Your Password</h1>
            </td>
          </tr>
          
          <!-- Body -->
          <tr>
            <td style="padding: 40px;">
              <p style="margin: 0 0 20px 0; color: #333333; font-size: 16px; line-height: 1.6;">
                Hi <strong>${username}</strong>,
              </p>
              
              <p style="margin: 0 0 20px 0; color: #333333; font-size: 16px; line-height: 1.6;">
                We received a request to reset your password for your account. If you made this request, please enter the code below to create a new password:
              </p>
              
              <!-- Reset Code Box -->
              <table role="presentation" style="width: 100%; border-collapse: collapse; margin: 30px 0;">
                <tr>
                  <td align="center">
                    <div style="background-color: #f8f9fa; border: 2px dashed #0066A4; border-radius: 8px; padding: 20px; display: inline-block;">
                      <p style="margin: 0 0 10px 0; color: #666666; font-size: 14px; text-transform: uppercase; letter-spacing: 1px;">Reset Code</p>
                      <p style="margin: 0; color: #0066A4; font-size: 36px; font-weight: 700; letter-spacing: 8px;">${resetCode}</p>
                    </div>
                  </td>
                </tr>
              </table>
              
              <p style="margin: 0 0 20px 0; color: #666666; font-size: 14px; line-height: 1.6;">
                ⚠️ This code will expire in 15 minutes for security purposes.
              </p>
              
              <p style="margin: 0 0 20px 0; color: #666666; font-size: 14px; line-height: 1.6;">
                If you didn't request a password reset, please ignore this email or contact our support team if you have concerns.
              </p>
              
              <hr style="border: none; border-top: 1px solid #eeeeee; margin: 30px 0;">
              
              <p style="margin: 0; color: #999999; font-size: 13px; line-height: 1.6;">
                If you need help, feel free to contact our support team.
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 20px 40px; background-color: #f8f9fa; border-radius: 0 0 8px 8px; text-align: center;">
              <p style="margin: 0; color: #999999; font-size: 12px;">
                © ${new Date().getFullYear()} Key Business Solutions. All rights reserved.
              </p>
              <p style="margin: 5px 0 0 0; color: #999999; font-size: 12px;">
                4738 Duckhorn Drive, Sacramento, CA 95834
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
      `;

      console.log('Sending email to:', email, 'from:', this.fromEmail);
      await client.api(`/users/${this.fromEmail}/sendMail`).post({
        message: {
          subject: 'Reset Your Password - Key Business Solutions',
          body: { contentType: 'HTML', content: htmlBody },
          toRecipients: [{ emailAddress: { address: email } }],
          from: { emailAddress: { address: this.fromEmail } },
        },
        saveToSentItems: true,
      });

      console.log('Email sent successfully to:', email);
      Logger.info(`Password reset email sent to ${email}`);
      return true;
    } catch (error: any) {
      Logger.error(`Failed to send password reset email: ${error?.message || String(error)}`);
      return false;
    }
  }

  async login(loginData: LoginRequest): Promise<AuthResponse> {
    try {
      const { email, password } = loginData;
      const users = await database.query(
        'SELECT id, first_name, last_name, email, password, role, is_active, no_of_hours FROM users WHERE email = ?',
        [email],
      );
      if (!Array.isArray(users) || users.length === 0) {
        return { success: false, message: 'Invalid email or password' };
      }

      const user = users[0];
      Logger.info(user);
      if (!user.is_active) {
        return { success: false, message: 'Account is deactivated' };
      }
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        return { success: false, message: 'Invalid  email or password' };
      }
      const token = jwt.sign(
        {
          userId: user.id,
          email: user.email,
          role: user.role,
        },
        env.jwtSecret,
        { expiresIn: '1h' },
      );
      Logger.info(
        `User logged in successfully: ${user.email} with role: ${user.role}`,
      );
      return {
        success: true,
        message: 'Login successful',
        token,
        user: {
          id: user.id,
          first_name: user.first_name,
          last_name: user.last_name,
          name: `${user.first_name} ${user.last_name}`.trim(),
          email: user.email,
          role: user.role,
          no_of_hours: user.no_of_hours,
        },
      };
    } catch (error) {
      Logger.error(`Login error: ${error}`);
      return { success: false, message: 'Internal server error' };
    }
  }
  async forgotPassword(
    email: string,
  ): Promise<{ success: boolean; message: string; resetToken?: string; emailSent?: boolean }> {
    try {
      const users = await database.query(
        'SELECT id, first_name, last_name FROM users WHERE email = ?',
        [email],
      );

      if (!Array.isArray(users) || users.length === 0) {
        // Don't reveal if email exists
        return {
          success: true,
          message: 'If this email exists, a reset link has been sent',
        };
      }

      const user = users[0];
      const username = `${user.first_name || ''} ${user.last_name || ''}`.trim() || 'User';

      // Generate simple 6-digit code
      const resetToken = Math.floor(100000 + Math.random() * 900000).toString();

      await database.query('UPDATE users SET reset_token = ? WHERE email = ?', [
        resetToken,
        email,
      ]);

      // Send the password reset email
      const emailSent = await this.sendPasswordResetEmail(email, username, resetToken);

      Logger.info(`Password reset code for ${email}: ${resetToken}, email sent: ${emailSent}`);

      return {
        success: true,
        message: 'If this email exists, a reset code has been sent',
        resetToken, // Remove in production - only for testing
        emailSent,
      };
    } catch (error) {
      Logger.error(`Forgot password error: ${error}`);
      throw error;
    }
  }

  async verifyResetToken(
    email: string,
    token: string,
  ): Promise<{ success: boolean; message: string }> {
    try {
      const users = await database.query(
        'SELECT id FROM users WHERE email = ? AND reset_token = ?',
        [email, token],
      );

      if (!Array.isArray(users) || users.length === 0) {
        return { success: false, message: 'Invalid reset code' };
      }

      return { success: true, message: 'Reset code verified' };
    } catch (error) {
      Logger.error(`Verify reset token error: ${error}`);
      throw error;
    }
  }

  async setNewPassword(
    email: string,
    newPassword: string,
  ): Promise<{ success: boolean; message: string }> {
    try {
      const hashedPassword = await bcrypt.hash(newPassword, this.saltrounds);

      await database.query(
        'UPDATE users SET password = ?, reset_token = NULL WHERE email = ?',
        [hashedPassword, email],
      );

      Logger.info(`Password reset successfully for: ${email}`);
      return { success: true, message: 'Password reset successfully' };
    } catch (error) {
      Logger.error(`Set new password error: ${error}`);
      throw error;
    }
  }

  private generateTempPassword(): string {
    const length = 10;
    const charset =
      'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%';
    let password = '';
    for (let i = 0; i < length; i++) {
      password += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    return password;
  }

  async createProjectManager(
    adminId: number,
    pmData: CreatePMRequest,
  ): Promise<{ success: boolean; message: string; userId?: number }> {
    try {
      const { first_name, last_name, email, phone, location, no_of_hours } = pmData;
      const tempPassword = this.generateTempPassword();
      const hashedPassword = await bcrypt.hash(tempPassword, this.saltrounds);

      const result = (await database.query(
        'INSERT INTO users (first_name, last_name, email, phone, password, role, location, no_of_hours) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [ first_name, last_name, email, phone, hashedPassword, UserRole.PROJECT_MANAGER, location, no_of_hours ],
      )) as unknown as ResultSetHeader;

      const userId = result.insertId;
      Logger.info(`Admin (ID: ${adminId}) created PM: ${email}`);

      await changeLogService.recordUserChangeLogs(userId, adminId, [
        {
          fieldName: 'User',
          oldValue: null,
          newValue: `Project Manager created: ${first_name} ${last_name}`,
          changeType: 'CREATE',
        },
      ]);

      return {
        success: true,
        message: 'Project Manager created successfully. A temporary password has been generated.',
        userId,
      };
    } catch (error: any) {
      Logger.error(`Create PM error: ${error}`);
      if (error.code === 'ER_DUP_ENTRY') {
        return { success: false, message: 'A user with this email already exists.' };
      }
      return { success: false, message: 'Internal server error' };
    }
  }

  async registerEmployee(
    employeeData: RegisterEmployeeRequest,
  ): Promise<{ success: boolean; message: string; userId?: number }> {
    const connection = await database.getPool().getConnection();
    try {
      await connection.beginTransaction();

      // Step 1: Create the user record
      const { first_name, last_name, email, phone, password, location, no_of_hours } = employeeData;
      const hashedPassword = await bcrypt.hash(password, this.saltrounds);

      const userResult = (await connection.query(
        'INSERT INTO users (first_name, last_name, email, phone, password, role, location, no_of_hours) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [first_name, last_name, email, phone, hashedPassword, UserRole.EMPLOYEE, location, no_of_hours],
      )) as [ResultSetHeader, any];

      const userId = userResult[0].insertId; // The ResultSetHeader is the first element in the tuple

      // Step 2: Create the employee record
      const { employment_start_date, job_start_date, start_date, end_date, visa_status, college_name, college_address, degree, date_of_birth, college_Dso_name, college_Dso_email, college_Dso_phone, primary_emergency_contact_full_name, primary_emergency_contact_relationship, primary_emergency_contact_home_phone, secondary_emergency_contact_full_name, secondary_emergency_contact_relationship, secondary_emergency_contact_home_phone } = employeeData as any;
      const employement_start = employment_start_date || job_start_date || null;
      const employeeResult = (await connection.query(
        'INSERT INTO employees (user_id, employement_start_date, start_date, end_date, visa_status, college_name, college_address, degree, date_of_birth, college_Dso_name, college_Dso_email, college_Dso_phone, primary_emergency_contact_full_name, primary_emergency_contact_relationship, primary_emergency_contact_home_phone, secondary_emergency_contact_full_name, secondary_emergency_contact_relationship, secondary_emergency_contact_home_phone) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [userId, employement_start, start_date, end_date, visa_status, college_name, college_address, degree, date_of_birth, college_Dso_name, college_Dso_email, college_Dso_phone, primary_emergency_contact_full_name, primary_emergency_contact_relationship, primary_emergency_contact_home_phone, secondary_emergency_contact_full_name, secondary_emergency_contact_relationship, secondary_emergency_contact_home_phone],
      )) as [ResultSetHeader, any];
      const employeeId = employeeResult[0].insertId;

      await changeLogService.recordUserChangeLogs(userId, userId, [
        {
          fieldName: 'User',
          oldValue: null,
          newValue: `Employee registered: ${first_name} ${last_name}`,
          changeType: 'CREATE',
        },
      ], connection);
      if (employeeId) {
        await changeLogService.recordEmployeeChangeLogs(employeeId, userId, [
          {
            fieldName: 'Employee',
            oldValue: null,
            newValue: `Employee profile created: ${first_name} ${last_name}`,
            changeType: 'CREATE',
          },
        ], connection);
      }

      await connection.commit();
      Logger.info(`New employee registered successfully: ${email}`);
      return {
        success: true,
        message: 'Employee registered successfully.',
        userId,
      };
    } catch (error: any) {
      await connection.rollback();
      Logger.error(`Employee registration error: ${error}`);
      if (error.code === 'ER_DUP_ENTRY') {
        return { success: false, message: 'An account with this email already exists.' };
      }
      return { success: false, message: 'Internal server error during registration.' };
    } finally {
      connection.release();
    }
  }



  async validateToken(
    token: string,
  ): Promise<{ valid: boolean; payload?: jwt.JwtPayload | string }> {
    try {
      const payload = jwt.verify(token, env.jwtSecret);
      return { valid: true, payload };
    } catch {
      return { valid: false };
    }
  }

  async getUsers(
    requesterId: number,
  ): Promise<{ success: boolean; users?: unknown[]; message?: string }> {
    try {
      // Verify requester exists and get their role
      const requester = await database.query(
        'SELECT role FROM users WHERE id = ?',
        [requesterId],
      );

      if (!Array.isArray(requester) || requester.length === 0) {
        return { success: false, message: 'User not found' };
      }

      const requesterRole = (requester[0] as { role: string }).role;

      // Enhanced query to get complete employee data
      let query = `
        SELECT
          u.id, u.first_name, u.last_name, CONCAT(u.first_name,' ',u.last_name) AS name, u.email, u.phone, u.role, u.is_active, u.location, u.no_of_hours,
          e.user_id, e.employement_start_date, e.start_date, e.end_date, e.visa_status,
          e.college_name, e.college_address, e.degree, e.job_title, e.date_of_birth,
          e.college_Dso_name, e.college_Dso_email, e.college_Dso_phone,
          e.compensation, e.job_duties, e.project_manager_id,
          e.primary_emergency_contact_full_name, e.primary_emergency_contact_relationship, e.primary_emergency_contact_home_phone,
          e.secondary_emergency_contact_full_name, e.secondary_emergency_contact_relationship, e.secondary_emergency_contact_home_phone,
          pm.id as pm_id, pm.first_name as pm_first_name, pm.last_name as pm_last_name, pm.email as pm_email,
          GROUP_CONCAT(DISTINCT p.name) as project_names,
          GROUP_CONCAT(DISTINCT p.id) as project_ids
        FROM users u
        LEFT JOIN employees e ON u.id = e.user_id
        LEFT JOIN users pm ON e.project_manager_id = pm.id
        LEFT JOIN user_projects up ON u.id = up.user_id
        LEFT JOIN projects p ON up.project_id = p.id
        WHERE u.is_active = 1
      `;

      let params: (string | number)[] = [];

      // PM can see employees, Admin can see everyone
      if (requesterRole === UserRole.PROJECT_MANAGER) {
        query += ' AND u.role = ?';
        params.push(UserRole.EMPLOYEE);
      }

      query += ' GROUP BY u.id, u.first_name, u.last_name, u.email, u.phone, u.role, u.is_active, u.location, u.no_of_hours, e.user_id, e.employement_start_date, e.start_date, e.end_date, e.visa_status, e.college_name, e.college_address, e.degree, e.job_title, e.date_of_birth, e.college_Dso_name, e.college_Dso_email, e.college_Dso_phone, e.compensation, e.job_duties, e.project_manager_id, e.primary_emergency_contact_full_name, e.primary_emergency_contact_relationship, e.primary_emergency_contact_home_phone, e.secondary_emergency_contact_full_name, e.secondary_emergency_contact_relationship, e.secondary_emergency_contact_home_phone, pm.id, pm.first_name, pm.last_name, pm.email';

      const users = await database.query(query, params);

      // Transform the data to match expected format
      const transformedUsers = (users as any[]).map((user: any) => ({
        id: user.id,
        first_name: user.first_name,
        last_name: user.last_name,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        is_active: user.is_active,
        location: user.location,
        no_of_hours: user.no_of_hours,
        job_title: user.job_title || 'N/A',
        college_name: user.college_name,
        college_address: user.college_address,
        degree: user.degree,
        college_Dso_name: user.college_Dso_name,
        college_Dso_email: user.college_Dso_email,
        college_Dso_phone: user.college_Dso_phone,
        employement_start_date: user.employement_start_date,
        start_date: user.start_date,
        end_date: user.end_date,
        visa_status: user.visa_status,
        date_of_birth: user.date_of_birth,
        compensation: user.compensation,
        job_duties: user.job_duties,
        performance_review: user.performance_review,
        reports: user.reports,
        primary_emergency_contact_full_name: user.primary_emergency_contact_full_name,
        primary_emergency_contact_relationship: user.primary_emergency_contact_relationship,
        primary_emergency_contact_home_phone: user.primary_emergency_contact_home_phone,
        secondary_emergency_contact_full_name: user.secondary_emergency_contact_full_name,
        secondary_emergency_contact_relationship: user.secondary_emergency_contact_relationship,
        secondary_emergency_contact_home_phone: user.secondary_emergency_contact_home_phone,
        project_manager: user.pm_id ? {
          id: user.pm_id,
          first_name: user.pm_first_name || '',
          last_name: user.pm_last_name || '',
          email: user.pm_email
        } : null,
        project: user.project_names ? user.project_names.split(',').map((name: string, index: number) => ({
          id: user.project_ids ? user.project_ids.split(',')[index] : null,
          name: name.trim()
        })).filter((p: any) => p.id !== null) : []
      }));

      return { success: true, users: transformedUsers as unknown[] };
    } catch (error) {
      Logger.error(`Get users error: ${error}`);
      return { success: false, message: 'Internal server error' };
    }
  }

  async getProjectManagers(): Promise<{
    success: boolean;
    users?: unknown[];
    message?: string;
  }> {
    try {
      const query = 'SELECT id, first_name, last_name, CONCAT(first_name, " ", last_name) AS name, email, phone, location, no_of_hours, is_active FROM users WHERE role = ? AND is_active = 1';
      const users = await database.query(query, [UserRole.PROJECT_MANAGER]);
      return { success: true, users: users as unknown[] };
    } catch (error) {
      Logger.error(`Get Project Managers error: ${error}`);
      return { success: false, message: 'Internal server error' };
    }
  }

  async getInactiveProjectManagers(): Promise<{
    success: boolean;
    users?: unknown[];
    message?: string;
  }> {
    try {
      const query = 'SELECT id, first_name, last_name, CONCAT(first_name, " ", last_name) AS name, email, phone, location, no_of_hours, is_active FROM users WHERE role = ? AND is_active = 0';
      const users = await database.query(query, [UserRole.PROJECT_MANAGER]);
      return { success: true, users: users as unknown[] };
    } catch (error) {
      Logger.error(`Get Inactive Project Managers error: ${error}`);
      return { success: false, message: 'Internal server error' };
    }
  }

  async getInactiveEmployees(): Promise<{
    success: boolean;
    users?: unknown[];
    message?: string;
  }> {
    try {
      const query = `
        SELECT
          u.id, u.first_name, u.last_name, CONCAT(u.first_name,' ',u.last_name) AS name, u.email, u.phone, u.role, u.is_active, u.location, u.no_of_hours,
          e.user_id, e.employement_start_date, e.start_date, e.end_date, e.visa_status,
          e.college_name, e.college_address, e.degree, e.job_title, e.date_of_birth,
          e.college_Dso_name, e.college_Dso_email, e.college_Dso_phone,
          e.compensation, e.job_duties, e.project_manager_id,
          e.primary_emergency_contact_full_name, e.primary_emergency_contact_relationship, e.primary_emergency_contact_home_phone,
          e.secondary_emergency_contact_full_name, e.secondary_emergency_contact_relationship, e.secondary_emergency_contact_home_phone,
          pm.id as pm_id, pm.first_name as pm_first_name, pm.last_name as pm_last_name, pm.email as pm_email,
          GROUP_CONCAT(DISTINCT p.name) as project_names,
          GROUP_CONCAT(DISTINCT p.id) as project_ids
        FROM users u
        LEFT JOIN employees e ON u.id = e.user_id
        LEFT JOIN users pm ON e.project_manager_id = pm.id
        LEFT JOIN user_projects up ON u.id = up.user_id
        LEFT JOIN projects p ON up.project_id = p.id
        WHERE u.role = ? AND u.is_active = 0
        GROUP BY u.id, u.first_name, u.last_name, u.email, u.phone, u.role, u.is_active, u.location, u.no_of_hours, e.user_id, e.employement_start_date, e.start_date, e.end_date, e.visa_status, e.college_name, e.college_address, e.degree, e.job_title, e.date_of_birth, e.college_Dso_name, e.college_Dso_email, e.college_Dso_phone, e.compensation, e.job_duties, e.project_manager_id, e.primary_emergency_contact_full_name, e.primary_emergency_contact_relationship, e.primary_emergency_contact_home_phone, e.secondary_emergency_contact_full_name, e.secondary_emergency_contact_relationship, e.secondary_emergency_contact_home_phone, pm.id, pm.first_name, pm.last_name, pm.email
      `;
      const users = await database.query(query, [UserRole.EMPLOYEE]);

      // Transform the data to match expected format
      const transformedUsers = (users as any[]).map((user: any) => ({
        id: user.id,
        first_name: user.first_name,
        last_name: user.last_name,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        is_active: user.is_active,
        location: user.location,
        no_of_hours: user.no_of_hours,
        job_title: user.job_title || 'N/A',
        college_name: user.college_name,
        college_address: user.college_address,
        degree: user.degree,
        college_Dso_name: user.college_Dso_name,
        college_Dso_email: user.college_Dso_email,
        college_Dso_phone: user.college_Dso_phone,
        employement_start_date: user.employement_start_date,
        start_date: user.start_date,
        end_date: user.end_date,
        visa_status: user.visa_status,
        date_of_birth: user.date_of_birth,
        compensation: user.compensation,
        job_duties: user.job_duties,
        primary_emergency_contact_full_name: user.primary_emergency_contact_full_name,
        primary_emergency_contact_relationship: user.primary_emergency_contact_relationship,
        primary_emergency_contact_home_phone: user.primary_emergency_contact_home_phone,
        secondary_emergency_contact_full_name: user.secondary_emergency_contact_full_name,
        secondary_emergency_contact_relationship: user.secondary_emergency_contact_relationship,
        secondary_emergency_contact_home_phone: user.secondary_emergency_contact_home_phone,
        project_manager: user.pm_id ? {
          id: user.pm_id,
          first_name: user.pm_first_name || '',
          last_name: user.pm_last_name || '',
          email: user.pm_email
        } : null,
        project: user.project_names ? user.project_names.split(',').map((name: string, index: number) => ({
          id: user.project_ids ? user.project_ids.split(',')[index] : null,
          name: name.trim()
        })).filter((p: any) => p.id !== null) : []
      }));

      return { success: true, users: transformedUsers as unknown[] };
    } catch (error) {
      Logger.error(`Get Inactive Employees error: ${error}`);
      return { success: false, message: 'Internal server error' };
    }
  }

  async reactivateUser(
    userId: number,
    changedBy?: number | null,
  ): Promise<{ success: boolean; message: string }> {
    try {
      const rows = (await database.query<RowDataPacket[]>(
        'SELECT is_active FROM users WHERE id = ? LIMIT 1',
        [userId],
      )) as RowDataPacket[];

      if (!Array.isArray(rows) || rows.length === 0) {
        return { success: false, message: 'User not found or already active' };
      }

      if (rows[0].is_active === 1) {
        return { success: false, message: 'User not found or already active' };
      }

      const result = (await database.query(
        "UPDATE users SET is_active = 1 WHERE id = ?",
        [userId],
      )) as unknown as ResultSetHeader;

      if (result.affectedRows === 0) {
        return { success: false, message: 'User not found or already active' };
      }

      await changeLogService.recordUserChangeLogs(userId, changedBy ?? null, [
        {
          fieldName: 'Status',
          oldValue: 'Inactive',
          newValue: 'Active',
          changeType: 'UPDATE',
          changeReason: 'Reactivated via admin dashboard',
        },
      ]);

      Logger.info(`User reactivated successfully: ID ${userId}`);
      return { success: true, message: 'User reactivated successfully' };
    } catch (error) {
      Logger.error(`Reactivate user error: ${error}`);
      return { success: false, message: 'Failed to reactivate user' };
    }
  }
  async assignProjects(
    assignData: AssignProjectsRequest,
    options?: { changedBy?: number | null; changeReason?: string | null },
  ): Promise<{ success: boolean; message: string }> {
    const connection = await database.getPool().getConnection();
    try {
      await connection.beginTransaction();

      const { user_id, project_ids } = assignData;
      let requestedProjectIds = Array.isArray(project_ids)
        ? Array.from(new Set(project_ids.map((id) => Number(id)).filter((id) => Number.isFinite(id))))
        : [];
      assignData.project_ids = requestedProjectIds;

      // Determine target user's role
      const [userRows] = await connection.query<RowDataPacket[]>(
        'SELECT role FROM users WHERE id = ? LIMIT 1',
        [user_id]
      );
      const targetRole = userRows && userRows[0] ? (userRows[0].role as UserRole) : undefined;

      if (!targetRole) {
        await connection.rollback();
        return { success: false, message: 'Target user not found' };
      }

      if (targetRole === UserRole.PROJECT_MANAGER) {
        // For PMs: each project can belong to only one PM
        if (requestedProjectIds.length > 0) {
          const placeholders = requestedProjectIds.map(() => '?').join(',');
          const [conflicts] = await connection.query<RowDataPacket[]>(
            `SELECT up.project_id, u.id as pm_id, CONCAT(u.first_name,' ',u.last_name) AS pm_name
             FROM user_projects up
             JOIN users u ON u.id = up.user_id AND u.role = ?
             WHERE up.project_id IN (${placeholders}) AND up.user_id <> ?`,
            [UserRole.PROJECT_MANAGER, ...requestedProjectIds, user_id] as any
          );
          if (Array.isArray(conflicts) && conflicts.length > 0) {
            const conflictProjects = conflicts.map((c: any) => c.project_id);
            await connection.rollback();
            return {
              success: false,
              message: `One or more projects are already assigned to another project manager: ${[...new Set(conflictProjects)].join(', ')}`,
            };
          }
        }
      } else if (targetRole === UserRole.EMPLOYEE) {
        // For employees: allow only one project, and it must be one of the employee's PM's projects
        const [empRows] = await connection.query<RowDataPacket[]>(
          'SELECT project_manager_id FROM employees WHERE user_id = ? LIMIT 1',
          [user_id]
        );
        const pmId = empRows && empRows[0] ? (empRows[0].project_manager_id as number | null) : null;
        if (!pmId) {
          await connection.rollback();
          return { success: false, message: 'Employee has no assigned project manager' };
        }
        const selectedProjectId = requestedProjectIds.length > 0 ? Number(requestedProjectIds[0]) : null;
        if (!selectedProjectId) {
          // Clearing assignments is handled by deleting below; proceed
        } else {
          // Verify the project is assigned to the PM
          const [ok] = await connection.query<RowDataPacket[]>(
            'SELECT 1 FROM user_projects WHERE user_id = ? AND project_id = ? LIMIT 1',
            [pmId, selectedProjectId]
          );
          if (!ok || ok.length === 0) {
            await connection.rollback();
            return { success: false, message: 'Selected project is not assigned to the employee\'s project manager' };
          }
        }
        // Force single project for employees
        if (requestedProjectIds.length > 1) {
          requestedProjectIds = [requestedProjectIds[0]];
          assignData.project_ids = requestedProjectIds;
        }
      }

      const [existingAssignments] = await connection.query<RowDataPacket[]>(
        'SELECT project_id FROM user_projects WHERE user_id = ?',
        [user_id],
      );
      const previousProjectIds = new Set(
        (existingAssignments || []).map((row: any) => Number(row.project_id)),
      );

      // Remove existing assignments for this user
      await connection.query('DELETE FROM user_projects WHERE user_id = ?', [user_id]);

      // Add new assignments
      if (assignData.project_ids && assignData.project_ids.length > 0) {
        const values = assignData.project_ids.map(project_id => [user_id, project_id]);
        await connection.query(
          'INSERT INTO user_projects (user_id, project_id) VALUES ?',
          [values]
        );
      }

      const newProjectIdSet = new Set(assignData.project_ids || []);
      const addedProjects = (assignData.project_ids || []).filter((pid) => !previousProjectIds.has(pid));
      const removedProjects = Array.from(previousProjectIds).filter((pid) => !newProjectIdSet.has(pid));

      Logger.info(`Project assignment change detection - User: ${user_id}, Previous: [${Array.from(previousProjectIds).join(', ')}], New: [${(assignData.project_ids || []).join(', ')}], Added: [${addedProjects.join(', ')}], Removed: [${removedProjects.join(', ')}]`);

      if (addedProjects.length || removedProjects.length) {
        Logger.info(`Recording project change logs - Added: ${addedProjects.length}, Removed: ${removedProjects.length}`);
        await changeLogService.recordUserProjectChangeLogs(
          user_id,
          options?.changedBy ?? null,
          [
            ...addedProjects.map((projectId) => ({
              projectId,
              actionType: 'ASSIGNED' as const,
              oldValue: null,
              newValue: 'Assigned',
              changeReason: options?.changeReason ?? null,
            })),
            ...removedProjects.map((projectId) => ({
              projectId,
              actionType: 'UNASSIGNED' as const,
              oldValue: 'Assigned',
              newValue: null,
              changeReason: options?.changeReason ?? null,
            })),
          ],
          connection,
        );
      }

      await connection.commit();
      Logger.info(`Projects assigned to user ${user_id}: ${requestedProjectIds.join(', ')}`);
      return { success: true, message: 'Projects assigned successfully' };
    } catch (error) {
      await connection.rollback();
      Logger.error(`Assign projects error: ${error}`);
      return { success: false, message: 'Failed to assign projects' };
    } finally {
      connection.release();
    }
  }

  async getUserProjects(
    userId: number,
  ): Promise<{ success: boolean; projects?: unknown[]; message?: string }> {
    try {
      const projects = await database.query(
        'SELECT p.* FROM projects p JOIN user_projects up ON p.id = up.project_id WHERE up.user_id = ?',
        [userId]
      );
      return { success: true, projects: projects as unknown[] };
    } catch (error) {
      Logger.error(`Get user projects error: ${error}`);
      return { success: false, message: 'Failed to get user projects' };
    }
  }

  async assignEmployeesToPM(
    assignData: any,
    options?: { changedBy?: number | null; changeReason?: string | null },
  ): Promise<{ success: boolean; message: string }> {
    const connection = await database.getPool().getConnection();
    try {
      await connection.beginTransaction();

      const { pm_id, employee_ids } = assignData;
      const requestedEmployeeIds = new Set(employee_ids.map((id: any) => Number(id)));

      // Get PM name for change log
      const [pmRows] = await connection.query<RowDataPacket[]>(
        'SELECT first_name, last_name FROM users WHERE id = ? LIMIT 1',
        [pm_id]
      );
      const pmName = pmRows && pmRows[0] ? `${pmRows[0].first_name} ${pmRows[0].last_name}` : `PM ID: ${pm_id}`;

      // Get employees currently assigned to this PM (to detect unassignments)
      const [currentAssignments] = await connection.query<RowDataPacket[]>(
        'SELECT id as employee_id, user_id, project_manager_id FROM employees WHERE project_manager_id = ?',
        [pm_id]
      );
      const previouslyAssignedUserIds = new Set(
        (currentAssignments || []).map((row: any) => Number(row.user_id))
      );

      // Get employee records for the requested employee_ids to get their current PM assignments
      let employeeRecords: RowDataPacket[] = [];
      if (employee_ids.length > 0) {
        const placeholders = employee_ids.map(() => '?').join(',');
        const [rows] = await connection.query<RowDataPacket[]>(
          `SELECT id as employee_id, user_id, project_manager_id FROM employees WHERE user_id IN (${placeholders})`,
          employee_ids
        );
        employeeRecords = rows || [];
      }

      // Build a map of user_id -> employee record
      const employeeMap = new Map(employeeRecords.map((r: any) => [Number(r.user_id), r]));

      // Determine which employees are being assigned (new) and which are being unassigned
      const employeesToUnassign: { employeeId: number; userId: number; oldPmId: number }[] = [];
      const employeesToAssign: { employeeId: number; userId: number; oldPmId: number | null }[] = [];

      // Employees who were assigned to this PM but are no longer in the list
      for (const row of (currentAssignments || []) as RowDataPacket[]) {
        if (!requestedEmployeeIds.has(Number(row.user_id))) {
          employeesToUnassign.push({
            employeeId: Number(row.employee_id),
            userId: Number(row.user_id),
            oldPmId: pm_id,
          });
        }
      }

      // Employees in the new list
      for (const userId of employee_ids) {
        const numUserId = Number(userId);
        const empRecord = employeeMap.get(numUserId);
        if (empRecord) {
          const currentPmId = empRecord.project_manager_id ? Number(empRecord.project_manager_id) : null;
          // Only record change if PM is actually changing
          if (currentPmId !== pm_id) {
            employeesToAssign.push({
              employeeId: Number(empRecord.employee_id),
              userId: numUserId,
              oldPmId: currentPmId,
            });
          }
        }
      }

      // Remove existing assignments for this PM
      await connection.query('UPDATE employees SET project_manager_id = NULL WHERE project_manager_id = ?', [pm_id]);

      // Add new assignments
      if (employee_ids.length > 0) {
        const updatePromises = employee_ids.map((employee_id: number) => 
          connection.query('UPDATE employees SET project_manager_id = ? WHERE user_id = ?', [pm_id, employee_id])
        );
        await Promise.all(updatePromises);
      }

      // Record change logs for unassigned employees
      for (const emp of employeesToUnassign) {
        await changeLogService.recordEmployeeChangeLogs(
          emp.employeeId,
          options?.changedBy ?? null,
          [{
            fieldName: 'Project Manager',
            oldValue: pmName,
            newValue: null,
            changeType: 'UPDATE',
            changeReason: options?.changeReason ?? 'Unassigned from PM via admin dashboard',
          }],
          connection,
        );
      }

      // Record change logs for newly assigned employees
      for (const emp of employeesToAssign) {
        let oldPmName: string | null = null;
        if (emp.oldPmId) {
          const [oldPmRows] = await connection.query<RowDataPacket[]>(
            'SELECT first_name, last_name FROM users WHERE id = ? LIMIT 1',
            [emp.oldPmId]
          );
          oldPmName = oldPmRows && oldPmRows[0] ? `${oldPmRows[0].first_name} ${oldPmRows[0].last_name}` : `PM ID: ${emp.oldPmId}`;
        }
        await changeLogService.recordEmployeeChangeLogs(
          emp.employeeId,
          options?.changedBy ?? null,
          [{
            fieldName: 'Project Manager',
            oldValue: oldPmName,
            newValue: pmName,
            changeType: 'UPDATE',
            changeReason: options?.changeReason ?? 'Assigned to PM via admin dashboard',
          }],
          connection,
        );
      }

      await connection.commit();
      Logger.info(`Employees assigned to PM ${pm_id}: ${employee_ids.join(', ')}`);
      return { success: true, message: 'Employees assigned successfully' };
    } catch (error) {
      await connection.rollback();
      Logger.error(`Assign employees to PM error: ${error}`);
      return { success: false, message: 'Failed to assign employees' };
    } finally {
      connection.release();
    }
  }

  async getPMEmployees(
    pmId: number
  ): Promise<{ success: boolean; employees?: unknown[]; message?: string }> {
    try {
      const employees = await database.query(
        'SELECT u.id, u.first_name, u.last_name, CONCAT(u.first_name, " ", u.last_name) AS name, u.email, u.phone, u.location FROM users u JOIN employees e ON u.id = e.user_id WHERE e.project_manager_id = ? AND u.is_active = 1',
        [pmId]
      );
      return { success: true, employees: employees as unknown[] };
    } catch (error) {
      Logger.error(`Get PM employees error: ${error}`);
      return { success: false, message: 'Failed to get PM employees' };
    }
  }

  async getEmployeesWithoutPM(): Promise<{ success: boolean; employees?: unknown[]; message?: string }> {
    try {
      const employees = await database.query(
        'SELECT u.id, u.first_name, u.last_name, CONCAT(u.first_name, " ", u.last_name) AS name, u.email, u.phone, u.location FROM users u LEFT JOIN employees e ON u.id = e.user_id WHERE u.role = ? AND u.is_active = 1 AND (e.project_manager_id IS NULL OR e.project_manager_id = 0)',
        [UserRole.EMPLOYEE]
      );
      return { success: true, employees: employees as unknown[] };
    } catch (error) {
      Logger.error(`Get employees without PM error: ${error}`);
      return { success: false, message: 'Failed to get employees without PM' };
    }
  }

  async getEmployeesForReview(): Promise<{ success: boolean; employees?: unknown[]; count?: number; message?: string }> {
    try {
      const employees = await database.query(
        `SELECT u.id, u.first_name, u.last_name, CONCAT(u.first_name,' ',u.last_name) AS name, u.email, u.phone, u.location, u.no_of_hours,
         e.employement_start_date AS employment_start_date, e.start_date, e.end_date, e.visa_status, e.college_name, e.college_address, e.degree, e.job_title,
         e.date_of_birth, e.college_Dso_name, e.college_Dso_email, e.college_Dso_phone, e.compensation, e.job_duties, e.project_manager_id,
         e.primary_emergency_contact_full_name, e.primary_emergency_contact_relationship, e.primary_emergency_contact_home_phone,
         e.secondary_emergency_contact_full_name, e.secondary_emergency_contact_relationship, e.secondary_emergency_contact_home_phone
         FROM users u 
         LEFT JOIN employees e ON u.id = e.user_id 
         WHERE u.role = ? AND u.is_active = 1 AND (
           /* Users table fields */
           u.first_name IS NULL OR u.first_name = '' OR
           u.last_name IS NULL OR u.last_name = '' OR
           u.email IS NULL OR u.email = '' OR
           u.phone IS NULL OR u.phone = '' OR
           u.location IS NULL OR u.location = '' OR
           u.no_of_hours IS NULL OR
           /* Employees table - basic info */
           e.id IS NULL OR
           e.start_date IS NULL OR
           e.end_date IS NULL OR
           e.visa_status IS NULL OR e.visa_status = '' OR
           e.job_duties IS NULL OR e.job_duties = '' OR
           e.compensation IS NULL OR e.compensation = '' OR
           e.job_title IS NULL OR e.job_title = '' OR
           e.date_of_birth IS NULL OR
           e.employement_start_date IS NULL OR
           /* College/Education info */
           e.college_name IS NULL OR e.college_name = '' OR
           e.college_address IS NULL OR e.college_address = '' OR
           e.degree IS NULL OR e.degree = '' OR
           e.college_Dso_name IS NULL OR e.college_Dso_name = '' OR
           e.college_Dso_email IS NULL OR e.college_Dso_email = '' OR
           e.college_Dso_phone IS NULL OR e.college_Dso_phone = '' OR
           /* Primary emergency contact */
           e.primary_emergency_contact_full_name IS NULL OR e.primary_emergency_contact_full_name = '' OR
           e.primary_emergency_contact_relationship IS NULL OR e.primary_emergency_contact_relationship = '' OR
           e.primary_emergency_contact_home_phone IS NULL OR e.primary_emergency_contact_home_phone = '' OR
           /* Secondary emergency contact */
           e.secondary_emergency_contact_full_name IS NULL OR e.secondary_emergency_contact_full_name = '' OR
           e.secondary_emergency_contact_relationship IS NULL OR e.secondary_emergency_contact_relationship = '' OR
           e.secondary_emergency_contact_home_phone IS NULL OR e.secondary_emergency_contact_home_phone = ''
         )`,
        [UserRole.EMPLOYEE]
      );
      Logger.info('Employees for review retrieved successfully', employees)
      return { success: true, employees: employees as unknown[], count: (employees as unknown[]).length };
    } catch (error) {
      Logger.error(`Get employees for review error: ${error}`);
      return { success: false, message: 'Failed to get employees for review' };
    }
  }

  async updateEmployeeDetails(
    userId: number,
    employeeData: any,
    options?: { changedBy?: number | null; changeReason?: string | null },
  ): Promise<{ success: boolean; message: string }> {
    const connection = await database.getPool().getConnection();
    try {
      await connection.beginTransaction();

      const [userRows] = await connection.query<RowDataPacket[]>(
        'SELECT first_name, last_name, email, phone, location, no_of_hours FROM users WHERE id = ? LIMIT 1',
        [userId],
      );
      if (!Array.isArray(userRows) || userRows.length === 0) {
        await connection.rollback();
        return { success: false, message: 'User not found' };
      }
      const existingUser = userRows[0];

      const [employeeRows] = await connection.query<RowDataPacket[]>(
        `SELECT id, employement_start_date, start_date, end_date, visa_status, college_name, college_address, degree,
                job_title, date_of_birth, compensation, job_duties, project_manager_id,
                college_Dso_name, college_Dso_email, college_Dso_phone,
                primary_emergency_contact_full_name, primary_emergency_contact_relationship, primary_emergency_contact_home_phone,
                secondary_emergency_contact_full_name, secondary_emergency_contact_relationship, secondary_emergency_contact_home_phone
         FROM employees WHERE user_id = ? LIMIT 1`,
        [userId],
      );
      const existingEmployee = employeeRows[0] || {};
      const employeeRecordId = existingEmployee?.id ? Number(existingEmployee.id) : null;

      const {
        first_name,
        last_name,
        email,
        phone,
        location,
        no_of_hours,
        employment_start_date,
        job_start_date,
        start_date,
        end_date,
        visa_status,
        college_name,
        college_address,
        degree,
        job_title,
        date_of_birth,
        compensation,
        job_duties,
        project_manager_id,
        college_Dso_name,
        college_Dso_email,
        college_Dso_phone,
        primary_emergency_contact_full_name,
        primary_emergency_contact_relationship,
        primary_emergency_contact_home_phone,
        secondary_emergency_contact_full_name,
        secondary_emergency_contact_relationship,
        secondary_emergency_contact_home_phone,
      } = employeeData as any;

      const employement_start_update = employment_start_date || job_start_date || null;
      const userChangeEntries: ChangeLogInput[] = [];
      const employeeChangeEntries: ChangeLogInput[] = [];
      const changeReason = options?.changeReason ?? null;

      const formatValue = (value: any) => {
        if (value === undefined || value === null) return null;
        if (value instanceof Date) return value.toISOString().split('T')[0];
        return value;
      };

      const normalize = (value: any) => {
        const formatted = formatValue(value);
        if (formatted === null) return null;
        return String(formatted);
      };

      const pushChange = (fieldName: string, newValue: any, prevValue: any, target: 'user' | 'employee') => {
        if (newValue === undefined) return;
        if (normalize(newValue) === normalize(prevValue)) return;
        const entry = {
          fieldName,
          oldValue: formatValue(prevValue),
          newValue: formatValue(newValue),
          changeReason,
        };
        if (target === 'user') userChangeEntries.push(entry);
        else employeeChangeEntries.push(entry);
      };

      // Update user table
      await connection.query(
        'UPDATE users SET first_name = ?, last_name = ?, email = ?, phone = ?, location = ?, no_of_hours = ? WHERE id = ?',
        [first_name, last_name, email, phone, location, no_of_hours, userId],
      );

      pushChange('First Name', first_name, existingUser.first_name, 'user');
      pushChange('Last Name', last_name, existingUser.last_name, 'user');
      pushChange('Email', email, existingUser.email, 'user');
      pushChange('Phone', phone, existingUser.phone, 'user');
      pushChange('Location', location, existingUser.location, 'user');
      pushChange('Hours', no_of_hours, existingUser.no_of_hours, 'user');

      // Update employee table
      await connection.query(
        'UPDATE employees SET employement_start_date = ?, start_date = ?, end_date = ?, visa_status = ?, college_name = ?, college_address = ?, degree = ?, job_title = ?, date_of_birth = ?, compensation = ?, job_duties = ?, project_manager_id = ?, college_Dso_name = ?, college_Dso_email = ?, college_Dso_phone = ?, primary_emergency_contact_full_name = ?, primary_emergency_contact_relationship = ?, primary_emergency_contact_home_phone = ?, secondary_emergency_contact_full_name = ?, secondary_emergency_contact_relationship = ?, secondary_emergency_contact_home_phone = ? WHERE user_id = ?',
        [
          employement_start_update,
          start_date,
          end_date,
          visa_status,
          college_name,
          college_address,
          degree,
          job_title,
          date_of_birth,
          compensation,
          job_duties,
          project_manager_id,
          college_Dso_name,
          college_Dso_email,
          college_Dso_phone,
          primary_emergency_contact_full_name,
          primary_emergency_contact_relationship,
          primary_emergency_contact_home_phone,
          secondary_emergency_contact_full_name,
          secondary_emergency_contact_relationship,
          secondary_emergency_contact_home_phone,
          userId,
        ],
      );

      pushChange('Employment Start Date', employement_start_update, existingEmployee.employement_start_date, 'employee');
      pushChange('OPT Start Date', start_date, existingEmployee.start_date, 'employee');
      pushChange('OPT End Date', end_date, existingEmployee.end_date, 'employee');
      pushChange('Visa Status', visa_status, existingEmployee.visa_status, 'employee');
      pushChange('College Name', college_name, existingEmployee.college_name, 'employee');
      pushChange('College Address', college_address, existingEmployee.college_address, 'employee');
      pushChange('Degree', degree, existingEmployee.degree, 'employee');
      pushChange('Job Title', job_title, existingEmployee.job_title, 'employee');
      pushChange('Date of Birth', date_of_birth, existingEmployee.date_of_birth, 'employee');
      pushChange('Compensation', compensation, existingEmployee.compensation, 'employee');
      pushChange('Job Duties', job_duties, existingEmployee.job_duties, 'employee');
      pushChange('Project Manager', project_manager_id, existingEmployee.project_manager_id, 'employee');
      pushChange('DSO Name', college_Dso_name, existingEmployee.college_Dso_name, 'employee');
      pushChange('DSO Email', college_Dso_email, existingEmployee.college_Dso_email, 'employee');
      pushChange('DSO Phone', college_Dso_phone, existingEmployee.college_Dso_phone, 'employee');
      pushChange('Primary Emergency Contact Name', primary_emergency_contact_full_name, existingEmployee.primary_emergency_contact_full_name, 'employee');
      pushChange('Primary Emergency Contact Relationship', primary_emergency_contact_relationship, existingEmployee.primary_emergency_contact_relationship, 'employee');
      pushChange('Primary Emergency Contact Phone', primary_emergency_contact_home_phone, existingEmployee.primary_emergency_contact_home_phone, 'employee');
      pushChange('Secondary Emergency Contact Name', secondary_emergency_contact_full_name, existingEmployee.secondary_emergency_contact_full_name, 'employee');
      pushChange('Secondary Emergency Contact Relationship', secondary_emergency_contact_relationship, existingEmployee.secondary_emergency_contact_relationship, 'employee');
      pushChange('Secondary Emergency Contact Phone', secondary_emergency_contact_home_phone, existingEmployee.secondary_emergency_contact_home_phone, 'employee');

      Logger.info(`User change entries: ${JSON.stringify(userChangeEntries)}`);
      Logger.info(`Employee change entries: ${JSON.stringify(employeeChangeEntries)}`);
      Logger.info(`Employee record ID: ${employeeRecordId}`);
      
      if (userChangeEntries.length > 0) {
        await changeLogService.recordUserChangeLogs(
          userId,
          options?.changedBy ?? null,
          userChangeEntries,
          connection,
        );
        Logger.info(`Recorded ${userChangeEntries.length} user change logs for user ${userId}`);
      }
      if (employeeRecordId && employeeChangeEntries.length > 0) {
        await changeLogService.recordEmployeeChangeLogs(
          employeeRecordId,
          options?.changedBy ?? null,
          employeeChangeEntries,
          connection,
        );
        Logger.info(`Recorded ${employeeChangeEntries.length} employee change logs for employee ${employeeRecordId}`);
      }

      await connection.commit();
      Logger.info(`Employee details updated for user ID: ${userId}`);
      return { success: true, message: 'Employee details updated successfully' };
    } catch (error) {
      await connection.rollback();
      Logger.error(`Update employee details error: ${error}`);
      return { success: false, message: 'Failed to update employee details' };
    } finally {
      connection.release();
    }
  }
  public async getUserProfile(userId: number): Promise<{ success: boolean; user?: any; message?: string }> {
    try {
      const query = `
        SELECT
          u.id, u.first_name, u.last_name, CONCAT(u.first_name,' ',u.last_name) AS name, u.email, u.phone, u.role, u.is_active, u.location, u.no_of_hours,
          e.employement_start_date, e.start_date, e.end_date, e.visa_status,
          e.college_name, e.college_address, e.degree, e.job_title, e.date_of_birth,
          e.college_Dso_name, e.college_Dso_email, e.college_Dso_phone,
          e.compensation, e.job_duties, e.project_manager_id,
          e.primary_emergency_contact_full_name, e.primary_emergency_contact_relationship, e.primary_emergency_contact_home_phone,
          e.secondary_emergency_contact_full_name, e.secondary_emergency_contact_relationship, e.secondary_emergency_contact_home_phone
        FROM users u
        LEFT JOIN employees e ON u.id = e.user_id
        WHERE u.id = ?
      `;
      const users = await database.query(query, [userId]);

      if (!Array.isArray(users) || users.length === 0) {
        return { success: false, message: 'User not found' };
      }

      // The user object from the query already contains all the necessary fields.
      const user = users[0];

      return { success: true, user: user };
    } catch (error) {
      Logger.error(`Error fetching user profile for userId ${userId}: ${error}`);
      return { success: false, message: 'Internal server error' };
    }
  }

  async getUserChangeLogs(userId: number): Promise<{
    success: boolean;
    changeLogs?: UserChangeLog[];
    projectChangeLogs?: UserProjectChangeLog[];
    employeeChangeLogs?: EmployeeChangeLog[];
    message?: string;
  }> {
    try {
      const employeeRows = await database.query<RowDataPacket[]>(
        'SELECT id FROM employees WHERE user_id = ? LIMIT 1',
        [userId],
      );
      const employeeId = Array.isArray(employeeRows) && employeeRows.length > 0
        ? Number(employeeRows[0].id)
        : null;

      const [changeLogs, projectChangeLogs, employeeChangeLogs] = await Promise.all([
        changeLogService.getUserChangeLogs(userId),
        changeLogService.getUserProjectChangeLogs(userId),
        employeeId ? changeLogService.getEmployeeChangeLogs(employeeId) : Promise.resolve([]),
      ]);
      return { success: true, changeLogs, projectChangeLogs, employeeChangeLogs };
    } catch (error) {
      Logger.error(`Get user change logs error: ${error}`);
      return { success: false, message: 'Failed to load change history' };
    }
  }


  async deactivateUser(
    userId: number,
    changedBy?: number | null,
  ): Promise<{ success: boolean; message: string }> {
    try {
      const rows = (await database.query<RowDataPacket[]>(
        'SELECT is_active FROM users WHERE id = ? LIMIT 1',
        [userId],
      )) as RowDataPacket[];

      if (!Array.isArray(rows) || rows.length === 0) {
        return { success: false, message: 'User not found' };
      }

      if (rows[0].is_active === 0) {
        return { success: false, message: 'User not found or already inactive' };
      }

      const result = (await database.query(
        "UPDATE users SET is_active = 0 WHERE id = ?",
        [userId],
      )) as unknown as ResultSetHeader;

      if (result.affectedRows === 0) {
        return { success: false, message: 'User not found or already inactive' };
      }

      await changeLogService.recordUserChangeLogs(userId, changedBy ?? null, [
        {
          fieldName: 'Status',
          oldValue: 'Active',
          newValue: 'Inactive',
          changeType: 'UPDATE',
          changeReason: 'Deactivated via admin dashboard',
        },
      ]);

      Logger.info(`User deactivated successfully: ID ${userId}`);
      return { success: true, message: 'User deactivated successfully' };
    } catch (error) {
      Logger.error(`Deactivate user error: ${error}`);
      return { success: false, message: 'Failed to deactivate user' };
    }
  }
}
