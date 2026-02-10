import React, { useState, useRef, useCallback, useMemo } from 'react';
import { useInventoryFormFields } from '../../../hooks/useInventoryFormFields'; 
import { useInventoryActions } from '../../../hooks/useInventoryActions';
import { usePaperCalculator } from '../../../hooks/usePaperCalculator';
import { Card } from '../../UI/Card';
import { Input } from '../../UI/Input';
import { Select } from '../../UI/Select';
import { Button } from '../../UI/Button';
import { useToast } from '../../../contexts/ToastContext';
import { Calculator, CheckCircle2, Loader2, Combine, Box, ChevronDown, ChevronUp, List, RotateCcw } from 'lucide-react';
import { formatNumberToVN } from '../../../utils/formatting';
import { InventoryItem } from '../../../types';
import { SearchableSelect } from '../../UI/SearchableSelect';
import { ResultCard } from './ResultCard';

// Lazy load EditInventoryModal to match InventoryManager pattern
const EditInventoryModal = React.lazy(() => import('../Inventory/EditInventoryModal').then(m => ({ default: m.EditInventoryModal })));

// --- MAIN MANAGER COMPONENT ---
export const PaperCalculationManager: React.FC = () => {
  const { options } = useInventoryFormFields('create'); 
  const { addToast } = useToast();
  
  // Custom Hook for Logic & State
  const {
      qty, setQty,
      width, setWidth,
      length, setLength,
      gsm, setGsm,
      paperType, setPaperType,
      manufacturer, setManufacturer, // New
      trimMargin, setTrimMargin,
      wastePercentage, setWastePercentage,
      grainDirection, setGrainDirection,
      allowCombine, setAllowCombine,
      results,
      theoreticalWeight,
      extraWeights, 
      foundStockSizes,
      isCalculating,
      handleCalculate,
      isLoadingInventory,
      inventory,
      availableGsms
  } = usePaperCalculator();

  // Hooks for Bulk Update Actions
  const { handleSaveItem } = useInventoryActions();

  // --- MODAL STATE ---
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [templateItem, setTemplateItem] = useState<InventoryItem | null>(null);
  const [targetSkus, setTargetSkus] = useState<string[]>([]);
  
  // --- UI STATE ---
  const [showStockSizes, setShowStockSizes] = useState(false); // State để ẩn/hiện danh sách khổ lô

  // --- REFS FOR KEYBOARD NAVIGATION ---
  const inputsRef = useRef<(HTMLInputElement | HTMLSelectElement | null)[]>([]);

  // --- INPUT HANDLERS ---
  const handleIntegerChange = (setter: React.Dispatch<React.SetStateAction<string>>) => (e: React.ChangeEvent<HTMLInputElement>) => {
      let val = e.target.value;
      const raw = val.replace(/[^0-9]/g, '');
      const formatted = raw ? raw.replace(/\B(?=(\d{3})+(?!\d))/g, ".") : '';
      setter(formatted);
  };

  const handleDecimalChange = (setter: React.Dispatch<React.SetStateAction<string>>) => (e: React.ChangeEvent<HTMLInputElement>) => {
      let val = e.target.value;
      val = val.replace(/\./g, ',');
      val = val.replace(/[^0-9,]/g, '');
      const parts = val.split(',');
      if (parts.length > 2) {
           val = parts[0] + ',' + parts.slice(1).join('');
      }
      setter(val);
  };

  const handleKeyDown = (index: number) => (e: React.KeyboardEvent<HTMLInputElement | HTMLSelectElement>) => {
    // 1. Enter Key -> Next Field or Submit
    if (e.key === 'Enter') {
        e.preventDefault();
        // Index 8 is now the last input (Trim Margin) because Manufacturer is Index 0
        if (index === 8) { 
            handleCalculate();
        } else {
            const nextEl = inputsRef.current[index + 1];
            if (nextEl) {
                nextEl.focus();
                if (nextEl instanceof HTMLInputElement) {
                    nextEl.select();
                }
            }
        }
        return;
    }

    // 2. Arrow Navigation (Left/Right)
    const isArrowRight = e.key === 'ArrowRight';
    const isArrowLeft = e.key === 'ArrowLeft';

    if (isArrowRight || isArrowLeft) {
        if (e.currentTarget instanceof HTMLInputElement) {
            const target = e.currentTarget;
            if (isArrowRight && target.selectionStart === target.value.length) {
                e.preventDefault();
                const nextEl = inputsRef.current[index + 1];
                if (nextEl) {
                    nextEl.focus();
                    if (nextEl instanceof HTMLInputElement) nextEl.select();
                }
            } else if (isArrowLeft && target.selectionStart === 0) {
                e.preventDefault();
                const prevEl = inputsRef.current[index - 1];
                if (prevEl) {
                    prevEl.focus();
                    if (prevEl instanceof HTMLInputElement) prevEl.select();
                }
            }
        } else {
            // For Select/SearchableSelect (non-input native), always navigate
            e.preventDefault();
            if (isArrowRight) {
                 const nextEl = inputsRef.current[index + 1];
                 if (nextEl) {
                     nextEl.focus();
                     if (nextEl instanceof HTMLInputElement) nextEl.select();
                 }
            } else if (isArrowLeft) {
                 const prevEl = inputsRef.current[index - 1];
                 if (prevEl) {
                     prevEl.focus();
                     if (prevEl instanceof HTMLInputElement) prevEl.select();
                 }
            }
        }
    }
  };

  // --- HELPER: RESET FORM ---
  const handleResetInputs = useCallback(() => {
    setQty('');
    setWidth('');
    setLength('');
    // Giữ nguyên Loại giấy, NSX và GSM để người dùng nhập tiếp
    // Reset các thông số kỹ thuật về mặc định
    setTrimMargin('2');
    setWastePercentage('0.25'); 
    setGrainDirection('FREE');
    addToast('Đã xóa thông số nhập liệu', 'info', 1000);
    // Focus lại vào ô Số lượng (index 4)
    setTimeout(() => {
        const qtyInput = inputsRef.current[4];
        if (qtyInput) (qtyInput as HTMLElement).focus();
    }, 50);
  }, [setQty, setWidth, setLength, setTrimMargin, setWastePercentage, setGrainDirection, addToast]);

  // --- LOGIC: FILTER MANUFACTURERS BASED ON SELECTED PAPER TYPE ---
  const availableManufacturers = useMemo(() => {
      const normalize = (str: string) => str ? str.toLowerCase().trim() : '';
      const targetType = normalize(paperType);

      // Sử dụng Set để lấy danh sách NSX duy nhất từ Inventory
      const uniqueMfg = new Set<string>();

      inventory.forEach(item => {
          // Logic: 
          // 1. Nếu chưa chọn loại giấy (targetType rỗng) -> Lấy tất cả NSX có trong kho
          // 2. Nếu đã chọn loại giấy -> Chỉ lấy NSX của các cuộn khớp loại giấy đó
          if (!targetType || normalize(item.paperType).includes(targetType)) {
              if (item.manufacturer) {
                  uniqueMfg.add(item.manufacturer);
              }
          }
      });

      // Convert Set to Options array & Sort alpha
      const computedOptions = Array.from(uniqueMfg).sort().map(m => ({
          value: m,
          label: m
      }));

      // Luôn thêm tùy chọn 'Tất cả' ở đầu
      return [{ value: '', label: 'Tất cả' }, ...computedOptions];
  }, [inventory, paperType]);


  // --- ACTION HANDLERS ---
  // Optimization: Wrap in useCallback to prevent ResultCard re-renders
  const handleOpenPendingModal = useCallback((selectedRolls: { sku: string }[]) => {
    if (!selectedRolls || selectedRolls.length === 0) return;

    // Tìm item đầy đủ từ inventory dựa trên SKU đầu tiên để làm template
    const firstSku = selectedRolls[0].sku;
    const foundItem = inventory.find(i => i.sku === firstSku);

    if (foundItem) {
        setTemplateItem(foundItem);
        setTargetSkus(selectedRolls.map(r => r.sku));
        setIsEditModalOpen(true);
    } else {
        addToast('Không tìm thấy thông tin chi tiết cuộn giấy.', 'error');
    }
  }, [inventory, addToast]);

  const handleSaveBulkPending = useCallback((updatedItem: InventoryItem) => {
      if (targetSkus.length > 0) {
          handleSaveItem(updatedItem, targetSkus);
          setIsEditModalOpen(false);
          setTargetSkus([]);
          setTemplateItem(null);
      }
  }, [targetSkus, handleSaveItem]);

  return (
    <div className="flex flex-col xl:flex-row-reverse gap-6 h-full animate-fade-in">
      {/* INPUT COLUMN */}
      <Card className="w-full xl:w-[20%] flex flex-col gap-5 h-fit border-t-4 border-t-brand-red shadow-2xl sticky top-4">
         <div className="flex items-start justify-between">
            <div>
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <Calculator className="w-6 h-6 text-brand-red" />
                    Thông số
                </h2>
                <p className="text-gray-400 text-xs mt-1">Nhập thông số đơn hàng</p>
            </div>
            <button 
                onClick={handleResetInputs}
                className="p-2 -mr-2 text-gray-500 hover:text-white hover:bg-white/10 rounded-full transition-all"
                title="Xóa nhanh (Giữ lại Loại giấy/GSM/NSX)"
            >
                <RotateCcw className="w-4 h-4" />
            </button>
         </div>

         <div className="space-y-4">
            
            {/* 1. Loại giấy (Index 0) - MOVED TO TOP */}
            <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-400 uppercase">Loại giấy</label>
                <SearchableSelect
                    ref={(el) => { if (el) inputsRef.current[0] = el; }} // Index 0
                    options={options.paper}
                    value={paperType}
                    onChange={(val) => {
                        setPaperType(val);
                        setManufacturer(''); // Reset NSX khi đổi loại giấy
                    }}
                    onKeyDown={handleKeyDown(0)}
                    placeholder="Nhập hoặc chọn loại giấy..."
                    className="font-bold text-sm"
                />
            </div>

            {/* 2. Nhà sản xuất (Index 1) - MOVED BELOW PAPER TYPE & FILTERED */}
            <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-400 uppercase">Nhà Sản Xuất</label>
                <SearchableSelect
                    ref={(el) => { if (el) inputsRef.current[1] = el; }} // Index 1
                    options={availableManufacturers} // Use Computed Options
                    value={manufacturer}
                    onChange={(val) => setManufacturer(val)}
                    onKeyDown={handleKeyDown(1)}
                    placeholder="Nhập hoặc chọn NSX..."
                    className="font-bold text-sm"
                />
            </div>

             {/* 3. Định lượng (Index 2) */}
             <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-400 uppercase">Định lượng</label>
                <SearchableSelect 
                    ref={(el) => { if (el) inputsRef.current[2] = el; }}
                    options={availableGsms}
                    value={gsm} 
                    onChange={(val) => setGsm(val)}
                    onKeyDown={handleKeyDown(2)}
                    placeholder="Chọn..."
                    className="font-bold"
                />
            </div>

            {/* 4. Thớ giấy & Số lượng (Index 3 & 4) */}
            <div className="grid grid-cols-2 gap-3">
                 <div className="space-y-1">
                    <label className="text-xs font-semibold text-gray-400 uppercase">Thớ giấy</label>
                    <Select
                        ref={(el) => { inputsRef.current[3] = el; }}
                        value={grainDirection}
                        onChange={(e) => setGrainDirection(e.target.value as any)}
                        onKeyDown={handleKeyDown(3)}
                        options={[
                            { value: 'FREE', label: 'Tự do' },
                            { value: 'LONG', label: 'Thớ dài' },
                            { value: 'SHORT', label: 'Thớ ngắn' }
                        ]}
                        className="font-bold text-sm"
                    />
                </div>
                
                <div className="space-y-1">
                    <label className="text-xs font-semibold text-gray-400 uppercase">Số lượng</label>
                    <Input 
                        ref={(el) => { inputsRef.current[4] = el; }}
                        placeholder="VD: 5.000" 
                        value={qty} 
                        onChange={handleIntegerChange(setQty)}
                        onKeyDown={handleKeyDown(4)}
                        className="text-right font-bold"
                    />
                </div>
            </div>

            {/* 5. Kích thước cắt (Indices 5 & 6) */}
            <div className="grid grid-cols-2 gap-3">
                <Input 
                    ref={(el) => { inputsRef.current[5] = el; }}
                    label="Rộng (cm)" 
                    placeholder="35,5" 
                    value={width} 
                    onChange={handleDecimalChange(setWidth)}
                    onKeyDown={handleKeyDown(5)}
                    className="text-right px-2" 
                />
                <Input 
                    ref={(el) => { inputsRef.current[6] = el; }}
                    label="Dài (cm)" 
                    placeholder="55,0" 
                    value={length} 
                    onChange={handleDecimalChange(setLength)}
                    onKeyDown={handleKeyDown(6)}
                    className="text-right px-2" 
                />
            </div>

            {/* 6. Hao hụt & An toàn (Indices 7 & 8) */}
            <div className="grid grid-cols-2 gap-3">
                    <Input 
                    ref={(el) => { inputsRef.current[7] = el; }}
                    label="Hao hụt (%)" 
                    placeholder="0.25" 
                    value={wastePercentage} 
                    onChange={handleDecimalChange(setWastePercentage)}
                    onKeyDown={handleKeyDown(7)}
                    className="text-right px-2" 
                />
                    <Input 
                    ref={(el) => { inputsRef.current[8] = el; }}
                    label="Bù xén (mm)" 
                    placeholder="2" 
                    value={trimMargin} 
                    onChange={handleDecimalChange(setTrimMargin)}
                    onKeyDown={handleKeyDown(8)}
                    className="text-right px-2" 
                />
            </div>

            {/* 7. Tùy chọn nâng cao: Combine Only */}
            <div className="pt-2 border-t border-gray-800">
                <button
                    onClick={() => setAllowCombine(!allowCombine)}
                    className={`
                        w-full flex items-center justify-center gap-2 p-3 rounded-lg border transition-all duration-200 outline-none
                        ${allowCombine 
                            ? 'bg-blue-500/10 border-blue-500 text-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.2)]' 
                            : 'bg-slate-900 border-gray-700 text-gray-500 hover:border-gray-500 hover:text-gray-400'}
                    `}
                >
                    <Combine className="w-5 h-5" />
                    <span className="text-sm font-bold">Cho phép ghép lô (Combine)</span>
                </button>
            </div>
         </div>

         <Button 
            onClick={handleCalculate}
            disabled={isCalculating || isLoadingInventory}
            className="w-full h-12 text-lg font-bold bg-gradient-to-r from-brand-red to-red-700 hover:from-red-600 hover:to-red-800 shadow-lg shadow-red-900/40 mt-auto"
         >
            {isCalculating ? (
                <>
                    <Loader2 className="w-5 h-5 animate-spin mr-2" />
                    Đang tính...
                </>
            ) : (
                'TÍNH TOÁN'
            )}
         </Button>
         
         {isLoadingInventory && (
             <div className="flex items-center justify-center gap-2 text-xs text-blue-400 animate-pulse">
                <Loader2 className="w-3 h-3 animate-spin" /> <span>Đang đồng bộ dữ liệu kho...</span>
             </div>
         )}
      </Card>

      {/* RESULTS COLUMN */}
      <div className="flex-1 flex flex-col gap-4 overflow-hidden">
        <div className="flex items-center justify-between animate-fade-in shrink-0 bg-slate-900/50 p-2 rounded-lg border border-gray-800/50">
            <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-green-500" />
                    Kết quả đề xuất
                </h3>
                
                {/* Updated Theoretical Weight Display with Extra Details */}
                <div className="mt-2 pl-1">
                    <p className="text-base text-gray-300 flex items-center gap-2">
                        Trọng lượng lý thuyết (chưa hao hụt): 
                        <span className="text-white font-mono font-bold text-xl">
                            {theoreticalWeight > 0 ? formatNumberToVN(theoreticalWeight.toFixed(2)) : '0'} kg
                        </span>
                    </p>
                    {theoreticalWeight > 0 && (
                        <p className="text-xs text-gray-500 mt-0.5 flex items-center gap-4">
                            <span>(Bù xén +{trimMargin}mm: <span className="text-orange-400 font-bold">{formatNumberToVN(extraWeights.trim.toFixed(2))} kg</span></span>
                            <span>| Hao hụt +{wastePercentage}%: <span className="text-red-400 font-bold">{formatNumberToVN(extraWeights.waste.toFixed(2))} kg</span>)</span>
                        </p>
                    )}
                </div>
            </div>
            
            {/* UPDATED: Collapsible Stock Sizes List */}
            <div className="flex flex-col items-end pl-4 border-l border-gray-800 max-w-[50%]">
                <button
                    onClick={() => setShowStockSizes(!showStockSizes)}
                    className="text-sm font-black text-brand-purple uppercase tracking-wider flex items-center gap-2 hover:text-brand-purple transition-colors outline-none focus:text-brand-purple"
                >
                     <List className="w-4 h-4" /> Danh sách khổ Lô
                     {showStockSizes ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
                
                {showStockSizes && (
                    <div className="mt-1 animate-fade-in w-full">
                        {foundStockSizes.length > 0 ? (
                            <div className="flex flex-wrap justify-end items-center gap-y-1 content-end">
                                {foundStockSizes.map((size: any, index: number) => (
                                    <div key={index} className="flex items-center">
                                        <span className="text-orange-500 font-black text-base drop-shadow-sm">
                                            {Number(size).toFixed(1).replace('.', ',')}
                                        </span>
                                        {index < foundStockSizes.length - 1 && (
                                            <span className="text-gray-500 mx-1.5 font-light">|</span>
                                        )}
                                    </div>
                                ))}
                            </div>
                        ) : (
                             <div className="text-right">
                                <span className="text-xs text-gray-500 italic">
                                    {(!paperType || !gsm) ? "---" : "Không có"}
                                </span>
                             </div>
                        )}
                    </div>
                )}
            </div>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar pr-1 pb-10 space-y-6">
            {results.length > 0 ? (
                results.map((res, idx) => (
                    <ResultCard 
                        key={`${res.stockDimensionUsed}-${idx}`}
                        result={res}
                        index={idx}
                        targetWidth={width}
                        targetLength={length}
                        // Now passed as a stable function reference
                        onOpenModal={handleOpenPendingModal}
                    />
                ))
            ) : (
                // Empty States placeholders
                [1, 2, 3].map((i) => (
                    <div key={i} className="h-64 rounded-xl border-2 border-dashed border-gray-800 bg-slate-900/30 flex flex-col items-center justify-center text-gray-700 animate-pulse">
                        <span className="text-6xl font-black opacity-10 mb-2">#{i}</span>
                        <span className="text-sm font-medium opacity-50">Đang chờ tính toán...</span>
                    </div>
                ))
            )}
        </div>
      </div>

      {/* MODAL: Pending Out Selection */}
      {isEditModalOpen && templateItem && (
          <React.Suspense fallback={null}>
              <EditInventoryModal
                  item={templateItem}
                  mode="edit"
                  isOpen={isEditModalOpen}
                  onClose={() => setIsEditModalOpen(false)}
                  onSave={handleSaveBulkPending}
                  selectedCount={targetSkus.length}
              />
          </React.Suspense>
      )}
    </div>
  );
};