import database from '../config/database';
import {
  AuthResponse,
  CreatePMRequest,
  LoginRequest,
  RegisterEmployeeRequest,
  UserRole,
  AssignProjectsRequest,
} from '../models/User';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import Logger from '../utils/logger';
import { ResultSetHeader, RowDataPacket } from 'mysql2';
dotenv.config();

export class AuthService {
  private readonly saltrounds = 12;
  async login(loginData: LoginRequest): Promise<AuthResponse> {
    try {
      const { email, password } = loginData;
      const users = await database.query(
        'SELECT id, first_name, last_name, email, password, role, is_active, no_of_hours FROM users WHERE email = ?',
        [email],
      );
      if (!Array.isArray(users) || users.length === 0) {
        return { success: false, message: 'Invalid email or password' };
      }

      const user = users[0];
      Logger.info(user);
      if (!user.is_active) {
        return { success: false, message: 'Account is deactivated' };
      }
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        return { success: false, message: 'Invalid  email or password' };
      }
      const token = jwt.sign(
        {
          userId: user.id,
          email: user.email,
          role: user.role,
        },
        process.env.JWT_SECRET as string,
        { expiresIn: '1h' },
      );
      Logger.info(
        `User logged in successfully: ${user.email} with role: ${user.role}`,
      );
      return {
        success: true,
        message: 'Login successful',
        token,
        user: {
          id: user.id,
          first_name: user.first_name,
          last_name: user.last_name,
          name: `${user.first_name} ${user.last_name}`.trim(),
          email: user.email,
          role: user.role,
          no_of_hours: user.no_of_hours,
        },
      };
    } catch (error) {
      Logger.error(`Login error: ${error}`);
      return { success: false, message: 'Internal server error' };
    }
  }
  async forgotPassword(
    email: string,
  ): Promise<{ success: boolean; message: string; resetToken?: string }> {
    try {
      const users = await database.query(
        'SELECT id FROM users WHERE email = ?',
        [email],
      );

      if (!Array.isArray(users) || users.length === 0) {
        // Don't reveal if email exists
        return {
          success: true,
          message: 'If this email exists, a reset link has been sent',
        };
      }

      // Generate simple 6-digit code (or use crypto for longer token)
      const resetToken = Math.floor(100000 + Math.random() * 900000).toString();

      await database.query('UPDATE users SET reset_token = ? WHERE email = ?', [
        resetToken,
        email,
      ]);

      // In production: Send email with reset code
      Logger.info(`Password reset code for ${email}: ${resetToken}`);

      return {
        success: true,
        message: 'If this email exists, a reset code has been sent',
        resetToken, // Remove in production - only for testing
      };
    } catch (error) {
      Logger.error(`Forgot password error: ${error}`);
      throw error;
    }
  }

  async verifyResetToken(
    email: string,
    token: string,
  ): Promise<{ success: boolean; message: string }> {
    try {
      const users = await database.query(
        'SELECT id FROM users WHERE email = ? AND reset_token = ?',
        [email, token],
      );

      if (!Array.isArray(users) || users.length === 0) {
        return { success: false, message: 'Invalid reset code' };
      }

      return { success: true, message: 'Reset code verified' };
    } catch (error) {
      Logger.error(`Verify reset token error: ${error}`);
      throw error;
    }
  }

  async setNewPassword(
    email: string,
    newPassword: string,
  ): Promise<{ success: boolean; message: string }> {
    try {
      const hashedPassword = await bcrypt.hash(newPassword, this.saltrounds);

      await database.query(
        'UPDATE users SET password = ?, reset_token = NULL WHERE email = ?',
        [hashedPassword, email],
      );

      Logger.info(`Password reset successfully for: ${email}`);
      return { success: true, message: 'Password reset successfully' };
    } catch (error) {
      Logger.error(`Set new password error: ${error}`);
      throw error;
    }
  }

  private generateTempPassword(): string {
    const length = 10;
    const charset =
      'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%';
    let password = '';
    for (let i = 0; i < length; i++) {
      password += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    return password;
  }

  async createProjectManager(
    adminId: number,
    pmData: CreatePMRequest,
  ): Promise<{ success: boolean; message: string; userId?: number }> {
    try {
      const { first_name, last_name, email, phone, location, no_of_hours } = pmData;
      const tempPassword = this.generateTempPassword();
      const hashedPassword = await bcrypt.hash(tempPassword, this.saltrounds);

      const result = (await database.query(
        'INSERT INTO users (first_name, last_name, email, phone, password, role, location, no_of_hours) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [ first_name, last_name, email, phone, hashedPassword, UserRole.PROJECT_MANAGER, location, no_of_hours ],
      )) as unknown as ResultSetHeader;

      const userId = result.insertId;
      Logger.info(`Admin (ID: ${adminId}) created PM: ${email}`);


      return {
        success: true,
        message: 'Project Manager created successfully. A temporary password has been generated.',
        userId,
      };
    } catch (error: any) {
      Logger.error(`Create PM error: ${error}`);
      if (error.code === 'ER_DUP_ENTRY') {
        return { success: false, message: 'A user with this email already exists.' };
      }
      return { success: false, message: 'Internal server error' };
    }
  }

  async registerEmployee(
    employeeData: RegisterEmployeeRequest,
  ): Promise<{ success: boolean; message: string; userId?: number }> {
    const connection = await database.getPool().getConnection();
    try {
      await connection.beginTransaction();

      // Step 1: Create the user record
      const { first_name, last_name, email, phone, password, location, no_of_hours } = employeeData;
      const hashedPassword = await bcrypt.hash(password, this.saltrounds);

      const userResult = (await connection.query(
        'INSERT INTO users (first_name, last_name, email, phone, password, role, location, no_of_hours) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [first_name, last_name, email, phone, hashedPassword, UserRole.EMPLOYEE, location, no_of_hours],
      )) as [ResultSetHeader, any];

      const userId = userResult[0].insertId; // The ResultSetHeader is the first element in the tuple

      // Step 2: Create the employee record
      const { employment_start_date, job_start_date, start_date, end_date, visa_status, college_name, college_address, degree, date_of_birth, college_Dso_name, college_Dso_email, college_Dso_phone } = employeeData as any;
      const employement_start = employment_start_date || job_start_date || null;
      await connection.query(
        'INSERT INTO employees (user_id, employement_start_date, start_date, end_date, visa_status, college_name, college_address, degree, date_of_birth, college_Dso_name, college_Dso_email, college_Dso_phone) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [userId, employement_start, start_date, end_date, visa_status, college_name, college_address, degree, date_of_birth, college_Dso_name, college_Dso_email, college_Dso_phone],
      );

      await connection.commit();
      Logger.info(`New employee registered successfully: ${email}`);
      return {
        success: true,
        message: 'Employee registered successfully.',
        userId,
      };
    } catch (error: any) {
      await connection.rollback();
      Logger.error(`Employee registration error: ${error}`);
      if (error.code === 'ER_DUP_ENTRY') {
        return { success: false, message: 'An account with this email already exists.' };
      }
      return { success: false, message: 'Internal server error during registration.' };
    } finally {
      connection.release();
    }
  }



  async validateToken(
    token: string,
  ): Promise<{ valid: boolean; payload?: jwt.JwtPayload | string }> {
    try {
      const payload = jwt.verify(token, process.env.JWT_SECRET!);
      return { valid: true, payload };
    } catch {
      return { valid: false };
    }
  }

  async getUsers(
    requesterId: number,
  ): Promise<{ success: boolean; users?: unknown[]; message?: string }> {
    try {
      // Verify requester exists and get their role
      const requester = await database.query(
        'SELECT role FROM users WHERE id = ?',
        [requesterId],
      );

      if (!Array.isArray(requester) || requester.length === 0) {
        return { success: false, message: 'User not found' };
      }

      const requesterRole = (requester[0] as { role: string }).role;

      // Enhanced query to get complete employee data
      let query = `
        SELECT
          u.id, u.first_name, u.last_name, CONCAT(u.first_name,' ',u.last_name) AS name, u.email, u.phone, u.role, u.is_active, u.location, u.no_of_hours,
          e.user_id, e.employement_start_date, e.start_date, e.end_date, e.visa_status,
          e.college_name, e.college_address, e.degree, e.job_title, e.date_of_birth,
          e.college_Dso_name, e.college_Dso_email, e.college_Dso_phone,
          e.compensation, e.job_duties, e.project_manager_id,
          pm.id as pm_id, pm.first_name as pm_first_name, pm.last_name as pm_last_name, pm.email as pm_email,
          GROUP_CONCAT(DISTINCT p.name) as project_names,
          GROUP_CONCAT(DISTINCT p.id) as project_ids
        FROM users u
        LEFT JOIN employees e ON u.id = e.user_id
        LEFT JOIN users pm ON e.project_manager_id = pm.id
        LEFT JOIN user_projects up ON u.id = up.user_id
        LEFT JOIN projects p ON up.project_id = p.id
      `;

      let params: (string | number)[] = [];

      // PM can see employees, Admin can see everyone
      if (requesterRole === UserRole.PROJECT_MANAGER) {
        query += ' WHERE u.role = ?';
        params.push(UserRole.EMPLOYEE);
      }

      query += ' GROUP BY u.id, u.first_name, u.last_name, u.email, u.phone, u.role, u.is_active, u.location, u.no_of_hours, e.user_id, e.employement_start_date, e.start_date, e.end_date, e.visa_status, e.college_name, e.college_address, e.degree, e.job_title, e.date_of_birth, e.college_Dso_name, e.college_Dso_email, e.college_Dso_phone, e.compensation, e.job_duties, e.project_manager_id, pm.id, pm.first_name, pm.last_name, pm.email';

      const users = await database.query(query, params);

      // Transform the data to match expected format
      const transformedUsers = (users as any[]).map((user: any) => ({
        id: user.id,
        first_name: user.first_name,
        last_name: user.last_name,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        is_active: user.is_active,
        location: user.location,
        no_of_hours: user.no_of_hours,
        job_title: user.job_title || 'N/A',
        college_name: user.college_name,
        college_address: user.college_address,
        degree: user.degree,
        college_Dso_name: user.college_Dso_name,
        college_Dso_email: user.college_Dso_email,
        college_Dso_phone: user.college_Dso_phone,
        employement_start_date: user.employement_start_date,
        start_date: user.start_date,
        end_date: user.end_date,
        visa_status: user.visa_status,
        date_of_birth: user.date_of_birth,
        compensation: user.compensation,
        job_duties: user.job_duties,
        performance_review: user.performance_review,
        reports: user.reports,
        project_manager: user.pm_id ? {
          id: user.pm_id,
          first_name: user.pm_first_name || '',
          last_name: user.pm_last_name || '',
          email: user.pm_email
        } : null,
        project: user.project_names ? user.project_names.split(',').map((name: string, index: number) => ({
          id: user.project_ids ? user.project_ids.split(',')[index] : null,
          name: name.trim()
        })).filter((p: any) => p.id !== null) : []
      }));

      return { success: true, users: transformedUsers as unknown[] };
    } catch (error) {
      Logger.error(`Get users error: ${error}`);
      return { success: false, message: 'Internal server error' };
    }
  }

  async getProjectManagers(): Promise<{
    success: boolean;
    users?: unknown[];
    message?: string;
  }> {
    try {
      const query = 'SELECT id, first_name, last_name, CONCAT(first_name, " ", last_name) AS name, email, phone, location, no_of_hours FROM users WHERE role = ?';
      const users = await database.query(query, [UserRole.PROJECT_MANAGER]);
      return { success: true, users: users as unknown[] };
    } catch (error) {
      Logger.error(`Get Project Managers error: ${error}`);
      return { success: false, message: 'Internal server error' };
    }
  }
  async assignProjects(
    assignData: AssignProjectsRequest,
  ): Promise<{ success: boolean; message: string }> {
    const connection = await database.getPool().getConnection();
    try {
      await connection.beginTransaction();

      const { user_id, project_ids } = assignData;

      // Determine target user's role
      const [userRows] = await connection.query<RowDataPacket[]>(
        'SELECT role FROM users WHERE id = ? LIMIT 1',
        [user_id]
      );
      const targetRole = userRows && userRows[0] ? (userRows[0].role as UserRole) : undefined;

      if (!targetRole) {
        await connection.rollback();
        return { success: false, message: 'Target user not found' };
      }

      if (targetRole === UserRole.PROJECT_MANAGER) {
        // For PMs: each project can belong to only one PM
        if (Array.isArray(project_ids) && project_ids.length > 0) {
          const placeholders = project_ids.map(() => '?').join(',');
          const [conflicts] = await connection.query<RowDataPacket[]>(
            `SELECT up.project_id, u.id as pm_id, CONCAT(u.first_name,' ',u.last_name) AS pm_name
             FROM user_projects up
             JOIN users u ON u.id = up.user_id AND u.role = ?
             WHERE up.project_id IN (${placeholders}) AND up.user_id <> ?`,
            [UserRole.PROJECT_MANAGER, ...project_ids, user_id] as any
          );
          if (Array.isArray(conflicts) && conflicts.length > 0) {
            const conflictProjects = conflicts.map((c: any) => c.project_id);
            await connection.rollback();
            return {
              success: false,
              message: `One or more projects are already assigned to another project manager: ${[...new Set(conflictProjects)].join(', ')}`,
            };
          }
        }
      } else if (targetRole === UserRole.EMPLOYEE) {
        // For employees: allow only one project, and it must be one of the employee's PM's projects
        const [empRows] = await connection.query<RowDataPacket[]>(
          'SELECT project_manager_id FROM employees WHERE user_id = ? LIMIT 1',
          [user_id]
        );
        const pmId = empRows && empRows[0] ? (empRows[0].project_manager_id as number | null) : null;
        if (!pmId) {
          await connection.rollback();
          return { success: false, message: 'Employee has no assigned project manager' };
        }
        const selectedProjectId = Array.isArray(project_ids) && project_ids.length > 0 ? Number(project_ids[0]) : null;
        if (!selectedProjectId) {
          // Clearing assignments is handled by deleting below; proceed
        } else {
          // Verify the project is assigned to the PM
          const [ok] = await connection.query<RowDataPacket[]>(
            'SELECT 1 FROM user_projects WHERE user_id = ? AND project_id = ? LIMIT 1',
            [pmId, selectedProjectId]
          );
          if (!ok || ok.length === 0) {
            await connection.rollback();
            return { success: false, message: 'Selected project is not assigned to the employee\'s project manager' };
          }
        }
        // Force single project for employees
        if (Array.isArray(project_ids) && project_ids.length > 1) {
          assignData.project_ids = [Number(project_ids[0])];
        }
      }

      // Remove existing assignments for this user
      await connection.query('DELETE FROM user_projects WHERE user_id = ?', [user_id]);

      // Add new assignments
      if (assignData.project_ids && assignData.project_ids.length > 0) {
        const values = assignData.project_ids.map(project_id => [user_id, project_id]);
        await connection.query(
          'INSERT INTO user_projects (user_id, project_id) VALUES ?',
          [values]
        );
      }

      await connection.commit();
      Logger.info(`Projects assigned to user ${user_id}: ${project_ids.join(', ')}`);
      return { success: true, message: 'Projects assigned successfully' };
    } catch (error) {
      await connection.rollback();
      Logger.error(`Assign projects error: ${error}`);
      return { success: false, message: 'Failed to assign projects' };
    } finally {
      connection.release();
    }
  }

  async getUserProjects(
    userId: number,
  ): Promise<{ success: boolean; projects?: unknown[]; message?: string }> {
    try {
      const projects = await database.query(
        'SELECT p.* FROM projects p JOIN user_projects up ON p.id = up.project_id WHERE up.user_id = ?',
        [userId]
      );
      return { success: true, projects: projects as unknown[] };
    } catch (error) {
      Logger.error(`Get user projects error: ${error}`);
      return { success: false, message: 'Failed to get user projects' };
    }
  }

  async assignEmployeesToPM(
    assignData: any
  ): Promise<{ success: boolean; message: string }> {
    const connection = await database.getPool().getConnection();
    try {
      await connection.beginTransaction();

      const { pm_id, employee_ids } = assignData;

      // Remove existing assignments for this PM
      await connection.query('UPDATE employees SET project_manager_id = NULL WHERE project_manager_id = ?', [pm_id]);

      // Add new assignments
      if (employee_ids.length > 0) {
        const updatePromises = employee_ids.map((employee_id: number) => 
          connection.query('UPDATE employees SET project_manager_id = ? WHERE user_id = ?', [pm_id, employee_id])
        );
        await Promise.all(updatePromises);
      }

      await connection.commit();
      Logger.info(`Employees assigned to PM ${pm_id}: ${employee_ids.join(', ')}`);
      return { success: true, message: 'Employees assigned successfully' };
    } catch (error) {
      await connection.rollback();
      Logger.error(`Assign employees to PM error: ${error}`);
      return { success: false, message: 'Failed to assign employees' };
    } finally {
      connection.release();
    }
  }

  async getPMEmployees(
    pmId: number
  ): Promise<{ success: boolean; employees?: unknown[]; message?: string }> {
    try {
      const employees = await database.query(
        'SELECT u.id, u.first_name, u.last_name, CONCAT(u.first_name, " ", u.last_name) AS name, u.email, u.phone, u.location FROM users u JOIN employees e ON u.id = e.user_id WHERE e.project_manager_id = ?',
        [pmId]
      );
      return { success: true, employees: employees as unknown[] };
    } catch (error) {
      Logger.error(`Get PM employees error: ${error}`);
      return { success: false, message: 'Failed to get PM employees' };
    }
  }

  async getEmployeesWithoutPM(): Promise<{ success: boolean; employees?: unknown[]; message?: string }> {
    try {
      const employees = await database.query(
        'SELECT u.id, u.first_name, u.last_name, CONCAT(u.first_name, " ", u.last_name) AS name, u.email, u.phone, u.location FROM users u LEFT JOIN employees e ON u.id = e.user_id WHERE u.role = ? AND (e.project_manager_id IS NULL OR e.project_manager_id = 0)',
        [UserRole.EMPLOYEE]
      );
      return { success: true, employees: employees as unknown[] };
    } catch (error) {
      Logger.error(`Get employees without PM error: ${error}`);
      return { success: false, message: 'Failed to get employees without PM' };
    }
  }

  async getEmployeesForReview(): Promise<{ success: boolean; employees?: unknown[]; count?: number; message?: string }> {
    try {
      const employees = await database.query(
        `SELECT u.id, u.first_name, u.last_name, CONCAT(u.first_name,' ',u.last_name) AS name, u.email, u.phone, u.location, u.no_of_hours,
         e.employement_start_date, e.start_date, e.end_date, e.visa_status, e.college_name, e.college_address, e.degree, e.job_title,
         e.date_of_birth, e.college_Dso_name, e.college_Dso_email, e.college_Dso_phone, e.compensation, e.job_duties, e.project_manager_id
         FROM users u 
         LEFT JOIN employees e ON u.id = e.user_id 
         WHERE u.role = ? AND (
           e.employement_start_date IS NULL OR e.start_date IS NULL OR e.end_date IS NULL OR e.visa_status IS NULL OR 
           e.college_name IS NULL OR e.college_address IS NULL OR e.degree IS NULL OR e.job_title IS NULL OR
           e.date_of_birth IS NULL OR e.compensation IS NULL OR e.job_duties IS NULL
         )`,
        [UserRole.EMPLOYEE]
      );
      Logger.info('Employees for review retrieved successfully', employees)
      return { success: true, employees: employees as unknown[], count: (employees as unknown[]).length };
    } catch (error) {
      Logger.error(`Get employees for review error: ${error}`);
      return { success: false, message: 'Failed to get employees for review' };
    }
  }

  async updateEmployeeDetails(
    userId: number,
    employeeData: any
  ): Promise<{ success: boolean; message: string }> {
    const connection = await database.getPool().getConnection();
    try {
      await connection.beginTransaction();

      const { first_name, last_name, email, phone, location, no_of_hours, employment_start_date, job_start_date, start_date, end_date, visa_status, college_name, college_address, degree, job_title, date_of_birth, compensation, job_duties, project_manager_id, college_Dso_name, college_Dso_email, college_Dso_phone } = employeeData as any;
      const employement_start_update = employment_start_date || job_start_date || null;

      // Update user table
      await connection.query(
        'UPDATE users SET first_name = ?, last_name = ?, email = ?, phone = ?, location = ?, no_of_hours = ? WHERE id = ?',
        [first_name, last_name, email, phone, location, no_of_hours, userId]
      );

      // Update employee table
      await connection.query(
        'UPDATE employees SET employement_start_date = ?, start_date = ?, end_date = ?, visa_status = ?, college_name = ?, college_address = ?, degree = ?, job_title = ?, date_of_birth = ?, compensation = ?, job_duties = ?, project_manager_id = ?, college_Dso_name = ?, college_Dso_email = ?, college_Dso_phone = ? WHERE user_id = ?',
        [employement_start_update, start_date, end_date, visa_status, college_name, college_address, degree, job_title, date_of_birth, compensation, job_duties, project_manager_id, college_Dso_name, college_Dso_email, college_Dso_phone, userId]
      );

      await connection.commit();
      Logger.info(`Employee details updated for user ID: ${userId}`);
      return { success: true, message: 'Employee details updated successfully' };
    } catch (error) {
      await connection.rollback();
      Logger.error(`Update employee details error: ${error}`);
      return { success: false, message: 'Failed to update employee details' };
    } finally {
      connection.release();
    }
  }
  public async getUserProfile(userId: number): Promise<{ success: boolean; user?: any; message?: string }> {
    try {
      const query = `
        SELECT
          u.id, u.first_name, u.last_name, CONCAT(u.first_name,' ',u.last_name) AS name, u.email, u.phone, u.role, u.is_active, u.location, u.no_of_hours,
          e.employement_start_date, e.start_date, e.end_date, e.visa_status,
          e.college_name, e.college_address, e.degree, e.job_title, e.date_of_birth,
          e.college_Dso_name, e.college_Dso_email, e.college_Dso_phone,
          e.compensation, e.job_duties, e.project_manager_id
        FROM users u
        LEFT JOIN employees e ON u.id = e.user_id
        WHERE u.id = ?
      `;
      const users = await database.query(query, [userId]);

      if (!Array.isArray(users) || users.length === 0) {
        return { success: false, message: 'User not found' };
      }

      // The user object from the query already contains all the necessary fields.
      const user = users[0];

      return { success: true, user: user };
    } catch (error) {
      Logger.error(`Error fetching user profile for userId ${userId}: ${error}`);
      return { success: false, message: 'Internal server error' };
    }
  }


  async deactivateUser(userId: number): Promise<{ success: boolean; message: string }> {
    try {
      const result = await database.query(
        "UPDATE users SET is_active = 0 WHERE id = ?",
        [userId]
      ) as unknown as ResultSetHeader;

      if (result.affectedRows === 0) {
        return { success: false, message: 'User not found or already inactive' };
      }

      Logger.info(`User deactivated successfully: ID ${userId}`);
      return { success: true, message: 'User deactivated successfully' };
    } catch (error) {
      Logger.error(`Deactivate user error: ${error}`);
      return { success: false, message: 'Failed to deactivate user' };
    }
  }
}
