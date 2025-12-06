import { ResultSetHeader, RowDataPacket } from 'mysql2';
import database from '../config/database';
import { CreateMeetingRecord, Meeting } from '../models/Meeting';

export class MeetingService {
  async logMeeting(data: CreateMeetingRecord): Promise<{ success: boolean; meetingId?: number; message?: string }> {
    try {
      const result = await database.query<ResultSetHeader>(
        `INSERT INTO meetings (title, meeting_link, start_time, duration_minutes, created_by, event_id)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          data.title,
          data.meeting_link,
          new Date(data.start_time),
          data.duration_minutes ?? 60,
          data.created_by,
          data.event_id || null,
        ]
      );
      return { success: true, meetingId: result.insertId };
    } catch (error: any) {
      console.error('Failed to log meeting:', error?.message || error);
      return { success: false, message: 'Failed to save meeting details' };
    }
  }

  async listMeetings(params: { limit?: number; upcomingOnly?: boolean } = {}): Promise<{ success: boolean; meetings?: Meeting[]; message?: string }> {
    try {
      const { limit, upcomingOnly } = params;
      const filters: string[] = [];
      const sqlParams: (string | number | Date)[] = [];

      if (upcomingOnly) {
        filters.push('m.start_time >= NOW()');
      }

      const where = filters.length ? `WHERE ${filters.join(' AND ')}` : '';
      const limitClause = limit ? 'LIMIT ?' : '';
      if (limit) sqlParams.push(limit);

      const rows = (await database.query<RowDataPacket[]>(
        `SELECT 
           m.*,
           CONCAT(u.first_name,' ',u.last_name) as created_by_name,
           u.email as created_by_email
         FROM meetings m
         JOIN users u ON u.id = m.created_by
         ${where}
         ORDER BY m.start_time DESC
         ${limitClause}`,
        sqlParams
      )) as Meeting[];

      return { success: true, meetings: rows as Meeting[] };
    } catch (error: any) {
      console.error('Failed to list meetings:', error?.message || error);
      return { success: false, message: 'Failed to load meetings' };
    }
  }

  async listUserMeetings(userId: number, params: { limit?: number; upcomingOnly?: boolean } = {}): Promise<{ success: boolean; meetings?: Meeting[]; message?: string }> {
    try {
      const { limit, upcomingOnly } = params;
      const filters: string[] = ['m.created_by = ?'];
      const sqlParams: (string | number | Date)[] = [userId];

      if (upcomingOnly) {
        filters.push('m.start_time >= NOW()');
      }

      const where = `WHERE ${filters.join(' AND ')}`;
      const limitClause = limit ? 'LIMIT ?' : '';
      if (limit) sqlParams.push(limit);

      const rows = (await database.query<RowDataPacket[]>(
        `SELECT 
           m.*,
           CONCAT(u.first_name,' ',u.last_name) as created_by_name,
           u.email as created_by_email
         FROM meetings m
         JOIN users u ON u.id = m.created_by
         ${where}
         ORDER BY m.start_time DESC
         ${limitClause}`,
        sqlParams
      )) as Meeting[];

      return { success: true, meetings: rows as Meeting[] };
    } catch (error: any) {
      console.error('Failed to list user meetings:', error?.message || error);
      return { success: false, message: 'Failed to load meetings' };
    }
  }
}

export default new MeetingService();
