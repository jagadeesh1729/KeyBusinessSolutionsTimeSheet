import type { PoolConnection } from 'mysql2/promise';
import { RowDataPacket } from 'mysql2';
import database from '../config/database';
import {
  ChangeType,
  ProjectChangeLog,
  UserChangeLog,
  UserProjectActionType,
  UserProjectChangeLog,
  EmployeeChangeLog,
} from '../models/ChangeLog';

export interface ChangeLogInput {
  fieldName: string;
  oldValue?: any;
  newValue?: any;
  changeType?: ChangeType;
  changeReason?: string | null;
}

type QueryExecutor = {
  query: (sql: string, values?: any[]) => Promise<any>;
};

const formatValue = (value: any): string | null => {
  if (value === undefined || value === null) return null;
  if (typeof value === 'string') return value;
  if (value instanceof Date) return value.toISOString();
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
};

class ChangeLogService {
  private getExecutor(connection?: PoolConnection): QueryExecutor {
    if (connection) {
      return {
        query: (sql: string, values?: any[]) => connection.query(sql, values),
      };
    }

    return {
      query: (sql: string, values?: any[]) => database.query(sql, values),
    };
  }

  async recordProjectChangeLogs(
    projectId: number,
    changedBy: number | null,
    changes: ChangeLogInput[],
    connection?: PoolConnection,
  ): Promise<void> {
    if (!changes.length) return;
    const executor = this.getExecutor(connection);
    const sql = `
      INSERT INTO project_change_logs
        (project_id, changed_by, field_name, old_value, new_value, change_type, change_reason)
      VALUES ${changes.map(() => '(?,?,?,?,?,?,?)').join(',')}
    `;
    const params = changes.flatMap((change) => [
      projectId,
      changedBy ?? null,
      change.fieldName,
      formatValue(change.oldValue),
      formatValue(change.newValue),
      change.changeType ?? 'UPDATE',
      change.changeReason ?? null,
    ]);
    await executor.query(sql, params);
  }

  async recordUserChangeLogs(
    userId: number,
    changedBy: number | null,
    changes: ChangeLogInput[],
    connection?: PoolConnection,
  ): Promise<void> {
    if (!changes.length) return;
    const executor = this.getExecutor(connection);
    const sql = `
      INSERT INTO user_change_logs
        (user_id, changed_by, field_name, old_value, new_value, change_type, change_reason)
      VALUES ${changes.map(() => '(?,?,?,?,?,?,?)').join(',')}
    `;
    const params = changes.flatMap((change) => [
      userId,
      changedBy ?? null,
      change.fieldName,
      formatValue(change.oldValue),
      formatValue(change.newValue),
      change.changeType ?? 'UPDATE',
      change.changeReason ?? null,
    ]);
    await executor.query(sql, params);
  }

  async recordEmployeeChangeLogs(
    employeeId: number,
    changedBy: number | null,
    changes: ChangeLogInput[],
    connection?: PoolConnection,
  ): Promise<void> {
    if (!changes.length) return;
    const executor = this.getExecutor(connection);
    const sql = `
      INSERT INTO employee_change_logs
        (employee_id, changed_by, field_name, old_value, new_value, change_type, change_reason)
      VALUES ${changes.map(() => '(?,?,?,?,?,?,?)').join(',')}
    `;
    const params = changes.flatMap((change) => [
      employeeId,
      changedBy ?? null,
      change.fieldName,
      formatValue(change.oldValue),
      formatValue(change.newValue),
      change.changeType ?? 'UPDATE',
      change.changeReason ?? null,
    ]);
    try {
      console.log(`[ChangeLogService] Recording employee change logs - employeeId: ${employeeId}, changes: ${changes.length}`);
      console.log(`[ChangeLogService] SQL: ${sql}`);
      console.log(`[ChangeLogService] Params: ${JSON.stringify(params)}`);
      await executor.query(sql, params);
      console.log(`[ChangeLogService] Successfully recorded employee change logs`);
    } catch (error) {
      console.error(`[ChangeLogService] Error recording employee change logs:`, error);
      throw error;
    }
  }

  async getProjectChangeLogs(projectId: number): Promise<ProjectChangeLog[]> {
    const rows = (await database.query<RowDataPacket[]>(
      `SELECT pcl.*, u.first_name, u.last_name, u.email
       FROM project_change_logs pcl
       LEFT JOIN users u ON pcl.changed_by = u.id
       WHERE pcl.project_id = ?
       ORDER BY pcl.changed_at DESC, pcl.id DESC`,
      [projectId],
    )) as RowDataPacket[];

    return rows.map((row: any) => ({
      ...row,
      changed_by: row.changed_by ?? null,
      changed_by_name: row.first_name
        ? `${row.first_name} ${row.last_name ?? ''}`.trim()
        : null,
      changed_by_email: row.email || null,
    })) as ProjectChangeLog[];
  }

  async getUserChangeLogs(userId: number): Promise<UserChangeLog[]> {
    const rows = (await database.query<RowDataPacket[]>(
      `SELECT ucl.*, changer.first_name, changer.last_name, changer.email
       FROM user_change_logs ucl
       LEFT JOIN users changer ON changer.id = ucl.changed_by
       WHERE ucl.user_id = ?
       ORDER BY ucl.changed_at DESC, ucl.id DESC`,
      [userId],
    )) as RowDataPacket[];

    return rows.map((row: any) => ({
      ...row,
      changed_by: row.changed_by ?? null,
      changed_by_name: row.first_name
        ? `${row.first_name} ${row.last_name ?? ''}`.trim()
        : null,
      changed_by_email: row.email || null,
    })) as UserChangeLog[];
  }

