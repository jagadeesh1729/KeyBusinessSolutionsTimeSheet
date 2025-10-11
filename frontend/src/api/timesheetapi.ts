
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
  
  // PM - Approve timesheet
  approveTimesheet: (id: number, notes?: string) => 
    apiClient.post(`/timesheets/${id}/approve`, { notes }),
  
  // NEW: System auto-approve timesheet (uses PUT and finds manager on backend)
  autoApproveTimesheet: (id: number) =>
    apiClient.put(`/timesheets/${id}/auto/approve`),

  // PM - Reject timesheet
  rejectTimesheet: (id: number, reason: string) => 
    apiClient.post(`/timesheets/${id}/reject`, { reason }),
  
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
  
  // Admin - Get dashboard stats
  getDashboardStats: (range: string = 'current') => 
    apiClient.get(`/dashboard/timesheet-stats?range=${range}`),
};

// Project service
export const projectAPI = {
  getAssignedProjects: () => 
    apiClient.get('/timesheets/employee/projects'), // Updated endpoint
  
  getAllProjects: () => 
    apiClient.get('/projects'),
};

export default { timesheetAPI, projectAPI };