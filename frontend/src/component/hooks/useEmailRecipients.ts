import { useState, useEffect } from 'react';
import apiClient from '../../api/apiClient';

interface Recipient {
  id: number;
  name: string;
  email: string;
  role: string;
}

export const useEmailRecipients = () => {
  const [projectManagers, setProjectManagers] = useState<Recipient[]>([]);
  const [employees, setEmployees] = useState<Recipient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        setError(null);
        const [pmResponse, usersResponse] = await Promise.all([
          apiClient.get('/users/pms'),      // Dedicated PM list
          apiClient.get('/auth/users'),     // Full user list (admin/PM scoped)
        ]);

        // Normalize project managers
        const pmData = Array.isArray(pmResponse.data?.users) ? pmResponse.data.users : [];
        const normalizedPMs: Recipient[] = pmData
          .filter((pm: any) => pm?.email)
          .map((pm: any) => ({
            id: pm.id,
            name: (pm.name || `${pm.first_name ?? ''} ${pm.last_name ?? ''}`).trim() || pm.email,
            email: pm.email,
            role: 'project_manager',
          }));

        // Normalize employees from the full user list
        const allUsers = Array.isArray(usersResponse.data?.data) ? usersResponse.data.data : [];
        const normalizedEmployees: Recipient[] = allUsers
          .filter((user: any) => user?.role === 'employee' && user?.email)
          .map((user: any) => ({
            id: user.id,
            name: (user.name || `${user.first_name ?? ''} ${user.last_name ?? ''}`).trim() || user.email,
            email: user.email,
            role: 'employee',
          }));

        setProjectManagers(normalizedPMs);
        setEmployees(normalizedEmployees);
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to fetch users.');
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  return { projectManagers, employees, loading, error };
};
