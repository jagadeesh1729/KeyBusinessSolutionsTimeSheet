export interface Meeting {
  id: number;
  title: string;
  meeting_link: string;
  start_time: string;
  duration_minutes: number;
  created_by: number;
  created_at: string;
  event_id?: string | null;
  created_by_name?: string;
  created_by_email?: string;
}
