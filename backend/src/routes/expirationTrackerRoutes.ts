import { Router, Response } from 'express';
import { authenticate, AuthRequest } from '../middleware/authMiddleware';
import { requireAdmin } from '../middleware/roleMiddleware';
import { expirationTrackerService } from '../services/expirationTrackerService';
import Logger from '../utils/logger';

const router = Router();

/**
 * GET /api/expiration-tracker
 * Get current expiration tracker settings
 * Accessible by all authenticated users
 */
router.get('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const result = await expirationTrackerService.getTracker();
    if (!result.success) {
      return res.status(500).json(result);
    }
    res.json(result);
  } catch (error) {
    Logger.error(`Get expiration tracker error: ${error}`);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

/**
 * PUT /api/expiration-tracker
 * Update expiration tracker settings
 * Admin only
 */
router.put('/', authenticate, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    // Get the tracker first (or create if not exists)
    const trackerResult = await expirationTrackerService.getTracker();
    if (!trackerResult.success || !trackerResult.data) {
      return res.status(500).json({ success: false, message: 'Failed to get tracker' });
    }

    const result = await expirationTrackerService.updateTracker(
      trackerResult.data.id!,
      req.body,
      req.user?.userId ?? null
    );

    if (!result.success) {
      return res.status(400).json(result);
    }
    res.json(result);
  } catch (error) {
    Logger.error(`Update expiration tracker error: ${error}`);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

/**
 * GET /api/expiration-tracker/employees
 * Get list of employees whose visa/contract is expiring within target_days
 * Accessible by all authenticated users
 */
router.get('/employees', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const result = await expirationTrackerService.getExpiringEmployees();
    if (!result.success) {
      return res.status(500).json(result);
    }
    res.json(result);
  } catch (error) {
    Logger.error(`Get expiring employees error: ${error}`);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

/**
 * GET /api/expiration-tracker/count
 * Get count of expiring employees by status
 * Accessible by all authenticated users
 */
router.get('/count', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const result = await expirationTrackerService.getExpiringEmployeesCount();
    if (!result.success) {
      return res.status(500).json(result);
    }
    res.json(result);
  } catch (error) {
    Logger.error(`Get expiring employees count error: ${error}`);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

/**
 * GET /api/expiration-tracker/change-logs
 * Get change logs for the expiration tracker
 * Admin only
 */
router.get('/change-logs', authenticate, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const trackerResult = await expirationTrackerService.getTracker();
    if (!trackerResult.success || !trackerResult.data) {
      return res.status(500).json({ success: false, message: 'Failed to get tracker' });
    }

    const result = await expirationTrackerService.getTrackerChangeLogs(trackerResult.data.id!);
    if (!result.success) {
      return res.status(500).json(result);
    }
    res.json(result);
  } catch (error) {
    Logger.error(`Get tracker change logs error: ${error}`);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

export default router;
