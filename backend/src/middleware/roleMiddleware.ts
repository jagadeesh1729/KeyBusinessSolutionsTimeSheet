import { Response, NextFunction } from 'express';
import { AuthRequest } from './authMiddleware';
import { UserRole } from '../models/User';
import Logger from '../utils/logger';

export const requireRole = (allowedRoles: UserRole[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      Logger.warn(
        `User ${req.user.email} with role ${req.user.role} attempted to access admin-only route`,
      );
      res.status(403).json({
        success: false,
        message: 'Insufficient permissions',
      });
      return;
    }

    next();
  };
};

export const requireAdmin = requireRole([UserRole.ADMIN]);
export const requirePMOrAdmin = requireRole([
  UserRole.ADMIN,
  UserRole.PROJECT_MANAGER,
]);
export const requireEmployee = requireRole([UserRole.EMPLOYEE]);
export const requireProjectManager = requireRole([UserRole.PROJECT_MANAGER]);
