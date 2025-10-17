export type DateString = string;

export interface TaskEntry {
  name: string;
  hours: number;
}

export interface DailyEntry {
  date: DateString;
  hours: number;
  tasks: TaskEntry[];
}

export interface Timesheet {
  id: number;
  employeeId: number;
  projectId?: number;
  periodType: 'weekly' | 'bi-monthly' | 'monthly';
  periodStart: DateString | string;
  periodEnd: DateString | string;
  status: 'draft' | 'pending' | 'approved' | 'rejected' | string;
  totalHours: number;
  autoApprove?: boolean;
  dailyEntries: DailyEntry[];
  entries?: DailyEntry[];
  createdAt: string;
  submittedAt?: string;
  approvedAt?: string;
  approvedBy?: number;
  rejectedAt?: string;
  rejectedBy?: number;
  rejectionReason?: string;
  updatedAt?: string;
  project?: {
    id: number;
    name: string;
    autoApprove: boolean;
    periodType: 'weekly' | 'bi-monthly' | 'monthly';
  };
  employee?: {
    id: number;
    name: string;
    email: string;
  };
  employeeName?: string;
}

export interface CreateTimesheetRequest {
  projectId: number;
  periodStart: DateString;
  periodEnd: DateString;
  dailyEntries: DailyEntry[];
}

export interface UpdateTimesheetRequest {
  id: number | string;
  periodStart: DateString;
  periodEnd: DateString;
  dailyEntries: DailyEntry[];
  status: string;
}

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

export interface TimesheetListResponse {
  success: boolean;
  timesheets?: Timesheet[];
  message?: string;
}

export interface TimesheetResponse {
  success: boolean;
  timesheet?: Timesheet;
  message?: string;
}

export interface Project {
  id: number;
  name: string;
  status: 'Active' | 'Inactive';
  autoApprove: boolean;
  periodType: 'weekly' | 'bi-monthly' | 'monthly';
}

export interface ProjectStat {
  projectId: number;
  projectName: string;
  totalAssigned: number;
  filled: number;
  notFilled: number;
}

export interface DashboardStats {
  totalEmployees: number;
  filledTimesheets: number;
  pendingApproval: number;
  approvedTimesheets: number;
  rejectedTimesheets: number;
  notSubmitted: number;
  projectStats: ProjectStat[];
}

// Utility functions
export const toDateString = (date: Date): DateString => {
  return date.toISOString().split('T')[0];
};

export const isWeekday = (date: Date): boolean => {
  const day = date.getDay();
  return day !== 0 && day !== 6; // 0 = Sunday, 6 = Saturday
};

export const isHoliday = (dateStr: DateString, holidays: Array<{ date: DateString }>): boolean => {
  return holidays.some(holiday => holiday.date === dateStr);
};

// Legacy interfaces for backward compatibility
export interface CalenderViewFromAdmin {
  startDate: DateString;
  endDate: DateString;
  holidays: Array<{ id: string; date: DateString; reason: string }>;
  autoApprove: boolean;
  periodType: 'weekly' | 'bi-monthly' | 'monthly';
  weekend: DateString[];
}

export interface TimesheetEntryOptionA {
  date: DateString;
  tasks: TaskEntry[];
  hours: number;
}


