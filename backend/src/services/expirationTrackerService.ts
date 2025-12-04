import database from '../config/database';
import { OkPacket, RowDataPacket } from 'mysql2';
import Logger from '../utils/logger';
import { changeLogService, ChangeLogInput } from './changeLogService';
import {
  ExpirationTracker,
  ExpirationTrackerLog,
  ExpirationTrackerLogWithUser,
  CreateExpirationTrackerRequest,
  UpdateExpirationTrackerRequest,
  ExpiringEmployee,
  RecurringFrequency,
} from '../models/ExpirationTracker';

interface ServiceResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
}

export class ExpirationTrackerService {
  /**
   * Get the expiration tracker settings (singleton - only one row should exist)
   */
  async getTracker(): Promise<ServiceResponse<ExpirationTracker>> {
    try {
      const rows = await database.query<RowDataPacket[]>(
        'SELECT * FROM expiration_tracker ORDER BY id ASC LIMIT 1'
      );

      if (!rows || rows.length === 0) {
        // Create default tracker if none exists
        const result = await this.createTracker({});
        return result;
      }

      return {
        success: true,
        data: rows[0] as ExpirationTracker,
      };
    } catch (error) {
      Logger.error(`Error fetching expiration tracker: ${error}`);
      return { success: false, message: 'Failed to fetch expiration tracker settings' };
    }
  }

  /**
   * Create expiration tracker settings
   */
  async createTracker(
    data: CreateExpirationTrackerRequest,
    changedBy?: number | null
  ): Promise<ServiceResponse<ExpirationTracker>> {
    try {
      const target_days = data.target_days ?? 180;
      const recurring = data.recurring ?? 'monthly';

      const result = await database.query<OkPacket>(
        'INSERT INTO expiration_tracker (target_days, recurring) VALUES (?, ?)',
        [target_days, recurring]
      );

      const trackerId = result.insertId;

      // Record creation in change logs
      const changes: ChangeLogInput[] = [
        { fieldName: 'target_days', newValue: target_days, changeType: 'CREATE' },
        { fieldName: 'recurring', newValue: recurring, changeType: 'CREATE' },
      ];
      await changeLogService.recordExpirationTrackerChangeLogs(trackerId, changedBy ?? null, changes);

      return {
        success: true,
        message: 'Expiration tracker created successfully',
        data: { id: trackerId, target_days, recurring },
      };
    } catch (error) {
      Logger.error(`Error creating expiration tracker: ${error}`);
      return { success: false, message: 'Failed to create expiration tracker' };
    }
  }

  /**
   * Update expiration tracker settings
   */
  async updateTracker(
    id: number,
    data: UpdateExpirationTrackerRequest,
    changedBy?: number | null
  ): Promise<ServiceResponse<ExpirationTracker>> {
    try {
      // Get current tracker
      const currentRows = await database.query<RowDataPacket[]>(
        'SELECT * FROM expiration_tracker WHERE id = ?',
        [id]
      );

      if (!currentRows || currentRows.length === 0) {
        return { success: false, message: 'Expiration tracker not found' };
      }

      const current = currentRows[0] as ExpirationTracker;
      const changes: ChangeLogInput[] = [];
      const updates: string[] = [];
      const values: any[] = [];

      // Check target_days change
      if (data.target_days !== undefined && data.target_days !== current.target_days) {
        updates.push('target_days = ?');
        values.push(data.target_days);
        changes.push({
          fieldName: 'target_days',
          oldValue: current.target_days,
          newValue: data.target_days,
          changeType: 'UPDATE',
        });
      }

      // Check recurring change
      if (data.recurring !== undefined && data.recurring !== current.recurring) {
        updates.push('recurring = ?');
        values.push(data.recurring);
        changes.push({
          fieldName: 'recurring',
          oldValue: current.recurring,
          newValue: data.recurring,
          changeType: 'UPDATE',
        });
      }

      if (updates.length === 0) {
        return {
          success: true,
          message: 'No changes detected',
          data: current,
        };
      }

      values.push(id);
      await database.query(
        `UPDATE expiration_tracker SET ${updates.join(', ')} WHERE id = ?`,
        values
      );

      // Record changes
      await changeLogService.recordExpirationTrackerChangeLogs(id, changedBy ?? null, changes);

      // Get updated tracker
      const updatedRows = await database.query<RowDataPacket[]>(
        'SELECT * FROM expiration_tracker WHERE id = ?',
        [id]
      );

      return {
        success: true,
        message: 'Expiration tracker updated successfully',
        data: updatedRows[0] as ExpirationTracker,
      };
    } catch (error) {
      Logger.error(`Error updating expiration tracker: ${error}`);
      return { success: false, message: 'Failed to update expiration tracker' };
    }
  }

