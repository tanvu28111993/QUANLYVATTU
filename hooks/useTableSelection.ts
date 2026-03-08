
import { useState, useCallback } from 'react';

/**
 * Hook quản lý logic chọn dòng trong bảng (Selection)
 * @param data Danh sách dữ liệu hiện tại đang hiển thị
 * @param getKey Hàm để lấy unique key (ID/SKU) từ item
 */
export const useTableSelection = <T>(data: T[], getKey: (item: T) => string) => {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Chọn/Bỏ chọn một dòng
  const handleSelectId = useCallback((id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  // Chọn tất cả/Bỏ chọn tất cả
  const handleSelectAll = useCallback((isSelected: boolean) => {
    if (isSelected) {
      const allIds = data.map(getKey);
      setSelectedIds(new Set(allIds));
    } else {
      setSelectedIds(new Set());
    }
  }, [data, getKey]);

  // Reset selection
  const clearSelection = useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  return {
    selectedIds,
    handleSelectId,
    handleSelectAll,
    clearSelection
  };
};
