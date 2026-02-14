
/// <reference types="vite/client" />

// Cấu hình API
// Sử dụng try-catch để an toàn khi truy cập import.meta.env trong trường hợp build lỗi
let envUrl: string | undefined;
try {
  // Biến này sẽ được Vite thay thế bằng chuỗi (nếu define hoạt động)
  // hoặc runtime sẽ đọc từ object import.meta.env
  envUrl = import.meta.env.VITE_API_URL;
} catch {
  envUrl = undefined;
}

const ENV_URL = envUrl;

// Hardcoded fallback - URL này phải luôn là bản Deploy mới nhất của Google Apps Script
const FALLBACK_URL = 'https://script.google.com/macros/s/AKfycbzksG9x1T4cweYZyr7lYwKG7x0T2SoFHdvWVaCsweXWF1uYZ1g7hzGXNYm3RAHZkfLD/exec';

export const API_URL = (typeof ENV_URL === 'string' && ENV_URL.startsWith('http')) 
  ? ENV_URL 
  : FALLBACK_URL;

console.log(`[System] API Endpoint: ${API_URL.substring(0, 40)}...`);

// Cấu hình UI
export const FULL_WIDTH_MENUS = [
    'INVENTORY', 
    'REFERENCE',
    'MATERIAL_INVENTORY',
    'MATERIAL_LOCATIONS',
    'PAPER_CALCULATION'
];

export const UI_CONFIG = {
  TABLE_ROW_HEIGHT: 36,
  SIDEBAR_WIDTH_COLLAPSED: 80, 
  SIDEBAR_WIDTH_EXPANDED: 256, 
};

export const GLOBAL_EVENTS = {
  FOCUS_SEARCH: 'GLOBAL_FOCUS_SEARCH',
  TRIGGER_PRINT: 'GLOBAL_TRIGGER_PRINT',
  TRIGGER_SYNC: 'GLOBAL_TRIGGER_SYNC'
};

export const QUERY_KEYS = {
  INVENTORY: ['inventory'],
};

export const DB_CONFIG = {
  NAME: 'KhoGiayDB',
  VERSION: 3,
  STORES: {
    INVENTORY: 'inventoryStore',
    HISTORY: 'historyStore',
    QUEUE: 'commandQueueStore',
  }
};

export const SYNC_CONFIG = {
  TAG: 'sync-queue',
  BROADCAST_CHANNEL: 'command_sync_channel',
  QUEUE_STORAGE_KEY: 'pendingCommands',
};

export const CACHE_CONFIG = {
  STALE_TIME: 1000 * 60 * 5, 
  GC_TIME: 1000 * 60 * 60 * 24, 
};
