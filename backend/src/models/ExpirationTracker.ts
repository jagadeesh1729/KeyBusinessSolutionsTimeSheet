export type RecurringFrequency = 'daily' | 'weekly' | 'bi-weekly' | 'bi-monthly' | 'monthly' | 'quarterly';

export interface ExpirationTracker {
  id?: number;
  target_days: number;         // Default 180 (6 months)
  recurring: RecurringFrequency;
}

export interface ExpirationTrackerLog {
  id?: number;
  tracker_id: number;
  changed_by: number | null;
  field_name: string;
  old_value: string | null;
  new_value: string | null;
  change_type: 'CREATE' | 'UPDATE' | 'DELETE';
  changed_at?: Date;
}

export interface ExpirationTrackerLogWithUser extends ExpirationTrackerLog {
  changed_by_name?: string | null;
  changed_by_email?: string | null;
}

export interface CreateExpirationTrackerRequest {
  target_days?: number;
  recurring?: RecurringFrequency;
}

export interface UpdateExpirationTrackerRequest {
  target_days?: number;
  recurring?: RecurringFrequency;
}

export interface ExpiringEmployee {
  id: number;
  user_id: number;
  first_name: string;
  last_name: string;
  email: string;
  end_date: string | null;
  days_until_expiry: number;
  months_until_expiry: number;
  status: 'expired' | 'critical' | 'warning' | 'safe';
  is_expiring_soon: number; // 1 if within target_days, 0 otherwise
}
