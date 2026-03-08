import { ScheduleItem } from '../types';
import { ColumnConfig } from '../types/ui';

const numberFormatter = new Intl.NumberFormat('vi-VN');
const formatNumber = (val: any) => {
    const num = Number(val);
    return !isNaN(num) ? numberFormatter.format(num) : val;
};

const formatDate = (val: any) => {
    if (!val) return '';
    try {
        const date = new Date(val);
        if (isNaN(date.getTime())) return val;
        return new Intl.DateTimeFormat('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(date);
    } catch (e) {
        return val;
    }
};

const getScheduleStatus = (dateStr: string) => {
    if (!dateStr) return { label: '', color: '' };
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const target = new Date(dateStr);
    target.setHours(0, 0, 0, 0);
    
    const diffTime = target.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    // Logic:
    // Quá hạn: Ngày dự kiến < Ngày hiện tại (diffDays < 0)
    // Sắp về: 0 <= diffDays <= 4
    
    if (diffDays < 0) return { label: 'Quá hạn', color: 'text-orange-500 font-bold' };
    if (diffDays >= 0 && diffDays <= 4) return { label: 'Sắp về', color: 'text-brand-purple font-bold' };
    
    return { label: '', color: 'text-gray-300 font-bold' };
};

export const getScheduleRowStyle = (item: ScheduleItem) => {
    // Priority: LVTS prefix -> Red color
    if (item.id && item.id.startsWith('LVTS-')) {
        return 'text-[#DA291C] font-extrabold';
    }

    const status = getScheduleStatus(item.expectedArrivalDate);
    if (status.label === 'Quá hạn') return 'text-orange-500 font-bold';
    if (status.label === 'Sắp về') return 'text-brand-purple font-bold';
    return 'text-gray-300 font-bold';
};

export const SCHEDULE_COLUMNS: ColumnConfig<ScheduleItem>[] = [
    { header: 'ĐƠN HÀNG MUA', accessor: 'purchaseOrder', width: 180 },
    { header: 'LOẠI VẬT TƯ', accessor: 'materialType', width: 170 },
    { header: 'MÃ NCC', accessor: 'supplierCode', width: 150 },
    { header: 'TÊN NHÀ CUNG CẤP', accessor: 'supplierName', width: 300 },
    { header: 'TÊN VẬT TƯ', accessor: 'materialName', width: 500 },
    { header: 'ĐƠN HÀNG/ KHÁCH HÀNG', accessor: 'orderCustomer', width: 200 },
    { header: 'LOẠI KIỆN', accessor: 'packetType', width: 150 },
    { header: 'LOẠI GIẤY', accessor: 'paperType', width: 150 },
    { header: 'NHÀ SẢN XUẤT', accessor: 'manufacturer', width: 200 },
    { header: 'NGÀY MUA', accessor: 'purchaseDate', width: 150, format: formatDate },
    { header: 'ĐỊNH LƯỢNG', accessor: 'gsm', width: 120, isNumeric: true, format: formatNumber },
    { header: 'KHỔ LÔ', accessor: 'rollWidth', width: 120, isNumeric: true, format: formatNumber },
    { header: 'DÀI', accessor: 'length', width: 120, isNumeric: true, format: formatNumber },
    { header: 'RỘNG', accessor: 'width', width: 120, isNumeric: true, format: formatNumber },
    { header: 'SỐ LƯỢNG', accessor: 'quantity', width: 120, isNumeric: true, format: formatNumber },
    { header: 'ĐƠN VỊ', accessor: 'unit', width: 100 },
    { header: 'NGÀY DỰ KIẾN VỀ', accessor: 'expectedArrivalDate', width: 150, format: formatDate },
    { header: 'NGƯỜI NHẬP', accessor: 'importer', width: 120 },
    { 
        header: 'CẬP NHẬT', 
        accessor: 'updatedAt', 
        width: 150, 
        format: (val) => {
            if (!val) return '';
            try {
                return new Date(val).toLocaleString('vi-VN');
            } catch {
                return val;
            }
        }
    },
    { 
        header: 'TRẠNG THÁI', 
        accessor: 'expectedArrivalDate', // Use date to calculate status
        width: 150,
        format: (val) => getScheduleStatus(val).label,
        getCellStyle: (item) => {
             if (item.id && item.id.startsWith('LVTS-')) return 'text-[#DA291C] font-extrabold';
             return getScheduleStatus(item.expectedArrivalDate).color;
        }
    }
];
