import { useState, useEffect } from 'react';
import apiClient from '../../api/apiClient';

export type RecurringFrequency = 'daily' | 'weekly' | 'bi-weekly' | 'bi-monthly' | 'monthly' | 'quarterly';

export interface ExpiringEmployee {
  id: number;
  user_id: number;
  first_name: string;
  last_name: string;
  email: string;
  end_date: string | null;
  days_until_expiry: number;
  months_until_expiry: number;
  status: 'expired' | 'critical' | 'warning' | 'safe';
  is_expiring_soon: number; // 1 if within target_days, 0 otherwise
  // For backward compatibility
  name?: string;
  role?: string;
  monthsFromNow?: number;
}

export interface TrackerSettings {
  id?: number;
  target_days: number;
  recurring: RecurringFrequency;
}

export const useExpiryWatchlist = () => {
  const [expiringUsers, setExpiringUsers] = useState<ExpiringEmployee[]>([]);
  const [trackerSettings, setTrackerSettings] = useState<TrackerSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchExpiringEmployees = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch both tracker settings and expiring employees
      const [trackerResponse, employeesResponse] = await Promise.all([
        apiClient.get('/expiration-tracker'),
        apiClient.get('/expiration-tracker/employees'),
      ]);

      setTrackerSettings(trackerResponse.data.data || null);
      
      // Map the response to include monthsFromNow for backward compatibility
      const employees = (employeesResponse.data.data || []).map((emp: ExpiringEmployee) => ({
        ...emp,
        name: `${emp.first_name} ${emp.last_name}`,
        role: 'employee',
        monthsFromNow: emp.months_until_expiry,
      }));
      
      setExpiringUsers(employees);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch expiry watchlist data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExpiringEmployees();
  }, []);

  return { 
    expiringUsers, 
    trackerSettings,
    loading, 
    error,
    refetch: fetchExpiringEmployees,
  };
};

export const useExpiryWatchlistCount = () => {
  const [counts, setCounts] = useState({
    total: 0,
    expired: 0,
    critical: 0,
    warning: 0,
    safe: 0,
    target_days: 180,
    recurring: 'monthly' as RecurringFrequency,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCounts = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiClient.get('/expiration-tracker/count');
      setCounts(response.data.data || counts);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch expiry counts.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCounts();
  }, []);

  return { counts, loading, error, refetch: fetchCounts };
};

export const useExpirationTrackerSettings = () => {
  const [settings, setSettings] = useState<TrackerSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updating, setUpdating] = useState(false);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiClient.get('/expiration-tracker');
      setSettings(response.data.data || null);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch tracker settings.');
    } finally {
      setLoading(false);
    }
  };

  const updateSettings = async (newSettings: Partial<TrackerSettings>) => {
    try {
      setUpdating(true);
      setError(null);
      const response = await apiClient.put('/expiration-tracker', newSettings);
      setSettings(response.data.data || null);
      return { success: true, data: response.data.data };
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to update tracker settings.';
      setError(errorMessage);
      return { success: false, message: errorMessage };
    } finally {
      setUpdating(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  return { settings, loading, error, updating, updateSettings, refetch: fetchSettings };
};
