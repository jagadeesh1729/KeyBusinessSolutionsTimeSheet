import { Router, Request, Response } from 'express';
import { TimesheetService } from '../services/timesheetService';
import { authenticate } from '../middleware/authMiddleware';
import { requirePMOrAdmin } from '../middleware/roleMiddleware';
import Logger from '../utils/logger';

const router = Router();
const timesheetService = new TimesheetService();

// Get dashboard timesheet statistics
router.get('/timesheet-stats', authenticate, requirePMOrAdmin, async (req: Request, res: Response) => {
  try {
    const { userId, role } = (req as any).user || {};
    const range = (req.query.range as string) || 'current';
    const startDate = (req.query.startDate as string) || undefined;
    const endDate = (req.query.endDate as string) || undefined;

    if (!userId) {
      return res.status(401).json({ success: false, message: 'User not authenticated' });
    }

    if (role === 'admin') {
      const result = await timesheetService.getDashboardStatsAdmin({ range, startDate, endDate });
      return res.json(result);
    }

    console.log('Getting dashboard stats for manager:', userId, 'range:', range);
    const result = await timesheetService.getDashboardStats({ managerId: userId, range, startDate, endDate });
    return res.json(result);
  } catch (error) {
    Logger.error(`Get dashboard stats error: ${error}`);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Detailed lists for dashboard metrics and per-project team breakdown
router.get('/timesheet-details', authenticate, requirePMOrAdmin, async (req: Request, res: Response) => {
  try {
    const { userId, role } = (req as any).user || {};
    const status = (req.query.status as string) || undefined; // 'pending' | 'approved' | 'filled' | 'not-submitted'
    const projectId = req.query.projectId ? parseInt(req.query.projectId as string, 10) : undefined;
    // Admin should always query "all" (no date filter)
    const range = role === 'admin' ? 'all' : ((req.query.range as string) || undefined);
    const startDate = (req.query.startDate as string) || undefined;
    const endDate = (req.query.endDate as string) || undefined;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'User not authenticated' });
    }
    if (projectId !== undefined && Number.isNaN(projectId)) {
      return res.status(400).json({ success: false, message: 'Invalid project ID' });
    }

    const result = await timesheetService.getTimesheetDetails({
      scopeUserId: userId,
      isAdmin: role === 'admin',
      status,
      projectId,
      range,
      startDate,
      endDate,
    });
    return res.json(result);
  } catch (error) {
    Logger.error(`Get timesheet details error: ${error}`);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

export default router;
