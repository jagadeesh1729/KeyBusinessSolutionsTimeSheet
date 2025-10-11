import { Router, Request, Response } from 'express';
import { TimesheetService } from '../services/timesheetService';
import { authenticate } from '../middleware/authMiddleware';
import {requirePMOrAdmin} from '../middleware/roleMiddleware';

import Logger from '../utils/logger';
import database from '../config/database';
import { RowDataPacket } from 'mysql2/promise';

const router = Router();
const timesheetService = new TimesheetService();

// Helper function to get employeeId from userId
const getEmployeeId = async (userId: number): Promise<{ success: boolean; employeeId?: number; message?: string }> => {
  try {
    const employeeResult = await timesheetService.getEmployeeByUserId(userId);
    if (!employeeResult.success || !employeeResult.employee) {
      return { success: false, message: 'Access denied. Employee role required.' };
    }
    return { success: true, employeeId: employeeResult.employee.id };
  } catch (error) {
    return { success: false, message: 'Failed to verify employee status' };
  }
};

// Get current timesheet for employee + project
router.get('/current', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.userId;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'User not authenticated' });
    }

    // Convert userId to employeeId
    const employeeResult = await getEmployeeId(userId);
    if (!employeeResult.success) {
      return res.status(403).json({ success: false, message: employeeResult.message });
    }
    
    const projectId = parseInt(req.query.projectId as string, 10);
    if (isNaN(projectId)) {
      return res.status(400).json({ success: false, message: 'Invalid project ID' });
    }

    const result = await timesheetService.getCurrentTimesheet(employeeResult.employeeId!, projectId);
    res.json(result);
  } catch (error) {
    Logger.error(`Get current timesheet error: ${error}`);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Get timesheet by ID
router.get('/:id', authenticate, async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(400).json({ success: false, message: 'Invalid timesheet ID' });
    }
    
    const userId = (req as any).user?.userId;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'User not authenticated' });
    }

    // Convert userId to employeeId
    const employeeResult = await getEmployeeId(userId);
    if (!employeeResult.success) {
      return res.status(403).json({ success: false, message: employeeResult.message });
    }
    
    const result = await timesheetService.getTimesheetById(id, employeeResult.employeeId!);
    
    if (!result.success) {
      return res.status(404).json(result);
    }
    res.json(result);
  } catch (error) {
    Logger.error(`Get timesheet by ID error: ${error}`);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Get timesheet history for employee
router.get('/', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.userId;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'User not authenticated' });
    }

    // Convert userId to employeeId
    const employeeResult = await getEmployeeId(userId);
    if (!employeeResult.success) {
      return res.status(403).json({ success: false, message: employeeResult.message });
    }
    
    const result = await timesheetService.getEmployeeTimesheets(employeeResult.employeeId!);
    res.json(result);
  } catch (error) {
    Logger.error(`Get timesheets error: ${error}`);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// NEW: Get employee's draft timesheets
router.get('/employee/drafts', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.userId;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'User not authenticated' });
    }

    // Convert userId to employeeId
    const employeeResult = await getEmployeeId(userId);
    if (!employeeResult.success) {
      return res.status(403).json({ success: false, message: employeeResult.message });
    }
    
    const result = await timesheetService.getEmployeeDraftTimesheets(employeeResult.employeeId!);
    res.json(result);
  } catch (error) {
    Logger.error(`Get draft timesheets error: ${error}`);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Create new timesheet
router.post('/', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.userId;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'User not authenticated' });
    }

    // Convert userId to employeeId
    const employeeResult = await getEmployeeId(userId);
    if (!employeeResult.success) {
      return res.status(403).json({ success: false, message: employeeResult.message });
    }
    
    const timesheetData = { ...req.body, employeeId: employeeResult.employeeId! };
    
    const result = await timesheetService.createTimesheet(timesheetData);
    if (!result.success) {
      return res.status(400).json(result);
    }
    res.status(201).json(result);
  } catch (error) {
    Logger.error(`Create timesheet error: ${error}`);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Update timesheet
router.put('/:id', authenticate, async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(400).json({ success: false, message: 'Invalid timesheet ID' });
    }
    
    const userId = (req as any).user?.userId;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'User not authenticated' });
    }

    // Convert userId to employeeId
    const employeeResult = await getEmployeeId(userId);
    if (!employeeResult.success) {
      return res.status(403).json({ success: false, message: employeeResult.message });
    }
    
    const result = await timesheetService.updateTimesheet(id, employeeResult.employeeId!, req.body);
    
    if (!result.success) {
      return res.status(404).json(result);
    }
    res.json(result);
  } catch (error) {
    Logger.error(`Update timesheet error: ${error}`);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// UPDATED: Enhanced submit timesheet with better error handling
router.put('/:id/submit', authenticate, async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(400).json({ success: false, message: 'Invalid timesheet ID' });
    }
    
    const userId = (req as any).user?.userId;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'User not authenticated' });
    }

    // Convert userId to employeeId
    const employeeResult = await getEmployeeId(userId);
    if (!employeeResult.success) {
      return res.status(403).json({ success: false, message: employeeResult.message });
    }
    
    const result = await timesheetService.submitTimesheet(id, employeeResult.employeeId!);
    
    if (!result.success) {
      // More specific status codes based on error type
      if (result.message?.includes('not found')) {
        return res.status(404).json(result);
      }
      if (result.message?.includes('cannot be submitted') || result.message?.includes('Current status:')) {
        return res.status(409).json(result); // Conflict
      }
      return res.status(400).json(result);
    }
    
    res.json(result);
  } catch (error) {
    Logger.error(`Submit timesheet error: ${error}`);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Get employee's projects (NEW - helpful endpoint)
router.get('/employee/projects', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.userId; ///5

    
    const result = await timesheetService.getEmployeeProjects(userId);
    Logger.info(`Get employee projects result: ${JSON.stringify(result)}`);
    console.log(`Get employee projects result: ${JSON.stringify(result)}`);
    res.json(result);
  } catch (error) {
    Logger.error(`Get employee projects error: ${error}`);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Manager routes - Get pending timesheets (NO CHANGE - managers use userId)
router.get('/manager/pending', authenticate, requirePMOrAdmin, async (req: Request, res: Response) => {
  try {
    const managerId = (req as any).user.userId;
    const result = await timesheetService.getPendingTimesheets(managerId);
    res.json(result);
  } catch (error) {
    Logger.error(`Get pending timesheets error: ${error}`);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Approve timesheet (NO CHANGE - managers use userId)
router.post('/:id/approve', authenticate, requirePMOrAdmin, async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(400).json({ success: false, message: 'Invalid timesheet ID' });
    }
    
    const managerId = (req as any).user.userId;
    const result = await timesheetService.approveTimesheet(id, managerId, req.body.notes);
    
    if (!result.success) {
      return res.status(400).json(result);
    }
    res.json(result);
  } catch (error) {
    Logger.error(`Approve timesheet error: ${error}`);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// NEW: PUT route to approve timesheet by looking up the manager from the project
router.put('/:id/auto/approve', authenticate, async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(400).json({ success: false, message: 'Invalid timesheet ID' });
    }

    // Step 1: Get the project_id from the timesheet
    const [timesheetRows] = await database.query<RowDataPacket[]>(
      'SELECT project_id FROM timesheets WHERE id = ?',
      [id]
    );

    if (timesheetRows.length === 0) {
      return res.status(404).json({ success: false, message: 'Timesheet not found' });
    }
    const projectId = timesheetRows[0].project_id;

    // Step 2: Find the project manager for that project
    const [managerRows] = await database.query<RowDataPacket[]>(
      `SELECT up.user_id FROM user_projects up
       JOIN users u ON up.user_id = u.id
       WHERE up.project_id = ? AND u.role IN ('pm', 'admin')
       LIMIT 1`,
      [projectId]
    );

    if (managerRows.length === 0) {
      return res.status(404).json({ success: false, message: 'Project manager for this project not found' });
    }
    const managerId = managerRows[0].user_id;

    // Step 3: Call the approval service with the found managerId
    const result = await timesheetService.approveTimesheet(id, managerId, req.body.notes);

    if (!result.success) {
      return res.status(400).json(result);
    }
    res.json(result);
  } catch (error) {
    Logger.error(`Approve timesheet (PUT) error: ${error}`);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Reject timesheet (NO CHANGE - managers use userId)
router.post('/:id/reject', authenticate, requirePMOrAdmin, async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(400).json({ success: false, message: 'Invalid timesheet ID' });
    }
    
    const managerId = (req as any).user.userId;
    const { reason } = req.body;
    
    if (!reason) {
      return res.status(400).json({ success: false, message: 'Rejection reason is required' });
    }
    
    const result = await timesheetService.rejectTimesheet(id, managerId, reason);
    
    if (!result.success) {
      return res.status(400).json(result);
    }
    res.json(result);
  } catch (error) {
    Logger.error(`Reject timesheet error: ${error}`);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Get PM stats (projects and employees)
router.get('/manager/stats', authenticate, requirePMOrAdmin, async (req: Request, res: Response) => {
  try {
    const managerId = (req as any).user.userId;
    const result = await timesheetService.getPMStats(managerId);
    res.json(result);
  } catch (error) {
    Logger.error(`Get PM stats error: ${error}`);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Get PM projects
router.get('/manager/projects', authenticate, requirePMOrAdmin, async (req: Request, res: Response) => {
  try {
    const managerId = (req as any).user.userId;
    const result = await timesheetService.getPMProjects(managerId);
    res.json(result);
  } catch (error) {
    Logger.error(`Get PM projects error: ${error}`);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Get PM employees
router.get('/manager/employees', authenticate, requirePMOrAdmin, async (req: Request, res: Response) => {
  try {
    const managerId = (req as any).user.userId;
    const result = await timesheetService.getPMEmployees(managerId);
    res.json(result);
  } catch (error) {
    Logger.error(`Get PM employees error: ${error}`);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Get employees who haven't submitted
router.get('/manager/not-submitted', authenticate, requirePMOrAdmin, async (req: Request, res: Response) => {
  try {
    const managerId = (req as any).user.userId;
    const result = await timesheetService.getEmployeesNotSubmitted(managerId);
    res.json(result);
  } catch (error) {
    Logger.error(`Get employees not submitted error: ${error}`);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// NEW: Route to handle project period type changes
router.put('/projects/:id/period-type', authenticate, requirePMOrAdmin, async (req: Request, res: Response) => {
  try {
    const projectId = parseInt(req.params.id, 10);
    const { period_type } = req.body;
    
    if (isNaN(projectId)) {
      return res.status(400).json({ success: false, message: 'Invalid project ID' });
    }
    
    if (!['weekly', 'bi-monthly', 'monthly'].includes(period_type)) {
      return res.status(400).json({ success: false, message: 'Invalid period type' });
    }
    
    // Update project period type
    const database = require('../config/database').default;
    await database.query(
      'UPDATE projects SET period_type = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [period_type, projectId]
    );
    
    // Update existing draft timesheets
    const result = await timesheetService.updateTimesheetsForProjectPeriodChange(projectId, period_type);
    
    if (!result.success) {
      return res.status(500).json(result);
    }
    
    res.json({ success: true, message: 'Project period type updated successfully' });
  } catch (error) {
    Logger.error(`Update project period type error: ${error}`);
    res.status(500).json({ success: false, message: 'Failed to update project period type' });
  }
});

// NEW: Get dashboard statistics
router.get('/manager/dashboard', authenticate, requirePMOrAdmin, async (req: Request, res: Response) => {
  try {
    const managerId = (req as any).user.userId;
    const range = (req.query.range as string) || 'monthly';
    const result = await timesheetService.getDashboardStats(managerId, range);
    res.json(result);
  } catch (error) {
    Logger.error(`Get dashboard stats error: ${error}`);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});
router.get('/rejected', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.userId;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'User not authenticated' });
    }

    // Convert userId to employeeId
    const employeeResult = await getEmployeeId(userId);
    if (!employeeResult.success) {
      return res.status(403).json({ success: false, message: employeeResult.message });
    }
    
    // Get rejected timesheets for this employee
    const rows = (await database.query(
      `SELECT 
         t.*,
         p.name as project_name,
         p.period_type,
         p.auto_approve
       FROM timesheets t 
       JOIN projects p ON t.project_id = p.id 
       WHERE t.employee_id = ? AND t.status = 'rejected'
       ORDER BY t.rejected_at DESC`,
      [employeeResult.employeeId!]
    )) as RowDataPacket[];
    
    res.json({ success: true, timesheets: rows });
  } catch (error) {
    Logger.error(`Get rejected timesheets error: ${error}`);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// NEW: Get timesheet for editing (with rejection details)
router.get('/:id/edit', authenticate, async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(400).json({ success: false, message: 'Invalid timesheet ID' });
    }
    
    const userId = (req as any).user?.userId;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'User not authenticated' });
    }

    // Convert userId to employeeId
    const employeeResult = await getEmployeeId(userId);
    if (!employeeResult.success) {
      return res.status(403).json({ success: false, message: employeeResult.message });
    }
    
    // Get timesheet with rejection details
    const result = await timesheetService.getTimesheetById(id, employeeResult.employeeId!);
    
    if (!result.success || !result.timesheet) {
      return res.status(404).json(result);
    }

    // Only allow editing if timesheet is rejected
    if (result.timesheet.status !== 'rejected') {
      return res.status(403).json({ 
        success: false, 
        message: 'Only rejected timesheets can be edited' 
      });
    }
    
    res.json(result);
  } catch (error) {
    Logger.error(`Get timesheet for edit error: ${error}`);
    res.status(500).json({ success: false, message: 'Internal server error' }); // The error message was already a string, so no change needed here.
  }
});

export default router;