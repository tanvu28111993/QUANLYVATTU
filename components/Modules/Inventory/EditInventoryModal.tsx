
import React, { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { InventoryItem } from '../../../types';
import { Card } from '../../UI/Card';
import { Button } from '../../UI/Button';
import { Input } from '../../UI/Input';
import { X, Save, Calendar } from 'lucide-react';

interface EditInventoryModalProps {
  item: InventoryItem;
  mode?: 'create' | 'edit';
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedItem: InventoryItem) => void;
  selectedCount?: number;
}

export const EditInventoryModal: React.FC<EditInventoryModalProps> = ({ item, mode = 'edit', isOpen, onClose, onSave, selectedCount = 0 }) => {
  // Với chế độ "Chọn lô chờ xuất", ta không cần validate phức tạp các trường khác, chỉ cần trường pendingOut
  const { 
    control, 
    handleSubmit, 
    reset, 
    formState: { isSubmitting },
    setFocus
  } = useForm<{ pendingOut: string }>({
    defaultValues: { pendingOut: item.pendingOut || '' }
  });

  useEffect(() => {
    if (item && isOpen) {
        reset({ pendingOut: item.pendingOut || '' });
        // Auto focus vào ô input sau khi mở modal
        setTimeout(() => setFocus('pendingOut'), 100);
    }
  }, [item, isOpen, reset, setFocus]);

  // --- Global Keyboard Event Handler (Escape) ---
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const onSubmit = (data: { pendingOut: string }) => {
    // Chỉ cập nhật trường pendingOut, giữ nguyên các trường khác
    const submissionData = {
        ...item,
        pendingOut: data.pendingOut
    } as InventoryItem;

    onSave(submissionData);
  };

  if (!isOpen) return null;

  // Xác định tiêu đề dựa trên số lượng chọn
  const isBulkMode = selectedCount > 1;
  const title = isBulkMode 
      ? `Chọn lô chờ xuất (${selectedCount} cuộn)` 
      : 'Chọn lô chờ xuất';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <Card className="w-full max-w-md flex flex-col p-0 overflow-hidden bg-slate-900 border-gray-700 shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800 bg-slate-950">
          <div>
            <h2 className="text-xl font-bold text-white">
                {title}
            </h2>
            <div className="text-sm text-gray-400">
                {isBulkMode ? (
                    'Cập nhật thông tin chờ xuất cho các cuộn đã chọn'
                ) : (
                    <span>Cập nhật cho SKU: <span className="text-brand-red font-mono font-bold">{item.sku}</span></span>
                )}
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-full transition-colors" title="Đóng (Esc)">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6">
          <form id="edit-inventory-form" onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-blue-400 uppercase tracking-wider">
                   Thông tin Chờ Xuất
                </label>
                <Controller
                    name="pendingOut"
                    control={control}
                    render={({ field }) => (
                        <Input
                            {...field}
                            icon={Calendar}
                            placeholder="Nhập ngày hoặc thông tin chờ xuất..."
                            autoFocus
                            className="h-12 text-lg"
                        />
                    )}
                />
                <p className="text-xs text-gray-500 italic">
                    Nhập thông tin để đánh dấu lô này đang chờ xuất kho.
                </p>
              </div>
          </form>
        </div>

        <div className="px-6 py-4 border-t border-gray-800 bg-slate-950 flex justify-end gap-3">
          <Button type="button" variant="ghost" onClick={onClose} disabled={isSubmitting}>
            Hủy bỏ (Esc)
          </Button>
          <Button type="submit" form="edit-inventory-form" isLoading={isSubmitting} className="px-6 flex items-center gap-2 bg-orange-600 hover:bg-orange-700">
            <Save className="w-4 h-4" />
            Lưu thay đổi (Enter)
          </Button>
        </div>
      </Card>
    </div>
  );
};
