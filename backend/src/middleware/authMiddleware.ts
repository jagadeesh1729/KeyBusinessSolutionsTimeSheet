import { NextFunction, Request, Response } from 'express';
import { AuthService } from '../services/authService';
import Logger from '../utils/logger';
import { UserRole } from '../models/User';

const authService = new AuthService();

export interface AuthRequest extends Request {
  user?: {
    userId: number;
    email: string;
    role: UserRole;
    employeeId?:number; 
  };
}

export const authenticate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const authHeader = req.header('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.',
      });
      return;
    }
    const token = authHeader.substring(7);
    const { valid, payload } = await authService.validateToken(token);

    if (!valid) {
      res.status(401).json({
        success: false,
        message: 'Invalid or expired token',
      });
      return;
    }

    // Add user info to request
    req.user = payload as { userId: number; email: string; role: UserRole, employeeId?:number};
    next();
  } catch (error) {
    Logger.error(`Authentication middleware error: ${error}`);
    res.status(500).json({
      success: false,
      message: 'Internal server error during authentication',
    });
  }
};
