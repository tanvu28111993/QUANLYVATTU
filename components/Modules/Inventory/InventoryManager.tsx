
import React, { useCallback, useEffect } from 'react';
import { useInventoryQuery } from '../../../hooks/useInventoryQuery'; 
import { useUIStore } from '../../../stores/uiStore'; 
import { InventoryToolbar } from './InventoryToolbar';
import { InventoryTable } from './InventoryTable';
import { useInventoryFilter } from '../../../hooks/useInventoryFilter';
import { useInventoryActions } from '../../../hooks/useInventoryActions';
import { useTableSelection } from '../../../hooks/useTableSelection';
import { INVENTORY_COLUMNS, getDefaultCellStyle } from '../../../utils/inventoryColumnConfig';
import { useToast } from '../../../contexts/ToastContext';
import { GLOBAL_EVENTS } from '../../../utils/constants';
import { InventoryItem } from '../../../types';

// Code Splitting for heavy modals
const EditInventoryModal = React.lazy(() => import('./EditInventoryModal').then(m => ({ default: m.EditInventoryModal })));

export const InventoryManager: React.FC = () => {
  // 1. Data & Fetching State
  const { inventory, isLoading: isInitialLoading, isFetching: isSyncing, refresh } = useInventoryQuery();
  const { addToast } = useToast();
  
  // 2. Actions & Local UI State
  // Lấy prepareBulkUpdate từ hook thay vì định nghĩa logic tại đây
  const { editingItem, handleRowDoubleClick, handleCloseModal, handleSaveItem, prepareBulkUpdate } = useInventoryActions();

  // 3. UI Global State
  const { inventoryViewState, setInventoryViewState } = useUIStore();
  
  // 4. Business Logic Layer (Filtering)
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
  } = useInventoryFilter(inventory, inventoryViewState);

  // 5. Selection Logic (Extracted to Hook)
  const { 
    selectedIds: selectedSkus, 
    handleSelectId: handleSelectRow, 
    handleSelectAll, 
    clearSelection 
  } = useTableSelection(displayInventory, (item: InventoryItem) => item.sku);

  // Sync state changes back to Global Store
  useEffect(() => {
    setInventoryViewState(filters);
  }, [filters, setInventoryViewState]);

  // Reset selection when filters change or refresh
  useEffect(() => {
    clearSelection();
  }, [filters, sortConfig, inventory, clearSelection]);

  // Wrappers
  const handleExportCSV = useCallback(() => {
    exportAndDownloadCSV(INVENTORY_COLUMNS, "TonKho");
  }, [exportAndDownloadCSV]);

  // Use the action from hook
  const handleBulkUpdate = useCallback(() => {
      prepareBulkUpdate(selectedSkus, inventory);
  }, [selectedSkus, inventory, prepareBulkUpdate]);

  // --- LISTEN FOR GLOBAL SHORTCUTS ---
  useEffect(() => {
    const handleGlobalSync = () => {
       addToast("Đang đồng bộ dữ liệu...", "info");
       refresh();
    };

    window.addEventListener(GLOBAL_EVENTS.TRIGGER_SYNC, handleGlobalSync);

    return () => {
        window.removeEventListener(GLOBAL_EVENTS.TRIGGER_SYNC, handleGlobalSync);
    };
  }, [refresh, addToast]);

  return (
    <div className="w-full h-full flex flex-col">
      <div className="mb-4">
          <InventoryToolbar 
            totalWeight={totalWeight}
            totalRows={displayInventory.length}
            isPending={isFiltering}
            isSyncing={isSyncing}
            
            // Cleaned up Props
            filterState={filters}
            onUpdateFilter={updateFilter}
            onClearRangeFilters={clearRangeFilters}
            
            onRefresh={refresh}
            onExportCSV={handleExportCSV}
            
            columns={INVENTORY_COLUMNS}

            // Selection Props passed to Toolbar
            selectedCount={selectedSkus.size}
            onBulkUpdate={handleBulkUpdate}
          />
      </div>

      <InventoryTable 
        data={displayInventory}
        isLoading={isInitialLoading}
        isSyncing={isSyncing}
        columns={INVENTORY_COLUMNS}
        
        sortConfig={sortConfig}
        onSort={handleSort}
        
        // Combined Filter State
        filterState={filters}
        
        onRowDoubleClick={handleRowDoubleClick}
        getDefaultStyle={getDefaultCellStyle}

        // Selection Props
        selectedSkus={selectedSkus}
        onSelectRow={handleSelectRow}
        onSelectAll={handleSelectAll}
      />

      {editingItem && (
        <React.Suspense fallback={null}>
          <EditInventoryModal 
            item={editingItem}
            mode="edit"
            isOpen={true}
            onClose={handleCloseModal}
            onSave={(updatedItem) => {
                // Nếu đang chọn nhiều dòng, truyền danh sách SKU để update hàng loạt
                const bulkSkus = selectedSkus.size > 0 ? Array.from(selectedSkus) : undefined;
                handleSaveItem(updatedItem, bulkSkus);
            }}
            selectedCount={selectedSkus.size}
          />
        </React.Suspense>
      )}
    </div>
  );
};
