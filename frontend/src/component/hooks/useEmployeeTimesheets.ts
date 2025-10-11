import { useState, useEffect, useCallback } from 'react';
import apiClient from '../../api/apiClient';
import { useAuth } from '../../context/AuthContext';
import type { Timesheet } from '../types/Holiday';

export const useEmployeeTimesheets = () => {
  const { user } = useAuth();
  const [timesheets, setTimesheets] = useState<Timesheet[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTimesheets = useCallback(async () => {
    if (!user?.userId) return;

    try {
      setLoading(true);
      setError(null);
      // Assuming an endpoint exists to get timesheets by user ID
      const response = await apiClient.get(`/timesheets/user/${user.userId}`);
      setTimesheets(response.data.data || []);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch timesheets.');
    } finally {
      setLoading(false);
    }
  }, [user?.userId]);

  useEffect(() => {
    fetchTimesheets();
  }, [fetchTimesheets]);

  return {
    timesheets,
    loading,
    error,
  };
};