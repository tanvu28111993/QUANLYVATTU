
/* eslint-disable no-restricted-globals */
import { ScheduleItem } from '../types/schedule';

// --- HELPER FUNCTIONS ---
export const removeVietnameseTones = (str: string): string => {
    if (!str) return '';
    return str
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/đ/g, 'd')
        .replace(/Đ/g, 'D');
};

export const parseDateToTimestamp = (val: unknown): number => {
    if (!val || typeof val !== 'string') return -1;
    // Assume DD/MM/YYYY or YYYY-MM-DD
    // The current app seems to use YYYY-MM-DD for ScheduleItem dates (based on ImportScheduleModal)
    // But let's handle both or just standard Date parse
    try {
        const d = new Date(val as string);
        return isNaN(d.getTime()) ? -1 : d.getTime();
    } catch (e) {
        return -1;
    }
};

// --- WORKER CODE ---
export const SCHEDULE_WORKER_CODE = `
/* eslint-disable no-restricted-globals */

// 1. HELPER FUNCTIONS
const removeVietnameseTones = (str) => {
    if (!str) return '';
    return str
        .normalize('NFD')
        .replace(/[\\u0300-\\u036f]/g, '')
        .replace(/đ/g, 'd')
        .replace(/Đ/g, 'D');
};

const parseDateToTimestamp = (val) => {
    if (!val || typeof val !== 'string') return -1;
    try {
        // Try standard parse first (YYYY-MM-DD)
        let d = new Date(val);
        if (!isNaN(d.getTime())) return d.getTime();
        
        // Try DD/MM/YYYY
        const parts = val.trim().split('/');
        if (parts.length === 3) {
             const day = parseInt(parts[0], 10);
             const month = parseInt(parts[1], 10);
             const year = parseInt(parts[2], 10);
             d = new Date(year, month - 1, day);
             return d.getTime();
        }
        return -1;
    } catch (e) {
        return -1;
    }
};

// 2. WORKER STATE
let cachedData = [];
let lastFilteredResult = [];

// Encoder for Transferable Objects
const encoder = new TextEncoder();

// Helper to send data
const postResult = (action, result, extras = {}) => {
    try {
        const jsonString = JSON.stringify(result);
        const encoded = encoder.encode(jsonString);
        self.postMessage(
            { action, resultBuffer: encoded.buffer, ...extras }, 
            [encoded.buffer]
        );
    } catch (err) {
        console.error("Worker encode error", err);
        self.postMessage({ action, result: [], error: err.message });
    }
};

// 3. EXPORT LOGIC
const numberFormatter = new Intl.NumberFormat('vi-VN');

const generateCSV = (data, columns) => {
    const BOM = "\\uFEFF";
    const headers = columns.map(c => c.header).join(';');
    
    const rows = data.map(item => {
        return columns.map(col => {
            let val = item[col.accessor];

            if (col.isNumeric && val !== null && val !== undefined && val !== '') {
                 const num = Number(val);
                 if (!isNaN(num)) {
                     val = numberFormatter.format(num);
                 }
            }

            if (typeof val === 'string') {
                val = val.replace(/;/g, ','); 
                val = val.replace(/[\\n\\r]+/g, ' ');
            }

            return val !== null && val !== undefined ? val : '';
        }).join(';');
    }).join('\\n');

    return BOM + headers + "\\n" + rows;
};

// 4. MESSAGE HANDLER
self.onmessage = (e) => {
  const { 
    action,
    data, 
    filterConfig, 
    sortConfig,
    columns,
    fileName
  } = e.data;

  // 1. SET DATA
  if (action === 'SET_DATA') {
    if (data) {
      cachedData = data;
      lastFilteredResult = [...data];
    }
    return;
  }

  // 2. EXPORT CSV
  if (action === 'EXPORT_CSV') {
      try {
          const csvContent = generateCSV(lastFilteredResult, columns);
          const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
          
          self.postMessage({ 
              action: 'EXPORT_RESULT', 
              blob: blob,
              fileName: fileName 
          });
      } catch (err) {
          console.error("Export Error", err);
      }
      return;
  }

  // 3. FILTER & SORT
  if (action === 'FILTER_SORT' || !action) {
      const dataToProcess = data || cachedData;

      if (!dataToProcess || dataToProcess.length === 0) {
        lastFilteredResult = [];
        self.postMessage({ action: 'FILTER_RESULT', result: [], totalQuantity: 0 });
        return;
      }

      const { searchTerm, searchColumn } = filterConfig || {};

      // Filter
      const filtered = dataToProcess.filter((item) => {
        if (!searchTerm) return true;

        const normalize = (str) => removeVietnameseTones(String(str).toLowerCase().trim());
        const cleanSearchTerm = normalize(searchTerm);
        const searchTerms = cleanSearchTerm.split(';').map((t) => t.trim()).filter((t) => t !== '');
        
        if (searchTerms.length === 0) return true;

        if (searchColumn === 'all') {
          return searchTerms.every((term) => 
            Object.entries(item).some(([key, val]) => {
              const normalizedVal = normalize(val);
              if (normalizedVal.includes(term)) return true;
              
              // Check formatted date for date columns (YYYY-MM-DD -> DD/MM/YYYY)
              if (['purchaseDate', 'expectedArrivalDate'].includes(key) && val) {
                  try {
                      const d = new Date(val);
                      if (!isNaN(d.getTime())) {
                          const day = String(d.getDate()).padStart(2, '0');
                          const month = String(d.getMonth() + 1).padStart(2, '0');
                          const year = d.getFullYear();
                          const formatted = day + '/' + month + '/' + year;
                          if (formatted.includes(term)) return true;
                      }
                  } catch (e) {}
              }
              return false;
            })
          );
        } else {
          let value = normalize(item[searchColumn]);
          
          // Special handling for date columns in specific column search
          if (['purchaseDate', 'expectedArrivalDate'].includes(searchColumn) && item[searchColumn]) {
              try {
                  const d = new Date(item[searchColumn]);
                  if (!isNaN(d.getTime())) {
                      const day = String(d.getDate()).padStart(2, '0');
                      const month = String(d.getMonth() + 1).padStart(2, '0');
                      const year = d.getFullYear();
                      value = day + '/' + month + '/' + year;
                  }
              } catch (e) {}
          }
          
          return searchTerms.every((term) => value.includes(term));
        }
      });

      // Sort
      let sorted = filtered;
      if (sortConfig && sortConfig.key) {
           const key = sortConfig.key;
           const dir = sortConfig.direction === 'asc' ? 1 : -1;

           if (['purchaseDate', 'expectedArrivalDate'].includes(key)) {
                const mapped = filtered.map((item, i) => ({ 
                    index: i, 
                    value: parseDateToTimestamp(item[key]) 
                }));
                mapped.sort((a, b) => (a.value - b.value) * dir);
                sorted = mapped.map(el => filtered[el.index]);
           } else {
               sorted = [...filtered].sort((a, b) => {
                    const aVal = a[key];
                    const bVal = b[key];
                    if (aVal === bVal) return 0;
                    if (aVal === null || aVal === undefined) return 1;
                    if (bVal === null || bVal === undefined) return -1;

                    const numA = Number(aVal);
                    const numB = Number(bVal);
                    if (!isNaN(numA) && !isNaN(numB) && String(aVal).trim() !== '' && String(bVal).trim() !== '') {
                        return (numA - numB) * dir;
                    }
                    const strA = String(aVal).toLowerCase();
                    const strB = String(bVal).toLowerCase();
                    return strA.localeCompare(strB, 'vi', { numeric: true }) * dir;
               });
           }
      }

      lastFilteredResult = sorted;

      // Calculate Total Quantity (Tons)
      // Assuming quantity is in KG
      const totalQuantity = sorted.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0) / 1000;
      
      postResult('FILTER_RESULT', sorted, { totalQuantity });
  }
};
`;
