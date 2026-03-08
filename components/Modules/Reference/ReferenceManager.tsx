import React from 'react';
import { Card } from '../../UI/Card';
import { Input } from '../../UI/Input';
import { Search } from 'lucide-react';
import { useReferenceManagement } from '../../../hooks/useReferenceManagement';
import { CATEGORIES } from '../../../utils/referenceConfig';

export const ReferenceManager: React.FC = () => {
    // Sử dụng Logic từ Hook
    const {
        selectedCategory, setSelectedCategory,
        searchTerm, setSearchTerm,
        isLoading,
        currentConfig,
        filteredData
    } = useReferenceManagement();

    const hasField = (key: string) => currentConfig.fields.some(f => f.key === key);

    return (
        <div className="w-full h-full flex flex-col xl:flex-row gap-6 animate-fade-in p-0">
            {/* Sidebar */}
            <div className="w-full xl:w-64 flex flex-col gap-2 shrink-0">
                <div className="bg-slate-900 border border-gray-800 rounded-xl p-2 h-full shadow-lg">
                    {CATEGORIES.map(cat => (
                        <button
                            key={cat.key}
                            onClick={() => {
                                setSelectedCategory(cat.key);
                                setSearchTerm('');
                            }}
                            className={`
                                w-full flex items-center gap-4 px-4 py-4 rounded-lg text-base font-medium transition-all mb-1
                                ${selectedCategory === cat.key 
                                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/30 ring-1 ring-blue-400' 
                                    : 'bg-transparent text-gray-400 hover:bg-slate-800 hover:text-white'}
                            `}
                        >
                            <cat.icon className={`w-5 h-5 ${selectedCategory === cat.key ? 'text-white' : 'text-gray-500'}`} />
                            {cat.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Main Content */}
            <Card className="flex-1 flex flex-col bg-slate-900 border-gray-800 p-0 overflow-hidden shadow-2xl h-full" noPadding>
                
                {/* Search Bar */}
                <div className="p-6 border-b border-gray-800 bg-slate-950/50 flex flex-col gap-6">
                        <div className="w-full md:w-1/2 lg:w-1/3">
                        <Input 
                            icon={Search}
                            placeholder={`Tìm kiếm trong ${currentConfig.label}...`}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="bg-slate-900 border-slate-700 font-bold"
                        />
                        </div>
                </div>

                {/* Table List */}
                <div className="flex-1 overflow-y-auto custom-scrollbar p-0 bg-slate-900">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-slate-950 text-gray-400 text-sm uppercase font-semibold sticky top-0 z-10 shadow-sm">
                            <tr>
                                {currentConfig.fields.map(f => (
                                    <th key={f.key} className="px-6 py-4 border-b border-gray-800" style={{ width: f.width }}>
                                        {f.label}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-800/50">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={currentConfig.fields.length} className="px-6 py-12 text-center text-gray-500">
                                        Đang tải dữ liệu...
                                    </td>
                                </tr>
                            ) : filteredData.length === 0 ? (
                                <tr>
                                    <td colSpan={currentConfig.fields.length} className="px-6 py-12 text-center text-gray-500">
                                        Không có dữ liệu phù hợp.
                                    </td>
                                </tr>
                            ) : (
                                filteredData.map((row, idx) => (
                                    <tr key={idx} className="hover:bg-slate-800/80 transition-colors group">
                                        {/* Tăng kích thước chữ (text-lg) và in đậm (font-bold) cho các cột */}
                                        {hasField('value') && (
                                            <td className="px-6 py-4 text-gray-200 text-lg font-bold border-r border-transparent group-hover:border-gray-800">
                                                {row[0]}
                                            </td>
                                        )}
                                        {hasField('code') && (
                                            <td className="px-6 py-4 border-r border-transparent group-hover:border-gray-800">
                                                <span className={`text-lg font-bold ${row[1] ? 'text-orange-500' : 'text-gray-500 italic'}`}>
                                                    {row[1] || '-'}
                                                </span>
                                            </td>
                                        )}
                                        {hasField('extra') && (
                                            <td className="px-6 py-4 border-r border-transparent group-hover:border-gray-800">
                                                <span className={`text-lg font-bold ${row[2] ? 'text-orange-500' : 'text-gray-500 italic'}`}>
                                                    {row[2] || '-'}
                                                </span>
                                            </td>
                                        )}
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </Card>
        </div>
    );
};