import { useState, useEffect } from 'react';
import apiClient from '../../api/apiClient';

interface ExpiryCountData {
  total: number;
  expired: number;
  critical: number;
  warning: number;
  safe: number;
  target_days: number;
}

export const useExpiryWatchlistCount = () => {
  const [expiryCount, setExpiryCount] = useState(0);
  const [countDetails, setCountDetails] = useState<ExpiryCountData | null>(null);

  useEffect(() => {
    const fetchCount = async () => {
      try {
        const response = await apiClient.get('/expiration-tracker/count');
        const data = response.data.data;
        
        if (data) {
          // Total count of employees needing attention (expired + critical + warning)
          const attentionCount = (data.expired || 0) + (data.critical || 0) + (data.warning || 0);
          setExpiryCount(attentionCount);
          setCountDetails(data);
        }
      } catch (error) {
        console.error('Failed to fetch expiry watchlist count:', error);
        // Fallback to old method if new API fails
        try {
          const response = await apiClient.get('/auth/users');
          const users = response.data.data || [];
          
          const today = new Date();
          today.setHours(0, 0, 0, 0);

          const expiringCount = users.filter((user: any) => {
            if (user.role !== 'employee' || !user.end_date) return false;
            
            const expiryDate = new Date(user.end_date);
            const monthsDiff = (expiryDate.getFullYear() - today.getFullYear()) * 12 + 
                              (expiryDate.getMonth() - today.getMonth());
            
            return monthsDiff <= 3;
          }).length;

          setExpiryCount(expiringCount);
        } catch (fallbackError) {
          console.error('Fallback fetch also failed:', fallbackError);
        }
      }
    };

    fetchCount();
  }, []);

  return expiryCount;
};
