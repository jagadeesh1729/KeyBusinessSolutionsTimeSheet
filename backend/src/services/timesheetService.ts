import database from '../config/database';
import { ResultSetHeader, RowDataPacket } from 'mysql2';
import {
  Timesheet,
  CreateTimesheetRequest,
  UpdateTimesheetRequest,
  PeriodType,
  TimesheetStatus,
  DailyEntry
} from '../models/Timesheet';

export class TimesheetService {
  private resolveRange(range?: string, startDate?: string, endDate?: string): { start?: string; end?: string } {
    if (startDate && endDate) return { start: startDate, end: endDate };
    const now = new Date();
    const toISO = (d: Date) => d.toISOString().slice(0, 10);
    const firstDayOfCurrentWeek = () => {
      const d = new Date(now);
      const day = d.getDay();
      const diff = (day === 0 ? -6 : 1) - day; // Monday start
      d.setDate(d.getDate() + diff);
      d.setHours(0, 0, 0, 0);
      return d;
    };
    switch (range) {
      case 'all': {
        // No date filtering
        return {};
      }
      case 'last-week': {
        const end = firstDayOfCurrentWeek();
        const start = new Date(end);
        start.setDate(start.getDate() - 7);
        return { start: toISO(start), end: toISO(new Date(end.getTime() - 1)) };
      }
      case 'last-month': {
        const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const end = new Date(now.getFullYear(), now.getMonth(), 0);
        return { start: toISO(start), end: toISO(end) };
      }
      case 'last-quarter': {
        const currentQuarter = Math.floor(now.getMonth() / 3);
        const start = new Date(now.getFullYear(), (currentQuarter - 1) * 3, 1);
        const end = new Date(now.getFullYear(), currentQuarter * 3, 0);
        return { start: toISO(start), end: toISO(end) };
      }
      case 'year-to-date': {
        const start = new Date(now.getFullYear(), 0, 1);
        return { start: toISO(start), end: toISO(now) };
      }
      case 'current':
      default: {
        const start = firstDayOfCurrentWeek();
        const end = new Date(start);
        end.setDate(end.getDate() + 6);
        return { start: toISO(start), end: toISO(end) };
      }
    }
  }
  async getCurrentTimesheet(employeeId: number, projectId: number): Promise<{ success: boolean; timesheet?: Timesheet; message?: string }> {
    try {
      // Get project details to determine period type
      const projectRows = (await database.query(
        'SELECT period_type, auto_approve FROM projects WHERE id = ? AND status = ?',
        [projectId, 'Active']
      )) as RowDataPacket[];
      
      if (projectRows.length === 0) {
        return { success: false, message: 'Project not found or inactive' };
      }
      
      const project = projectRows[0];
      
      // Calculate current period dates
      const periodDates = await this.calculatePeriodDates(project.period_type, new Date());
      
      // Look for existing timesheet for current period
      const timesheetRows = (await database.query(
        `SELECT 
           t.*,
           p.name as project_name, 
           p.period_type,
           p.auto_approve,
           CONCAT(u.first_name,' ',u.last_name) as employee_name 
         FROM timesheets t 
         JOIN projects p ON t.project_id = p.id 
         JOIN employees e ON t.employee_id = e.id
         JOIN users u ON e.user_id = u.id 
         WHERE t.employee_id = ? AND t.project_id = ? AND t.period_start = ? AND t.period_end = ?`,
        [employeeId, projectId, periodDates.periodStart, periodDates.periodEnd]
      )) as RowDataPacket[];
      
      if (timesheetRows.length > 0) {
        const timesheet = timesheetRows[0] as Timesheet;
        // Add project settings to timesheet object
        timesheet.period_type = project.period_type;
        timesheet.auto_approve = project.auto_approve;
        return { success: true, timesheet };
      }
      
      // Check for any draft timesheet with different period (due to period type change)
      const draftTimesheetRows = (await database.query(
        `SELECT 
           t.*,
           p.name as project_name, 
           p.period_type,
           p.auto_approve,
           CONCAT(u.first_name,' ',u.last_name) as employee_name 
         FROM timesheets t 
         JOIN projects p ON t.project_id = p.id 
         JOIN employees e ON t.employee_id = e.id
         JOIN users u ON e.user_id = u.id 
         WHERE t.employee_id = ? AND t.project_id = ? AND t.status = 'draft'
         ORDER BY t.created_at DESC LIMIT 1`,
        [employeeId, projectId]
      )) as RowDataPacket[];
      
      if (draftTimesheetRows.length > 0) {
        const draftTimesheet = draftTimesheetRows[0];
        
        // If draft timesheet has different period, update it to current period
        if (draftTimesheet.period_start !== periodDates.periodStart || 
            draftTimesheet.period_end !== periodDates.periodEnd) {
          
          // Check if a timesheet already exists for the current period
          const existingCurrentPeriod = (await database.query(
            'SELECT id FROM timesheets WHERE employee_id = ? AND project_id = ? AND period_start = ? AND period_end = ? AND id != ?',
            [employeeId, projectId, periodDates.periodStart, periodDates.periodEnd, draftTimesheet.id]
          )) as RowDataPacket[];
          
          if (existingCurrentPeriod.length === 0) {
            // Update the draft timesheet to current period
            await database.query(
              'UPDATE timesheets SET period_start = ?, period_end = ? WHERE id = ?',
              [periodDates.periodStart, periodDates.periodEnd, draftTimesheet.id]
            );
            
            draftTimesheet.period_start = periodDates.periodStart;
            draftTimesheet.period_end = periodDates.periodEnd;
          } else {
            // Delete this draft since there's already one for current period
            await database.query('DELETE FROM timesheets WHERE id = ?', [draftTimesheet.id]);
            // Return the existing one
            return await this.getCurrentTimesheet(employeeId, projectId);
          }
        }
        
        // Add project settings to timesheet object
        draftTimesheet.period_type = project.period_type;
        draftTimesheet.auto_approve = project.auto_approve;
        return { success: true, timesheet: draftTimesheet as Timesheet };
      }
      
      // Create new timesheet if doesn't exist
      const newTimesheet = await this.createTimesheet({
        employeeId,
        projectId,
        periodStart: periodDates.periodStart,
        periodEnd: periodDates.periodEnd,
        dailyEntries: []
      });
      
      return newTimesheet;
    } catch (error) {
      console.error('Get current timesheet error:', error);
      return { success: false, message: 'Failed to get current timesheet' };
    }
  }

