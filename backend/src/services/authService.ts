import database from '../config/database';
import {
  AuthResponse,
  CreateUserRequest,
  LoginRequest,
  UserRole,
} from '../models/User';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import Logger from '../utils/logger';
dotenv.config();

export class AuthService {
  private readonly saltrounds = 12;
  async login(loginData: LoginRequest): Promise<AuthResponse> {
    try {
      const { email, password } = loginData;
      const users = await database.query(
        'select id,name,email,password,role,is_active from users where email = ?',
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
        process.env.JWT_SECRET as string,
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
          name: user.name,
          email: user.email,
          role: user.role,
        },
      };
    } catch (error) {
      Logger.error(`Login error: ${error}`);
      return { success: false, message: 'Internal server error' };
    }
  }
  async forgotPassword(
    email: string,
  ): Promise<{ success: boolean; message: string; resetToken?: string }> {
    try {
      const users = await database.query(
        'SELECT id FROM users WHERE email = ?',
        [email],
      );

      if (!Array.isArray(users) || users.length === 0) {
        // Don't reveal if email exists
        return {
          success: true,
          message: 'If this email exists, a reset link has been sent',
        };
      }

      // Generate simple 6-digit code (or use crypto for longer token)
      const resetToken = Math.floor(100000 + Math.random() * 900000).toString();

      await database.query('UPDATE users SET reset_token = ? WHERE email = ?', [
        resetToken,
        email,
      ]);

      // In production: Send email with reset code
      Logger.info(`Password reset code for ${email}: ${resetToken}`);

      return {
        success: true,
        message: 'If this email exists, a reset code has been sent',
        resetToken, // Remove in production - only for testing
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
  async createUserByAdmin(adminId: number, userData: CreateUserRequest) {
    try {
      const adminUsers = await database.query(
        'select id,role from users where id= ? and role= ?',
        [adminId, UserRole.ADMIN],
      );
      if (!Array.isArray(adminUsers) || adminUsers.length === 0) {
        return { success: false, message: 'Admin not found' };
      }
      const adminUser = adminUsers[0];
      if (adminUser.role !== UserRole.ADMIN) {
        return { success: false, message: 'Admin not found' };
      }
      const { name, email, phone, role, location, no_of_hours, project_name } =
        userData;
      const tempPassword = this.generateTempPassword();
      const hashedPassword = await bcrypt.hash(tempPassword, this.saltrounds);
      const newUser = {
        name,
        email,
        phone,
        password: hashedPassword,
        role,
        location,
        no_of_hours,
        project_name,
      };
      const result = await database.query(
        'insert into users (name,email,phone,password,role,location,no_of_hours,project_name) values (?,?,?,?,?,?,?,?)',
        [
          newUser.name,
          newUser.email,
          newUser.phone,
          newUser.password,
          newUser.role,
          newUser.location ?? '',
          newUser.no_of_hours,
          newUser.project_name ?? '',
        ],
      );
      const userId = (result as { insertId: number }).insertId;
      Logger.info(`User created successfully: ${newUser.email}`);
      Logger.info(
        `Admin (ID: ${adminId}) created user: ${email} with role: ${role}`,
      );

      return {
        success: true,
        message: 'User created successfully. Temporary password generated.',
        tempPassword,
        userId,
      };
    } catch (error) {
      Logger.error(`Create user by admin error: ${error}`);
      return { success: false, message: 'Internal server error' };
    }
  }
  async validateToken(
    token: string,
  ): Promise<{ valid: boolean; payload?: jwt.JwtPayload | string }> {
    try {
      const payload = jwt.verify(token, process.env.JWT_SECRET!);
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

      let query = 'SELECT id, name, email, role, is_active FROM users';
      let params: (string | number)[] = [];

      // PM can see employees, Admin can see everyone
      if (requesterRole === UserRole.PROJECT_MANAGER) {
        query += ' WHERE role = ?';
        params = [UserRole.EMPLOYEE];
      }
      // Admin can see all users without filter

      const users = await database.query(query, params);

      return {
        success: true,
        users: users as unknown[],
      };
    } catch (error) {
      Logger.error(`Get users error: ${error}`);
      throw error;
    }
  }
}
