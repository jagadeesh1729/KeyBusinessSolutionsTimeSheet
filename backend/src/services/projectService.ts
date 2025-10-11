import database from '../config/database';
import { ResultSetHeader, RowDataPacket } from 'mysql2';
import {
  PeriodType,
  ProjectStatus,
  Project,
  CreateProjectRequest,
  UpdateProjectRequest,
  
} from '../models/Project';

export class ProjectService {
  async createProject(
    projectData: CreateProjectRequest
  ): Promise<{ success: boolean; message: string; projectId?: number }> {
    const { name, start_date, end_date, auto_approve = true, period_type = 'weekly' } = projectData;
    // Basic validation
    if (!name) {
      return { success: false, message: 'Project name is required' };
    }

    const values: any[] = [
      name,
      start_date || null,
      end_date || null,
      auto_approve,
      period_type,
    ];

    const result = await database.query(
      'INSERT INTO projects (name, start_date, end_date, auto_approve, period_type) VALUES (?, ?, ?, ?, ?)',
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