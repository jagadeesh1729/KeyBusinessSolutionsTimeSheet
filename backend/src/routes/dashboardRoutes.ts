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
    const managerId = (req as any).user.userId;
    const range = req.query.range as string || 'current';
    
    console.log('Getting dashboard stats for manager:', managerId, 'range:', range);
    
    const result = await timesheetService.getDashboardStats(managerId, range);
    res.json(result);
  } catch (error) {
    Logger.error(`Get dashboard stats error: ${error}`);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

export default router;