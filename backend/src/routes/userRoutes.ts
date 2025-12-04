import { Router, Request, Response } from 'express';
import { AuthService } from '../services/authService';
import { authenticate, AuthRequest } from '../middleware/authMiddleware';
import { requireAdmin, requirePMOrAdmin } from '../middleware/roleMiddleware';
import { AssignProjectsRequest } from '../models/User';
import Logger from '../utils/logger';

const router = Router();
const authService = new AuthService();

// Public endpoint for an employee to register themselves
router.post('/register/employee', async (req: Request, res: Response) => {
  try {
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

// Protected endpoint for an admin to create a Project Manager
router.post('/create/pm', authenticate, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const adminId = req.user!.userId; // We know user exists due to middleware
    const result = await authService.createProjectManager(adminId, req.body);
    if (!result.success) {
      return res.status(400).json(result);
    }
    res.status(201).json(result);
  } catch (error) {
    Logger.error(`Create PM error: ${error}`);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Protected endpoint for any authenticated user to get all Project Managers
router.get('/pms', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const result = await authService.getProjectManagers();
    res.json(result);
  } catch (error) {
    Logger.error(`Get PMs error: ${error}`);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Get inactive Project Managers (Admin only)
router.get('/pms/inactive', authenticate, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const result = await authService.getInactiveProjectManagers();
    res.json(result);
  } catch (error) {
    Logger.error(`Get inactive PMs error: ${error}`);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Get inactive Employees (Admin only)
router.get('/employees/inactive', authenticate, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const result = await authService.getInactiveEmployees();
    res.json(result);
  } catch (error) {
    Logger.error(`Get inactive employees error: ${error}`);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Reactivate a user (Admin only)
router.put('/:id/reactivate', authenticate, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const userId = parseInt(req.params.id, 10);
    if (isNaN(userId)) {
      return res.status(400).json({ success: false, message: 'Invalid user ID' });
    }
    const result = await authService.reactivateUser(userId, req.user?.userId ?? null);
    res.json(result);
  } catch (error) {
    Logger.error(`Reactivate user error: ${error}`);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Protected endpoint to get projects for a specific user
router.get('/:id/projects', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = parseInt(req.params.id, 10);
    if (isNaN(userId)) {
      return res.status(400).json({ success: false, message: 'Invalid user ID' });
    }
    const result = await authService.getUserProjects(userId);
    res.json(result);
  } catch (error) {
    Logger.error(`Get user projects error: ${error}`);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

router.get('/:id/change-logs', authenticate, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const userId = parseInt(req.params.id, 10);
    if (isNaN(userId)) {
      return res.status(400).json({ success: false, message: 'Invalid user ID' });
    }
    const result = await authService.getUserChangeLogs(userId);
    if (!result.success) {
      return res.status(500).json(result);
    }
    res.json(result);
  } catch (error) {
    Logger.error(`Get user change logs error: ${error}`);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Assign projects to user (Admin/PM only)
router.post('/assign-projects', authenticate, requirePMOrAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { user_id, project_ids }: AssignProjectsRequest = req.body;
    if (!user_id || !Array.isArray(project_ids)) {
      return res.status(400).json({ success: false, message: 'User ID and project IDs array are required' });
    }
    const result = await authService.assignProjects(req.body, {
      changedBy: req.user?.userId ?? null,
    });
    if (!result.success) {
      return res.status(400).json(result);
    }
    res.json(result);
  } catch (error) {
    Logger.error(`Assign projects error: ${error}`);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Get employees assigned to a specific PM
router.get('/pm-employees/:pmId', authenticate, requirePMOrAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const pmId = parseInt(req.params.pmId);
    if (isNaN(pmId)) {
      return res.status(400).json({ success: false, message: 'Invalid Project Manager ID' });
    }
    const result = await authService.getPMEmployees(pmId);
    if (!result.success) {
      return res.status(400).json(result);
    }
    res.json({ success: true, data: result.employees });
  } catch (error) {
    Logger.error(`Get PM employees error: ${error}`);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Get employees not assigned to any PM
router.get('/employees-without-pm', authenticate, requirePMOrAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const result = await authService.getEmployeesWithoutPM();
    if (!result.success) {
      return res.status(400).json(result);
    }
    res.json({ success: true, data: result.employees });
  } catch (error) {
    Logger.error(`Get employees without PM error: ${error}`);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Assign employees to a PM
router.post('/assign-employees-to-pm', authenticate, requirePMOrAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { pm_id, employee_ids } = req.body;
    if (!pm_id || !Array.isArray(employee_ids)) {
      return res.status(400).json({ success: false, message: 'PM ID and employee IDs array are required' });
    }
    const result = await authService.assignEmployeesToPM(req.body, {
      changedBy: req.user?.userId ?? null,
    });
    res.json(result);
  } catch (error) {
    Logger.error(`Assign employees to PM error: ${error}`);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Deactivate a user (Admin only)
router.delete('/:id', authenticate, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const userId = parseInt(req.params.id, 10);
    if (isNaN(userId)) {
      return res.status(400).json({ success: false, message: 'Invalid user ID' });
    }
    const result = await authService.deactivateUser(userId, req.user?.userId ?? null);
    res.json(result);
  } catch (error) {
    Logger.error(`Deactivate user error: ${error}`);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});


export default router;
