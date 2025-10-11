export type ProjectStatus = 'Active' | 'Inactive';
export type PeriodType = 'weekly' | 'bi-monthly' | 'monthly';

export interface Project {
  id: number;
  name: string;
  status: ProjectStatus;
  start_date: Date | null;
  end_date: Date | null;
  auto_approve: boolean;
  period_type: PeriodType;
  created_at: Date;
  updated_at: Date;
}

export interface CreateProjectRequest {
  name: string;
  start_date?: string; // Dates often come as strings from JSON
  end_date?: string;
  auto_approve?: boolean;
  period_type?: PeriodType;
}

export interface UpdateProjectRequest {
  name?: string;
  status?: ProjectStatus;
  start_date?: string;
  end_date?: string;
  auto_approve?: boolean;
  period_type?: PeriodType;
}
// src/types/UserProject.ts

export interface UserProject {
  user_id: number;     // FK → users.id
  project_id: number;  // FK → projects.id
}
// src/types/AssignProjectsRequest.ts

export interface AssignProjectsRequest {
  user_id: number;
  project_ids: number[]; // multiple projects
}
