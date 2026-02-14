
import { InventoryItem, WorkerAction, WorkerResponse } from '../types';
import { WORKER_CODE } from '../workers/inventory.worker';

// Cache Blob URL to prevent memory leaks
let workerBlobUrl: string | null = null;

export const createWorker = (): Worker => {
  try {
    if (!workerBlobUrl) {
        const blob = new Blob([WORKER_CODE], { type: 'application/javascript' });
        workerBlobUrl = URL.createObjectURL(blob);
    }
    return new Worker(workerBlobUrl);
  } catch (e) {
    console.error("Critical: Failed to create worker instance", e);
    throw e;
  }
};

let sharedWorker: Worker | null = null;

const getSharedWorker = (): Worker => {
  if (!sharedWorker) {
    sharedWorker = createWorker();
  }
  return sharedWorker;
};

const decoder = new TextDecoder();

const decodeWorkerResponse = (data: WorkerResponse) => {
  if ('resultBuffer' in data && data.resultBuffer) {
    try {
      const jsonString = decoder.decode(data.resultBuffer);
      return JSON.parse(jsonString);
    } catch (e) {
      console.error("Worker decode failure", e);
      return [];
    }
  }
  
  // Fix: Safe access to 'result' property on WorkerResponse union type.
  // We check for property existence to satisfy the TypeScript compiler for union types.
  if ('result' in data) {
    return (data as any).result || [];
  }
  
  return [];
};

export const WorkerService = {
  createWorker,

  transformData: (rawData: any[][]): Promise<InventoryItem[]> => {
    return new Promise((resolve, reject) => {
      const worker = getSharedWorker();
      const handleMessage = (e: MessageEvent<WorkerResponse>) => {
        if (e.data.action === 'TRANSFORM_RESULT') {
          if (e.data.error) reject(new Error(e.data.error));
          else resolve(decodeWorkerResponse(e.data));
          worker.removeEventListener('message', handleMessage); 
        }
      };
      worker.addEventListener('message', handleMessage);
      worker.postMessage({ action: 'TRANSFORM', rawData });
    });
  },

  mergeData: (currentData: InventoryItem[], newItems: InventoryItem[]): Promise<InventoryItem[]> => {
    return new Promise((resolve, reject) => {
      const worker = getSharedWorker();
      const handleMessage = (e: MessageEvent<WorkerResponse>) => {
        if (e.data.action === 'MERGE_RESULT') {
          if (e.data.error) reject(new Error(e.data.error));
          else resolve(decodeWorkerResponse(e.data));
          worker.removeEventListener('message', handleMessage);
        }
      };
      worker.addEventListener('message', handleMessage);
      worker.postMessage({ action: 'MERGE_DATA', currentData, newItems });
    });
  }
};
