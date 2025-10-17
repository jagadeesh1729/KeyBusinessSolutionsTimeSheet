import database from '../config/database';
import { ResultSetHeader, RowDataPacket } from 'mysql2';
import {
  PeriodType,
  ProjectStatus,
  Project,
  CreateProjectRequest,
  UpdateProjectRequest,
  
} from '../models/Project';
  import { Timesheet } from '../models/Timesheet';

export class ProjectService {
  async createProject(
    projectData: CreateProjectRequest
  ): Promise<{ success: boolean; message: string; projectId?: number }> {
    const { name, start_date, end_date, auto_approve = true, period_type = 'weekly', client_address, project_description } = projectData;
    // Basic validation
    if (!name) {
      return { success: false, message: 'Project name is required' };
    }
    // Generate or validate project code
    const ensurePrefix = (n: string) => {
      const words = n
        .replace(/[^A-Za-z0-9\s]/g, ' ')
        .trim()
        .split(/\s+/)
        .filter(Boolean);
      if (words.length === 0) return 'PRJ';
      if (words.length === 1) {
        const w = words[0].toUpperCase().replace(/[^A-Z0-9]/g, '');
        return (w.slice(0, 3) || 'PRJ').toUpperCase();
      }
      return words.slice(0, 3).map(w => w[0].toUpperCase()).join('');
    };
    const randomToken = (len = 6) => {
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
      let out = '';
      for (let i = 0; i < len; i++) out += chars.charAt(Math.floor(Math.random() * chars.length));
      return out;
    };
    const buildCode = (prefix: string) => `${prefix}-${randomToken(6)}`;

    let code = (projectData.code || '').toUpperCase().trim();
    if (!code) {
      const prefix = ensurePrefix(name);
      code = buildCode(prefix);
    }

    // Attempt to avoid duplicates if a unique index exists
    for (let i = 0; i < 3; i++) {
      const exists = await database.query<RowDataPacket[]>(
        'SELECT id FROM projects WHERE code = ? LIMIT 1',
        [code]
      );
      if (!exists || exists.length === 0) break;
      code = buildCode(ensurePrefix(name));
    }

    const values: any[] = [
      name,
      'Active',
      start_date || null,
      end_date || null,
      auto_approve,
      period_type,
      code,
      client_address || null,
      project_description || null,
    ];

    const result = await database.query(
      'INSERT INTO projects (name, status, start_date, end_date, auto_approve, period_type, code, client_address, project_description) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      values
    ) as unknown as ResultSetHeader;
    
    const insertId = result.insertId;

    if (insertId && insertId > 0) {
      return {
        success: true,
        message: 'Project created successfully',
        projectId: insertId,
      };
    }
    return { success: false, message: 'Failed to create project' };
  }

  async getAllProjects(): Promise<{ success: boolean; projects?: Project[] }> {
    const rows = (await database.query('SELECT * FROM projects WHERE status = ?', [
      'Active',
    ])) as RowDataPacket[];
    return { success: true, projects: rows as Project[] };
  }

  async getAllProjectsWithTimesheets(): Promise<{ success: boolean; projects?: any[]; message?: string }> {
    try {
      // Step 1: Get all projects
      const projectRows = (await database.query(
        'SELECT id, name, code, project_description, client_address, status, period_type, auto_approve FROM projects ORDER BY name'
      )) as RowDataPacket[];

      const projects = projectRows as Project[];
      if (projects.length === 0) {
        return { success: true, projects: [] };
      }

      const projectIds = projects.map(p => p.id);

      // Step 2: Get all timesheets for those projects in a single, efficient query
      const timesheetRows = (await database.query(
        `SELECT
           t.*,
           CONCAT(u.first_name,' ',u.last_name) as employee_name
         FROM timesheets t
         JOIN employees e ON t.employee_id = e.id
         JOIN users u ON e.user_id = u.id
         WHERE t.project_id IN (?)
         ORDER BY t.project_id, u.first_name, u.last_name, t.period_start DESC`,
        [projectIds.join(',')] // Convert array of numbers to a comma-separated string
      )) as RowDataPacket[];

      const timesheets = timesheetRows as (Timesheet & { employee_name: string })[];

      // Step 3: Map timesheets to their respective projects for an efficient join
      const timesheetsByProjectId = new Map<number, any[]>();
      for (const timesheet of timesheets) {
        if (!timesheetsByProjectId.has(timesheet.project_id)) {
          timesheetsByProjectId.set(timesheet.project_id, []);
        }
        timesheetsByProjectId.get(timesheet.project_id)!.push(timesheet);
      }

      // Step 4: Attach the timesheets to each project object
      const projectsWithTimesheets = projects.map(project => ({
        ...project,
        timesheets: timesheetsByProjectId.get(project.id) || [],
      }));

      return { success: true, projects: projectsWithTimesheets };
    } catch (error) {
      console.error('Get all projects with timesheets error:', error);
      return { success: false, message: 'Failed to get projects with timesheets' };
    }
  }