  async getTimesheetById(id: number, employeeId: number): Promise<{ success: boolean; timesheet?: Timesheet; message?: string }> {
    try {
      // UPDATED: Fixed query to join with employees table properly and get project settings
      const rows = (await database.query(
        `SELECT 
           t.*,
           p.name as project_name,
           p.period_type,
           p.auto_approve,
           CONCAT(u.first_name,' ',u.last_name) as employee_name 
         FROM timesheets t 
         JOIN projects p ON t.project_id = p.id 
         JOIN employees e ON t.employee_id = e.id
         JOIN users u ON e.user_id = u.id 
         WHERE t.id = ? AND t.employee_id = ?`,
        [id, employeeId]
      )) as RowDataPacket[];
      
      if (rows.length === 0) {
        return { success: false, message: 'Timesheet not found' };
      }
      
      const timesheet = rows[0] as Timesheet;
      return { success: true, timesheet };
    } catch (error) {
      console.error('Get timesheet by ID error:', error);
      return { success: false, message: 'Failed to get timesheet' };
    }
  }

  async getEmployeeTimesheets(employeeId: number): Promise<{ success: boolean; timesheets?: Timesheet[]; message?: string }> {
    try {
      // UPDATED: Added project settings to the query
      const rows = (await database.query(
        `SELECT 
           t.*,
           p.name as project_name,
           p.period_type,
           p.auto_approve,
           CONCAT(u.first_name,' ',u.last_name) as employee_name
         FROM timesheets t 
         JOIN projects p ON t.project_id = p.id 
         JOIN employees e ON t.employee_id = e.id
         JOIN users u ON e.user_id = u.id
         WHERE t.employee_id = ? 
         ORDER BY t.period_start DESC, t.created_at DESC`,
        [employeeId]
      )) as RowDataPacket[];
      console.log('Found timesheets:', rows.length, rows);
      return { success: true, timesheets: rows as Timesheet[] };
    } catch (error) {
      console.error('Get employee timesheets error:', error);
      return { success: false, message: 'Failed to get timesheets' };
    }
  }

  async getEmployeeDraftTimesheets(employeeId: number): Promise<{ success: boolean; timesheets?: Timesheet[]; message?: string }> {
    try {
      const rows = (await database.query(
        `SELECT 
           t.*,
           p.name as project_name,
           p.period_type,
           p.auto_approve
         FROM timesheets t 
         JOIN projects p ON t.project_id = p.id 
         WHERE t.employee_id = ? AND t.status = 'draft'
         ORDER BY t.period_start DESC`,
        [employeeId]
      )) as RowDataPacket[];
      return { success: true, timesheets: rows as Timesheet[] };
    } catch (error) {
      console.error('Get employee draft timesheets error:', error);
      return { success: false, message: 'Failed to get draft timesheets' };
    }
  }

  async createTimesheet(timesheetData: CreateTimesheetRequest & { employeeId: number }): Promise<{ success: boolean; timesheet?: Timesheet; message?: string }> {
    const { employeeId, projectId, periodStart, periodEnd, dailyEntries } = timesheetData;
    
    try {
      // Check if timesheet already exists for this period
      const existingRows = (await database.query(
        'SELECT id FROM timesheets WHERE employee_id = ? AND project_id = ? AND period_start = ? AND period_end = ?',
        [employeeId, projectId, periodStart!, periodEnd!]
      )) as RowDataPacket[];
      
      if (existingRows.length > 0) {
        return { success: false, message: 'Timesheet already exists for this period' };
      }
      
      const totalHours = this.calculateTotalHours(dailyEntries || []);
      
      // UPDATED: Removed period_type and auto_approve from INSERT - they come from project
      const result = await database.query(
        `INSERT INTO timesheets (employee_id, project_id, period_start, period_end, daily_entries, total_hours) 
         VALUES (?, ?, ?, ?, ?, ?)`,
        [employeeId, projectId, periodStart!, periodEnd!, JSON.stringify({ entries: dailyEntries || [] }), totalHours]
      ) as unknown as ResultSetHeader;
      
      const insertId = result.insertId;
      
      if (insertId && insertId > 0) {
        const newTimesheet = await this.getTimesheetById(insertId, employeeId);
        return newTimesheet;
      }
      
      return { success: false, message: 'Failed to create timesheet' };
    } catch (error) {
      console.error('Create timesheet error:', error);
      return { success: false, message: 'Failed to create timesheet' };
    }
  }

  async updateTimesheet(id: number, employeeId: number, updateData: UpdateTimesheetRequest): Promise<{ success: boolean; timesheet?: Timesheet; message?: string }> {
    try {
      // Check if timesheet exists and belongs to employee
      const existingTimesheet = await this.getTimesheetById(id, employeeId);
      if (!existingTimesheet.success || !existingTimesheet.timesheet) {
        return { success: false, message: 'Timesheet not found' };
      }
      
      // Check if timesheet can be edited
      if (existingTimesheet.timesheet.status !== 'draft' && existingTimesheet.timesheet.status !== 'rejected') {
        return { success: false, message: 'Timesheet cannot be edited in current status' };
      }
      
      const totalHours = this.calculateTotalHours(updateData.dailyEntries);
      
      // Use the status from the updateData if provided, otherwise keep the existing status.
      // This allows the frontend to set the status to 'pending' on submit.
      const newStatus = 
        updateData.status && ['draft', 'pending', 'rejected', 'approved'].includes(updateData.status)
        ? updateData.status
        : existingTimesheet.timesheet.status;
      
      await database.query(
        'UPDATE timesheets SET daily_entries = ?, total_hours = ?, status = ? WHERE id = ? AND employee_id = ?',
        [JSON.stringify({ entries: updateData.dailyEntries }), totalHours, newStatus, id, employeeId]
      );
      
      // Return updated timesheet
      return await this.getTimesheetById(id, employeeId);
    } catch (error) {
      console.error('Update timesheet error:', error);
      return { success: false, message: 'Failed to update timesheet' };
    }
  }

