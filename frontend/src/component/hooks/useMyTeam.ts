import { useState, useEffect, useCallback } from 'react';
import apiClient from '../../api/apiClient';
import { useAuth } from '../../context/AuthContext';

interface TeamMember {
  id: number;
  name: string;
  email: string;
  phone: string;
  location: string;
}

export const useMyTeam = () => {
  const { user } = useAuth();
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await apiClient.get(`/users/pm-employees/${user.id}`);
      setTeam(response.data.data || []);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch your team members.');
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    team,
    loading,
    error,
  };
};