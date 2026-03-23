
// Cấu hình API
const FALLBACK_URL = 'https://script.google.com/macros/s/AKfycbxiLWlQ4OTARFOSLoL1c2GDBu4auzs5aNuVw-6-VtuqV7PFyf4eRzmtjqiD60PC7Jmz/exec';

let envUrl: string | undefined;
try {
  // Vite replaces this during build
  // Cast import.meta to any to bypass missing type definitions for ImportMeta.env in the execution environment
  envUrl = (import.meta as any).env?.VITE_API_URL;
} catch (e) {
  envUrl = undefined;
}

export const API_URL = (typeof envUrl === 'string' && envUrl.startsWith('http')) 
  ? envUrl 
  : FALLBACK_URL;

// Log to console so developer can see which URL is being hit in Production
if (typeof window !== 'undefined') {
  console.log(`[System] Connected to API: ${API_URL.split('/s/')[0]}...`);
}

// Cấu hình UI
export const FULL_WIDTH_MENUS = [
    'INVENTORY', 
    'REFERENCE',
    'MATERIAL_INVENTORY',
    'PAPER_CALCULATION',
    'USER_MANAGEMENT'
];

export const NO_PADDING_MENUS = [
    'OVERVIEW',
    'EXPECTED_SCHEDULE'
];

export const KEEP_ALIVE_MENUS = [
    'OVERVIEW'
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
  METADATA: ['metadata'],
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