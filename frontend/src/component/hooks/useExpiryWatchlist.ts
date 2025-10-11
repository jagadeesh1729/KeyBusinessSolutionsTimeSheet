import { useState, useEffect, useMemo } from 'react';
import apiClient from '../../api/apiClient';

interface ExpiryUser {
  id: number;
  name: string;
  role: string;
  end_date: string | null;
  monthsFromNow?: number;
}

export const useExpiryWatchlist = () => {
  const [users, setUsers] = useState<ExpiryUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await apiClient.get('/auth/users');
        setUsers(response.data.data || []);
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to fetch user data.');
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  const expiringUsers = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return users
      .filter(user => user.role === 'employee' && user.end_date)
      .map(user => {
        const expiryDate = new Date(user.end_date!);
        const monthsDiff = (expiryDate.getFullYear() - today.getFullYear()) * 12 + 
                          (expiryDate.getMonth() - today.getMonth());
        return { ...user, monthsFromNow: monthsDiff };
      })
      .sort((a, b) => a.monthsFromNow! - b.monthsFromNow!);
  }, [users]);

  return { expiringUsers, loading, error };
};