  // FIXED: Enhanced submitTimesheet with proper locking and status handling
  async submitTimesheet(id: number, employeeId: number): Promise<{ success: boolean; timesheet?: Timesheet; message?: string }> {
    const connection = await database.getPool().getConnection();
    
    try {
      await connection.beginTransaction();
      
      // Lock the timesheet row to prevent race conditions
      const timesheetRows = (await connection.query(
        `SELECT 
           t.*,
           p.auto_approve,
           p.period_type 
         FROM timesheets t 
         JOIN projects p ON t.project_id = p.id 
         WHERE t.id = ? AND t.employee_id = ? FOR UPDATE`,
        [id, employeeId]
      )) as RowDataPacket[];
      
      if (timesheetRows.length === 0) {
        await connection.rollback();
        return { success: false, message: 'Timesheet not found' };
      }
      
      const timesheet = timesheetRows[0];
      timesheet.auto_approve = timesheetRows[0].auto_approve;
      timesheet.period_type = timesheetRows[0].period_type;
      
      // Check current status - only draft and rejected can be submitted
      if (timesheet.status !== 'draft' && timesheet.status !== 'rejected') {
        await connection.rollback();
        return { success: false, message: `Timesheet cannot be submitted. Current status: ${timesheet.status}` };
      }
      
      if (timesheet.total_hours <= 0) {
        await connection.rollback();
        return { success: false, message: 'Timesheet must have at least some hours to submit' };
      }
      
      let newStatus: TimesheetStatus = 'pending';
      let approvedBy: number | null = null;
      let approvedAt: string | null = null;
      
      // Auto-approve logic based on project settings
      if (timesheet.auto_approve) {
        newStatus = 'approved';
        approvedBy = null; // System auto-approval
        approvedAt = new Date().toISOString().slice(0, 19).replace('T', ' ');
      }
      
      // Update timesheet status and clear any previous rejection data
      await connection.query(
        `UPDATE timesheets 
         SET status = ?, submitted_at = ?, approved_by = ?, approved_at = ?, 
             rejected_by = NULL, rejected_at = NULL, rejection_reason = NULL
         WHERE id = ?`,
        [newStatus, new Date().toISOString().slice(0, 19).replace('T', ' '), approvedBy, approvedAt, id]
      );
      
      await connection.commit();
      
      // Return updated timesheet
      return await this.getTimesheetById(id, employeeId);
    } catch (error) {
      await connection.rollback();
      console.error('Submit timesheet error:', error);
      return { success: false, message: 'Failed to submit timesheet' };
    } finally {
      connection.release();
    }
  }

  // NEW: Method to update timesheets when project period type changes
  async updateTimesheetsForProjectPeriodChange(projectId: number, newPeriodType: PeriodType): Promise<{ success: boolean; message?: string }> {
    const connection = await database.getPool().getConnection();
    
    try {
      await connection.beginTransaction();
      
      // Get all draft timesheets for this project
      const draftTimesheets = (await connection.query(
        `SELECT t.id, t.employee_id, t.created_at 
         FROM timesheets t 
         WHERE t.project_id = ? AND t.status = 'draft'`,
        [projectId]
      )) as RowDataPacket[];
      
      for (const timesheet of draftTimesheets) {
        // Calculate new period based on the created date and new period type
        const createdDate = new Date(timesheet.created_at);
        const newPeriod = await this.calculatePeriodDates(newPeriodType, createdDate);
        
        // Check if timesheet with new period already exists
        const existingRows = (await connection.query(
          'SELECT id FROM timesheets WHERE employee_id = ? AND project_id = ? AND period_start = ? AND period_end = ? AND id != ?',
          [timesheet.employee_id, projectId, newPeriod.periodStart, newPeriod.periodEnd, timesheet.id]
        )) as RowDataPacket[];
        
        if (existingRows.length === 0) {
          // Update the timesheet with new period dates
          await connection.query(
            'UPDATE timesheets SET period_start = ?, period_end = ? WHERE id = ?',
            [newPeriod.periodStart, newPeriod.periodEnd, timesheet.id]
          );
        } else {
          // Delete the duplicate timesheet since one already exists for the new period
          await connection.query('DELETE FROM timesheets WHERE id = ?', [timesheet.id]);
        }
      }
      
      await connection.commit();
      return { success: true };
    } catch (error) {
      await connection.rollback();
      console.error('Update timesheets for project period change error:', error);
      return { success: false, message: 'Failed to update timesheets for project period change' };
    } finally {
      connection.release();
    }
  }

