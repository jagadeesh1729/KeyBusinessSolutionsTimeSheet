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
  code?: string;
  client_address?: string | null;
  project_description?: string | null;
  signature_required?: boolean | null;
  created_at: Date;
  updated_at: Date;
}

export interface CreateProjectRequest {
  name: string;
  start_date?: string; // Dates often come as strings from JSON
  end_date?: string;
  auto_approve?: boolean;
  period_type?: PeriodType;
  code?: string;
  client_address?: string;
  project_description?: string;
  signature_required?: boolean;
}

export interface UpdateProjectRequest {
  name?: string;
  status?: ProjectStatus;
  start_date?: string;
  end_date?: string;
  auto_approve?: boolean;
  period_type?: PeriodType;
  // Allow optional updates
  client_address?: string;
  project_description?: string;
  signature_required?: boolean;
  // Generally we do not update code, but keep optional for flexibility
  code?: string;
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
