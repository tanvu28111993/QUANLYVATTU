
import { useEffect } from 'react';
import { GLOBAL_EVENTS } from '../utils/constants';

// Export lại để đảm bảo tương thích ngược nếu có file nào import trực tiếp từ hook này (optional, but good practice during refactor)
export { GLOBAL_EVENTS };

export const useGlobalShortcuts = () => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Chỉ xử lý khi nhấn kèm Ctrl (Windows) hoặc Meta (Mac)
      if (!(e.ctrlKey || e.metaKey)) return;

      switch (e.key.toLowerCase()) {
        case 'f':
          e.preventDefault();
          window.dispatchEvent(new CustomEvent(GLOBAL_EVENTS.FOCUS_SEARCH));
          break;
        case 'p':
          e.preventDefault();
          window.dispatchEvent(new CustomEvent(GLOBAL_EVENTS.TRIGGER_PRINT));
          break;
        case 's':
          e.preventDefault();
          window.dispatchEvent(new CustomEvent(GLOBAL_EVENTS.TRIGGER_SYNC));
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);
};
