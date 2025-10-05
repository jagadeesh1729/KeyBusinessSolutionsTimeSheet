import { Request, Response } from 'express';
import { AuthService } from '../services/authService';
import Logger from '../utils/logger';
import { AuthRequest } from '../middleware/authMiddleware';
import { CreateUserRequest, LoginRequest, UserRole } from '../models/User';

const authService = new AuthService();

export class AuthController {
  async login(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { email, password }: LoginRequest = req.body;

      if (!email || !password) {
        res.status(400).json({
          success: false,
          message: 'Email and password are required',
        });
        return;
      }

      const result = await authService.login({ email, password });

      if (!result.success) {
        res.status(401).json(result);
        return;
      }

      res.json(result);
    } catch (error) {
      Logger.error(`Login controller error: ${error}`);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  }

  async createUser(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { name, email, role }: CreateUserRequest = req.body;

      if (!name || !email || !role) {
        res.status(400).json({
          success: false,
          message: 'Name, email, and role are required',
        });
        return;
      }

      if (!Object.values(UserRole).includes(role)) {
        res.status(400).json({
          success: false,
          message: 'Invalid role',
        });
        return;
      }

      // Only admin can create users
      const result = await authService.createUserByAdmin(req.user!.userId, {
        name,
        email,
        role,
        phone: '',
        no_of_hours: 0,
      });

      if (!result.success) {
        res.status(400).json(result);
        return;
      }

      res.status(201).json({
        success: true,
        message: result.message,
        data: {
          userId: result.userId,
          user: { name, email, role },
          tempPassword: result.tempPassword, // Remove this in production, send via email instead
        },
      });
    } catch (error) {
      Logger.error(`Create user controller error: ${error}`);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  }

  async getUsers(req: AuthRequest, res: Response): Promise<void> {
    try {
      const result = await authService.getUsers(req.user!.userId);

      if (!result.success) {
        res.status(400).json(result);
        return;
      }

      res.json({
        success: true,
        data: result.users,
      });
    } catch (error) {
      Logger.error(`Get users controller error: ${error}`);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  }

  async getProfile(req: AuthRequest, res: Response): Promise<void> {
    try {
      res.json({
        success: true,
        data: {
          user: req.user,
        },
      });
    } catch (error) {
      Logger.error(`Get profile controller error: ${error}`);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  }
  async forgotPassword(req: Request, res: Response): Promise<void> {
    try {
      const { email } = req.body;

      if (!email) {
        res.status(400).json({
          success: false,
          message: 'Email is required',
        });
        return;
      }

      const result = await authService.forgotPassword(email);

      // Always return success to prevent email enumeration
      res.json({
        success: true,
        message: 'If this email exists, a reset code has been sent',
        // Remove resetToken in production
        resetToken: result.resetToken,
      });
    } catch (error) {
      Logger.error(`Forgot password controller error: ${error}`);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  }

  async verifyResetCode(req: Request, res: Response): Promise<void> {
    try {
      const { email, code } = req.body;

      if (!email || !code) {
        res.status(400).json({
          success: false,
          message: 'Email and reset code are required',
        });
        return;
      }

      const result = await authService.verifyResetToken(email, code);

      if (!result.success) {
        res.status(400).json(result);
        return;
      }

      res.json(result);
    } catch (error) {
      Logger.error(`Verify reset code controller error: ${error}`);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  }

  async resetPassword(req: Request, res: Response): Promise<void> {
    try {
      const { email, code, newPassword } = req.body;

      if (!email || !code || !newPassword) {
        res.status(400).json({
          success: false,
          message: 'Email, reset code, and new password are required',
        });
        return;
      }

      if (newPassword.length < 6) {
        res.status(400).json({
          success: false,
          message: 'Password must be at least 6 characters',
        });
        return;
      }

      // Verify code first
      const verifyResult = await authService.verifyResetToken(email, code);
      if (!verifyResult.success) {
        res.status(400).json(verifyResult);
        return;
      }

      // Set new password
      const result = await authService.setNewPassword(email, newPassword);

      res.json(result);
    } catch (error) {
      Logger.error(`Reset password controller error: ${error}`);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  }
}
