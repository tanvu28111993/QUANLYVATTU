import React, { useState, useMemo } from 'react';
import { ScheduleItem } from '../../../types';
import { ColumnConfig } from '../../../types/ui';
import { useVirtualScroll } from '../../../hooks/useVirtualScroll';
import { useColumnResize } from '../../../hooks/useColumnResize';
import { ExpectedScheduleRow } from './ExpectedScheduleRow';
import { ExpectedScheduleTableHeader } from './ExpectedScheduleTableHeader';
import { UI_CONFIG } from '../../../utils/constants';
import { TableSkeleton } from '../Inventory/TableSkeleton';

interface ExpectedScheduleTableProps {
  data: ScheduleItem[];
  columns: ColumnConfig<ScheduleItem>[];
  isLoading: boolean;
  isSyncing: boolean;
  sortConfig: { key: keyof ScheduleItem | null; direction: 'asc' | 'desc' };
  onSort: (key: keyof ScheduleItem) => void;
  searchColumn?: string;
}

export const ExpectedScheduleTable: React.FC<ExpectedScheduleTableProps> = ({
  data,
  columns,
  isLoading,
  isSyncing,
  sortConfig,
  onSort,
  searchColumn,
}) => {
  const ROW_HEIGHT = UI_CONFIG.TABLE_ROW_HEIGHT; 
  
  // Virtual Scroll
  const { 
    containerRef, 
    handleScroll, 
    startIndex, 
    endIndex, 
    paddingTop, 
    paddingBottom 
  } = useVirtualScroll(data.length, ROW_HEIGHT);

  // Column Resize
  const initialWidths = useState(() => {
    const widths: Record<string, number> = {};
    columns.forEach(col => widths[col.accessor as string] = col.width || 100);
    return widths;
  })[0];
  
  const { colWidths, handleMouseDown } = useColumnResize(initialWidths);

  const totalTableWidth = useMemo(() => {
      return columns.reduce((acc, col) => acc + (colWidths[col.accessor as string] || 100), 0);
  }, [columns, colWidths]);

  const visibleRows = data.slice(startIndex, endIndex);
  const showSkeleton = isLoading && data.length === 0;
  const showBackgroundUpdate = (isLoading || isSyncing) && data.length > 0;

  return (
    <div className="flex-1 w-full flex flex-col relative bg-slate-900 border border-gray-800 rounded-xl shadow-xl overflow-hidden">
        {showBackgroundUpdate && (
          <div className="absolute top-0 left-0 w-full h-1 bg-blue-900/30 z-50">
              <div className="h-full bg-blue-500 animate-progress-indeterminate shadow-[0_0_10px_rgba(59,130,246,0.5)]"></div>
          </div>
        )}

        {showSkeleton ? (
          <TableSkeleton />
        ) : (
          <div className="relative w-full h-full flex flex-col flex-1 min-h-0">
            <div 
                ref={containerRef}
                onScroll={handleScroll}
                className={`overflow-auto flex-1 custom-scrollbar relative will-change-scroll ${showBackgroundUpdate ? 'opacity-70 transition-opacity duration-200' : 'opacity-100'}`}
            >
                <table 
                  className="text-left border-collapse" 
                  style={{ tableLayout: 'fixed', width: totalTableWidth }}
                >
                  <ExpectedScheduleTableHeader 
                    columns={columns}
                    colWidths={colWidths}
                    sortConfig={sortConfig}
                    onSort={onSort}
                    onResizeMouseDown={handleMouseDown}
                  />
                  
                  <tbody className="divide-y divide-gray-800/50">
                      {paddingTop > 0 && <tr><td colSpan={columns.length} style={{ height: paddingTop }} /></tr>}
  
                      {visibleRows.length > 0 ? (
                      visibleRows.map((item, index) => {
                          const actualIndex = startIndex + index;
                          return (
                            <ExpectedScheduleRow 
                              key={item.id}
                              item={item}
                              index={actualIndex}
                              columns={columns}
                              colWidths={colWidths}
                              rowHeight={ROW_HEIGHT}
                              searchColumn={searchColumn}
                            />
                          );
                      })
                      ) : (
                      <tr>
                          <td colSpan={columns.length} className="px-6 py-12 text-center text-gray-500">
                          Không có dữ liệu.
                          </td>
                      </tr>
                      )}
  
                      {paddingBottom > 0 && <tr><td colSpan={columns.length} style={{ height: paddingBottom }} /></tr>}
                  </tbody>
                </table>
            </div>
          </div>
        )}
    </div>
  );
};