  async getEmployeeChangeLogs(employeeId: number): Promise<EmployeeChangeLog[]> {
    const rows = (await database.query<RowDataPacket[]>(
      `SELECT ecl.*, changer.first_name, changer.last_name, changer.email
       FROM employee_change_logs ecl
       LEFT JOIN users changer ON changer.id = ecl.changed_by
       WHERE ecl.employee_id = ?
       ORDER BY ecl.changed_at DESC, ecl.id DESC`,
      [employeeId],
    )) as RowDataPacket[];

    return rows.map((row: any) => ({
      ...row,
      changed_by: row.changed_by ?? null,
      changed_by_name: row.first_name
        ? `${row.first_name} ${row.last_name ?? ''}`.trim()
        : null,
      changed_by_email: row.email || null,
    })) as EmployeeChangeLog[];
  }

  async recordUserProjectChangeLogs(
    userId: number,
    changedBy: number | null,
    entries: { projectId: number; actionType: UserProjectActionType; oldValue?: any; newValue?: any; changeReason?: string | null }[],
    connection?: PoolConnection,
  ): Promise<void> {
    if (!entries.length) return;
    const executor = this.getExecutor(connection);
    const sql = `
      INSERT INTO user_project_change_logs
        (user_id, project_id, changed_by, action_type, old_value, new_value, change_reason)
      VALUES ${entries.map(() => '(?,?,?,?,?,?,?)').join(',')}
    `;
    const params = entries.flatMap((entry) => [
      userId,
      entry.projectId,
      changedBy ?? null,
      entry.actionType,
      formatValue(entry.oldValue),
      formatValue(entry.newValue),
      entry.changeReason ?? null,
    ]);
    try {
      console.log(`[ChangeLogService] Recording user project change logs - userId: ${userId}, entries: ${entries.length}`);
      console.log(`[ChangeLogService] SQL: ${sql}`);
      console.log(`[ChangeLogService] Params: ${JSON.stringify(params)}`);
      await executor.query(sql, params);
      console.log(`[ChangeLogService] Successfully recorded user project change logs`);
    } catch (error) {
      console.error(`[ChangeLogService] Error recording user project change logs:`, error);
      throw error;
    }
  }

  async getUserProjectChangeLogs(userId: number): Promise<UserProjectChangeLog[]> {
    const rows = (await database.query<RowDataPacket[]>(
      `SELECT upl.*, p.name as project_name, changer.first_name, changer.last_name, changer.email
       FROM user_project_change_logs upl
       LEFT JOIN projects p ON p.id = upl.project_id
       LEFT JOIN users changer ON changer.id = upl.changed_by
       WHERE upl.user_id = ?
       ORDER BY upl.changed_at DESC, upl.id DESC`,
      [userId],
    )) as RowDataPacket[];

    return rows.map((row: any) => ({
      ...row,
      changed_by: row.changed_by ?? null,
      changed_by_name: row.first_name
        ? `${row.first_name} ${row.last_name ?? ''}`.trim()
        : null,
      changed_by_email: row.email || null,
      project_name: row.project_name || null,
    })) as UserProjectChangeLog[];
  }

  async recordExpirationTrackerChangeLogs(
    trackerId: number,
    changedBy: number | null,
    changes: ChangeLogInput[],
    connection?: PoolConnection,
  ): Promise<void> {
    if (!changes.length) return;
    const executor = this.getExecutor(connection);
    const sql = `
      INSERT INTO expiration_tracker_logs
        (tracker_id, changed_by, field_name, old_value, new_value, change_type)
      VALUES ${changes.map(() => '(?,?,?,?,?,?)').join(',')}
    `;
    const params = changes.flatMap((change) => [
      trackerId,
      changedBy ?? null,
      change.fieldName,
      formatValue(change.oldValue),
      formatValue(change.newValue),
      change.changeType ?? 'UPDATE',
    ]);
    try {
      console.log(`[ChangeLogService] Recording expiration tracker change logs - trackerId: ${trackerId}, changes: ${changes.length}`);
      await executor.query(sql, params);
      console.log(`[ChangeLogService] Successfully recorded expiration tracker change logs`);
    } catch (error) {
      console.error(`[ChangeLogService] Error recording expiration tracker change logs:`, error);
      throw error;
    }
  }

  async getExpirationTrackerChangeLogs(trackerId: number): Promise<any[]> {
    const rows = (await database.query<RowDataPacket[]>(
      `SELECT etl.*, changer.first_name, changer.last_name, changer.email
       FROM expiration_tracker_logs etl
       LEFT JOIN users changer ON changer.id = etl.changed_by
       WHERE etl.tracker_id = ?
       ORDER BY etl.changed_at DESC, etl.id DESC`,
      [trackerId],
    )) as RowDataPacket[];

    return rows.map((row: any) => ({
      ...row,
      changed_by: row.changed_by ?? null,
      changed_by_name: row.first_name
        ? `${row.first_name} ${row.last_name ?? ''}`.trim()
        : null,
      changed_by_email: row.email || null,
    }));
  }
}

export const changeLogService = new ChangeLogService();