  /**
   * Get ALL employees with end_date, with flag indicating if within target_days threshold
   */
  async getExpiringEmployees(): Promise<ServiceResponse<ExpiringEmployee[]>> {
    try {
      // Get tracker settings
      const trackerResult = await this.getTracker();
      if (!trackerResult.success || !trackerResult.data) {
        return { success: false, message: 'Failed to get tracker settings' };
      }

      const targetDays = trackerResult.data.target_days;

      // Query ALL employees with end_date (not limited to target_days)
      // Status calculation:
      // - expired: end_date < today
      // - critical: end_date within 30 days
      // - warning: end_date within target_days  
      // - safe: end_date beyond target_days
      const rows = await database.query<RowDataPacket[]>(
        `SELECT 
          e.id,
          e.user_id,
          u.first_name,
          u.last_name,
          u.email,
          e.end_date,
          DATEDIFF(e.end_date, CURDATE()) as days_until_expiry,
          TIMESTAMPDIFF(MONTH, CURDATE(), e.end_date) as months_until_expiry,
          CASE 
            WHEN e.end_date < CURDATE() THEN 'expired'
            WHEN DATEDIFF(e.end_date, CURDATE()) <= 30 THEN 'critical'
            WHEN DATEDIFF(e.end_date, CURDATE()) <= ? THEN 'warning'
            ELSE 'safe'
          END as status,
          CASE 
            WHEN DATEDIFF(e.end_date, CURDATE()) <= ? THEN 1
            ELSE 0
          END as is_expiring_soon
        FROM employees e
        INNER JOIN users u ON e.user_id = u.id
        WHERE e.end_date IS NOT NULL
          AND u.is_active = 1
        ORDER BY e.end_date ASC`,
        [targetDays, targetDays]
      );

      return {
        success: true,
        data: rows as ExpiringEmployee[],
      };
    } catch (error) {
      Logger.error(`Error fetching expiring employees: ${error}`);
      return { success: false, message: 'Failed to fetch expiring employees' };
    }
  }

  /**
   * Get expiring employees count by status
   */
  async getExpiringEmployeesCount(): Promise<ServiceResponse<{
    total: number;
    expired: number;
    critical: number;
    warning: number;
    safe: number;
    target_days: number;
    recurring: RecurringFrequency;
  }>> {
    try {
      // Get tracker settings
      const trackerResult = await this.getTracker();
      if (!trackerResult.success || !trackerResult.data) {
        return { success: false, message: 'Failed to get tracker settings' };
      }

      const tracker = trackerResult.data;

      const rows = await database.query<RowDataPacket[]>(
        `SELECT 
          COUNT(*) as total,
          SUM(CASE WHEN e.end_date < CURDATE() THEN 1 ELSE 0 END) as expired,
          SUM(CASE WHEN e.end_date >= CURDATE() AND DATEDIFF(e.end_date, CURDATE()) <= 30 THEN 1 ELSE 0 END) as critical,
          SUM(CASE WHEN DATEDIFF(e.end_date, CURDATE()) > 30 AND DATEDIFF(e.end_date, CURDATE()) <= 90 THEN 1 ELSE 0 END) as warning,
          SUM(CASE WHEN DATEDIFF(e.end_date, CURDATE()) > 90 THEN 1 ELSE 0 END) as safe
        FROM employees e
        INNER JOIN users u ON e.user_id = u.id
        WHERE e.end_date IS NOT NULL
          AND u.is_active = 1
          AND DATEDIFF(e.end_date, CURDATE()) <= ?`,
        [tracker.target_days]
      );

      const counts = rows[0] || { total: 0, expired: 0, critical: 0, warning: 0, safe: 0 };

      return {
        success: true,
        data: {
          total: Number(counts.total) || 0,
          expired: Number(counts.expired) || 0,
          critical: Number(counts.critical) || 0,
          warning: Number(counts.warning) || 0,
          safe: Number(counts.safe) || 0,
          target_days: tracker.target_days,
          recurring: tracker.recurring,
        },
      };
    } catch (error) {
      Logger.error(`Error fetching expiring employees count: ${error}`);
      return { success: false, message: 'Failed to fetch expiring employees count' };
    }
  }

  /**
   * Get change logs for expiration tracker
   */
  async getTrackerChangeLogs(trackerId: number): Promise<ServiceResponse<ExpirationTrackerLogWithUser[]>> {
    try {
      const logs = await changeLogService.getExpirationTrackerChangeLogs(trackerId);
      return {
        success: true,
        data: logs as ExpirationTrackerLogWithUser[],
      };
    } catch (error) {
      Logger.error(`Error fetching tracker change logs: ${error}`);
      return { success: false, message: 'Failed to fetch change logs' };
    }
  }
}

export const expirationTrackerService = new ExpirationTrackerService();