  async getPendingTimesheets(managerId: number): Promise<{ success: boolean; timesheets?: Timesheet[]; message?: string }> {
    try {
      console.log('Getting pending timesheets for manager ID:', managerId);
      
      // UPDATED: Fixed query to join with employees table and get project settings
      const rows = (await database.query(
        `SELECT 
           t.*,
           p.name as project_name,
           p.period_type,
           p.auto_approve,
           CONCAT(u.first_name,' ',u.last_name) as employee_name,
           u.email as employee_email
         FROM timesheets t 
         JOIN projects p ON t.project_id = p.id 
         JOIN employees e ON t.employee_id = e.id
         JOIN users u ON e.user_id = u.id
         JOIN user_projects up ON up.project_id = p.id AND up.user_id = ?
         WHERE t.status = 'pending' AND p.auto_approve = 0
         ORDER BY t.submitted_at ASC`,
        [managerId]
      )) as RowDataPacket[];
      
      console.log('Found pending timesheets for manager:', rows.length);
      
      return { success: true, timesheets: rows as Timesheet[] };
    } catch (error) {
      console.error('Get pending timesheets error:', error);
      return { success: false, message: 'Failed to get pending timesheets' };
    }
  }

  async approveTimesheet(id: number, managerId: number, notes?: string): Promise<{ success: boolean; timesheet?: Timesheet; message?: string }> {
    try {
      const result = await database.query(
        'UPDATE timesheets SET status = ?, approved_by = ?, approved_at = ? WHERE id = ?',
        ['approved', managerId, new Date().toISOString().slice(0, 19).replace('T', ' '), id]
      ) as unknown as ResultSetHeader;
      
      if (result.affectedRows === 0) {
        return { success: false, message: 'Timesheet not found' };
      }
      
      // Get the employee ID for the updated timesheet
      const timesheetRows = (await database.query(
        'SELECT employee_id FROM timesheets WHERE id = ?',
        [id]
      )) as RowDataPacket[];
      
      if (timesheetRows.length > 0) {
        const employeeId = timesheetRows[0].employee_id;
        return await this.getTimesheetById(id, employeeId);
      }
      
      return { success: false, message: 'Failed to approve timesheet' };
    } catch (error) {
      console.error('Approve timesheet error:', error);
      return { success: false, message: 'Failed to approve timesheet' };
    }
  }

  async rejectTimesheet(id: number, managerId: number, reason: string): Promise<{ success: boolean; timesheet?: Timesheet; message?: string }> {
    try {
      const result = await database.query(
        'UPDATE timesheets SET status = ?, rejected_by = ?, rejected_at = ?, rejection_reason = ? WHERE id = ?',
        ['rejected', managerId, new Date().toISOString().slice(0, 19).replace('T', ' '), reason, id]
      ) as unknown as ResultSetHeader;
      
      if (result.affectedRows === 0) {
        return { success: false, message: 'Timesheet not found' };
      }
      
      // Get the employee ID for the updated timesheet
      const timesheetRows = (await database.query(
        'SELECT employee_id FROM timesheets WHERE id = ?',
        [id]
      )) as RowDataPacket[];
      
      if (timesheetRows.length > 0) {
        const employeeId = timesheetRows[0].employee_id;
        return await this.getTimesheetById(id, employeeId);
      }
      
      return { success: false, message: 'Failed to reject timesheet' };
    } catch (error) {
      console.error('Reject timesheet error:', error);
      return { success: false, message: 'Failed to reject timesheet' };
    }
  }

  private calculateTotalHours(dailyEntries: DailyEntry[]): number {
    return dailyEntries.reduce((total, entry) => total + entry.hours, 0);
  }

  // FIXED: Period calculation to match SQL logic
  private async calculatePeriodDates(periodType: PeriodType, date: Date): Promise<{ periodStart: string; periodEnd: string }> {
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const pad = (num: number) => num.toString().padStart(2, '0');
    
    switch (periodType) {
      case 'weekly':
        // Match SQL logic: DAYOFWEEK returns 1=Sunday, 2=Monday, etc.
        // JavaScript getDay() returns 0=Sunday, 1=Monday, etc.
        const dayOfWeek = date.getDay(); // 0=Sunday, 1=Monday, ..., 6=Saturday
        const daysSinceMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Convert to days since Monday
        
        const monday = new Date(date);
        monday.setDate(date.getDate() - daysSinceMonday);
        
        const sunday = new Date(monday);
        sunday.setDate(monday.getDate() + 6);
        
        return {
          periodStart: `${monday.getFullYear()}-${pad(monday.getMonth() + 1)}-${pad(monday.getDate())}`,
          periodEnd: `${sunday.getFullYear()}-${pad(sunday.getMonth() + 1)}-${pad(sunday.getDate())}`
        };
        
      case 'bi-monthly':
        const isFirstHalf = date.getDate() <= 15;
        return {
          periodStart: isFirstHalf ? `${year}-${pad(month)}-01` : `${year}-${pad(month)}-16`,
          periodEnd: isFirstHalf ? `${year}-${pad(month)}-15` : `${year}-${pad(month)}-${new Date(year, month, 0).getDate()}`
        };
        
      case 'monthly':
        return {
          periodStart: `${year}-${pad(month)}-01`,
          periodEnd: `${year}-${pad(month)}-${new Date(year, month, 0).getDate()}`
        };
        
      default:
        throw new Error(`Unknown period type: ${periodType}`);
    }
  }

  // ADDED: New helper method to get employee ID from user ID (for authentication)
  async getEmployeeByUserId(userId: number): Promise<{ success: boolean; employee?: { id: number; user_id: number; employee_code: string; department: string; position: string }; message?: string }> {
    try {
      const rows = (await database.query(
        `SELECT e.id, e.user_id
         FROM employees e
         JOIN users u ON e.user_id = u.id
         WHERE u.id = ? AND u.role = 'employee'`,
        [userId]
      )) as RowDataPacket[];
      
      if (rows.length === 0) {
        return { success: false, message: 'Employee not found or user is not an employee' };
      }
      
      return { success: true, employee: rows[0] as any };
    } catch (error) {
      console.error('Get employee by user ID error:', error);
      return { success: false, message: 'Failed to get employee information' };
    }
  }