  async getAssignedProjects(employeeId: number): Promise<{ success: boolean; projects?: Project[] }> {
    console.log('ProjectService.getAssignedProjects called with employeeId:', employeeId);
    const query = `SELECT p.* FROM projects p 
       JOIN user_projects up ON p.id = up.project_id 
       WHERE up.user_id = ? AND p.status = 'Active'`;
    console.log('Executing query:', query);
    console.log('Query parameters:', [employeeId]);
    const rows = (await database.query(query, [employeeId])) as RowDataPacket[];
    console.log('Query result rows:', rows);
    console.log('Number of projects found:', rows.length);
    return { success: true, projects: rows as Project[] };
  }

  async getInactiveProjects(): Promise<{ success: boolean; projects?: Project[] }> {
    const rows = (await database.query('SELECT * FROM projects WHERE status = ?', [
      'Inactive',
    ])) as RowDataPacket[];
    return { success: true, projects: rows as Project[] };
  }

  async getProjectById(
    id: number
  ): Promise<{ success: boolean; project?: Project; message?: string }> {
    const rows = (await database.query('SELECT * FROM projects WHERE id = ?', [
      id,
    ])) as RowDataPacket[];
    const projects = rows as Project[];
    if (projects.length === 0) {
      return { success: false, message: 'Project not found' };
    }
    return { success: true, project: projects[0] };
  }

  async updateProject(
    id: number,
    projectData: UpdateProjectRequest
  ): Promise<{ success: boolean; message: string }> {
    const { project: currentProject, success: projectFound } = await this.getProjectById(id);
    if (!projectFound || !currentProject) {
      return { success: false, message: 'Project not found' };
    }

    const hasDateChanged = 
      (projectData.start_date && projectData.start_date !== currentProject.start_date?.toISOString().split('T')[0]) ||
      (projectData.end_date && projectData.end_date !== currentProject.end_date?.toISOString().split('T')[0]);

    const connection = await database.getPool().getConnection();
    try {
      await connection.beginTransaction();

      const updateFields: string[] = [];
      const values: (string | boolean | PeriodType | ProjectStatus | number)[] = [];

      if (projectData.name) {
        updateFields.push('name = ?');
        values.push(projectData.name);
      }
      if (projectData.start_date) {
        updateFields.push('start_date = ?');
        values.push(projectData.start_date);
      }
      if (projectData.end_date) {
        updateFields.push('end_date = ?');
        values.push(projectData.end_date);
      }
      if (projectData.status) {
        updateFields.push('status = ?');
        values.push(projectData.status);
      }
      if (projectData.auto_approve !== undefined) {
        updateFields.push('auto_approve = ?');
        values.push(projectData.auto_approve);
      }
      if (projectData.period_type) {
        updateFields.push('period_type = ?');
        values.push(projectData.period_type);
      }
      if (projectData.client_address !== undefined) {
        updateFields.push('client_address = ?');
        values.push(projectData.client_address);
      }
      if (projectData.project_description !== undefined) {
        updateFields.push('project_description = ?');
        values.push(projectData.project_description);
      }
      // Avoid changing code unless explicitly provided
      if (projectData.code) {
        updateFields.push('code = ?');
        values.push(projectData.code);
      }

      if (updateFields.length > 0) {
        values.push(id);
        const sql = `UPDATE projects SET ${updateFields.join(', ')} WHERE id = ?`;
        await connection.query(sql, values);
      }

      if (hasDateChanged) {
        await connection.query(
          'INSERT INTO project_date_history (project_id, old_start_date, old_end_date, new_start_date, new_end_date) VALUES (?, ?, ?, ?, ?)',
          [id, currentProject.start_date, currentProject.end_date, projectData.start_date || currentProject.start_date, projectData.end_date || currentProject.end_date]
        );
      }

      await connection.commit();
      return { success: true, message: 'Project updated successfully' };
    } catch (error) {
      await connection.rollback();
      console.error('Failed to update project:', error);
      return { success: false, message: 'Failed to update project due to a server error.' };
    } finally {
      connection.release();
    }
  }

  async deactivateProject(id: number): Promise<{ success: boolean; message: string }> {
    const result = await database.query(
      "UPDATE projects SET status = 'Inactive' WHERE id = ?",
      [id]
    ) as unknown as ResultSetHeader;

    if (result.affectedRows === 0) {
      return { success: false, message: 'Project not found or already inactive' };
    }

    return { success: true, message: 'Project deactivated successfully' };
  }
}
