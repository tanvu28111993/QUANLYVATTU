import React from 'react';
import { Card } from '../../UI/Card';
import { Input } from '../../UI/Input';
import { Button } from '../../UI/Button';
import { Pencil, Plus, Search, X, Save } from 'lucide-react';
import { useReferenceManagement } from '../../../hooks/useReferenceManagement';
import { CATEGORIES } from '../../../utils/referenceConfig';

export const ReferenceManager: React.FC = () => {
    // Sử dụng Logic từ Hook
    const {
        selectedCategory, setSelectedCategory,
        searchTerm, setSearchTerm,
        newValue, setNewValue,
        newCode, setNewCode,
        newExtra, setNewExtra,
        isEditing,
        isSubmitting,
        isLoading,
        currentConfig,
        filteredData,
        handleResetForm,
        handleEdit,
        handleInputChange,
        handleSubmit
    } = useReferenceManagement();

    const hasField = (key: string) => currentConfig.fields.some(f => f.key === key);
    const getFieldConfig = (key: string) => currentConfig.fields.find(f => f.key === key);

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
                                handleResetForm();
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
                
                {/* Form & Actions */}
                <div className="p-6 border-b border-gray-800 bg-slate-950/50 flex flex-col gap-6">
                        <form onSubmit={handleSubmit} className="flex flex-col md:flex-row gap-4 items-end w-full">
                        {hasField('value') && (
                            <div className="w-full md:w-1/4">
                                <label className="text-xs font-semibold text-gray-400 mb-1.5 block uppercase ml-1">
                                    {getFieldConfig('value')?.label} <span className="text-red-500">*</span>
                                </label>
                                <Input 
                                    placeholder={getFieldConfig('value')?.placeholder}
                                    value={newValue}
                                    onChange={(e) => handleInputChange(setNewValue, e.target.value)}
                                    disabled={isSubmitting || (isEditing && !!getFieldConfig('value')?.readOnly)}
                                    className={`h-11 font-bold ${isEditing && getFieldConfig('value')?.readOnly ? 'opacity-50 cursor-not-allowed bg-slate-950' : ''}`}
                                />
                            </div>
                        )}

                        {hasField('code') && (
                            <div className="flex-1 w-full">
                                    <label className="text-xs font-semibold text-gray-400 mb-1.5 block uppercase ml-1">
                                    {getFieldConfig('code')?.label}
                                </label>
                                <Input 
                                    placeholder={getFieldConfig('code')?.placeholder}
                                    value={newCode}
                                    onChange={(e) => handleInputChange(setNewCode, e.target.value, true)}
                                    disabled={isSubmitting || (isEditing && !!getFieldConfig('code')?.readOnly)}
                                    className={`h-11 font-bold ${isEditing && getFieldConfig('code')?.readOnly ? 'opacity-50 cursor-not-allowed bg-slate-950' : ''}`}
                                />
                            </div>
                        )}

                            {hasField('extra') && (
                            <div className="w-full md:w-1/4">
                                    <label className="text-xs font-semibold text-gray-400 mb-1.5 block uppercase ml-1">
                                    {getFieldConfig('extra')?.label}
                                </label>
                                <Input 
                                    placeholder={getFieldConfig('extra')?.placeholder}
                                    value={newExtra}
                                    onChange={(e) => handleInputChange(setNewExtra, e.target.value)}
                                    disabled={isSubmitting || (isEditing && !!getFieldConfig('extra')?.readOnly)}
                                    className={`h-11 font-bold ${isEditing && getFieldConfig('extra')?.readOnly ? 'opacity-50 cursor-not-allowed bg-slate-950' : ''}`}
                                />
                            </div>
                        )}

                        <div className="flex gap-2">
                             {isEditing && (
                                <Button 
                                    type="button" 
                                    onClick={handleResetForm}
                                    variant="ghost"
                                    disabled={isSubmitting}
                                    className="h-11 border border-gray-700 bg-slate-800"
                                >
                                    <X className="w-5 h-5" />
                                </Button>
                             )}
                            <Button type="submit" isLoading={isSubmitting} className={`h-11 px-6 shrink-0 ${isEditing ? 'bg-orange-600 hover:bg-orange-700' : 'bg-green-600 hover:bg-green-700'}`}>
                                {isEditing ? <Save className="w-5 h-5 mr-2" /> : <Plus className="w-5 h-5 mr-2" />} 
                                {isEditing ? 'Lưu' : 'Thêm'}
                            </Button>
                        </div>
                        </form>

                        <div className="h-px w-full bg-gray-800/50"></div>

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
                                {/* Column Action: Width 1% to shrink fit, nowrap to keep text single line */}
                                <th className="px-2 py-4 border-b border-gray-800 w-[1%] whitespace-nowrap text-center">Hành động</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-800/50">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={currentConfig.fields.length + 1} className="px-6 py-12 text-center text-gray-500">
                                        Đang tải dữ liệu...
                                    </td>
                                </tr>
                            ) : filteredData.length === 0 ? (
                                <tr>
                                    <td colSpan={currentConfig.fields.length + 1} className="px-6 py-12 text-center text-gray-500">
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
                                        
                                        <td className="px-2 py-4 text-center whitespace-nowrap">
                                            <button 
                                                onClick={() => handleEdit(row)}
                                                disabled={isSubmitting}
                                                className="p-2 rounded-lg text-gray-500 hover:bg-blue-500/10 hover:text-blue-500 transition-colors border border-transparent hover:border-blue-500/20"
                                                title="Sửa dòng này"
                                            >
                                                <Pencil className="w-5 h-5" />
                                            </button>
                                        </td>
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