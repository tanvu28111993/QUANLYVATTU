
// Cấu hình API
const FALLBACK_URL = 'https://script.google.com/macros/s/AKfycbzksG9x1T4cweYZyr7lYwKG7x0T2SoFHdvWVaCsweXWF1uYZ1g7hzGXNYm3RAHZkfLD/exec';

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