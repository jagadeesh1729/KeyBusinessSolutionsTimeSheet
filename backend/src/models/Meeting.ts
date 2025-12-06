export interface Meeting {
  id: number;
  title: string;
  meeting_link: string;
  start_time: Date | string;
  duration_minutes: number;
  created_by: number;
  created_at: Date | string;
  event_id?: string | null;
  created_by_name?: string;
  created_by_email?: string;
}

export interface CreateMeetingRecord {
  title: string;
  meeting_link: string;
  start_time: string | Date;
  duration_minutes: number;
  created_by: number;
  event_id?: string | null;
}
