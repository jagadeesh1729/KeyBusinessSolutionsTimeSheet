export type ChangeType = 'CREATE' | 'UPDATE' | 'DELETE';

interface BaseChangeLog {
  id: number;
  field_name: string;
  old_value: string | null;
  new_value: string | null;
  change_type: ChangeType;
  change_reason?: string | null;
  changed_at: string;
  changed_by?: number | null;
  changed_by_name?: string | null;
  changed_by_email?: string | null;
}

export interface ProjectChangeLog extends BaseChangeLog {
  project_id: number;
}

export interface UserChangeLog extends BaseChangeLog {
  user_id: number;
}

export interface ProjectDateHistoryEntry {
  id: number;
  project_id: number;
  old_start_date: string | null;
  old_end_date: string | null;
  new_start_date: string | null;
  new_end_date: string | null;
  changed_at: string;
}

export type UserProjectActionType = 'ASSIGNED' | 'UNASSIGNED' | 'UPDATED';

export interface UserProjectChangeLog {
  id: number;
  user_id: number;
  project_id: number;
  project_name?: string | null;
  changed_by?: number | null;
  changed_by_name?: string | null;
  changed_by_email?: string | null;
  action_type: UserProjectActionType;
  old_value: string | null;
  new_value: string | null;
  change_reason?: string | null;
  changed_at: string;
}

export interface EmployeeChangeLog extends BaseChangeLog {
  employee_id: number;
}
