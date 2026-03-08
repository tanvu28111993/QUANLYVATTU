import { InventoryItem } from '../types';
import { HttpService } from './http';
import { WorkerService } from './worker';

export const InventoryService = {
  /**
   * Fetch Inventory Data from Server
   * Supports Delta Sync if lastUpdated timestamp is provided.
   */
  fetchInventory: async (lastUpdated: number = 0): Promise<{ items: InventoryItem[], serverTimestamp: number } | null> => {
    try {
      console.log(`[Service] Fetching inventory changes since: ${new Date(lastUpdated).toLocaleString()}`);

      const params = new URLSearchParams();
      params.append('action', 'getInventory');
      params.append('lastUpdated', lastUpdated.toString());
      
      const response = await HttpService.get(params);
      const data = await response.json();

      if (data.error) throw new Error(data.error);

      // Nếu không có dữ liệu mới (data.data rỗng hoặc null)
      if (!data.data || data.data.length === 0) {
        return null; 
      }

      console.log(`[Service] Received ${data.data.length} updated rows. Processing via Worker...`);

      // Transform dữ liệu thô sang Object (sử dụng Worker)
      const newItems = await WorkerService.transformData(data.data);

      return {
          items: newItems,
          serverTimestamp: data.serverTimestamp || Date.now()
      };

    } catch (error) {
      console.error("Inventory Fetch Error:", error);
      throw error; 
    }
  },

  /**
   * Fetch Meta Data (Danh mục) from Server
   */
  fetchMetaData: async () => {
    try {
      const params = new URLSearchParams();
      params.append('action', 'getMetaData');
      const response = await HttpService.get(params);
      const data = await response.json();

      if (data.success) {
        return data.data;
      } else {
        throw new Error(data.message || 'Failed to fetch metadata');
      }
    } catch (error) {
      console.error("MetaData Fetch Error:", error);
      throw error;
    }
  },

  /**
   * Update Meta Data (Danh mục) on Server
   */
  updateMetaData: async (category: string, operation: string, value: string, code?: string, extra?: string, oldValue?: string) => {
    // Read-only mode optimization
    console.log(`[InventoryService] Read-only mode: Skipping metadata update for ${value}`);
    return { success: true, message: "Read-only mode: Update simulated" };
  },
};