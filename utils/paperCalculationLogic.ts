
// File này chứa logic tính toán thuần túy, không phụ thuộc vào React State
// Giúp giảm tải cho Hook và dễ dàng unit test hơn.

export interface CalculationResult {
  rollSkuDisplay: string;
  selectedRolls: { sku: string; weight: number }[];
  rollCount: number;
  rollTotalWeight: number;
  rollsNeeded: number;
  rollsNeededWeight: number;
  stockDimensionUsed: number;
  dimensionSource: 'WIDTH' | 'LENGTH';
  isRotated: boolean;
  cutsPerWidth: number;
  trimWasteCm: number;
  trimWastePercent: number;
  trimWasteKg: number;
  usedWeight: number;
  leftoverWeight: number;
  requiredLengthM: number;
  score: number;
  status: 'OPTIMAL' | 'GOOD' | 'ACCEPTABLE' | 'WARNING';
}

export const calculateScenario = (
    group: { items: { sku: string; weight: number }[], count: number, totalWeight: number },
    stockDim: number,
    dimSource: 'WIDTH' | 'LENGTH',
    cutDimAcross: number,
    cutDimAlong: number,
    totalQty: number,
    gsmVal: number,
    rotated: boolean,
    resultsArr: CalculationResult[],
    allowCombineBatch: boolean,
    wastePct: number
  ) => {
    // 1. Kiểm tra kích thước
    const usableStockDim = stockDim;
    if (usableStockDim < cutDimAcross) return;

    // 2. Tính số đường cắt
    const cuts = Math.floor(usableStockDim / cutDimAcross);
    if (cuts === 0) return;

    // 3. Tính hao phí lề (Trim Waste)
    const totalUsedWidth = (cuts * cutDimAcross);
    const trimWaste = stockDim - totalUsedWidth;
    const trimWastePct = (trimWaste / stockDim) * 100;

    // 4. Tính chiều dài & Trọng lượng cần thiết (Demand)
    const rowsNeeded = Math.ceil(totalQty / cuts);
    const productionLengthM = rowsNeeded * (cutDimAlong / 100);
    const totalRequiredLengthM = productionLengthM * (1 + wastePct / 100);
    const usedKg = totalRequiredLengthM * (stockDim / 100) * (gsmVal / 1000);
    const trimWasteKg = usedKg * (trimWaste / stockDim);

    // --- ALGORITHM UPDATE: BEST FIT STRATEGY (Small -> Large) ---
    // Constraints:
    // 1. Odd Roll (Cuộn lẻ): < 300kg.
    // 2. Mandatory: At least 2 Odd Rolls (Smallest) if available.
    // 3. Filling Strategy: Smallest -> Largest to minimize leftover on the last roll.

    // A. Sort all available rolls Ascending (Small -> Large)
    const allRollsAsc = [...group.items].sort((a, b) => a.weight - b.weight);

    // B. Mandatory Selection (Min 2 Smallest Odd Rolls)
    const mandatoryCount = 2;
    const oddRolls = allRollsAsc.filter(r => r.weight < 300);
    // Take up to 2 smallest odd rolls
    const mandatorySelection = oddRolls.slice(0, mandatoryCount);
    
    // C. Filling Strategy (Best Fit)
    let currentSelection = [...mandatorySelection];
    let currentWeight = currentSelection.reduce((sum, r) => sum + r.weight, 0);
    
    // Identify used SKUs to exclude from pool
    const selectedSkus = new Set(currentSelection.map(r => r.sku));
    
    // Remaining pool: All rolls (Ascending) excluding already selected mandatory ones
    const remainingPool = allRollsAsc.filter(r => !selectedSkus.has(r.sku));

    const tolerance = 0.5; // 0.5kg tolerance

    // Iterate Small -> Large
    for (const roll of remainingPool) {
        // Stop Condition: If we have enough weight, stop immediately.
        // Adding smaller rolls first ensures we cross the threshold by the smallest possible margin.
        if (currentWeight >= usedKg - tolerance) break; 
        
        currentSelection.push(roll);
        currentWeight += roll.weight;
    }

    // Check Shortage
    const isShortage = currentWeight < usedKg - tolerance;
    if (!allowCombineBatch && isShortage) return;

    // D. Final Display Sort: Ascending (Small -> Large)
    // Requirement: "Sắp xếp lại toàn bộ danh sách này theo thứ tự Tăng dần (Nhỏ -> Lớn)"
    const finalSelectedItems = [...currentSelection].sort((a, b) => a.weight - b.weight);
    
    const rollsNeededCount = finalSelectedItems.length;
    const leftover = currentWeight - usedKg; 

    // --- SCORING SYSTEM ---
    let score = 2000; 

    // 1. Phạt nặng nếu thiếu hàng
    if (isShortage) score -= 10000; 

    // 2. Phạt dựa trên Lượng dư thừa (Leftover)
    score -= (leftover * 2); 

    // 3. Phạt dựa trên Hao phí lề (Trim Waste)
    score -= (trimWastePct * 50);

    // 4. THƯỞNG nếu dùng nhiều cuộn (Khuyến khích dọn kho)
    score += (rollsNeededCount * 50);

    // Logic đặc biệt: Ưu tiên phương án dùng hết sạch cuộn lẻ (Leftover thấp)
    if (leftover < 50 && leftover >= 0) score += 500;

    // Xếp hạng trạng thái
    let status: CalculationResult['status'] = 'GOOD';
    if (isShortage) status = 'WARNING';
    else if (trimWastePct < 2 && leftover < 50) status = 'OPTIMAL'; 
    else if (trimWastePct > 10 || leftover > 200) status = 'ACCEPTABLE';

    // Tạo chuỗi hiển thị SKU (ngắn gọn)
    const skuDisplay = finalSelectedItems.map(i => i.sku).join(', ');

    resultsArr.push({
        rollSkuDisplay: skuDisplay,
        selectedRolls: finalSelectedItems, 
        rollCount: group.count,
        rollTotalWeight: group.totalWeight,
        rollsNeeded: rollsNeededCount,
        rollsNeededWeight: currentWeight,
        stockDimensionUsed: stockDim,
        dimensionSource: dimSource,
        isRotated: rotated,
        cutsPerWidth: cuts,
        trimWasteCm: trimWaste,
        trimWastePercent: trimWastePct,
        trimWasteKg: trimWasteKg,
        usedWeight: usedKg,
        leftoverWeight: leftover,
        requiredLengthM: totalRequiredLengthM,
        score,
        status
    });
};
