import React, { useState, useMemo } from 'react';
import { useMetaDataQuery } from './useMetaDataQuery';
import { CATEGORIES, CategoryKey } from '../utils/referenceConfig';
import { useCommandQueue } from '../contexts/CommandQueueContext';

export const useReferenceManagement = () => {
    const { data: metaData, isLoading } = useMetaDataQuery();
    const [selectedCategory, setSelectedCategory] = useState<CategoryKey>('loaiNhap');
    const [searchTerm, setSearchTerm] = useState('');
    const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');

    // Debounce Search Term
    React.useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearchTerm(searchTerm);
        }, 300);
        return () => clearTimeout(timer);
    }, [searchTerm]);
    
    const { queue } = useCommandQueue();

    const currentConfig = CATEGORIES.find(c => c.key === selectedCategory)!;
    const currentData = metaData ? metaData[selectedCategory] : [];

    // Filter Data Logic
    const filteredData = useMemo(() => {
        let data = currentData ? [...currentData] : [];
        
        // Apply pending commands from Global Queue (Optimistic UI)
        queue.forEach(cmd => {
            if (cmd.type === 'METADATA_BATCH' && Array.isArray(cmd.payload)) {
                cmd.payload.forEach((op: any) => {
                    if (op.category !== selectedCategory) return;
                    
                    if (op.operation === 'ADD') {
                        data.push([op.value, op.code, op.extra]);
                    } else if (op.operation === 'UPDATE') {
                        const idx = data.findIndex(row => row[0] === op.oldValue);
                        if (idx !== -1) {
                            data[idx] = [op.value, op.code, op.extra];
                        }
                    }
                });
            }
        });

        const term = debouncedSearchTerm.toLowerCase();
        return data.filter(row => {
            const val = String(row[0] || '').toLowerCase();
            const code = String(row[1] || '').toLowerCase();
            const extra = String(row[2] || '').toLowerCase();
            return val.includes(term) || code.includes(term) || extra.includes(term);
        });
    }, [currentData, debouncedSearchTerm, queue, selectedCategory]);

    return {
        // Data & State
        selectedCategory, setSelectedCategory,
        searchTerm, setSearchTerm,
        isLoading,
        currentConfig,
        filteredData
    };
};