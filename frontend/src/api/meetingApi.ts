import apiClient from './apiClient';

export interface MeetingQueryParams {
  limit?: number;
  upcomingOnly?: boolean;
}

export const meetingAPI = {
  list: (params: MeetingQueryParams = {}) => {
    const query = new URLSearchParams();
    if (params.limit) query.set('limit', String(params.limit));
    if (params.upcomingOnly) query.set('upcoming', 'true');
    const qs = query.toString();
    return apiClient.get(`/meet${qs ? `?${qs}` : ''}`);
  },
};

export default meetingAPI;
