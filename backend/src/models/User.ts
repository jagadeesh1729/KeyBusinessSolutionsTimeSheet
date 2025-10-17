export enum UserRole {
  ADMIN = 'admin',
  EMPLOYEE = 'employee',
  PROJECT_MANAGER = 'project_manager',
}
export interface User {
  id?: number;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  password: string;
  role: UserRole;
  is_active?: boolean;
  reset_token?: string;
  location: string;
  no_of_hours: number;
}
export interface Employee {
  id?: number;
  user_id: number;                 // FK → users.id
  start_date?: string | null;      // format: yyyy-mm-dd
  end_date?: string | null;        // format: yyyy-mm-dd
  visa_status?: string | null;
  job_duties?: string | null;
  compensation?: string | null;
  performance_review?: string | null;
  reports?: string | null;
  project_manager_id?: number | null; // FK → users.id (PM)
}

export interface RegisterEmployeeRequest {
  // User fields
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  password: string;
  location?: string;
  no_of_hours?: number;
  // Employee fields
  employment_start_date?: string;
  start_date?: string; // OPT start date
  end_date?: string;   // OPT end date
  visa_status?: string;
  job_duties?: string;
  compensation?: string;
  college_name?: string;
  college_address?: string;
  degree?: string;
  date_of_birth?: string;
  college_Dso_name?: string;
  college_Dso_email?: string;
  college_Dso_phone?: string;
}


export interface CreatePMRequest {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  location: string;
  no_of_hours: number;
}

export interface LoginRequest {
  email: string;
  password: string;
}
export interface CreateUserRequest {
  first_name: string;
  last_name: string;
  email: string;
  role: UserRole;
}

export interface UserProject {
  user_id: number;     // FK → users.id
  project_id: number;  // FK → projects.id
}

export interface AssignProjectsRequest {
  user_id: number;
  project_ids: number[]; // multiple projects
}

export interface AssignEmployeesToPMRequest {
  pm_id: number;
  employee_ids: number[]; // multiple employees
}

export interface AuthResponse {
  success: boolean;
  message: string;
  token?: string;
  user?: {
    id: number;
    first_name: string;
    last_name: string;
    name?: string; // computed full name for compatibility
    email: string;
    role: UserRole;
    no_of_hours: number;
  };
}
