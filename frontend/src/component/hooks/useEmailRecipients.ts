import { useState, useEffect, useMemo } from 'react';
import apiClient from '../../api/apiClient';

interface Recipient {
  id: number;
  name: string;
  email: string;
  role: string;
}

export const useEmailRecipients = () => {
  const [users, setUsers] = useState<Recipient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await apiClient.get('/auth/users'); // This endpoint returns all users for an admin
        setUsers(response.data.data || []);
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to fetch users.');
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  const projectManagers = useMemo(() => {
    return users.filter(user => user.role === 'project_manager');
  }, [users]);

  const employees = useMemo(() => {
    return users.filter(user => user.role === 'employee');
  }, [users]);

  return { projectManagers, employees, loading, error };
};