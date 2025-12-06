import { useCallback, useEffect, useState } from 'react';
import { meetingAPI, type MeetingQueryParams } from '../../api/meetingApi';
import type { Meeting } from '../types/meeting';

export const useMeetings = (params?: MeetingQueryParams) => {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const paramKey = JSON.stringify(params || {});

  const fetchMeetings = useCallback(async (override?: MeetingQueryParams) => {
    try {
      setLoading(true);
      setError(null);
      const baseParams = params || {};
      const resp = await meetingAPI.list({ ...baseParams, ...(override || {}) });
      if (resp.data?.success === false) {
        setError(resp.data?.message || 'Failed to fetch meetings');
        setMeetings([]);
        return;
      }
      const rows: Meeting[] = resp.data?.meetings || resp.data?.data || [];
      setMeetings(rows);
    } catch (e: any) {
      setError(e?.response?.data?.message || e?.message || 'Failed to fetch meetings');
      setMeetings([]);
    } finally {
      setLoading(false);
    }
  }, [paramKey]); // paramKey keeps deps stable for identical objects

  useEffect(() => {
    fetchMeetings();
  }, [fetchMeetings]);

  return { meetings, loading, error, refetch: fetchMeetings };
};

export default useMeetings;
