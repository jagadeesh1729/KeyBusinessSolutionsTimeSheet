import { Router, Request, Response } from 'express';
import { AuthService } from '../services/authService';
import { authenticate, AuthRequest } from '../middleware/authMiddleware';
import { requireAdmin, requirePMOrAdmin } from '../middleware/roleMiddleware';
import Logger from '../utils/logger';
import { CreateUserRequest, LoginRequest, UserRole, CreatePMRequest, RegisterEmployeeRequest, AssignProjectsRequest, AssignEmployeesToPMRequest } from '../models/User';
import { authRateLimiter } from '../middleware/rateLimiters';

const router = Router();
const authService = new AuthService();

router.post('/login', authRateLimiter, async (req: AuthRequest, res: Response) => {
  try {
    const { email, password }: LoginRequest = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required' });
    }
    const result = await authService.login({ email, password });

    if (!result.success) {
      return res.status(401).json(result);
    }
    res.json(result);
  } catch (error) {
    Logger.error(`Login error: ${error}`);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

router.post('/forgot-password', async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, message: 'Email is required' });
    }
    const result = await authService.forgotPassword(email);
    res.json({ success: true, message: 'If this email exists, a reset code has been sent', resetToken: result.resetToken });
  } catch (error) {
    Logger.error(`Forgot password error: ${error}`);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

router.post('/verify-reset-code', async (req: Request, res: Response) => {
  try {
    const { email, code } = req.body;
    if (!email || !code) {
      return res.status(400).json({ success: false, message: 'Email and reset code are required' });
    }
    const result = await authService.verifyResetToken(email, code);
    if (!result.success) {
      return res.status(400).json(result);
    }
    res.json(result);
  } catch (error) {
    Logger.error(`Verify reset code error: ${error}`);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

router.post('/reset-password', async (req: Request, res: Response) => {
  try {
    const { email, code, newPassword } = req.body;
    if (!email || !code || !newPassword) {
      return res.status(400).json({ success: false, message: 'Email, reset code, and new password are required' });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });
    }
    const verifyResult = await authService.verifyResetToken(email, code);
    if (!verifyResult.success) {
      return res.status(400).json(verifyResult);
    }
    const result = await authService.setNewPassword(email, newPassword);
    res.json(result);
  } catch (error) {
    Logger.error(`Reset password error: ${error}`);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

router.get('/profile', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    // The user ID is available from the authenticated request's token payload.
    const userId = req.user!.userId;

    // Use the AuthService to fetch the full, detailed user profile from the database.
    const result = await authService.getUserProfile(userId);

    if (!result.success) {
      return res.status(404).json(result);
    }
    res.json({ success: true, data: { user: result.user } });
  } catch (error) {
    Logger.error(`Get profile error: ${error}`);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

router.get('/users', authenticate, requirePMOrAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const result = await authService.getUsers(req.user!.userId);
    if (!result.success) {
      return res.status(400).json(result);
    }
    res.json({ success: true, data: result.users });
  } catch (error) {
    Logger.error(`Get users error: ${error}`);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Admin creates PM
router.post('/create-pm', authenticate, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { first_name, last_name, email, phone, location, no_of_hours }: CreatePMRequest = req.body as any;
    if (!first_name || !last_name || !email || !phone) {
      return res.status(400).json({ success: false, message: 'First name, last name, email, and phone are required' });
    }
    const result = await authService.createProjectManager(req.user!.userId, req.body);
    if (!result.success) {
      return res.status(400).json(result);
    }
    res.status(201).json(result);
  } catch (error) {
    Logger.error(`Create PM error: ${error}`);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Employee self-registration
router.post('/register-employee', async (req: Request, res: Response) => {
  try {
    const { first_name, last_name, email, phone, password }: RegisterEmployeeRequest = req.body as any;
    if (!first_name || !last_name || !email || !phone || !password) {
      return res.status(400).json({ success: false, message: 'First name, last name, email, phone, and password are required' });
    }
    if (password.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });
    }
    const result = await authService.registerEmployee(req.body);
    if (!result.success) {
      return res.status(400).json(result);
    }
    res.status(201).json(result);
  } catch (error) {
    Logger.error(`Employee registration error: ${error}`);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Get user's assigned projects
router.get('/user-projects/:userId', authenticate, requirePMOrAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const userId = parseInt(req.params.userId);
    if (isNaN(userId)) {
      return res.status(400).json({ success: false, message: 'Invalid user ID' });
    }
    const result = await authService.getUserProjects(userId);
    if (!result.success) {
      return res.status(400).json(result);
    }
    res.json({ success: true, data: result.projects });
  } catch (error) {
    Logger.error(`Get user projects error: ${error}`);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Get employees needing review (Admin only)
router.get('/employees-for-review', authenticate, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const result = await authService.getEmployeesForReview();
    if (!result.success) {
      return res.status(400).json(result);
    }
    res.json({ success: true, data: result.employees, count: result.count });
  } catch (error) {
    Logger.error(`Get employees for review error: ${error}`);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Update employee details (Admin only)
router.put('/employee/:userId', authenticate, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const userId = parseInt(req.params.userId);
    if (isNaN(userId)) {
      return res.status(400).json({ success: false, message: 'Invalid user ID' });
    }
    const result = await authService.updateEmployeeDetails(userId, req.body);
    if (!result.success) {
      return res.status(400).json(result);
    }
    res.json(result);
  } catch (error) {
    Logger.error(`Update employee details error: ${error}`);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

export default router;