  // Get projects assigned to a user (via user_projects.user_id)
  async getEmployeeProjects(userId: number): Promise<{ success: boolean; projects?: any[]; message?: string }> {
    try {
      const rows = (await database.query(
        `SELECT 
           p.id,
           p.name,
           p.period_type,
           p.auto_approve,
           p.status
         FROM user_projects up
         JOIN projects p ON up.project_id = p.id
         WHERE up.user_id = ? AND p.status = 'Active'
         ORDER BY p.name`,
        [userId]
      )) as RowDataPacket[];

      // Return fields aligned with frontend Project type: { id, name, period_type, auto_approve, status }
      return { success: true, projects: rows };
    } catch (error) {
      console.error('Get employee projects error:', error);
      return { success: false, message: 'Failed to get employee projects' };
    }
  }

  // Get PM statistics
  async getPMStats(managerId: number): Promise<{ success: boolean; stats?: { projects: number; employees: number; pending: number; approved: number; rejected: number; notSubmitted: number }; message?: string }> {
    try {
      // Get managed projects count
      const projectRows = (await database.query(
        `SELECT COUNT(*) as project_count
         FROM user_projects up
         JOIN projects p ON up.project_id = p.id
         WHERE up.user_id = ? AND p.status = 'Active'`,
        [managerId]
      )) as RowDataPacket[];
      
      // Get managed employees count
      const employeeRows = (await database.query(
        `SELECT COUNT(DISTINCT e.id) as employee_count
         FROM user_projects up1
         JOIN projects p ON up1.project_id = p.id
         JOIN user_projects up2 ON up2.project_id = p.id
         JOIN employees e ON up2.user_id = e.user_id
         WHERE up1.user_id = ? AND p.status = 'Active'`,
        [managerId]
      )) as RowDataPacket[];
      
      // Get timesheet status counts
      const pendingRows = (await database.query(
        `SELECT COUNT(*) as count FROM timesheets t
         JOIN projects p ON t.project_id = p.id
         JOIN user_projects up ON up.project_id = p.id
         WHERE up.user_id = ? AND t.status = 'pending'`,
        [managerId]
      )) as RowDataPacket[];
      
      const approvedRows = (await database.query(
        `SELECT COUNT(*) as count FROM timesheets t
         JOIN projects p ON t.project_id = p.id
         JOIN user_projects up ON up.project_id = p.id
         WHERE up.user_id = ? AND t.status = 'approved'`,
        [managerId]
      )) as RowDataPacket[];
      
      const rejectedRows = (await database.query(
        `SELECT COUNT(*) as count FROM timesheets t
         JOIN projects p ON t.project_id = p.id
         JOIN user_projects up ON up.project_id = p.id
         WHERE up.user_id = ? AND t.status = 'rejected'`,
        [managerId]
      )) as RowDataPacket[];
      
      // Get count of employees who haven't submitted (no timesheet or status = 'draft')
      const notSubmittedRows = (await database.query(
        `SELECT COUNT(DISTINCT e.id) as count
         FROM user_projects up1
         JOIN projects p ON up1.project_id = p.id
         JOIN user_projects up2 ON up2.project_id = p.id
         JOIN employees e ON up2.user_id = e.user_id
         LEFT JOIN timesheets t ON t.employee_id = e.id AND t.project_id = p.id
         WHERE up1.user_id = ? AND p.status = 'Active' 
           AND (t.id IS NULL OR t.status = 'draft')`,
        [managerId]
      )) as RowDataPacket[];
      
      const notSubmitted = notSubmittedRows[0]?.count || 0;
      
      return {
        success: true,
        stats: {
          projects: projectRows[0]?.project_count || 0,
          employees: employeeRows[0]?.employee_count || 0,
          pending: pendingRows[0]?.count || 0,
          approved: approvedRows[0]?.count || 0,
          rejected: rejectedRows[0]?.count || 0,
          notSubmitted
        }
      };
    } catch (error) {
      console.error('Get PM stats error:', error);
      return { success: false, message: 'Failed to get PM statistics' };
    }
  }

  // Get PM projects with details
  async getPMProjects(managerId: number): Promise<{ success: boolean; projects?: any[]; message?: string }> {
    try {
      console.log('Getting projects for manager ID:', managerId);
      const rows = (await database.query(
        `SELECT p.id, p.name, p.period_type, p.auto_approve, p.status
         FROM user_projects up
         JOIN projects p ON up.project_id = p.id
         WHERE up.user_id = ? AND p.status = 'Active'
         ORDER BY p.name`,
        [managerId]
      )) as RowDataPacket[];
      
      console.log('Found projects:', rows.length, rows);
      return { success: true, projects: rows };
    } catch (error) {
      console.error('Get PM projects error:', error);
      return { success: false, message: 'Failed to get PM projects' };
    }
  }

  // Get PM employees with their associated projects
  async getPMEmployees(managerId: number): Promise<{ success: boolean; employees?: any[]; message?: string }> {
    try {
      console.log('Getting employees for manager ID:', managerId);
      const rows = (await database.query(
        `SELECT DISTINCT u.id, CONCAT(u.first_name,' ',u.last_name) AS name, u.first_name, u.last_name, u.email, u.phone, e.id as employee_id
         FROM user_projects up1
         JOIN projects p ON up1.project_id = p.id
         JOIN user_projects up2 ON up2.project_id = p.id
         JOIN employees e ON up2.user_id = e.user_id
         JOIN users u ON e.user_id = u.id
         WHERE up1.user_id = ? AND p.status = 'Active'
         ORDER BY u.first_name, u.last_name`,
        [managerId]
      )) as RowDataPacket[];
      
      console.log('Found employees:', rows.length, rows);
      
      // Get projects for each employee
      for (const employee of rows) {
        const projectRows = (await database.query(
          `SELECT p.id, p.name
           FROM user_projects up1
           JOIN projects p ON up1.project_id = p.id
           JOIN user_projects up2 ON up2.project_id = p.id
           WHERE up1.user_id = ? AND up2.user_id = ? AND p.status = 'Active' AND up1.user_id != up2.user_id`,
          [managerId, employee.id]
        )) as RowDataPacket[];
        employee.projects = projectRows;
      }
      
      return { success: true, employees: rows };
    } catch (error) {
      console.error('Get PM employees error:', error);
      return { success: false, message: 'Failed to get PM employees' };
    }
  }

