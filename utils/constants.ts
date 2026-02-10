
// Cấu hình API
// Ưu tiên sử dụng biến môi trường, fallback về hardcoded URL cho development nhanh
const ENV_URL = (import.meta as any).env?.VITE_API_URL;

export const API_URL = (typeof ENV_URL === 'string' && ENV_URL.startsWith('http')) 
  ? ENV_URL 
  : 'https://script.google.com/macros/s/AKfycbzksG9x1T4cweYZyr7lYwKG7x0T2SoFHdvWVaCsweXWF1uYZ1g7hzGXNYm3RAHZkfLD/exec';

// Cấu hình UI
// Thêm REFERENCE để trang Bảng Tra hiển thị full width
export const FULL_WIDTH_MENUS = [
    'INVENTORY', 
    'REFERENCE',
    'MATERIAL_INVENTORY',
    'MATERIAL_LOCATIONS',
    'PAPER_CALCULATION'
];

export const UI_CONFIG = {
  TABLE_ROW_HEIGHT: 36,
  SIDEBAR_WIDTH_COLLAPSED: 80, // w-20 equivalent
  SIDEBAR_WIDTH_EXPANDED: 256, // w-64 equivalent
};

// Cấu hình Sự kiện Toàn cục (Global Shortcuts)
export const GLOBAL_EVENTS = {
  FOCUS_SEARCH: 'GLOBAL_FOCUS_SEARCH',
  TRIGGER_PRINT: 'GLOBAL_TRIGGER_PRINT',
  TRIGGER_SYNC: 'GLOBAL_TRIGGER_SYNC'
};

// Cấu hình React Query Keys
export const QUERY_KEYS = {
  INVENTORY: ['inventory'],
};

// Cấu hình IndexedDB
export const DB_CONFIG = {
  NAME: 'KhoGiayDB',
  VERSION: 3,
  STORES: {
    INVENTORY: 'inventoryStore',
    HISTORY: 'historyStore',
    QUEUE: 'commandQueueStore',
  }
};

// Cấu hình Background Sync
export const SYNC_CONFIG = {
  TAG: 'sync-queue',
  BROADCAST_CHANNEL: 'command_sync_channel',
  QUEUE_STORAGE_KEY: 'pendingCommands',
};

// Cấu hình Cache
export const CACHE_CONFIG = {
  STALE_TIME: 1000 * 60 * 5, // 5 phút
  GC_TIME: 1000 * 60 * 60 * 24, // 24 giờ
};