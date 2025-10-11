export type PeriodType = 'weekly' | 'bi-monthly' | 'monthly';
export type TimesheetStatus = 'draft' | 'pending' | 'approved' | 'rejected';

export interface TaskEntry {
  name: string;
  hours: number;
}

export interface DailyEntry {
  date: string;
  hours: number;
  tasks: TaskEntry[];
}

export interface Timesheet {
  id: number;
  employee_id: number;
  project_id: number;
  period_type: PeriodType;
  period_start: string;
  period_end: string;
  status: TimesheetStatus;
  total_hours: number;
  auto_approve: boolean;
  daily_entries: DailyEntry[];
  created_at: Date;
  submitted_at?: Date;
  approved_at?: Date;
  approved_by?: number;
  rejected_at?: Date;
  rejected_by?: number;
  rejection_reason?: string;
  updated_at: Date;
}

export interface CreateTimesheetRequest {
  projectId: number;
  periodStart?: string;
  periodType?: PeriodType;
  periodEnd?: string;
  dailyEntries: DailyEntry[];
}

export interface UpdateTimesheetRequest {
  dailyEntries: DailyEntry[];
  status?: TimesheetStatus;
}
export interface DatabaseQueryParams extends Array<string | number | boolean | Date | null> {}
export interface SubmitTimesheetRequest {
  timesheetId: number;
}

export interface ApproveTimesheetRequest {
  timesheetId: number;
  notes?: string;
}

export interface RejectTimesheetRequest {
  timesheetId: number;
  reason: string;
}