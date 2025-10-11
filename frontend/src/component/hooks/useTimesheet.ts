// Updated hook to handle timesheet editing and rejection details
import { useState, useEffect } from 'react';
import { timesheetAPI, projectAPI } from '../../api/timesheetapi';
import type { Timesheet, DailyEntry, CreateTimesheetRequest, UpdateTimesheetRequest } from '../types/Holiday';
import type  Project  from '../types/project';

// Hook for current timesheet
export const useCurrentTimesheet = (projectId?: number) => {
  const [data, setData] = useState<Timesheet | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCurrentTimesheet = async (id: number) => {
    try {
      setLoading(true);
      setError(null);
      const response = await timesheetAPI.getCurrentTimesheet(id);
      if (response.data.success) {
        const timesheetData = response.data.timesheet;
        if (timesheetData) {
          // Transform snake_case from backend to camelCase for frontend
          const ts = timesheetData as any;
          timesheetData.periodStart = ts.period_start;
          timesheetData.periodEnd = ts.period_end;
          timesheetData.totalHours = ts.total_hours;
          timesheetData.rejectionReason = ts.rejection_reason;
          timesheetData.dailyEntries = ts.daily_entries?.entries || [];
          timesheetData.project = { name: ts.project_name, autoApprove: ts.auto_approve, periodType: ts.period_type, id: ts.project_id };
        }
        setData(timesheetData || null);
      } else {
        setError(response.data.message || 'Failed to fetch timesheet');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch timesheet');
    } finally {
      setLoading(false);
    }
  };

  const refetch = (id: number) => {
    fetchCurrentTimesheet(id);
  };

  useEffect(() => {
    if (projectId) {
      fetchCurrentTimesheet(projectId);
    } else {
      setLoading(false);
    }
  }, [projectId]);

  return { data, loading, error, refetch };
};

// Hook for specific timesheet by ID
export const useTimesheetById = (timesheetId?: number) => {
  const [data, setData] = useState<Timesheet | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTimesheet = async (id: number) => {
    try {
      setLoading(true);
      setError(null);
      const response = await timesheetAPI.getTimesheetById(id);
      if (response.data.success) {
        const timesheetData = response.data.timesheet;
        if (timesheetData) { // Add this mapping
          const ts = timesheetData as any;
          timesheetData.periodStart = ts.period_start;
          timesheetData.periodEnd = ts.period_end;
          timesheetData.totalHours = ts.total_hours;
          timesheetData.rejectionReason = ts.rejection_reason;
          timesheetData.dailyEntries = ts.daily_entries?.entries || [];
          timesheetData.project = { 
            name: ts.project_name, 
            autoApprove: ts.auto_approve, 
            periodType: ts.period_type, 
            id: ts.project_id 
          };
        }
        setData(timesheetData || null);
      } else {
        setError(response.data.message || 'Failed to fetch timesheet');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch timesheet');
    } finally {
      setLoading(false);
    }
  };

  const refetch = () => {
    if (timesheetId) {
      fetchTimesheet(timesheetId);
    }
  };

  useEffect(() => {
    if (timesheetId) {
      fetchTimesheet(timesheetId);
    } else {
      setLoading(false);
    }
  }, [timesheetId]);

  return { data, loading, error, refetch };
};

// Hook for timesheet history
export const useTimesheetHistory = () => {
  const [data, setData] = useState<Timesheet[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTimesheets = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await timesheetAPI.getEmployeeTimesheets();
      if (response.data.success) {
        // Transform flat data from API to nested structure expected by components
        const transformedTimesheets = (response.data.timesheets || []).map((ts: any) => ({
          ...ts,
          // Map snake_case from backend to camelCase for frontend
          periodStart: ts.period_start,
          periodEnd: ts.period_end,
          totalHours: ts.total_hours,
          employeeName: ts.employee_name,
          rejectionReason: ts.rejection_reason, // Add this mapping
          project: {
            id: ts.project_id,
            name: ts.project_name,
            autoApprove: ts.auto_approve,
            periodType: ts.period_type,
          },
          // Ensure dailyEntries is an array
          dailyEntries: ts.daily_entries?.entries || [],
        }));
        setData(transformedTimesheets);
      } else {
        setError(response.data.message || 'Failed to fetch timesheets');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch timesheets');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTimesheets();
  }, []);

  return { data, loading, error, refetch: fetchTimesheets };
};

// Hook for previous draft timesheets
export const useDraftTimesheets = () => {
  const [data, setData] = useState<Timesheet[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDrafts = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await timesheetAPI.getEmployeeDrafts();
      if (response.data.success) {
        // Transform flat data from API to nested structure
        const transformedTimesheets = (response.data.timesheets || []).map((ts: any) => ({
          ...ts,
          periodStart: ts.period_start,
          periodEnd: ts.period_end,
          totalHours: ts.total_hours,
          project: {
            id: ts.project_id,
            name: ts.project_name,
            autoApprove: ts.auto_approve,
            periodType: ts.period_type,
          },
          dailyEntries: ts.daily_entries?.entries || [],
        }));
        setData(transformedTimesheets);
      } else {
        setError(response.data.message || 'Failed to fetch drafts');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch drafts');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDrafts();
  }, []);

  return { data, loading, error, refetch: fetchDrafts };
};

// Hook for assigned projects
export const useAssignedProjects = () => {
  const [data, setData] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProjects = async () => {
    try {
      console.log('Fetching assigned projects...');
      setLoading(true);
      setError(null);
      const response = await projectAPI.getAssignedProjects();
      console.log('Projects API response:', response);
      if (response.data.success) {
        console.log('Projects found:', response.data.projects);
        setData(response.data.projects || []);
      } else {
        console.log('API returned error:', response.data.message);
        setError(response.data.message || 'Failed to fetch projects');
      }
    } catch (err: any) {
      console.log('API call failed:', err);
      setError(err.response?.data?.message || 'Failed to fetch projects');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  return { data, loading, error, refetch: fetchProjects };
};

// Hook for pending timesheets (PM)
export const usePendingTimesheets = () => {
  const [data, setData] = useState<Timesheet[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPendingTimesheets = async () => {
    try {
      console.log('Fetching pending timesheets...');
      setLoading(true);
      setError(null);
      const response = await timesheetAPI.getPendingTimesheets();
      console.log('Pending timesheets API response:', response.data);
      if (response.data.success) {
        console.log('Received timesheets:', response.data.timesheets);
        // Transform snake_case from backend to camelCase for frontend
        const transformed = (response.data.timesheets || []).map((ts: any) => ({
          ...ts,
          periodStart: ts.period_start,
          periodEnd: ts.period_end,
          totalHours: ts.total_hours,
          submittedAt: ts.submitted_at,
          rejectionReason: ts.rejection_reason,
          dailyEntries: ts.daily_entries?.entries || [],
        }));
        setData(transformed);
      } else {
        console.log('API error:', response.data.message);
        setError(response.data.message || 'Failed to fetch pending timesheets');
      }
    } catch (err: any) {
      console.log('Request failed:', err);
      setError(err.response?.data?.message || 'Failed to fetch pending timesheets');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingTimesheets();
  }, []);

  return { data, loading, error, refetch: fetchPendingTimesheets };
};

// Hook for PM stats
export const usePMStats = () => {
  const [data, setData] = useState<{ projects: number; employees: number; pending: number; approved: number; rejected: number; notSubmitted: number }>({ 
    projects: 0, employees: 0, pending: 0, approved: 0, rejected: 0, notSubmitted: 0 
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPMStats = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await timesheetAPI.getPMStats();
      if (response.data.success) {
        setData(response.data.stats || { projects: 0, employees: 0, pending: 0, approved: 0, rejected: 0, notSubmitted: 0 });
      } else {
        setError(response.data.message || 'Failed to fetch PM stats');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch PM stats');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPMStats();
  }, []);

  return { data, loading, error, refetch: fetchPMStats };
};

// Hook for dashboard stats (Admin)
export const useDashboardStats = (range: string = 'current') => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = async (timeRange: string) => {
    try {
      setLoading(true);
      setError(null);
      const response = await timesheetAPI.getDashboardStats(timeRange);
      if (response.data.success) {
        setData(response.data.data);
      } else {
        setError(response.data.message || 'Failed to fetch dashboard stats');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch dashboard stats');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats(range);
  }, [range]);

  const refetch = (newRange: string) => {
    fetchStats(newRange);
  };

  return { data, loading, error, refetch };
};

// Enhanced mutation hooks for actions
export const useTimesheetMutations = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createTimesheet = async (data: CreateTimesheetRequest) => {
    try {
      setLoading(true);
      setError(null);
      const response = await timesheetAPI.createTimesheet(data);
      return response.data;
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || 'Failed to create timesheet';
      setError(errorMsg);
      throw new Error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const updateTimesheet = async (data: UpdateTimesheetRequest & { id?: number }) => {
    try {
      setLoading(true);
      setError(null);
      let response;
        console.log('Updating timesheet with ID:', data.id);
        response = await timesheetAPI.updateTimesheet(data.id, data);
      
      return response.data;
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || 'Failed to update timesheet';
      setError(errorMsg);
      throw new Error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const submitTimesheet = async (id: number) => {
    try {
      setLoading(true);
      setError(null);
      console.log('Submitting timesheet with ID:', id);
      const response = await timesheetAPI.submitTimesheet(id);
      console.log('Submit response:', response.data);
      
      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to submit timesheet');
      }
      
      // Transform the returned timesheet to match frontend camelCase conventions
      const responseData = response.data;
      if (responseData.success && responseData.timesheet) {
        const ts = responseData.timesheet as any;
        responseData.timesheet.rejectionReason = ts.rejection_reason;
        responseData.timesheet.totalHours = ts.total_hours;
        responseData.timesheet.periodStart = ts.period_start;
        responseData.timesheet.periodEnd = ts.period_end;
        responseData.timesheet.submittedAt = ts.submitted_at;
      }

      return responseData;
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || err.message || 'Failed to submit timesheet';
      console.error('Submit timesheet error:', errorMsg);
      setError(errorMsg);
      throw new Error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const approveTimesheet = async (id: number, notes?: string) => {
    try {
      setLoading(true);
      setError(null);
      const response = await timesheetAPI.approveTimesheet(id, notes);
      return response.data;
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || 'Failed to approve timesheet';
      setError(errorMsg);
      throw new Error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const autoApproveTimesheet = async (id: number) => {
    try {
      setLoading(true);
      setError(null);
      const response = await timesheetAPI.autoApproveTimesheet(id);
      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to auto-approve timesheet');
      }
      return response.data;
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || err.message || 'Failed to auto-approve timesheet';
      setError(errorMsg);
      throw new Error(errorMsg);
    } finally {
      setLoading(false);
    }
  };
  const rejectTimesheet = async (id: number, reason: string) => {
    try {
      setLoading(true);
      setError(null);
      const response = await timesheetAPI.rejectTimesheet(id, reason);
      return response.data;
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || 'Failed to reject timesheet';
      setError(errorMsg);
      throw new Error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    error,
    createTimesheet,
    updateTimesheet,
    submitTimesheet,
    approveTimesheet,
    autoApproveTimesheet,
    rejectTimesheet,
  };
};