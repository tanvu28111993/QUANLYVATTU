import { useState, useEffect, useRef, useTransition, useCallback } from 'react';
import { ScheduleItem } from '../types';
import { ColumnConfig } from '../types/ui';
import { WorkerService } from '../services/worker';
import { useToast } from '../contexts/ToastContext';

export interface ScheduleFilterState {
  searchTerm: string;
  searchColumn: string;
  showAdvancedFilters: boolean;
}

export const useScheduleFilter = (data: ScheduleItem[], initialState?: Partial<ScheduleFilterState>) => {
  const [displayData, setDisplayData] = useState<ScheduleItem[]>([]);
  const [totalQuantity, setTotalQuantity] = useState(0);
  const [isFiltering, startTransition] = useTransition();
  const { addToast } = useToast();

  const [filters, setFilters] = useState<ScheduleFilterState>({
    searchTerm: initialState?.searchTerm || '',
    searchColumn: initialState?.searchColumn || 'all',
    showAdvancedFilters: initialState?.showAdvancedFilters || false
  });

  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState(filters.searchTerm);
  const [sortConfig, setSortConfig] = useState<{ key: keyof ScheduleItem | null; direction: 'asc' | 'desc' }>({
    key: 'expectedArrivalDate',
    direction: 'asc',
  });

  const workerRef = useRef<Worker | null>(null);
  const decoderRef = useRef<TextDecoder | null>(null);

  // Initialize Worker using Service Factory
  useEffect(() => {
    try {
      workerRef.current = WorkerService.createScheduleWorker();
      decoderRef.current = new TextDecoder();

      workerRef.current.onmessage = (e) => {
        if (e.data.action === 'FILTER_RESULT') {
            startTransition(() => {
              let result = e.data.result;
              
              // Handle Transferable Object (ArrayBuffer)
              if (e.data.resultBuffer && decoderRef.current) {
                  try {
                      const jsonString = decoderRef.current.decode(e.data.resultBuffer);
                      result = JSON.parse(jsonString);
                  } catch (err) {
                      console.error("Filter decode error", err);
                      result = [];
                  }
              }

              setDisplayData(result);
              setTotalQuantity(e.data.totalQuantity);
            });
        } else if (e.data.action === 'EXPORT_RESULT') {
            const { blob, fileName } = e.data;
            if (blob) {
                const url = URL.createObjectURL(blob);
                const link = document.createElement('a');
                
                const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
                link.href = url;
                link.download = `${fileName}_${timestamp}.csv`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                URL.revokeObjectURL(url);
                addToast("Xuất file thành công!", "success");
            }
        }
      };
    } catch (err) {
      console.error("Failed to initialize schedule filter worker:", err);
    }

    return () => {
      workerRef.current?.terminate();
    };
  }, [addToast]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(filters.searchTerm);
    }, 350); 
    return () => clearTimeout(timer);
  }, [filters.searchTerm]);

  useEffect(() => {
    if (workerRef.current && data) {
        workerRef.current.postMessage({
            action: 'SET_DATA',
            data
        });
        workerRef.current.postMessage({
            action: 'FILTER_SORT',
            filterConfig: { 
                searchTerm: debouncedSearchTerm, 
                searchColumn: filters.searchColumn
            },
            sortConfig
        });
    }
  }, [data]);

  useEffect(() => {
    if (workerRef.current) {
        workerRef.current.postMessage({
            action: 'FILTER_SORT', 
            filterConfig: { 
                searchTerm: debouncedSearchTerm, 
                searchColumn: filters.searchColumn
            },
            sortConfig
        });
    }
  }, [debouncedSearchTerm, filters.searchColumn, sortConfig]);

  const handleSort = useCallback((key: keyof ScheduleItem) => {
    let direction: 'asc' | 'desc' = 'asc';
    setSortConfig(prev => {
        if (prev.key === key && prev.direction === 'asc') {
            direction = 'desc';
        }
        return { key, direction };
    });
  }, []);

  const updateFilter = useCallback((key: keyof ScheduleFilterState, value: any) => {
      setFilters(prev => ({ ...prev, [key]: value }));
  }, []);

  const exportAndDownloadCSV = useCallback((columns: ColumnConfig<ScheduleItem>[], fileNamePrefix: string) => {
      if (workerRef.current) {
          const simpleColumns = columns.map(c => ({
              header: c.header,
              accessor: c.accessor,
              isNumeric: c.isNumeric
          }));

          addToast("Đang tạo file CSV...", "info");
          workerRef.current.postMessage({
              action: 'EXPORT_CSV',
              columns: simpleColumns,
              fileName: fileNamePrefix
          });
      }
  }, [addToast]);

  return {
    displayData,
    totalQuantity,
    isFiltering,
    filters,
    sortConfig,
    updateFilter,
    handleSort,
    exportAndDownloadCSV
  };
};
