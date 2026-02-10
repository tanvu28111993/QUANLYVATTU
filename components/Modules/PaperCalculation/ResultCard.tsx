import React, { memo, useMemo } from 'react';
import { CalculationResult } from '../../../hooks/usePaperCalculator';
import { Badge } from '../../UI/Badge';
import { Button } from '../../UI/Button';
import { 
    RotateCw, Scissors, Layers, Box, Scale, CheckCircle2, 
    AlertTriangle, Ruler, ArrowRight, Trash2, CalendarClock, PieChart 
} from 'lucide-react';
import { formatNumberToVN } from '../../../utils/formatting';

interface ResultCardProps {
    result: CalculationResult;
    index: number;
    targetWidth: string;
    targetLength: string;
    onOpenModal: (selectedRolls: { sku: string }[]) => void;
}

export const ResultCard: React.FC<ResultCardProps> = memo(({ result: res, index: idx, targetWidth, targetLength, onOpenModal }) => {
    // Màu sắc dựa trên hạng
    const rankColor = idx === 0 ? 'border-l-blue-500' : (idx === 1 ? 'border-l-brand-purple' : 'border-l-gray-600');
    const rankBg = idx === 0 ? 'bg-blue-500' : (idx === 1 ? 'bg-brand-purple' : 'bg-gray-600');
    const isOptimal = res.status === 'OPTIMAL';
    const isWarning = res.status === 'WARNING';

    // Optimization: Calculate display rows outside of JSX to keep render clean
    const rollRows = useMemo(() => {
        let remainingDemand = res.usedWeight;
        
        return res.selectedRolls.map((roll, rIdx) => {
            const rollWeight = roll.weight;
            let usedAmount = 0;
            
            // Logic: Lấy lượng cần từ cuộn hiện tại (tối đa bằng trọng lượng cuộn)
            if (remainingDemand > 0.01) { 
                usedAmount = remainingDemand >= rollWeight ? rollWeight : remainingDemand;
            }
            
            // Cập nhật nhu cầu còn lại cho các cuộn sau
            remainingDemand = Math.max(0, remainingDemand - usedAmount);
            
            // Tính tồn kho còn lại của cuộn này
            const remainingStock = rollWeight - usedAmount;
            
            // Đánh dấu là LẺ nếu có sử dụng nhưng vẫn còn dư (> 0.1kg)
            const isPartial = remainingStock > 0.1 && usedAmount > 0.1;

            return (
                <tr key={rIdx} className={`hover:bg-slate-800/50 ${isPartial ? 'bg-orange-500/5' : ''}`}>
                    <td className="px-4 py-2 font-mono text-gray-300 font-medium">
                        {roll.sku}
                        {/* Hiển thị tag LẺ nếu cuộn bị cắt dở */}
                        {isPartial && <span className="ml-2 text-[9px] text-orange-400 bg-orange-900/20 px-1 rounded border border-orange-500/20">LẺ</span>}
                    </td>
                    <td className="px-4 py-2 text-right text-gray-400">
                        {formatNumberToVN(roll.weight)}
                    </td>
                    <td className="px-4 py-2 text-right font-bold text-blue-400">
                        {usedAmount > 0.01 ? formatNumberToVN(usedAmount.toFixed(1)) : '0'}
                    </td>
                    <td className={`px-4 py-2 text-right font-bold ${remainingStock > 0.1 ? 'text-orange-500' : 'text-gray-600'}`}>
                        {remainingStock > 0.1 ? formatNumberToVN(remainingStock.toFixed(1)) : '-'}
                    </td>
                </tr>
            );
        });
    }, [res.selectedRolls, res.usedWeight]);

    return (
        <div 
            className={`
                relative rounded-xl bg-slate-900 border border-gray-800 shadow-xl overflow-hidden group
                transition-all duration-300 hover:shadow-2xl hover:border-gray-700
                border-l-[6px] ${rankColor}
                animate-slide-in-right
            `}
            style={{ animationDelay: `${idx * 100}ms` }}
        >
            {/* --- HEADER --- */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 border-b border-gray-800 bg-gradient-to-r from-slate-900 to-slate-950">
                <div className="flex items-center gap-4">
                    <div className={`
                        w-12 h-12 rounded-lg flex items-center justify-center font-black text-2xl text-white shadow-lg shrink-0
                        ${rankBg}
                    `}>
                        {idx + 1}
                    </div>
                    <div>
                        <div className="flex items-center gap-3">
                            <span className="text-2xl font-black text-white tracking-tight">
                                KHỔ {res.stockDimensionUsed} <span className="text-sm font-normal text-gray-400">cm</span>
                            </span>

                            {isOptimal && <Badge variant="success" size="sm">Tối ưu nhất</Badge>}
                            {isWarning && <Badge variant="error" size="sm">Thiếu giấy</Badge>}
                        </div>
                        
                        <div className="mt-1.5">
                            {!res.isRotated ? (
                                <span className="flex items-center gap-2 text-blue-400 font-bold text-sm bg-blue-400/10 px-3 py-1 rounded border border-blue-400/20 w-fit shadow-sm shadow-blue-900/20">
                                    <Scissors className="w-4 h-4" /> Thớ giấy theo chiều {targetLength} Dài
                                </span>
                            ) : (
                                <span className="flex items-center gap-2 text-orange-400 font-bold text-sm bg-orange-400/10 px-3 py-1 rounded border border-orange-400/20 w-fit shadow-sm shadow-orange-900/20">
                                    <RotateCw className="w-4 h-4" /> Thớ giấy theo chiều {targetWidth} Rộng
                                </span>
                            )}
                        </div>
                    </div>
                </div>
                
                {/* Status & Instruction Container */}
                <div className="flex items-start gap-6">
                        
                        {/* Rolls Stats (Compact Mode) */}
                        <div className="hidden xl:flex items-center gap-6 mr-4">
                            {/* Used Rolls */}
                            <div className="flex flex-col items-center justify-center group relative cursor-help">
                                <span className="text-[10px] font-bold uppercase text-orange-500 mb-1 tracking-wider">Dùng</span>
                                <div className="flex items-center gap-2">
                                <span className="text-3xl font-black text-orange-500 font-mono leading-none">{res.rollsNeeded}</span>
                                <Layers className="w-5 h-5 text-orange-500" />
                                </div>
                            </div>

                            {/* Separator */}
                            <div className="w-px h-8 bg-gray-800 self-center"></div>

                            {/* Stock Rolls */}
                            <div className="flex flex-col items-center justify-center group relative cursor-help">
                                <span className="text-[10px] font-bold uppercase text-brand-purple mb-1 tracking-wider">Kho</span>
                                <div className="flex items-center gap-2">
                                    <span className="text-3xl font-black text-brand-purple font-mono leading-none">{res.rollCount}</span>
                                    <Box className="w-5 h-5 text-brand-purple" />
                                </div>
                            </div>
                        </div>

                        {/* Separator */}
                        <div className="hidden xl:block w-px h-8 bg-gray-800 self-center"></div>

                        {/* Total Consumption */}
                        <div className="hidden xl:flex flex-col items-end text-right">
                            <span className="text-[10px] uppercase font-bold text-gray-500 mb-1 flex items-center gap-1 justify-end">
                                <Scale className="w-3 h-3" /> Tổng tiêu thụ
                            </span>
                            <div className="flex items-baseline gap-2 justify-end">
                                <span className="text-3xl font-black text-white font-mono tracking-tight">{formatNumberToVN(res.usedWeight.toFixed(1))}</span>
                                <span className="text-sm font-bold text-gray-500">kg</span>
                            </div>
                        </div>

                         {/* Separator */}
                         <div className="hidden xl:block w-px h-8 bg-gray-800 self-center"></div>

                        {/* Leftover Stock (Tồn kho sau cắt) */}
                        <div className="hidden xl:flex flex-col items-end text-right">
                             <span className="text-[10px] uppercase font-bold text-gray-500 mb-1 flex items-center gap-1 justify-end">
                                <Box className="w-3 h-3" /> Tồn kho sau cắt
                            </span>
                            <div className={`flex items-baseline gap-2 justify-end ${res.leftoverWeight < 0 ? 'text-red-500' : 'text-green-500'}`}>
                                <span className="text-3xl font-black font-mono tracking-tight">
                                    {formatNumberToVN(res.leftoverWeight.toFixed(1))}
                                </span>
                                <span className="text-sm font-bold text-gray-500">kg</span>
                            </div>
                        </div>

                        {/* Separator */}
                        <div className="hidden xl:block w-px h-8 bg-gray-800 self-center"></div>

                        {/* Status Indicator */}
                        <div className="flex flex-col items-end">
                            <div className="text-xs text-gray-500 uppercase font-bold mb-1">Trạng thái</div>
                            <div className={`text-lg font-bold flex items-center gap-2 ${res.leftoverWeight >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                                {res.leftoverWeight >= 0 ? (
                                    <>
                                        <CheckCircle2 className="w-5 h-5" /> Đủ hàng
                                    </>
                                ) : (
                                    <>
                                        <AlertTriangle className="w-5 h-5" /> Thiếu
                                    </>
                                )}
                            </div>
                        </div>
                </div>
            </div>

            {/* --- DASHBOARD STATS --- */}
            <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-gray-800 bg-slate-900/50">
                {/* STAT 1: Technical Instructions */}
                <div className="p-5 flex flex-col justify-center items-center text-center">
                    <span className="text-xs uppercase font-bold text-gray-400 mb-2 flex items-center gap-2 tracking-wider">
                         <Ruler className="w-4 h-4" /> Kích thước cắt
                    </span>
                    
                    <div className="flex items-center gap-4 text-sm mt-1">
                        <div className="flex flex-col items-center">
                            <span className="text-gray-500 text-[10px] uppercase font-bold mb-0.5">
                                {res.isRotated ? 'CHIA THEO (L)' : 'CHIA THEO (W)'}
                            </span>
                            <strong className="text-2xl text-white font-black font-mono leading-none">
                                {res.isRotated ? targetLength : targetWidth}
                            </strong>
                        </div>

                        <ArrowRight className="w-5 h-5 text-gray-600" />

                        <div className="flex flex-col items-center">
                            <span className="text-gray-500 text-[10px] uppercase font-bold mb-0.5">Vào Khổ</span>
                            <strong className="text-3xl text-brand-red font-black font-mono leading-none">{res.stockDimensionUsed}</strong>
                        </div>
                        
                        <div className="w-px h-8 bg-gray-700 mx-1"></div>

                        <div className="flex flex-col items-center">
                            <span className="text-gray-500 text-[10px] uppercase font-bold mb-0.5">Dài (m)</span>
                            <span className="text-xl text-white font-bold font-mono leading-none">{formatNumberToVN(res.requiredLengthM.toFixed(0))}</span>
                        </div>
                    </div>
                </div>

                {/* STAT 2: Efficiency */}
                <div className="p-5 flex flex-col justify-center items-center text-center">
                        <span className="text-xs uppercase font-bold text-gray-400 mb-2 tracking-wider flex items-center gap-2">
                             <PieChart className="w-4 h-4" /> Hiệu suất cắt
                        </span>
                        <div className="flex items-center gap-6 justify-center mt-1">
                            <div className="text-center">
                                <div className="text-4xl font-black text-white font-mono leading-none mb-1">{res.cutsPerWidth}</div>
                                <div className="text-xs text-gray-500 font-medium">tờ/hàng</div>
                            </div>
                            <div className="h-10 w-px bg-gray-700"></div>
                            <div className="text-center">
                                <div className="text-4xl font-black font-mono leading-none mb-1 text-brand-purple">
                                    {formatNumberToVN(res.trimWasteCm.toFixed(1))}<span className="text-lg">cm</span>
                                </div>
                                <div className="text-xs text-gray-500 font-medium">hao phí {res.trimWastePercent.toFixed(1)}%</div>
                            </div>
                        </div>
                </div>

                {/* STAT 3: Waste Weight (Trọng lượng hao phí) */}
                <div className="p-5 flex flex-col justify-center items-center text-center">
                        <span className="text-xs uppercase font-bold text-gray-400 mb-2 tracking-wider flex items-center gap-2">
                            <Trash2 className="w-3 h-3" /> Trọng lượng hao phí
                        </span>
                        
                        <div className="text-3xl xl:text-4xl font-black font-mono leading-none text-orange-500 mb-1 flex items-baseline gap-1 justify-center">
                            {formatNumberToVN(res.trimWasteKg.toFixed(1))} <span className="text-sm font-bold text-gray-500">kg</span>
                        </div>

                        <div className="text-xs font-medium text-gray-500">
                            chiếm {res.trimWastePercent.toFixed(1)}% tổng lượng
                        </div>
                </div>
            </div>

            {/* --- ROLLS TABLE --- */}
            <div className="bg-slate-900/50">
                <div className="px-4 py-2 flex items-center justify-between border-b border-gray-800/50 bg-slate-800/20">
                    <div className="text-[10px] uppercase font-bold text-gray-500 flex items-center gap-2">
                        <Box className="w-3 h-3" /> Danh sách cuộn ({res.selectedRolls.length})
                    </div>
                    <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onOpenModal(res.selectedRolls)}
                        className="h-6 text-[10px] px-2 py-0 border-blue-500/30 text-blue-400 hover:bg-blue-500/10 hover:text-blue-300"
                    >
                        <CalendarClock className="w-3 h-3 mr-1.5" />
                        Chọn chờ xuất
                    </Button>
                </div>
                <div className="max-h-[200px] overflow-y-auto custom-scrollbar">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-slate-900/80 sticky top-0 z-10 text-[10px] uppercase text-gray-500 font-semibold">
                            <tr>
                                <th className="px-4 py-2 font-medium">Mã SKU</th>
                                <th className="px-4 py-2 font-medium text-right">TL Gốc</th>
                                <th className="px-4 py-2 font-medium text-right">Sử dụng</th>
                                <th className="px-4 py-2 font-medium text-right">Còn lại</th>
                            </tr>
                        </thead>
                        <tbody className="text-xs divide-y divide-gray-800/30">
                            {rollRows}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
});