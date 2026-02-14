
import React, { useEffect } from 'react';
import { useInventoryQuery } from '../../../hooks/useInventoryQuery';
import { useUIStore } from '../../../stores/uiStore';
import { InventoryToolbar } from '../Inventory/InventoryToolbar';
import { InventoryTable } from '../Inventory/InventoryTable';
import { useInventoryFilter } from '../../../hooks/useInventoryFilter';
import { MATERIAL_COLUMNS } from '../../../utils/materialColumnConfig';
import { useToast } from '../../../contexts/ToastContext';
import { GLOBAL_EVENTS } from '../../../utils/constants';

export const MaterialManager: React.FC = () => {
  const { inventory, isLoading, isFetching, refresh } = useInventoryQuery();
  const { addToast } = useToast();
  
  const { materialViewState, setMaterialViewState } = useUIStore();
  
  // Re-use the existing filter hook for materials
  // Filtering materials assumes the same data structure for now, but filtered by specific columns
  const {
    displayInventory,
    totalWeight,
    isFiltering,
    filters,
    sortConfig,
    updateFilter,
    updateRangeFilter,
    clearRangeFilters,
    handleSort,
    exportAndDownloadCSV
  } = useInventoryFilter(inventory, materialViewState);

  // Sync with global store
  useEffect(() => {
    setMaterialViewState(filters);
  }, [filters, setMaterialViewState]);

  const handleExportCSV = () => {
    exportAndDownloadCSV(MATERIAL_COLUMNS, "TonKhoVatTu");
  };

  useEffect(() => {
    const handleGlobalSync = () => {
       refresh();
    };
    window.addEventListener(GLOBAL_EVENTS.TRIGGER_SYNC, handleGlobalSync);
    return () => window.removeEventListener(GLOBAL_EVENTS.TRIGGER_SYNC, handleGlobalSync);
  }, [refresh]);

  return (
    <div className="w-full h-full flex flex-col">
      <div className="mb-4">
          <InventoryToolbar 
            totalWeight={totalWeight}
            totalRows={displayInventory.length}
            isPending={isFiltering}
            isSyncing={isFetching}
            filterState={filters}
            onUpdateFilter={updateFilter}
            onClearRangeFilters={clearRangeFilters}
            onRefresh={refresh}
            onExportCSV={handleExportCSV}
            columns={MATERIAL_COLUMNS}
          />
      </div>

      <InventoryTable 
        data={displayInventory}
        isLoading={isLoading}
        isSyncing={isFetching}
        columns={MATERIAL_COLUMNS}
        sortConfig={sortConfig}
        onSort={handleSort}
        filterState={filters}
        variant="default"
      />
    </div>
  );
};
