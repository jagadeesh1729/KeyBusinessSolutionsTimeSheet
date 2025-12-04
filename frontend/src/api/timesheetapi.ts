
import apiClient from './apiClient';
import type { CreateTimesheetRequest, UpdateTimesheetRequest } from '../component/types/Holiday';

export const timesheetAPI = {
  // Get current timesheet for employee + project
  getCurrentTimesheet: (projectId: number) => 
    apiClient.get(`/timesheets/current?projectId=${projectId}`),
  
  // Get timesheet by ID
  getTimesheetById: (id: number) => 
    apiClient.get(`/timesheets/${id}`),
  
  // Get employee timesheet history
  getEmployeeTimesheets: () => 
    apiClient.get('/timesheets'),

  // NEW: Get employee's draft timesheets
  getEmployeeDrafts: () =>
    apiClient.get('/timesheets/employee/drafts'),
  
  // Create new timesheet
  createTimesheet: (data: CreateTimesheetRequest) => 
    apiClient.post('/timesheets', data),
  
  // Update timesheet
  updateTimesheet: (id: number, data: UpdateTimesheetRequest) => 
    apiClient.put(`/timesheets/${id}`, data),
  
  // Submit timesheet
  submitTimesheet: (id: number) => 
    apiClient.post(`/timesheets/${id}/submit`),
  
  // NEW: Get rejected timesheets for employee
  getRejectedTimesheets: () => 
    apiClient.get('/timesheets/rejected'),
  
  // NEW: Get timesheet details for editing (including rejection reason)
  getTimesheetForEdit: (id: number) => 
    apiClient.get(`/timesheets/${id}/edit`),
  
  // PM - Get pending timesheets
  getPendingTimesheets: () => 
    apiClient.get('/timesheets/manager/pending'),

  // PM - Get timesheets by status (pending | approved | rejected)
  getManagerTimesheetsByStatus: (status: 'pending' | 'approved' | 'rejected') =>
    apiClient.get(`/timesheets/manager/status/${status}`),
  
  // PM - Approve timesheet
  approveTimesheet: (id: number, notes?: string) => 
    apiClient.post(`/timesheets/${id}/approve`, { notes }),
  
  // NEW: System auto-approve timesheet (uses PUT and finds manager on backend)
  autoApproveTimesheet: (id: number) =>
    apiClient.put(`/timesheets/${id}/auto/approve`),

  // PM - Reject timesheet
  rejectTimesheet: (id: number, reason: string) => 
    apiClient.post(`/timesheets/${id}/reject`, { reason }),

  // Admin - Get timesheets by status (global)
  getAdminTimesheetsByStatus: (status: 'pending' | 'approved' | 'rejected') =>
    apiClient.get(`/timesheets/admin/status/${status}`),
  
  // PM - Get manager stats
  getPMStats: () => 
    apiClient.get('/timesheets/manager/stats'),
  
  // PM - Get managed projects
  getPMProjects: () => 
    apiClient.get('/timesheets/manager/projects'),
  
  // PM - Get managed employees
  getPMEmployees: () => 
    apiClient.get('/timesheets/manager/employees'),
  
  // PM - Get employees who haven't submitted
  getEmployeesNotSubmitted: () => 
    apiClient.get('/timesheets/manager/not-submitted'),
  
  // Admin/PM - Get dashboard stats with optional explicit dates
  getDashboardStats: (params: { range?: string; startDate?: string; endDate?: string } = { range: 'current' }) => {
    const q = new URLSearchParams();
    if (params.range) q.set('range', params.range);
    if (params.startDate) q.set('startDate', params.startDate);
    if (params.endDate) q.set('endDate', params.endDate);
    const qs = q.toString();
    return apiClient.get(`/dashboard/timesheet-stats${qs ? `?${qs}` : ''}`);
  },

  // Admin/PM - Get detailed lists for dashboard or per-project breakdown
  getTimesheetDetails: (params: { status?: string; projectId?: number; range?: string; startDate?: string; endDate?: string }) => {
    const q = new URLSearchParams();
    if (params.status) q.set('status', params.status);
    if (params.projectId !== undefined) q.set('projectId', String(params.projectId));
    if (params.range) q.set('range', params.range);
    if (params.startDate) q.set('startDate', params.startDate);
    if (params.endDate) q.set('endDate', params.endDate);
    const qs = q.toString();
    return apiClient.get(`/dashboard/timesheet-details${qs ? `?${qs}` : ''}`);
  },
};

// Project service
export const projectAPI = {
  getAssignedProjects: () => 
    apiClient.get('/timesheets/employee/projects'), // Updated endpoint
  
  getAllProjects: () => 
    apiClient.get('/projects'),
};

export default { timesheetAPI, projectAPI };
