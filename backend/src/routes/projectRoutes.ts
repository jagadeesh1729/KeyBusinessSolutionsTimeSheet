import { Router, Request, Response } from 'express';
import { ProjectService } from '../services/projectService';
import { authenticate } from '../middleware/authMiddleware';
import { requireAdmin, requirePMOrAdmin } from '../middleware/roleMiddleware';
import Logger from '../utils/logger';

const router = Router();
const projectService = new ProjectService();

router.get('/', async (req: Request, res: Response) => {
  try {
    const result = await projectService.getAllProjects();
    res.json(result);
  } catch (error) {
    Logger.error(`Get projects error: ${error}`);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// NEW: Admin-only route to get all projects with their timesheets
router.get('/all-with-timesheets', authenticate, requireAdmin, async (req: Request, res: Response) => {
  try {
    const result = await projectService.getAllProjectsWithTimesheets();
    res.json(result);
  } catch (error) {
    Logger.error(`Get all projects with timesheets error: ${error}`);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

router.get('/assigned', authenticate, async (req: Request, res: Response) => {
  try {
    console.log('GET /assigned - Request received');
    console.log('User from request:', (req as any).user);
    const employeeId = (req as any).user?.userId;
    console.log('Employee ID:', employeeId);
    if (!employeeId) {
      console.log('No employee ID found, returning 401');
      return res.status(401).json({ success: false, message: 'User not authenticated' });
    }
    console.log('Calling projectService.getAssignedProjects with employeeId:', employeeId);
    const result = await projectService.getAssignedProjects(employeeId);
    console.log('Project service result:', result);
    res.json(result);
  } catch (error) {
    console.log('Error in /assigned route:', error);
    Logger.error(`Get assigned projects error: ${error}`);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

router.get('/inactive', authenticate, requirePMOrAdmin, async (req: Request, res: Response) => {
  try {
    const result = await projectService.getInactiveProjects();
    res.json(result);
  } catch (error) {
    Logger.error(`Get inactive projects error: ${error}`);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

router.get('/:id', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(400).json({ success: false, message: 'Invalid project ID' });
    }
    const result = await projectService.getProjectById(id);
    if (!result.success) {
      return res.status(404).json(result);
    }
    res.json(result);
  } catch (error) {
    Logger.error(`Get project by ID error: ${error}`);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

router.post('/', authenticate, requirePMOrAdmin, async (req: Request, res: Response) => {
  try {
    const result = await projectService.createProject(req.body);
    if (!result.success) {
      return res.status(400).json(result);
    }
    res.status(201).json(result);
  } catch (error) {
    Logger.error(`Create project error: ${error}`);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

router.put('/:id', authenticate, requirePMOrAdmin, async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(400).json({ success: false, message: 'Invalid project ID' });
    }
    const result = await projectService.updateProject(id, req.body);
    if (!result.success) {
      return res.status(404).json(result);
    }
    res.json(result);
  } catch (error) {
    Logger.error(`Update project error: ${error}`);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

router.delete('/:id', authenticate, requirePMOrAdmin, async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(400).json({ success: false, message: 'Invalid project ID' });
    }
    const result = await projectService.deactivateProject(id); // This line was missing
    res.json(result);
  } catch (error) {
    Logger.error(`Delete project error: ${error}`);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

export default router;