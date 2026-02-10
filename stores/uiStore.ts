import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export interface InventoryViewState {
  searchTerm: string;
  searchColumn: string;
  showOddLots: boolean;
  showPendingOut: boolean;
  showAdvancedFilters: boolean;
  rangeFilters: {
    widthMin: string;
    widthMax: string;
    lengthMin: string;
    lengthMax: string;
  };
}

// State cho module Tính toán giấy
export interface PaperCalculationState {
  qty: string;
  width: string;
  length: string;
  gsm: string;
  paperType: string;
  manufacturer: string; // New field
  trimMargin: string;
  wastePercentage: string;
  grainDirection: 'FREE' | 'LONG' | 'SHORT';
  allowCombine: boolean;
}

interface UIState {
  // Inventory State
  inventoryViewState: InventoryViewState;
  setInventoryViewState: (state: Partial<InventoryViewState>) => void;
  resetInventoryState: () => void;

  // Material Inventory State
  materialViewState: InventoryViewState;
  setMaterialViewState: (state: Partial<InventoryViewState>) => void;
  resetMaterialState: () => void;

  // Paper Calculation State
  paperCalculationState: PaperCalculationState;
  setPaperCalculationState: (state: Partial<PaperCalculationState>) => void;
  resetPaperCalculationState: () => void;
}

const DEFAULT_INVENTORY_STATE: InventoryViewState = {
  searchTerm: '',
  searchColumn: 'all',
  showOddLots: false,
  showPendingOut: false,
  showAdvancedFilters: false,
  rangeFilters: { widthMin: '', widthMax: '', lengthMin: '', lengthMax: '' }
};

const DEFAULT_PAPER_CALCULATION_STATE: PaperCalculationState = {
  qty: '',
  width: '',
  length: '',
  gsm: '',
  paperType: '',
  manufacturer: '', // Default empty
  trimMargin: '2',
  wastePercentage: '0.25',
  grainDirection: 'FREE',
  allowCombine: true
};

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      // Inventory Implementation
      inventoryViewState: DEFAULT_INVENTORY_STATE,
      setInventoryViewState: (newState) => 
        set((state) => ({ 
          inventoryViewState: { ...state.inventoryViewState, ...newState } 
        })),
      resetInventoryState: () => set({ inventoryViewState: DEFAULT_INVENTORY_STATE }),

      // Material Implementation
      materialViewState: DEFAULT_INVENTORY_STATE,
      setMaterialViewState: (newState) => 
        set((state) => ({ 
          materialViewState: { ...state.materialViewState, ...newState } 
        })),
      resetMaterialState: () => set({ materialViewState: DEFAULT_INVENTORY_STATE }),

      // Paper Calculation Implementation
      paperCalculationState: DEFAULT_PAPER_CALCULATION_STATE,
      setPaperCalculationState: (newState) =>
        set((state) => ({
            paperCalculationState: { ...state.paperCalculationState, ...newState }
        })),
      resetPaperCalculationState: () => set({ paperCalculationState: DEFAULT_PAPER_CALCULATION_STATE }),
    }),
    {
      name: 'ui-storage-v2',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
          inventoryViewState: state.inventoryViewState,
          materialViewState: state.materialViewState,
          paperCalculationState: state.paperCalculationState,
      }),
    }
  )
);