
import { InventoryItem, ColumnConfig } from '../types';

const numberFormatter = new Intl.NumberFormat('vi-VN');

const formatNumber = (val: any) => {
    const num = Number(val);
    return !isNaN(num) ? numberFormatter.format(num) : val;
};

// Cấu hình cột cho bảng Tồn Kho Vật Tư
export const MATERIAL_COLUMNS: ColumnConfig<InventoryItem>[] = [
    { 
        header: 'MÃ VẬT TƯ', accessor: 'materialCode', width: 150,
        getCellStyle: () => 'text-blue-400 font-bold group-hover:text-blue-300' 
    },
    { 
        header: 'TÊN VẬT TƯ', accessor: 'sku', width: 250, // Sử dụng SKU làm tên chính hoặc Mapping lại tùy dữ liệu
        getCellStyle: () => 'text-white font-semibold'
    },
    { header: 'LOẠI / NHÓM', accessor: 'paperType', width: 150 },
    { header: 'ĐƠN VỊ TÍNH', accessor: 'packetCode', width: 120 },
    { 
        header: 'SỐ LƯỢNG', accessor: 'quantity', width: 150, isNumeric: true,
        format: formatNumber,
        getCellStyle: () => 'text-green-400 font-bold'
    },
    { 
        header: 'TRỌNG LƯỢNG (KG)', accessor: 'weight', width: 150, isNumeric: true,
        format: formatNumber 
    },
    { header: 'VỊ TRÍ', accessor: 'location', width: 150 },
    { header: 'NHÀ CUNG CẤP', accessor: 'supplier', width: 200 },
    { header: 'GHI CHÚ / MỤC ĐÍCH', accessor: 'purpose', width: 200 },
    { header: 'NGÀY NHẬP', accessor: 'importDate', width: 130, isNumeric: true },
    { header: 'NGƯỜI CẬP NHẬT', accessor: 'importer', width: 150 }
];
