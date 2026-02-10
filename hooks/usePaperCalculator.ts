import React, { useState, useMemo, useCallback } from 'react';
import { useInventoryQuery } from './useInventoryQuery';
import { useToast } from '../contexts/ToastContext';
import { parseVNToNumber } from '../utils/formatting';
import { calculateScenario, CalculationResult } from '../utils/paperCalculationLogic';
import { InventoryItem } from '../types';
import { useUIStore } from '../stores/uiStore';

// Re-export type for component usage
export type { CalculationResult };

export const usePaperCalculator = () => {
  const { inventory, isLoading: isLoadingInventory } = useInventoryQuery();
  const { addToast } = useToast();

  // --- FORM STATE (Now using Global Store) ---
  const { paperCalculationState, setPaperCalculationState } = useUIStore();
  
  const { 
      qty, width, length, gsm, paperType, manufacturer,
      trimMargin, wastePercentage, grainDirection, allowCombine 
  } = paperCalculationState;

  // Helper to create setters compatible with React.Dispatch<SetStateAction<T>>
  // This allows the UI component to stay unchanged
  const createSetter = (key: keyof typeof paperCalculationState) => (
      action: React.SetStateAction<any>
  ) => {
      const currentValue = paperCalculationState[key];
      const newValue = typeof action === 'function' ? action(currentValue) : action;
      setPaperCalculationState({ [key]: newValue });
  };

  const setQty = createSetter('qty');
  const setWidth = createSetter('width');
  const setLength = createSetter('length');
  const setGsm = createSetter('gsm');
  const setPaperType = createSetter('paperType');
  const setManufacturer = createSetter('manufacturer');
  const setTrimMargin = createSetter('trimMargin');
  const setWastePercentage = createSetter('wastePercentage');
  const setGrainDirection = createSetter('grainDirection');
  const setAllowCombine = createSetter('allowCombine');

  // --- CALCULATION STATE (Keep local, usually user wants to recalc or results are heavy) ---
  const [results, setResults] = useState<CalculationResult[]>([]);
  const [theoreticalWeight, setTheoreticalWeight] = useState<number>(0);
  const [extraWeights, setExtraWeights] = useState({ trim: 0, waste: 0 }); 
  const [isCalculating, setIsCalculating] = useState(false);

  // --- DERIVED STATE: GSM PARSING ---
  const { gsmNumeric, gsmSearchString } = useMemo(() => {
      let rawGsmStr = gsm || '';
      const firstSlashIdx = rawGsmStr.indexOf('/');
      
      if (firstSlashIdx !== -1) {
          const afterSlash = rawGsmStr.substring(firstSlashIdx + 1);
          const cleanAfter = afterSlash.trim();
          const parts = cleanAfter.split(/[\/_ ]/);
          if (parts.length > 0 && parts[0]) {
              rawGsmStr = parts[0];
          }
      }
      
      return {
          gsmNumeric: parseVNToNumber(rawGsmStr),
          gsmSearchString: rawGsmStr.trim().toLowerCase()
      };
  }, [gsm]);

  // --- DERIVED STATE: MATCHING INVENTORY ---
  // Tự động lọc kho khi người dùng thay đổi Loại giấy hoặc GSM
  const matchingItems = useMemo(() => {
      if (!paperType || !inventory || !gsmSearchString) return [];
      
      const normalize = (str: string) => str ? str.toString().toLowerCase().trim() : '';
      const targetType = normalize(paperType);
      const targetMfg = normalize(manufacturer);

      return inventory.filter(item => {
          // Bỏ qua các cuộn đang chờ xuất
          const pendingOut = item.pendingOut ? String(item.pendingOut).trim() : '';
          if (pendingOut.length > 0) return false;

          const itemGsmStr = normalize(item.gsm);
          // Tìm kiếm tương đối với số GSM
          const isGsmMatch = itemGsmStr.includes(gsmSearchString);

          const itemType = normalize(item.paperType);
          const isTypeMatch = itemType.includes(targetType); 

          // Filter by Manufacturer if selected
          let isMfgMatch = true;
          if (targetMfg) {
              const itemMfg = normalize(item.manufacturer);
              isMfgMatch = itemMfg.includes(targetMfg);
          }

          const rollWeight = item.weight || 0;
          const rollWidth = item.width || 0;
          const rollLength = item.length || 0;
      
          return isTypeMatch && isGsmMatch && isMfgMatch && rollWeight > 0 && (rollWidth > 0 || rollLength > 0);
      });
  }, [inventory, paperType, gsmSearchString, manufacturer]);

  // --- DERIVED STATE: FOUND STOCK SIZES ---
  const foundStockSizes = useMemo(() => {
      // Lấy danh sách khổ từ trường 'Lô/Dài (CM)' (item.length) theo yêu cầu
      return Array.from(new Set(matchingItems.map(i => Number(i.length) || 0)))
          .filter((v: number) => v > 0)
          .sort((a: number, b: number) => a - b);
  }, [matchingItems]);

  // --- AVAILABLE GSM OPTIONS ---
  const availableGsms = useMemo(() => {
      if (!paperType || !inventory) return [];
      
      const normalizedType = paperType.toLowerCase().trim();
      const targetMfg = manufacturer ? manufacturer.toLowerCase().trim() : '';
      const uniqueGsms = new Set<string>();

      inventory.forEach(item => {
          const itemType = item.paperType ? item.paperType.toLowerCase() : '';
          
          let isMfgMatch = true;
          if (targetMfg) {
              const itemMfg = item.manufacturer ? item.manufacturer.toLowerCase() : '';
              isMfgMatch = itemMfg.includes(targetMfg);
          }

          if (itemType.includes(normalizedType) && isMfgMatch) {
               if (item.gsm && item.gsm.trim() !== '') {
                   uniqueGsms.add(item.gsm.trim());
               }
          }
      });

      return Array.from(uniqueGsms).sort((a, b) => {
          const valA = parseFloat(a.replace(',', '.')); 
          const valB = parseFloat(b.replace(',', '.'));
          if (!isNaN(valA) && !isNaN(valB)) return valA - valB;
          return a.localeCompare(b);
      }).map(g => ({ value: g, label: g }));
  }, [inventory, paperType, manufacturer]);

  // --- MAIN CALCULATION HANDLER ---
  const handleCalculate = useCallback(() => {
    // Validation
    if (!qty || !width || !length || !gsm || !paperType) {
        addToast('Vui lòng nhập đầy đủ thông tin: Số lượng, Khổ, GSM, Loại giấy', 'warning');
        return;
    }

    setIsCalculating(true);

    // Sử dụng setTimeout để không block UI render
    setTimeout(() => {
        try {
            const Q = parseVNToNumber(qty);
            const W_sheet = parseVNToNumber(width);
            const L_sheet = parseVNToNumber(length);
            const Trim_mm = parseVNToNumber(trimMargin);
            const Waste_Pct = parseVNToNumber(wastePercentage);
            
            const Trim_cm = Trim_mm / 10;
            const W_real = W_sheet + Trim_cm;
            const L_real = L_sheet + Trim_cm;
            
            if (Q <= 0 || W_sheet <= 0 || L_sheet <= 0 || gsmNumeric <= 0) {
                 addToast(`Thông số không hợp lệ. Vui lòng kiểm tra lại.`, 'error');
                 setIsCalculating(false);
                 return;
            }

            // 1. Tính trọng lượng
            const netKg = Q * (W_sheet / 100) * (L_sheet / 100) * (gsmNumeric / 1000);
            const grossKg = Q * (W_real / 100) * (L_real / 100) * (gsmNumeric / 1000);
            const trimKg = Math.max(0, grossKg - netKg);
            const wasteKg = grossKg * (Waste_Pct / 100);

            setTheoreticalWeight(netKg);
            setExtraWeights({ trim: trimKg, waste: wasteKg });

            if (matchingItems.length === 0) {
                addToast(`Không tìm thấy giấy phù hợp! (Loại: ${paperType}, GSM: ${gsmNumeric})`, 'error');
                setIsCalculating(false);
                return;
            }

            // 2. Nhóm các cuộn giấy
            const groupedInventory: Record<string, {
                width: number;
                length: number;
                totalWeight: number;
                items: { sku: string; weight: number }[]; 
                count: number;
                gsm: string;
            }> = {};

            matchingItems.forEach(item => {
                const w = item.width || 0;
                const l = item.length || 0;
                const key = `${w}_${l}`;
                const weight = item.weight || 0;

                if (!groupedInventory[key]) {
                    groupedInventory[key] = {
                        width: w,
                        length: l,
                        totalWeight: 0,
                        items: [],
                        count: 0,
                        gsm: item.gsm
                    };
                }

                groupedInventory[key].totalWeight += weight;
                groupedInventory[key].items.push({ sku: item.sku, weight: weight });
                groupedInventory[key].count += 1;
            });

            // 3. Tính toán phương án
            let calculatedOptions: CalculationResult[] = [];
            const groups = Object.values(groupedInventory);

            groups.forEach(group => {
                const calcGsm = gsmNumeric; 

                const dimensionsToCheck: { val: number, source: 'WIDTH' | 'LENGTH' }[] = [];
                if (group.width > 0) dimensionsToCheck.push({ val: group.width, source: 'WIDTH' });
                if (group.length > 0) dimensionsToCheck.push({ val: group.length, source: 'LENGTH' });

                dimensionsToCheck.forEach(stockDim => {
                    // Scenario A: Cắt Rộng vào khổ
                    if (grainDirection === 'FREE' || grainDirection === 'LONG') {
                        calculateScenario(
                            group, stockDim.val, stockDim.source, 
                            W_real, L_real, Q, calcGsm, false, 
                            calculatedOptions, allowCombine, Waste_Pct
                        );
                    }

                    // Scenario B: Xoay khổ - Cắt Dài vào khổ
                    if (grainDirection === 'FREE' || grainDirection === 'SHORT') {
                        calculateScenario(
                            group, stockDim.val, stockDim.source, 
                            L_real, W_real, Q, calcGsm, true, 
                            calculatedOptions, allowCombine, Waste_Pct
                        );
                    }
                });
            });

            if (calculatedOptions.length === 0) {
                setResults([]);
                addToast('Không tìm thấy phương án cắt phù hợp kích thước.', 'warning');
                setIsCalculating(false);
                return;
            }

            // 4. Sắp xếp & Chọn lọc
            const rankedResults = calculatedOptions.sort((a, b) => {
                if (a.leftoverWeight >= 0 && b.leftoverWeight < 0) return -1;
                if (a.leftoverWeight < 0 && b.leftoverWeight >= 0) return 1;

                const diffWaste = a.trimWastePercent - b.trimWastePercent;
                if (Math.abs(diffWaste) > 0.5) return diffWaste; 
                
                return b.score - a.score;
            });

            setResults(rankedResults.slice(0, 5));
            addToast(`Đã tìm thấy ${rankedResults.length} phương án.`, 'success');

        } catch (error) {
            console.error("Calculation error", error);
            addToast('Có lỗi xảy ra khi tính toán.', 'error');
        } finally {
            setIsCalculating(false);
        }
    }, 300);
  }, [
      qty, width, length, gsm, paperType, manufacturer, trimMargin, wastePercentage, grainDirection, allowCombine,
      gsmNumeric, matchingItems, addToast
  ]);

  return {
    // Form State
    qty, setQty,
    width, setWidth,
    length, setLength,
    gsm, setGsm,
    paperType, setPaperType,
    manufacturer, setManufacturer, // Exported
    trimMargin, setTrimMargin,
    wastePercentage, setWastePercentage,
    grainDirection, setGrainDirection,
    allowCombine, setAllowCombine,
    
    // Calculation State
    results,
    theoreticalWeight,
    extraWeights,
    foundStockSizes,
    matchingItems, // EXPORTED MATCHING ITEMS
    isCalculating,
    
    // Actions
    handleCalculate,
    isLoadingInventory,
    inventory,
    availableGsms
  };
};