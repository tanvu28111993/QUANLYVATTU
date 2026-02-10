
import { Tag, Box, FileText, Truck, Factory } from 'lucide-react';

export type CategoryKey = 'loaiNhap' | 'kienGiay' | 'loaiGiay' | 'ncc' | 'nsx';

export interface CategoryConfig {
    key: CategoryKey;
    label: string;
    icon: any;
    fields: {
        key: 'value' | 'code' | 'extra';
        label: string;
        placeholder: string;
        width?: string;
        readOnly?: boolean; 
    }[];
}

export const CATEGORIES: CategoryConfig[] = [
    { 
        key: 'loaiNhap', label: 'Mục Đích Nhập', icon: Tag,
        fields: [
            { key: 'value', label: 'Tên Mục Đích', placeholder: 'Ví dụ: SẢN XUẤT...', width: '40%' },
            { key: 'code', label: 'Mã Viết Tắt', placeholder: 'SX', width: '20%', readOnly: true }
        ]
    },
    { 
        key: 'kienGiay', label: 'Kiện Giấy', icon: Box,
        fields: [
            { key: 'value', label: 'Tên Kiện', placeholder: 'Ví dụ: PALLET GỖ...', width: '40%' },
            { key: 'code', label: 'Mã Kiện', placeholder: 'PG', width: '20%', readOnly: true }
        ]
    },
    { 
        key: 'loaiGiay', label: 'Loại Giấy', icon: FileText,
        fields: [
            { key: 'value', label: 'Tên Loại Giấy', placeholder: 'Ví dụ: KRAFT...', width: '40%' },
            { key: 'code', label: 'Mã Loại', placeholder: 'K', width: '20%', readOnly: true }
        ]
    },
    { 
        key: 'ncc', label: 'Nhà Cung Cấp', icon: Truck,
        fields: [
            { key: 'value', label: 'Mã NCC', placeholder: 'Mã (VD: NCC01)...', width: '15%' },
            { key: 'code', label: 'Tên Nhà Cung Cấp', placeholder: 'Tên đầy đủ...', width: '40%' },
            { key: 'extra', label: 'Tên Ngắn', placeholder: 'Tên viết tắt...', width: '20%', readOnly: true }
        ]
    },
    { 
        key: 'nsx', label: 'Nhà Sản Xuất', icon: Factory,
        fields: [
            { key: 'value', label: 'Tên Nhà Sản Xuất', placeholder: 'Nhập tên...', width: '80%', readOnly: true }
        ]
    },
];
