import React, { useState, useEffect } from 'react';
import { ExpectedScheduleTable } from './ExpectedScheduleTable';
import { ExpectedScheduleToolbar, ScheduleFilterState } from './ExpectedScheduleToolbar';
import { SCHEDULE_COLUMNS } from '../../../utils/scheduleColumnConfig';
import { ScheduleItem } from '../../../types';
import { ScheduleService } from '../../../services/schedule';
import { useToast } from '../../../contexts/ToastContext';
import { useScheduleFilter } from '../../../hooks/useScheduleFilter';

export const ExpectedSchedule: React.FC = () => {
  const [data, setData] = useState<ScheduleItem[]>([]);
  const [loading, setLoading] = useState(true);

  const { addToast } = useToast();

  // Use the worker-based filter hook
  const {
    displayData,
    totalQuantity,
    isFiltering,
    filters,
    sortConfig,
    updateFilter,
    handleSort,
    exportAndDownloadCSV
  } = useScheduleFilter(data);

  const fetchData = async () => {
      try {
          setLoading(true);
          const items = await ScheduleService.getSchedule();
          setData(items);
      } catch (error) {
          console.error("Failed to fetch schedule", error);
          addToast("Lỗi tải dữ liệu lịch dự kiến", "error");
      } finally {
          setLoading(false);
      }
  };

  useEffect(() => {
      fetchData();
  }, []);

  const handleExportCSV = () => {
      exportAndDownloadCSV(SCHEDULE_COLUMNS, "Lich_Du_Kien");
  };

  return (
    <div className="w-full h-full flex flex-col bg-slate-950">
      <div className="flex-1 overflow-hidden p-4 flex flex-col gap-4">
          <ExpectedScheduleToolbar 
            totalQuantity={totalQuantity}
            totalRows={displayData.length}
            isPending={isFiltering}
            isSyncing={loading} 
            filterState={filters}
            onUpdateFilter={updateFilter}
            onRefresh={fetchData}
            onExportCSV={handleExportCSV}
            columns={SCHEDULE_COLUMNS}
          />

          <ExpectedScheduleTable 
            data={displayData}
            columns={SCHEDULE_COLUMNS}
            isLoading={loading}
            isSyncing={isFiltering}
            sortConfig={sortConfig}
            onSort={handleSort}
            searchColumn={filters.searchColumn !== 'all' ? filters.searchColumn : undefined}
          />
      </div>
    </div>
  );
};