  // Get employees who haven't submitted (no timesheet or status = 'draft')
  async getEmployeesNotSubmitted(managerId: number): Promise<{ success: boolean; employees?: any[]; message?: string }> {
    try {
      const rows = (await database.query(
        `SELECT DISTINCT u.id, CONCAT(u.first_name,' ',u.last_name) AS name, u.first_name, u.last_name, u.email, p.name as project_name, 
           COALESCE(t.status, 'not_created') as timesheet_status
         FROM user_projects up1
         JOIN projects p ON up1.project_id = p.id
         JOIN user_projects up2 ON up2.project_id = p.id
         JOIN employees e ON up2.user_id = e.user_id
         JOIN users u ON e.user_id = u.id
         LEFT JOIN timesheets t ON t.employee_id = e.id AND t.project_id = p.id
         WHERE up1.user_id = ? AND p.status = 'Active' 
           AND (t.id IS NULL OR t.status = 'draft')
         ORDER BY u.first_name, u.last_name, p.name`,
        [managerId]
      )) as RowDataPacket[];
      
      return { success: true, employees: rows };
    } catch (error) {
      console.error('Get employees not submitted error:', error);
      return { success: false, message: 'Failed to get employees who have not submitted' };
    }
  }

  // Get dashboard statistics
  async getDashboardStats(params: { managerId: number; range?: string; startDate?: string; endDate?: string }): Promise<{ success: boolean; data?: any; message?: string }> {
    try {
      const { managerId, range, startDate, endDate } = params;
      const resolved = this.resolveRange(range, startDate, endDate);
      const dateFilter = resolved.start && resolved.end ? ` AND t.period_start >= ? AND t.period_end <= ?` : '';
      const dfParams = resolved.start && resolved.end ? [resolved.start, resolved.end] : [];
      
      // Get total employees managed by this PM
      const employeeRows = (await database.query(
        `SELECT COUNT(DISTINCT e.id) as total_employees
         FROM user_projects up1
         JOIN projects p ON up1.project_id = p.id
         JOIN user_projects up2 ON up2.project_id = p.id
         JOIN employees e ON up2.user_id = e.user_id
         WHERE up1.user_id = ? AND p.status = 'Active'`,
        [managerId]
      )) as RowDataPacket[];
      
      // Get timesheet counts
      const filledRows = (await database.query(
        `SELECT COUNT(*) as filled_timesheets
         FROM timesheets t
         JOIN projects p ON t.project_id = p.id
         JOIN user_projects up ON up.project_id = p.id
         WHERE up.user_id = ? AND t.status IN ('pending', 'approved')${dateFilter}`,
        [managerId, ...dfParams]
      )) as RowDataPacket[];
      
      const pendingRows = (await database.query(
        `SELECT COUNT(*) as pending_approval
         FROM timesheets t
         JOIN projects p ON t.project_id = p.id
         JOIN user_projects up ON up.project_id = p.id
         WHERE up.user_id = ? AND t.status = 'pending'${dateFilter}`,
        [managerId, ...dfParams]
      )) as RowDataPacket[];
      
      const approvedRows = (await database.query(
        `SELECT COUNT(*) as approved_timesheets
         FROM timesheets t
         JOIN projects p ON t.project_id = p.id
         JOIN user_projects up ON up.project_id = p.id
         WHERE up.user_id = ? AND t.status = 'approved'${dateFilter}`,
        [managerId, ...dfParams]
      )) as RowDataPacket[];
      
      const rejectedRows = (await database.query(
        `SELECT COUNT(*) as rejected_timesheets
         FROM timesheets t
         JOIN projects p ON t.project_id = p.id
         JOIN user_projects up ON up.project_id = p.id
         WHERE up.user_id = ? AND t.status = 'rejected'${dateFilter}`,
        [managerId, ...dfParams]
      )) as RowDataPacket[];
      
      // Get project statistics
      const projectStatsRows = (await database.query(
        `SELECT 
          p.id as projectId,
          p.name as projectName,
          COUNT(DISTINCT up2.user_id) as totalAssigned,
          COUNT(DISTINCT CASE WHEN t.status IN ('pending', 'approved') THEN t.employee_id END) as filled,
          COUNT(DISTINCT up2.user_id) - COUNT(DISTINCT CASE WHEN t.status IN ('pending', 'approved') THEN t.employee_id END) as notFilled
        FROM user_projects up1
        JOIN projects p ON up1.project_id = p.id
        JOIN user_projects up2 ON up2.project_id = p.id
        JOIN employees e ON up2.user_id = e.user_id
        LEFT JOIN timesheets t ON t.employee_id = e.id AND t.project_id = p.id${dateFilter ? ' AND t.period_start >= ? AND t.period_end <= ?' : ''}
        WHERE up1.user_id = ? AND p.status = 'Active'
        GROUP BY p.id, p.name
        ORDER BY p.name`,
        [...(dateFilter ? dfParams : []), managerId]
      )) as RowDataPacket[];
      
      const dashboardData = {
        totalEmployees: employeeRows[0]?.total_employees || 0,
        filledTimesheets: filledRows[0]?.filled_timesheets || 0,
        pendingApproval: pendingRows[0]?.pending_approval || 0,
        approvedTimesheets: approvedRows[0]?.approved_timesheets || 0,
        rejectedTimesheets: rejectedRows[0]?.rejected_timesheets || 0,
        projectStats: projectStatsRows
      };
      
      console.log('Dashboard data:', dashboardData);
      
      return { success: true, data: dashboardData };
    } catch (error) {
      console.error('Get dashboard stats error:', error);
      return { success: false, message: 'Failed to get dashboard statistics' };
    }
  }

