import { useMemo } from 'react';
import { useMetaDataQuery } from './useMetaDataQuery';
import { SearchableOption } from '../components/UI/SearchableSelect';

export const useInventoryFormFields = (mode: 'create' | 'edit') => {
  const { data: metaData, isLoading } = useMetaDataQuery();

  // --- 1. Transform Metadata to Options ---
  const options = useMemo(() => {
    // Generic transform cho bảng 2 cột: [Value, Code]
    const transform = (data: string[][] | undefined, hasCode = false): SearchableOption[] => {
        if (!data) return [];
        return data.map(row => ({
            value: row[0],
            label: row[0],
            code: hasCode ? (row[1] || '') : ''
        }));
    };

    // Special transform cho NCC (3 cột: [Mã, Tên, Tên ngắn])
    // Form nhập liệu cần hiển thị Tên NCC cho người dùng chọn, Mã hiển thị phụ
    const transformNCC = (data: string[][] | undefined): SearchableOption[] => {
        if (!data) return [];
        return data.map(row => ({
            value: row[1], // Sử dụng Tên (Cột 2) làm giá trị chính
            label: row[1], // Hiển thị Tên
            code: row[0]   // Hiển thị Mã (Cột 1) ở góc
        }));
    };

    return {
        purpose: transform(metaData?.loaiNhap, true),
        packet: transform(metaData?.kienGiay, true),
        paper: transform(metaData?.loaiGiay, true),
        supplier: transformNCC(metaData?.ncc), // Use special logic for NCC
        manufacturer: transform(metaData?.nsx, false),
    };
  }, [metaData]);

  return {
    options,
    isLoading
  };
};