import { HttpService } from './http';
import { ScheduleItem } from '../types/schedule';
import { API_URL } from '../utils/constants';

export const ScheduleService = {
  getSchedule: async (): Promise<ScheduleItem[]> => {
    try {
      console.log(`[ScheduleService] Fetching from ${API_URL}`);
      const params = new URLSearchParams();
      params.append('action', 'getSchedule');
      const response = await HttpService.get(params);
      const data = await response.json();

      if (data.success) {
        return data.data;
      } else {
        // Handle case where backend returns { error: "..." } instead of { success: false, message: "..." }
        const errorMessage = data.message || data.error || 'Failed to fetch schedule';
        throw new Error(errorMessage);
      }
    } catch (error) {
      console.error("Schedule Fetch Error:", error);
      throw error;
    }
  }
};
