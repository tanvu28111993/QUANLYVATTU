import React, { useEffect } from 'react';
import { ExpectedScheduleTable } from './ExpectedScheduleTable';
import { ExpectedScheduleToolbar } from './ExpectedScheduleToolbar';
import { SCHEDULE_COLUMNS } from '../../../utils/scheduleColumnConfig';
import { useScheduleFilter } from '../../../hooks/useScheduleFilter';
import { useScheduleQuery } from '../../../hooks/useScheduleQuery';
import { GLOBAL_EVENTS } from '../../../utils/constants';
import { useToast } from '../../../contexts/ToastContext';

export const ExpectedSchedule: React.FC = () => {
  const { schedule, isLoading, isFetching, refresh } = useScheduleQuery();
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
  } = useScheduleFilter(schedule);

  // --- LISTEN FOR GLOBAL SHORTCUTS ---
  useEffect(() => {
    const handleGlobalSync = () => {
       addToast("Đang đồng bộ dữ liệu lịch...", "info");
       refresh();
    };

    window.addEventListener(GLOBAL_EVENTS.TRIGGER_SYNC, handleGlobalSync);

    return () => {
        window.removeEventListener(GLOBAL_EVENTS.TRIGGER_SYNC, handleGlobalSync);
    };
  }, [refresh, addToast]);

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
            isSyncing={isFetching} 
            filterState={filters}
            onUpdateFilter={updateFilter}
            onRefresh={refresh}
            onExportCSV={handleExportCSV}
            columns={SCHEDULE_COLUMNS}
          />

          <ExpectedScheduleTable 
            data={displayData}
            columns={SCHEDULE_COLUMNS}
            isLoading={isLoading}
            isSyncing={isFetching || isFiltering}
            sortConfig={sortConfig}
            onSort={handleSort}
            searchColumn={filters.searchColumn !== 'all' ? filters.searchColumn : undefined}
          />
      </div>
    </div>
  );
};