  // NEW: Admin method to get all timesheets for a project
  async getTimesheetsByProjectId(projectId: number): Promise<{ success: boolean; timesheets?: Timesheet[]; message?: string }> {
    try {
      const rows = (await database.query(
        `SELECT
           t.*,
           p.name as project_name,
           p.period_type,
           p.auto_approve,
           CONCAT(u.first_name,' ',u.last_name) as employee_name
         FROM timesheets t
         JOIN projects p ON t.project_id = p.id
         JOIN employees e ON t.employee_id = e.id
         JOIN users u ON e.user_id = u.id
         WHERE t.project_id = ?
         ORDER BY u.first_name, u.last_name, t.period_start DESC`,
        [projectId]
      )) as RowDataPacket[];
      return { success: true, timesheets: rows as Timesheet[] };
    } catch (error) {
      console.error(`Get timesheets by project ID error: ${error}`);
      return { success: false, message: 'Failed to get timesheets for project' };
    }
  }

  // Get timesheets by status for a manager (scoped via user_projects)
  async getTimesheetsByStatusForManager(managerId: number, status: 'pending' | 'approved' | 'rejected'): Promise<{ success: boolean; timesheets?: Timesheet[]; message?: string }> {
    try {
      const statusFilter = status;
      const rows = (await database.query(
        `SELECT 
           t.*,
           p.name as project_name,
           p.period_type,
           p.auto_approve,
           CONCAT(u.first_name,' ',u.last_name) as employee_name,
           u.email as employee_email
         FROM timesheets t 
         JOIN projects p ON t.project_id = p.id 
         JOIN employees e ON t.employee_id = e.id
         JOIN users u ON e.user_id = u.id
         JOIN user_projects up ON up.project_id = p.id AND up.user_id = ?
         WHERE t.status = ?
         ORDER BY 
           CASE WHEN ? = 'pending' THEN t.submitted_at END ASC,
           CASE WHEN ? IN ('approved','rejected') THEN t.updated_at END DESC`,
        [managerId, statusFilter, statusFilter, statusFilter]
      )) as RowDataPacket[];
      return { success: true, timesheets: rows as Timesheet[] };
    } catch (error) {
      console.error('Get timesheets by status for manager error:', error);
      return { success: false, message: 'Failed to get timesheets by status' };
    }
  }

  // Get timesheets by status for Admin (global)
  async getTimesheetsByStatusAdmin(status: 'pending' | 'approved' | 'rejected'): Promise<{ success: boolean; timesheets?: Timesheet[]; message?: string }> {
    try {
      const rows = (await database.query(
        `SELECT 
           t.*,
           p.name as project_name,
           p.period_type,
           p.auto_approve,
           CONCAT(u.first_name,' ',u.last_name) as employee_name,
           u.email as employee_email
         FROM timesheets t 
         JOIN projects p ON t.project_id = p.id 
         JOIN employees e ON t.employee_id = e.id
         JOIN users u ON e.user_id = u.id
         WHERE t.status = ?
         ORDER BY 
           CASE WHEN ? = 'pending' THEN t.submitted_at END ASC,
           CASE WHEN ? IN ('approved','rejected') THEN t.updated_at END DESC`,
        [status, status, status]
      )) as RowDataPacket[];
      return { success: true, timesheets: rows as Timesheet[] };
    } catch (error) {
      console.error('Get timesheets by status (admin) error:', error);
      return { success: false, message: 'Failed to get admin timesheets by status' };
    }
  }

  // Get global dashboard statistics for Admin (all projects/employees)
  async getDashboardStatsAdmin(params: { range?: string; startDate?: string; endDate?: string }): Promise<{ success: boolean; data?: any; message?: string }> {
    try {
      const { range, startDate, endDate } = params;
      const resolved = this.resolveRange(range, startDate, endDate);
      const dateFilter = resolved.start && resolved.end ? ` AND t.period_start >= ? AND t.period_end <= ?` : '';
      const dfParams = resolved.start && resolved.end ? [resolved.start, resolved.end] : [];
      // Total employees in the system
      const employeeRows = (await database.query(
        `SELECT COUNT(DISTINCT e.id) as total_employees
         FROM employees e`
      )) as RowDataPacket[];

      // Timesheet counts (global)
      const filledRows = (await database.query(
        `SELECT COUNT(*) as filled_timesheets
         FROM timesheets t
         WHERE t.status IN ('pending', 'approved')${dateFilter}`,
        dfParams
      )) as RowDataPacket[];

      const pendingRows = (await database.query(
        `SELECT COUNT(*) as pending_approval
         FROM timesheets t
         WHERE t.status = 'pending'${dateFilter}`,
        dfParams
      )) as RowDataPacket[];

      const approvedRows = (await database.query(
        `SELECT COUNT(*) as approved_timesheets
         FROM timesheets t
         WHERE t.status = 'approved'${dateFilter}`,
        dfParams
      )) as RowDataPacket[];

      const rejectedRows = (await database.query(
        `SELECT COUNT(*) as rejected_timesheets
         FROM timesheets t
         WHERE t.status = 'rejected'${dateFilter}`,
        dfParams
      )) as RowDataPacket[];

      // Employees assigned to active projects who have not submitted (no timesheet or only draft)
      const notSubmittedRows = (await database.query(
        `SELECT COUNT(DISTINCT e.id) as count
         FROM projects p
         JOIN user_projects up ON up.project_id = p.id
         JOIN employees e ON up.user_id = e.user_id
         LEFT JOIN timesheets t ON t.employee_id = e.id AND t.project_id = p.id${dateFilter ? ' AND t.period_start >= ? AND t.period_end <= ?' : ''}
         WHERE p.status = 'Active' AND (t.id IS NULL OR t.status = 'draft')`,
        dateFilter ? dfParams : []
      )) as RowDataPacket[];

      // Project statistics across all active projects
      const projectStatsRows = (await database.query(
        `SELECT 
          p.id as projectId,
          p.name as projectName,
          COUNT(DISTINCT up.user_id) as totalAssigned,
          COUNT(DISTINCT CASE WHEN t.status IN ('pending', 'approved') THEN t.employee_id END) as filled,
          COUNT(DISTINCT up.user_id) - COUNT(DISTINCT CASE WHEN t.status IN ('pending', 'approved') THEN t.employee_id END) as notFilled
        FROM projects p
        LEFT JOIN user_projects up ON up.project_id = p.id
        LEFT JOIN employees e ON up.user_id = e.user_id
        LEFT JOIN timesheets t ON t.employee_id = e.id AND t.project_id = p.id${dateFilter ? ' AND t.period_start >= ? AND t.period_end <= ?' : ''}
        WHERE p.status = 'Active'
        GROUP BY p.id, p.name
        ORDER BY p.name`,
        dateFilter ? dfParams : []
      )) as RowDataPacket[];

      const dashboardData = {
        totalEmployees: employeeRows[0]?.total_employees || 0,
        filledTimesheets: filledRows[0]?.filled_timesheets || 0,
        pendingApproval: pendingRows[0]?.pending_approval || 0,
        approvedTimesheets: approvedRows[0]?.approved_timesheets || 0,
        rejectedTimesheets: rejectedRows[0]?.rejected_timesheets || 0,
        notSubmitted: notSubmittedRows[0]?.count || 0,
        projectStats: projectStatsRows
      };

      return { success: true, data: dashboardData };
    } catch (error) {
      console.error('Get admin dashboard stats error:', error);
      return { success: false, message: 'Failed to get admin dashboard statistics' };
    }
  }

