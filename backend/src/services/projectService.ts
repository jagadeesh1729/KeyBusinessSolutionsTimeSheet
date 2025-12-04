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
import { changeLogService, ChangeLogInput } from './changeLogService';
import { ProjectDateHistoryEntry } from '../models/ChangeLog';

export class ProjectService {
  async createProject(
    projectData: CreateProjectRequest,
    options?: { changedBy?: number | null; changeReason?: string | null },
  ): Promise<{ success: boolean; message: string; projectId?: number }> {
    const { name, start_date, end_date, auto_approve = true, period_type = 'weekly', client_address, project_description, signature_required = true } = projectData;
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
      signature_required,
    ];

    const result = await database.query(
      'INSERT INTO projects (name, status, start_date, end_date, auto_approve, period_type, code, client_address, project_description, signature_required) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      values
    ) as unknown as ResultSetHeader;
    
    const insertId = result.insertId;

    if (insertId && insertId > 0) {
      await changeLogService.recordProjectChangeLogs(
        insertId,
        options?.changedBy ?? null,
        [
          {
            fieldName: 'Project',
            oldValue: null,
            newValue: `Project created: ${name}`,
            changeType: 'CREATE',
            changeReason: options?.changeReason ?? null,
          },
        ],
      );
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
    const query = `SELECT p.id, p.name, p.code, p.status, p.period_type, p.auto_approve, p.start_date, p.end_date, p.client_address, p.project_description 
       FROM projects p 
       JOIN user_projects up ON p.id = up.project_id 
       WHERE up.user_id = ? AND p.status = 'Active'`;
    console.log('Executing getAssignedProjects query:', query);
    const rows = (await database.query(query, [employeeId])) as RowDataPacket[];
    console.log('getAssignedProjects DB Result:', rows);
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

  async getProjectChangeLogs(
    projectId: number,
  ): Promise<{
    success: boolean;
    changeLogs?: Awaited<ReturnType<typeof changeLogService.getProjectChangeLogs>>;
    dateHistory?: ProjectDateHistoryEntry[];
    message?: string;
  }> {
    try {
      const [changeLogs, dateHistory] = await Promise.all([
        changeLogService.getProjectChangeLogs(projectId),
        this.getProjectDateHistoryRecords(projectId),
      ]);
      return { success: true, changeLogs, dateHistory };
    } catch (error) {
      console.error('Failed to get project change logs:', error);
      return { success: false, message: 'Failed to load project history' };
    }
  }

  async updateProject(
    id: number,
    projectData: UpdateProjectRequest,
    options?: { changedBy?: number | null; changeReason?: string | null },
  ): Promise<{ success: boolean; message: string }> {
    const { project: currentProject, success: projectFound } = await this.getProjectById(id);
    if (!projectFound || !currentProject) {
      return { success: false, message: 'Project not found' };
    }

    const normalizedCurrentStart = this.formatDateValue(currentProject.start_date);
    const normalizedCurrentEnd = this.formatDateValue(currentProject.end_date);
    const hasDateChanged =
      (projectData.start_date !== undefined && projectData.start_date !== normalizedCurrentStart) ||
      (projectData.end_date !== undefined && projectData.end_date !== normalizedCurrentEnd);
    const changeEntries: ChangeLogInput[] = [];
    const changeReason = options?.changeReason ?? null;

    const pushChange = (fieldName: string, newValue: any, existingValue: any) => {
      if (newValue === undefined) return;
      const prevComparable = this.normalizeForComparison(existingValue);
      const newComparable = this.normalizeForComparison(newValue);
      if (prevComparable === newComparable) return;
      changeEntries.push({
        fieldName,
        oldValue: existingValue ?? null,
        newValue: newValue ?? null,
        changeReason,
      });
    };

    const connection = await database.getPool().getConnection();
    try {
      await connection.beginTransaction();

      const updateFields: string[] = [];
      const values: (string | boolean | PeriodType | ProjectStatus | number)[] = [];

      if (projectData.name !== undefined) {
        updateFields.push('name = ?');
        values.push(projectData.name);
        pushChange('Name', projectData.name, currentProject.name);
      }
      if (projectData.start_date !== undefined) {
        updateFields.push('start_date = ?');
        values.push(projectData.start_date);
        pushChange('Start Date', projectData.start_date || null, normalizedCurrentStart);
      }
      if (projectData.end_date !== undefined) {
        updateFields.push('end_date = ?');
        values.push(projectData.end_date);
        pushChange('End Date', projectData.end_date || null, normalizedCurrentEnd);
      }
      if (projectData.status) {
        updateFields.push('status = ?');
        values.push(projectData.status);
        pushChange('Status', projectData.status, currentProject.status);
      }
      if (projectData.auto_approve !== undefined) {
        updateFields.push('auto_approve = ?');
        values.push(projectData.auto_approve);
        pushChange('Auto Approve', projectData.auto_approve, currentProject.auto_approve);
      }
      if (projectData.period_type) {
        updateFields.push('period_type = ?');
        values.push(projectData.period_type);
        pushChange('Period Type', projectData.period_type, currentProject.period_type);
      }
      if (projectData.client_address !== undefined) {
        updateFields.push('client_address = ?');
        values.push(projectData.client_address);
        pushChange('Client Address', projectData.client_address, (currentProject as any).client_address ?? null);
      }
      if (projectData.project_description !== undefined) {
        updateFields.push('project_description = ?');
        values.push(projectData.project_description);
        pushChange('Project Description', projectData.project_description, (currentProject as any).project_description ?? null);
      }
      if (projectData.signature_required !== undefined) {
        updateFields.push('signature_required = ?');
        values.push(projectData.signature_required);
        pushChange('Signature Required', projectData.signature_required, (currentProject as any).signature_required ?? null);
      }
      // Avoid changing code unless explicitly provided
      if (projectData.code) {
        updateFields.push('code = ?');
        values.push(projectData.code);
        pushChange('Code', projectData.code, currentProject.code ?? null);
      }

      if (updateFields.length > 0) {
        values.push(id);
        const sql = `UPDATE projects SET ${updateFields.join(', ')} WHERE id = ?`;
        await connection.query(sql, values);
      }

      if (hasDateChanged) {
        const newStart = projectData.start_date ?? normalizedCurrentStart;
        const newEnd = projectData.end_date ?? normalizedCurrentEnd;
        await connection.query(
          'INSERT INTO project_date_history (project_id, old_start_date, old_end_date, new_start_date, new_end_date) VALUES (?, ?, ?, ?, ?)',
          [id, normalizedCurrentStart, normalizedCurrentEnd, newStart, newEnd]
        );
      }

      if (changeEntries.length > 0) {
        await changeLogService.recordProjectChangeLogs(
          id,
          options?.changedBy ?? null,
          changeEntries,
          connection,
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

  async deactivateProject(
    id: number,
    options?: { changedBy?: number | null; changeReason?: string | null },
  ): Promise<{ success: boolean; message: string }> {
    const rows = (await database.query<RowDataPacket[]>(
      'SELECT status FROM projects WHERE id = ? LIMIT 1',
      [id],
    )) as RowDataPacket[];

    if (!Array.isArray(rows) || rows.length === 0) {
      return { success: false, message: 'Project not found' };
    }

    const currentStatus = rows[0].status as ProjectStatus;
    if (currentStatus === 'Inactive') {
      return { success: false, message: 'Project not found or already inactive' };
    }

    const result = (await database.query(
      "UPDATE projects SET status = 'Inactive' WHERE id = ?",
      [id],
    )) as unknown as ResultSetHeader;

    if (result.affectedRows === 0) {
      return { success: false, message: 'Project not found or already inactive' };
    }

    await changeLogService.recordProjectChangeLogs(id, options?.changedBy ?? null, [
      {
        fieldName: 'Status',
        oldValue: currentStatus,
        newValue: 'Inactive',
        changeType: 'UPDATE',
        changeReason: options?.changeReason ?? 'Deactivated via admin dashboard',
      },
    ]);

    return { success: true, message: 'Project deactivated successfully' };
  }

  private formatDateValue(value?: Date | string | null): string | null {
    if (!value) return null;
    if (value instanceof Date) {
      return value.toISOString().split('T')[0];
    }
    if (typeof value === 'string' && value.length > 10) {
      return value.split('T')[0];
    }
    return value;
  }

  private normalizeForComparison(value: any): string | null {
    if (value === undefined || value === null) return null;
    if (value instanceof Date) return value.toISOString();
    if (typeof value === 'boolean') return value ? 'true' : 'false';
    return String(value);
  }

  private async getProjectDateHistoryRecords(projectId: number): Promise<ProjectDateHistoryEntry[]> {
    const rows = (await database.query<RowDataPacket[]>(
      `SELECT * FROM project_date_history WHERE project_id = ? ORDER BY changed_at DESC, id DESC`,
      [projectId],
    )) as RowDataPacket[];

    return rows.map((row: any) => ({
      ...row,
      old_start_date: this.formatDateValue(row.old_start_date),
      old_end_date: this.formatDateValue(row.old_end_date),
      new_start_date: this.formatDateValue(row.new_start_date),
      new_end_date: this.formatDateValue(row.new_end_date),
    })) as ProjectDateHistoryEntry[];
  }
}
