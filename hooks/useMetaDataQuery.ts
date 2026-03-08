
import { useQuery } from '@tanstack/react-query';
import { InventoryService } from '../services/inventory';

export interface MetaData {
  loaiNhap: string[][]; // [Label, Code]
  kienGiay: string[][]; // [Label, Code]
  loaiGiay: string[][]; // [Label, Code]
  loaiVt: string[][];   // [Label, Code]
  ncc: string[][];      // [Label]
  nsx: string[][];      // [Label]
}

export const useMetaDataQuery = () => {
  return useQuery<MetaData>({
    queryKey: ['metadata'],
    queryFn: () => InventoryService.fetchMetaData(),
    // Dữ liệu danh mục (NCC, NSX...) coi là tĩnh trong suốt phiên làm việc
    // Chỉ cập nhật khi đăng nhập lại (được kích hoạt ở LoginScreen)
    staleTime: 1000 * 60 * 60, // 1 hour (Data is considered fresh for 1 hour)
    gcTime: 1000 * 60 * 60 * 24, // 24 hours (Keep in cache for 24 hours)
    refetchOnMount: false, // Don't refetch on mount if data is fresh
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });
};
