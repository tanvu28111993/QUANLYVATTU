import React from 'react';
import { ScheduleItem } from '../../../types';
import { ColumnConfig } from '../../../types/ui';
import { getScheduleRowStyle } from '../../../utils/scheduleColumnConfig';

interface ExpectedScheduleRowProps {
    item: ScheduleItem;
    index: number;
    columns: ColumnConfig<ScheduleItem>[];
    colWidths: Record<string, number>;
    rowHeight: number;
    isActive?: boolean;
    searchColumn?: string;
}

export const ExpectedScheduleRow = React.memo(({ 
    item, index, columns, colWidths, rowHeight, isActive = false, searchColumn
}: ExpectedScheduleRowProps) => {
    
    const rowStyle = getScheduleRowStyle(item);

    return (
        <tr 
            style={{ 
                height: rowHeight,
                contentVisibility: 'auto', 
                containIntrinsicSize: `${rowHeight}px` 
            }}
            className={`
                transition-all duration-75 group border-l-4 cursor-pointer border-transparent hover:bg-blue-600/20 hover:border-l-blue-500
                ${index % 2 === 0 ? '' : 'bg-slate-800/30'}
                ${isActive ? 'bg-blue-600/30 border-l-blue-400 ring-1 ring-inset ring-blue-500/50 z-10 relative' : ''}
            `}
        >
            {columns.map((col, colIndex) => {
                const accessor = col.accessor as string;
                // @ts-ignore
                const value = item[accessor];
                
                let displayValue = value !== null && value !== undefined ? String(value) : "";
                if (col.format) {
                    displayValue = String(col.format(value));
                }

                // Determine cell style: Column specific > Row default
                let cellClass = rowStyle;
                if (col.getCellStyle) {
                    // @ts-ignore - ScheduleItem matches the generic T in ColumnConfig but TS might need help
                    cellClass = col.getCellStyle(item, false, false); 
                }

                // Highlight if this is the search column
                const isHighlighted = searchColumn === accessor;

                return (
                    <td 
                        key={colIndex} 
                        style={{ width: colWidths[accessor], minWidth: colWidths[accessor] }}
                        className={`
                            px-4 py-0 text-sm whitespace-nowrap border-r border-gray-800 group-hover:border-gray-700 overflow-hidden font-bold
                            ${cellClass}
                            ${col.isNumeric ? 'text-right' : 'text-left'}
                            ${isHighlighted ? 'bg-yellow-500/20 text-yellow-200' : ''}
                        `}
                    >
                        <div className="flex items-center h-full w-full">
                            <span className={`w-full truncate ${col.isNumeric ? 'text-right' : 'text-left'}`}>
                                {displayValue}
                            </span>
                        </div>
                    </td>
                );
            })}
        </tr>
    );
});
