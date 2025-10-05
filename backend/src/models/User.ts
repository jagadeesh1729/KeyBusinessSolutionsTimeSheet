export enum UserRole {
  ADMIN = 'admin',
  EMPLOYEE = 'employee',
  PROJECT_MANAGER = 'project_manager',
}
export interface User {
  id?: number;
  name: string;
  email: string;
  phone: string;
  password: string;
  role: UserRole;
  is_active?: boolean;
  reset_token?: string;
  location?: string;
  no_of_hours: number;
  project_name?: string;
}
export interface LoginRequest {
  email: string;
  password: string;
}
export interface AuthResponse {
  success: boolean;
  message: string;
  token?: string;
  user?: {
    id: number;
    name: string;
    email: string;
    role: UserRole;
  };
}
export interface CreateUserRequest {
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  location?: string;
  no_of_hours: number;
  project_name?: string;
}