  async getTimesheetDetails(params: { scopeUserId: number; isAdmin: boolean; status?: string; projectId?: number; range?: string; startDate?: string; endDate?: string }): Promise<{ success: boolean; items?: any[]; message?: string }> {
    const { scopeUserId, isAdmin, status, projectId, range, startDate, endDate } = params;
    try {
      const resolved = this.resolveRange(range, startDate, endDate);
      const dateJoinFilter = resolved.start && resolved.end ? ' AND t.period_start >= ? AND t.period_end <= ?' : '';
      const dfParams = resolved.start && resolved.end ? [resolved.start, resolved.end] : [];
      // Base filters for PM (restrict to managed projects)
      const scopeJoin = isAdmin
        ? ''
        : 'JOIN user_projects scope_up ON scope_up.project_id = p.id AND scope_up.user_id = ?';
      const scopeParams = isAdmin ? [] : [scopeUserId];

      if (status === 'not-submitted' || status === 'not-created') {
        const query = `
          SELECT DISTINCT e.id as employeeId, CONCAT(u.first_name,' ',u.last_name) as employeeName, u.email as employeeEmail,
                 e.employement_start_date as employmentStartDate,
                 p.id as projectId, p.name as projectName,
                  COALESCE(t.status, 'not_created') as status,
                  t.period_start as periodStart,
                  t.period_end as periodEnd,
                  p.period_type as periodType
          FROM projects p
          ${scopeJoin}
          JOIN user_projects up ON up.project_id = p.id
          JOIN employees e ON up.user_id = e.user_id
          JOIN users u ON e.user_id = u.id
          LEFT JOIN timesheets t ON t.employee_id = e.id AND t.project_id = p.id${dateJoinFilter}
          WHERE p.status = 'Active'
            ${projectId ? 'AND p.id = ?' : ''}
            AND (${status === 'not-created' ? 't.id IS NULL' : "(t.id IS NULL OR t.status = 'draft')"})
          ORDER BY employeeName`;
        const rows = (await database.query(query, [...scopeParams, ...dfParams, ...(projectId ? [projectId] : [])])) as RowDataPacket[];
        const items = (rows as any[]).map((r: any) => ({ ...r }));
        // Fill period for not-created (no timesheet) using project period type and current date
        for (const r of items) {
          if (!r.periodStart || !r.periodEnd) {
            try {
              const period = await this.calculatePeriodDates(r.periodType || 'weekly', new Date());
              r.periodStart = period.periodStart;
              r.periodEnd = period.periodEnd;
            } catch (e) {
              // leave as null if calculation fails
            }
          }
        }
        return { success: true, items };
      }

      const statusFilter = status === 'filled' ? `t.status IN ('pending','approved')` : status ? `t.status = '${status}'` : `t.status IN ('pending','approved','rejected','draft')`;
      const query = `
        SELECT DISTINCT t.id as id,
               e.id as employeeId, CONCAT(u.first_name,' ',u.last_name) as employeeName, u.email as employeeEmail,
               e.employement_start_date as employmentStartDate,
               p.id as projectId, p.name as projectName,
               t.status as status, t.submitted_at as submittedAt,
               t.period_start as periodStart,
               t.period_end as periodEnd
        FROM projects p
        ${scopeJoin}
        JOIN user_projects up ON up.project_id = p.id
        JOIN employees e ON up.user_id = e.user_id
        JOIN users u ON e.user_id = u.id
        LEFT JOIN timesheets t ON t.employee_id = e.id AND t.project_id = p.id${dateJoinFilter}
        WHERE p.status = 'Active'
          ${projectId ? 'AND p.id = ?' : ''}
          AND ${statusFilter}
        ORDER BY employeeName`;
      const rows = (await database.query(query, [...scopeParams, ...dfParams, ...(projectId ? [projectId] : [])])) as RowDataPacket[];
      return { success: true, items: rows as any[] };
    } catch (error) {
      console.error('Get timesheet details error:', error);
      return { success: false, message: 'Failed to get timesheet details' };
    }
  }
}
