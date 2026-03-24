import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ScheduleService } from '../services/schedule';
import { ScheduleItem } from '../types';
import { useToast } from '../contexts/ToastContext';
import { useCallback } from 'react';
import { QUERY_KEYS, CACHE_CONFIG } from '../utils/constants';

export const useScheduleQuery = () => {
  const queryClient = useQueryClient();
  const { addToast } = useToast();

  const query = useQuery<ScheduleItem[]>({
    queryKey: QUERY_KEYS.SCHEDULE,
    queryFn: () => ScheduleService.getSchedule(),
    staleTime: CACHE_CONFIG.STALE_TIME,
    gcTime: CACHE_CONFIG.GC_TIME,
  });

  const refresh = useCallback(async () => {
      const oldData = query.data;
      const res = await query.refetch();
      if (res.isSuccess) {
          if (res.data === oldData) {
              addToast("Dữ liệu lịch dự kiến đã mới nhất", "info");
          } else {
              addToast("Cập nhật lịch dự kiến thành công", "success");
          }
      } else if (res.isError) {
          addToast("Lỗi kết nối máy chủ khi tải lịch", "error");
      }
  }, [query, addToast]);

  return {
    schedule: query.data || [],
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    error: query.error,
    refresh
  };
};
