
import { useState, useCallback } from 'react';
import { InventoryItem } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { useCommandQueue } from '../contexts/CommandQueueContext';
import { useQueryClient } from '@tanstack/react-query';
import { QUERY_KEYS } from '../utils/constants';
import { formatDateTime } from '../utils/formatting';
import { useInventoryQuery } from './useInventoryQuery';

export const useInventoryActions = () => {
  const { user } = useAuth();
  const { addToast } = useToast();
  const { addCommand } = useCommandQueue();
  const queryClient = useQueryClient();
  const { refresh } = useInventoryQuery();

  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  const handleRowDoubleClick = useCallback((item: InventoryItem) => {
    setEditingItem(item);
    setIsCreating(false);
  }, []);

  const handleAddNew = useCallback(() => {
    const newItem: InventoryItem = {
      sku: '',
      purpose: '',
      packetCode: '',
      paperType: '',
      gsm: '',
      supplier: '',
      manufacturer: '',
      importDate: formatDateTime(new Date()).split(' ')[0], // DD/MM/YYYY
      productionDate: formatDateTime(new Date()).split(' ')[0],
      length: 0,
      width: 0,
      weight: 0,
      quantity: 0,
      orderCustomer: '',
      materialCode: '',
      location: '',
      pendingOut: '',
      importer: user?.username || '',
      lastUpdated: formatDateTime(new Date()),
      transactionType: 'IMPORT'
    };
    setEditingItem(newItem);
    setIsCreating(true);
  }, [user]);

  const handleCloseModal = useCallback(() => {
    setEditingItem(null);
    setIsCreating(false);
  }, []);

  // NEW: Logic chuẩn bị cho Bulk Update được chuyển vào đây để tập trung Action logic
  const prepareBulkUpdate = useCallback((selectedSkus: Set<string>, inventory: InventoryItem[]) => {
      if (selectedSkus.size === 0) return;
      
      const firstSku = Array.from(selectedSkus)[0];
      const templateItem = inventory.find(i => i.sku === firstSku);
      
      if (templateItem) {
          setEditingItem(templateItem);
      }
  }, []);

  /**
   * updatedItem: Item chứa dữ liệu mới (pendingOut đã được nhập từ form)
   * bulkSkus: Danh sách SKU cần update (nếu là bulk update)
   */
  const handleSaveItem = useCallback(async (updatedItem: InventoryItem, bulkSkus?: string[]) => {
    try {
        // --- LOGIC HẬU TỐ (SUFFIX) ---
        // Format: " - [User] dd/MM/yyyy HH:mm:ss"
        const now = new Date();
        const day = String(now.getDate()).padStart(2, '0');
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const year = now.getFullYear();
        const h = String(now.getHours()).padStart(2, '0');
        const m = String(now.getMinutes()).padStart(2, '0');
        const s = String(now.getSeconds()).padStart(2, '0');

        const suffix = ` - ${user?.username || 'Unknown'} ${day}/${month}/${year} ${h}:${m}:${s}`;

        // Lấy giá trị pendingOut gốc từ form (người dùng nhập) và nối hậu tố
        let finalPendingOutValue = updatedItem.pendingOut ? String(updatedItem.pendingOut).trim() : '';
        if (finalPendingOutValue) {
            finalPendingOutValue += suffix;
        }

        if (bulkSkus && bulkSkus.length > 0) {
            // --- BULK UPDATE LOGIC ---
            // Chỉ cập nhật pendingOut, GIỮ NGUYÊN lastUpdated và importer của dữ liệu gốc
            
            // Update Cache Optimistically
            queryClient.setQueryData(QUERY_KEYS.INVENTORY, (oldData: InventoryItem[] | undefined) => {
                if (!oldData) return [];
                return oldData.map(item => {
                    if (bulkSkus.includes(item.sku)) {
                        return {
                            ...item,
                            pendingOut: finalPendingOutValue, 
                            // Không cập nhật lastUpdated/importer
                        };
                    }
                    return item;
                });
            });

            // Re-construct payload đầy đủ để đảm bảo code.gs overwrite đúng
            // Backend (code.gs) sử dụng convertItemToRow để ghi đè toàn bộ dòng,
            // nên payload command phải chứa đầy đủ thông tin của item đó.
            const currentCache = queryClient.getQueryData<InventoryItem[]>(QUERY_KEYS.INVENTORY) || [];
            
            const fullCommands = bulkSkus.map(sku => {
                const originalItem = currentCache.find(i => i.sku === sku);
                if (!originalItem) return null;
                
                return {
                    id: crypto.randomUUID(),
                    type: 'UPDATE',
                    payload: {
                        ...originalItem,
                        pendingOut: finalPendingOutValue
                        // Giữ nguyên importer & lastUpdated cũ từ originalItem
                    },
                    timestamp: Date.now()
                };
            }).filter(Boolean);

            // Push Batch Commands
            for (const cmd of fullCommands) {
                await addCommand(cmd as any);
            }

            addToast(`Đã cập nhật Chờ xuất cho ${bulkSkus.length} cuộn`, 'success');

        } else {
            // --- SINGLE UPDATE LOGIC ---
            const fullDate = formatDateTime(new Date());

             const finalItem = {
                ...updatedItem,
                pendingOut: finalPendingOutValue,
                // Nếu là Tạo mới (Nhập kho), ta vẫn phải cập nhật Importer/Time
                // Nếu là Sửa (Update Chờ xuất), ta giữ nguyên thông tin cũ (Requirement: không đổi người nhập/cập nhật khi sửa chờ xuất)
                importer: isCreating ? (user?.username || 'Unknown') : updatedItem.importer,
                lastUpdated: isCreating ? fullDate : updatedItem.lastUpdated
            };
            
            // Update Cache
            queryClient.setQueryData(QUERY_KEYS.INVENTORY, (oldData: InventoryItem[] | undefined) => {
                if (!oldData) return [finalItem];
                if (isCreating) return [finalItem, ...oldData];
                return oldData.map(item => item.sku === finalItem.sku ? finalItem : item);
            });

            // Queue Command
            await addCommand({
                id: crypto.randomUUID(),
                type: isCreating ? 'IMPORT' : 'UPDATE',
                payload: finalItem,
                timestamp: Date.now()
            });
            
            addToast(isCreating ? `Đã nhập kho SKU: ${finalItem.sku}` : `Đã lưu Chờ xuất: ${finalItem.sku}`, 'success');
        }
      
      setEditingItem(null);
      setIsCreating(false);
      
    } catch (error) {
      console.error("Failed to queue command", error);
      addToast("Lỗi khi lưu thay đổi", "error");
      refresh(); // Revert data if error
    }
  }, [addToast, user, addCommand, queryClient, refresh, isCreating]);

  return {
    editingItem,
    isCreating,
    handleRowDoubleClick,
    handleAddNew,
    handleCloseModal,
    handleSaveItem,
    prepareBulkUpdate, // Exported new function
    setEditingItem
  };
};
