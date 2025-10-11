import { useState, useEffect } from 'react';
import apiClient from '../../api/apiClient';

export const useEmployeeReviewCount = () => {
  const [reviewCount, setReviewCount] = useState(0);

  useEffect(() => {
    const fetchCount = async () => {
      try {
        // This endpoint is defined in your authRoutes.ts
        const response = await apiClient.get('/auth/employees-for-review');
        setReviewCount(response.data.count || 0);
      } catch (error) {
        console.error('Failed to fetch employee review count:', error);
      }
    };

    fetchCount();
  }, []);

  return reviewCount;
};