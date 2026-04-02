import React, { useState, useMemo } from 'react';
import { Users, UserPlus, Shield, Search, Trash2, Save, X, CheckSquare, Square, Loader2, Edit, RefreshCw } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { UserService } from '../../../services/user';
import { User } from '../../../types';
import { useColumnResize } from '../../../hooks/useColumnResize';

import { useToast } from '../../../contexts/ToastContext';

export const UserManager: React.FC = () => {
  const queryClient = useQueryClient();
  const { addToast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');

  const [isAdding, setIsAdding] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedUsernames, setSelectedUsernames] = useState<Set<string>>(new Set());
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [newUser, setNewUser] = useState<User>({});

  const { data, isLoading, isFetching, error } = useQuery({
    queryKey: ['users'],
    queryFn: UserService.fetchUsers,
  });

  const users = data?.users || [];
  const headers = data?.headers || [];

  const getValByHeader = (u: any, header: string, index: number) => {
    if (!u) return '';
    if (typeof u === 'string') return index === 0 ? u : '';
    
    const search = (obj: any): any => {
      if (!obj) return undefined;
      if (typeof obj !== 'object') return obj;
      
      let val = undefined;
      if (Array.isArray(obj)) {
        val = obj[index];
      } else {
        if (obj[header] !== undefined) val = obj[header];
        else {
          const keys = Object.keys(obj);
          const target = (header || '').toLowerCase().trim();
          const foundKey = keys.find(k => (k || '').toLowerCase().trim() === target);
          if (foundKey) val = obj[foundKey];
          else if (obj[index] !== undefined) val = obj[index];
          else if (obj[String(index)] !== undefined) val = obj[String(index)];
        }
      }
      
      // Handle { v: value } structure common in some GAS responses
      if (val && typeof val === 'object' && !Array.isArray(val) && val.v !== undefined) return val.v;
      return val;
    };

    let val = search(u);
    if (val === undefined && u.data) val = search(u.data);
    if (val === undefined && u.values) val = search(u.values);
    if (val === undefined && u.row) val = search(u.row);
    if (val === undefined && u.c) val = search(u.c); // Common in GAS
    
    return val !== undefined ? val : '';
  };

  const getUsername = (u: User) => {
    if (!u) return '';
    if (u.username !== undefined && !Array.isArray(u)) return u.username;
    return getValByHeader(u, headers[0], 0);
  };
  
  const getPassword = (u: User) => {
    if (!u) return '';
    if (u.password !== undefined && !Array.isArray(u)) return u.password;
    return getValByHeader(u, headers[1], 1);
  };

  const getPermissionVal = (u: User, item: { key: string, originalKey: string, index: number }) => {
    if (!u) return undefined;
    return getValByHeader(u, item.originalKey, item.index);
  };

  const USER_COLUMNS = useMemo(() => {
    if (headers.length === 0) return [];
    return headers.map((header, index) => ({
      key: `${header}-${index}`,
      originalKey: header,
      header: header.toUpperCase(),
      width: index < 2 ? (index === 0 ? 200 : 150) : 150
    }));
  }, [headers]);

  const permissionKeys = useMemo(() => {
    if (headers.length <= 2) return [];
    return headers.slice(2).map((header, index) => ({
      key: `${header}-${index + 2}`,
      originalKey: header,
      index: index + 2
    }));
  }, [headers]);

  const columnTypes = useMemo(() => {
    const types: Record<string, 'boolean' | 'string'> = {};
    permissionKeys.forEach(item => {
      let hasString = false;
      for (const user of users) {
        const val = getPermissionVal(user, item);
        if (typeof val === 'string' && val !== '' && val.toUpperCase() !== 'TRUE' && val.toUpperCase() !== 'FALSE') {
          hasString = true;
          break;
        }
      }
      types[item.key] = hasString ? 'string' : 'boolean';
    });
    return types;
  }, [permissionKeys, users]);

  const textFields = useMemo(() => permissionKeys.filter(item => columnTypes[item.key] === 'string'), [permissionKeys, columnTypes]);
  const booleanFields = useMemo(() => permissionKeys.filter(item => columnTypes[item.key] === 'boolean'), [permissionKeys, columnTypes]);

  const initialWidths = useMemo(() => {
    const widths: Record<string, number> = {};
    USER_COLUMNS.forEach(col => widths[col.key] = col.width);
    return widths;
  }, [USER_COLUMNS]);

  const { colWidths, handleMouseDown } = useColumnResize(initialWidths);

  const totalTableWidth = useMemo(() => {
    const columnsWidth = USER_COLUMNS.reduce((acc, col) => acc + (colWidths[col.key] || col.width), 0);
    return columnsWidth + 50; // 50px for checkbox column
  }, [colWidths, USER_COLUMNS]);

  const updateMutation = useMutation({
    mutationFn: ({ user, operation }: { user: User, operation: 'add' | 'edit' | 'delete' }) => 
      UserService.updateUser(user, operation),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
    onError: (err) => {
      addToast(`Lỗi: ${err instanceof Error ? err.message : 'Không thể thực hiện thao tác'}`, 'error');
      // Invalidate to sync back with server state if optimistic update failed
      queryClient.invalidateQueries({ queryKey: ['users'] });
    }
  });

  const filteredUsers = useMemo(() => {
    return users.filter(u => String(getUsername(u)).toLowerCase().includes((searchTerm || '').toLowerCase()));
  }, [users, searchTerm]);

  const handleSelectRow = (username: string) => {
    const newSet = new Set(selectedUsernames);
    if (newSet.has(username)) {
      newSet.delete(username);
    } else {
      newSet.add(username);
    }
    setSelectedUsernames(newSet);
  };

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedUsernames(new Set(filteredUsers.map(u => getUsername(u))));
    } else {
      setSelectedUsernames(new Set());
    }
  };

  const handleBulkDelete = () => {
    if (selectedUsernames.size === 0) return;
    
    const usersToDelete = users.filter(u => selectedUsernames.has(getUsername(u)));
    
    usersToDelete.forEach(user => {
      // Optimistic update
      queryClient.setQueryData(['users'], (old: User[] | undefined) => {
        if (!old) return old;
        return old.filter(u => getUsername(u) !== getUsername(user));
      });

      updateMutation.mutate({ user, operation: 'delete' });
    });
    
    setSelectedUsernames(new Set());
  };

  const handleEditClick = () => {
    if (selectedUsernames.size !== 1) return;
    const username = Array.from(selectedUsernames)[0];
    const userToEdit = users.find(u => getUsername(u) === username);
    if (userToEdit) {
      setEditingUser({ ...userToEdit });
      setIsEditing(true);
      setIsAdding(false);
    }
  };

  const handleSaveEdit = () => {
    if (!editingUser) return;
    
    // Close modal immediately for better UX
    setIsEditing(false);
    setEditingUser(null);
    setSelectedUsernames(new Set());

    // Optimistic update
    queryClient.setQueryData(['users'], (old: { users: User[], headers: string[] } | undefined) => {
      if (!old) return old;
      return {
        ...old,
        users: old.users.map(u => getUsername(u) === getUsername(editingUser) ? editingUser : u)
      };
    });

    updateMutation.mutate({ user: editingUser, operation: 'edit' });
  };

  const handleAdd = () => {
    if (!getUsername(newUser)) {
      addToast('Vui lòng nhập tên đăng nhập', 'warning');
      return;
    }
    
    // Check if user already exists in local state to prevent duplicate keys
    const exists = users.some(u => String(getUsername(u)).toLowerCase() === String(getUsername(newUser)).toLowerCase());
    if (exists) {
      addToast('Tài khoản đã tồn tại trong danh sách', 'error');
      return;
    }

    // Close modal immediately
    setIsAdding(false);
    const userToAdd = { ...newUser };
    
    // Reset form
    setNewUser({});

    // Optimistic update
    queryClient.setQueryData(['users'], (old: { users: User[], headers: string[] } | undefined) => {
      if (!old) return old;
      return {
        ...old,
        users: [...old.users, userToAdd]
      };
    });

    updateMutation.mutate({ user: userToAdd, operation: 'add' });
  };

  // filteredUsers moved up

  if (isLoading) return (
    <div className="flex-1 flex items-center justify-center bg-slate-950">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="w-12 h-12 text-emerald-500 animate-spin" />
        <p className="text-gray-400 animate-pulse">Đang tải danh sách người dùng...</p>
      </div>
    </div>
  );

  if (error) return (
    <div className="flex-1 flex items-center justify-center bg-slate-950 p-6">
      <div className="bg-red-500/10 border border-red-500/20 p-6 rounded-2xl max-w-md text-center">
        <Shield className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-white mb-2">Lỗi kết nối</h2>
        <p className="text-red-400 mb-6">{(error as Error).message}</p>
        <button 
          onClick={() => queryClient.invalidateQueries({ queryKey: ['users'] })}
          className="bg-red-500 hover:bg-red-600 text-white px-6 py-2 rounded-lg transition-all"
        >
          Thử lại
        </button>
      </div>
    </div>
  );

  return (
    <div className="w-full h-full flex flex-col">
      {/* Add User Modal */}
      {isAdding && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-brand-purple/30 p-6 rounded-xl w-full max-w-4xl shadow-2xl animate-fade-in">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-brand-purple flex items-center gap-2">
                <UserPlus className="w-6 h-6" /> Thêm người dùng mới
              </h3>
              <button onClick={() => setIsAdding(false)} className="text-gray-400 hover:text-white transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <label className="block text-xs text-gray-400 uppercase mb-2">{headers[0] || 'Tên đăng nhập'}</label>
                <input 
                  type="text" 
                  value={getUsername(newUser)}
                  onChange={e => {
                    const key = headers[0] || 'username';
                    setNewUser({...newUser, [key]: e.target.value});
                  }}
                  className="w-full bg-slate-950 border border-white/10 rounded-lg px-4 py-3 text-sm focus:border-brand-purple outline-none transition-colors"
                  placeholder={`Nhập ${headers[0] ? String(headers[0]).toLowerCase() : 'tên đăng nhập'}...`}
                />
              </div>
              <div>
                <label className="block text-xs text-gray-400 uppercase mb-2">{headers[1] || 'Mật khẩu'}</label>
                <input 
                  type="text" 
                  value={getPassword(newUser)}
                  onChange={e => {
                    const key = headers[1] || 'password';
                    setNewUser({...newUser, [key]: e.target.value});
                  }}
                  className="w-full bg-slate-950 border border-white/10 rounded-lg px-4 py-3 text-sm focus:border-brand-purple outline-none transition-colors"
                  placeholder={`Nhập ${headers[1] ? String(headers[1]).toLowerCase() : 'mật khẩu'}...`}
                />
              </div>
              {textFields.map(field => (
                <div key={field.key}>
                  <label className="block text-xs text-gray-400 uppercase mb-2">{field.originalKey}</label>
                  <input 
                    type="text" 
                    value={newUser[field.originalKey] as string || ''}
                    onChange={e => setNewUser({...newUser, [field.originalKey]: e.target.value})}
                    className="w-full bg-slate-950 border border-white/10 rounded-lg px-4 py-3 text-sm focus:border-brand-purple outline-none transition-colors"
                    placeholder={`Nhập ${String(field.originalKey).toLowerCase()}...`}
                  />
                </div>
              ))}
            </div>
            
            {booleanFields.length > 0 && (
              <div className="mb-2">
                <label className="block text-xs text-gray-400 uppercase mb-3">Phân quyền truy cập</label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 bg-slate-950/50 p-4 rounded-lg border border-white/5">
                  {booleanFields.map((field) => (
                    <label key={field.key} className="flex items-center gap-3 cursor-pointer group">
                      <div className="relative flex items-center justify-center">
                        <input 
                          type="checkbox" 
                          checked={newUser[field.originalKey] as boolean || false}
                          onChange={e => setNewUser({...newUser, [field.originalKey]: e.target.checked})}
                          className="sr-only"
                        />
                        <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${
                          newUser[field.originalKey] 
                            ? 'bg-brand-purple border-brand-purple' 
                            : 'bg-slate-900 border-white/20 group-hover:border-brand-purple/50'
                        }`}>
                          {newUser[field.originalKey] && <CheckSquare className="w-4 h-4 text-white" />}
                        </div>
                      </div>
                      <span className="text-sm text-gray-300 group-hover:text-white transition-colors">{field.originalKey}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-end gap-3 mt-8">
              <button 
                onClick={() => setIsAdding(false)}
                className="px-6 py-2.5 rounded-lg text-sm font-medium text-gray-400 hover:text-white hover:bg-white/5 transition-all"
              >
                Hủy
              </button>
              <button 
                onClick={handleAdd}
                className="flex items-center gap-2 bg-brand-purple hover:bg-brand-purple/80 text-white px-6 py-2.5 rounded-lg transition-all shadow-lg shadow-brand-purple/20"
              >
                <Save className="w-4 h-4" />
                <span>Lưu người dùng</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {isEditing && editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-orange-500/30 p-6 rounded-xl w-full max-w-4xl shadow-2xl animate-fade-in">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-orange-500 flex items-center gap-2">
                <Edit className="w-6 h-6" /> Phân quyền người dùng: <span className="text-white">{getUsername(editingUser)}</span>
              </h3>
              <button onClick={() => setIsEditing(false)} className="text-gray-400 hover:text-white transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <label className="block text-xs text-gray-400 uppercase mb-2">{headers[0] || 'Tên đăng nhập'}</label>
                <input 
                  type="text" 
                  value={getUsername(editingUser)}
                  disabled
                  className="w-full bg-slate-950/50 border border-white/5 rounded-lg px-4 py-3 text-sm text-gray-500 cursor-not-allowed outline-none"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-400 uppercase mb-2">{headers[1] || 'Mật khẩu'}</label>
                <input 
                  type="text" 
                  value={getPassword(editingUser)}
                  onChange={e => {
                    const key = headers[1] || 'password';
                    setEditingUser({...editingUser, [key]: e.target.value});
                  }}
                  className="w-full bg-slate-950 border border-white/10 rounded-lg px-4 py-3 text-sm focus:border-orange-500 outline-none transition-colors"
                  placeholder={`Nhập ${headers[1] ? String(headers[1]).toLowerCase() : 'mật khẩu mới'}...`}
                />
              </div>
              {textFields.map(field => (
                <div key={field.key}>
                  <label className="block text-xs text-gray-400 uppercase mb-2">{field.originalKey}</label>
                  <input 
                    type="text" 
                    value={editingUser[field.originalKey] as string || ''}
                    onChange={e => setEditingUser({...editingUser, [field.originalKey]: e.target.value})}
                    className="w-full bg-slate-950 border border-white/10 rounded-lg px-4 py-3 text-sm focus:border-orange-500 outline-none transition-colors"
                    placeholder={`Nhập ${String(field.originalKey).toLowerCase()}...`}
                  />
                </div>
              ))}
            </div>
            
            {booleanFields.length > 0 && (
              <div className="mb-2">
                <label className="block text-xs text-gray-400 uppercase mb-3">Phân quyền truy cập</label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 bg-slate-950/50 p-4 rounded-lg border border-white/5">
                  {booleanFields.map((field) => (
                    <label key={field.key} className="flex items-center gap-3 cursor-pointer group">
                      <div className="relative flex items-center justify-center">
                        <input 
                          type="checkbox" 
                          checked={editingUser[field.originalKey] as boolean || false}
                          onChange={e => setEditingUser({...editingUser, [field.originalKey]: e.target.checked})}
                          className="sr-only"
                        />
                        <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${
                          editingUser[field.originalKey] 
                            ? 'bg-orange-500 border-orange-500' 
                            : 'bg-slate-900 border-white/20 group-hover:border-orange-500/50'
                        }`}>
                          {editingUser[field.originalKey] && <CheckSquare className="w-4 h-4 text-white" />}
                        </div>
                      </div>
                      <span className="text-sm text-gray-300 group-hover:text-white transition-colors">{field.originalKey}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-end gap-3 mt-8">
              <button 
                onClick={() => setIsEditing(false)}
                className="px-6 py-2.5 rounded-lg text-sm font-medium text-gray-400 hover:text-white hover:bg-white/5 transition-all"
              >
                Hủy
              </button>
              <button 
                onClick={handleSaveEdit}
                className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-6 py-2.5 rounded-lg transition-all shadow-lg shadow-orange-500/20"
              >
                <Save className="w-4 h-4" />
                <span>Lưu thay đổi</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 w-full flex flex-col relative focus:outline-none focus:ring-2 focus:ring-brand-purple/50 bg-slate-900 border border-gray-800 rounded-xl shadow-xl overflow-hidden">
        {/* Toolbar */}
        <div className="p-4 border-b border-gray-800 bg-slate-950/50 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            {selectedUsernames.size > 0 && (
              <span className="text-sm text-gray-400 ml-2 whitespace-nowrap animate-fade-in">
                Đã chọn <span className="text-brand-purple font-bold">{selectedUsernames.size}</span> người dùng
              </span>
            )}
          </div>

          <div className="flex items-center gap-3">
            <button 
              onClick={() => { setIsAdding(!isAdding); setIsEditing(false); }}
              className="h-10 px-4 flex items-center gap-2 bg-brand-purple hover:bg-brand-purple/80 border border-brand-purple/50 text-white rounded-lg text-sm font-medium transition-all hover:shadow-lg active:scale-95 whitespace-nowrap shadow-lg shadow-brand-purple/20"
            >
              {isAdding ? <X className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
              <span className="hidden sm:inline">{isAdding ? 'Hủy' : 'Thêm'}</span>
            </button>

            <button 
              onClick={handleEditClick}
              disabled={selectedUsernames.size !== 1}
              className="h-10 px-4 flex items-center gap-2 bg-orange-500 hover:bg-orange-600 border border-orange-400 text-white rounded-lg text-sm font-medium transition-all hover:shadow-lg active:scale-95 whitespace-nowrap shadow-lg shadow-orange-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Edit className="w-4 h-4" />
              <span className="hidden sm:inline">Sửa</span>
            </button>

            <button 
              onClick={handleBulkDelete}
              disabled={selectedUsernames.size === 0}
              className="h-10 px-4 flex items-center gap-2 bg-red-500 hover:bg-red-600 border border-red-400 text-white rounded-lg text-sm font-medium transition-all hover:shadow-lg active:scale-95 whitespace-nowrap shadow-lg shadow-red-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Trash2 className="w-4 h-4" />
              <span className="hidden sm:inline">Xóa</span>
            </button>

            <div className="h-6 w-px bg-gray-800 mx-1"></div>

            <div className="relative w-full max-w-[250px] lg:max-w-[300px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input 
                type="text" 
                placeholder="Tìm kiếm..." 
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-10 pr-4 py-2 text-sm text-white focus:outline-none focus:border-brand-purple transition-all placeholder:text-gray-600"
              />
            </div>

            <button 
              onClick={() => queryClient.invalidateQueries({ queryKey: ['users'] })}
              className="h-10 px-4 flex items-center gap-2 bg-blue-600 hover:bg-blue-700 border border-blue-500 text-white rounded-lg transition-all hover:shadow-lg active:scale-95 whitespace-nowrap"
              title="Làm mới dữ liệu"
              disabled={isFetching}
            >
              <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin' : ''}`} />
              <span className="hidden md:inline">Làm Mới</span>
            </button>
          </div>
        </div>

        {/* Table Area */}
        <div className="flex-1 overflow-auto custom-scrollbar relative will-change-scroll opacity-100">
          <table className="text-left border-collapse" style={{ tableLayout: 'fixed', width: totalTableWidth }}>
            <thead className="bg-slate-950 text-white text-base uppercase font-bold sticky top-0 z-20 shadow-sm ring-1 ring-white/5">
              <tr>
                <th className="px-4 py-4 whitespace-nowrap border-b border-r border-gray-800 bg-slate-950 transition-colors duration-200 select-none group w-[50px] text-center">
                  <input 
                    type="checkbox" 
                    checked={filteredUsers.length > 0 && selectedUsernames.size === filteredUsers.length}
                    onChange={handleSelectAll}
                    className="w-4 h-4 rounded border-gray-600 bg-slate-800 text-brand-purple focus:ring-brand-purple/50 cursor-pointer"
                  />
                </th>
                {USER_COLUMNS.map((col) => (
                  <th 
                    key={col.key}
                    style={{ width: colWidths[col.key] || col.width, minWidth: colWidths[col.key] || col.width }}
                    className="relative px-4 py-4 whitespace-nowrap border-b border-r border-gray-800 bg-slate-950 transition-colors duration-200 select-none group"
                  >
                    <div className="flex items-center justify-center gap-2 w-full h-full">
                      <span className="truncate">{col.header}</span>
                    </div>
                    <div
                      className="absolute right-0 top-0 bottom-0 w-1.5 cursor-col-resize hover:bg-brand-purple/50 z-30"
                      onMouseDown={(e) => handleMouseDown(e, col.key)}
                    />
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/50">
              {filteredUsers.length > 0 ? (
                filteredUsers.map((user, index) => (
                  <tr 
                    key={getUsername(user)} 
                    onClick={() => handleSelectRow(getUsername(user))}
                    className={`h-[36px] transition-all duration-75 group border-l-4 cursor-pointer hover:bg-brand-purple/20 ${selectedUsernames.has(getUsername(user)) ? 'bg-brand-purple/10 border-l-brand-purple' : 'border-transparent'} ${index % 2 === 0 ? '' : 'bg-slate-800/30'}`}
                  >
                    <td className="px-4 py-0 border-r border-gray-800 group-hover:border-gray-700 text-center" style={{ width: 50 }} onClick={(e) => e.stopPropagation()}>
                      <input 
                        type="checkbox" 
                        checked={selectedUsernames.has(getUsername(user))}
                        onChange={() => handleSelectRow(getUsername(user))}
                        className="w-4 h-4 rounded border-gray-600 bg-slate-800 text-brand-purple focus:ring-brand-purple/50 cursor-pointer"
                      />
                    </td>
                    <td 
                      style={{ width: colWidths[headers[0]] || 200 }}
                      className="px-4 py-0 text-gray-300 text-sm font-bold border-r border-gray-800 group-hover:border-gray-700 overflow-hidden whitespace-nowrap"
                    >
                      <div className="flex items-center h-full w-full">
                        <span className="w-full truncate text-left">{getUsername(user)}</span>
                      </div>
                    </td>
                    <td 
                      style={{ width: colWidths[headers[1]] || 150 }}
                      className="px-4 py-0 border-r border-gray-800 group-hover:border-gray-700 overflow-hidden whitespace-nowrap"
                    >
                      <div className="flex items-center h-full w-full">
                        <span className="w-full truncate text-left text-sm font-bold text-orange-500">{getPassword(user) || '-'}</span>
                      </div>
                    </td>
                    
                    {/* Dynamic Columns */}
                    {permissionKeys.map(field => {
                      const isBoolean = columnTypes[field.key] === 'boolean';
                      const val = getPermissionVal(user, field);
                      
                      return (
                        <td 
                          key={field.key} 
                          style={{ width: colWidths[field.key] || 150 }}
                          className={`px-4 py-0 border-r border-gray-800 group-hover:border-gray-700 overflow-hidden whitespace-nowrap ${isBoolean ? 'text-center' : 'text-left'}`}
                        >
                          <div className={`flex items-center h-full w-full ${isBoolean ? 'justify-center' : 'justify-start'}`}>
                            {isBoolean ? (
                              <div className="inline-flex items-center justify-center">
                                {val ? (
                                  <CheckSquare className="w-5 h-5 text-orange-500 fill-orange-500/20" />
                                ) : (
                                  <Square className="w-5 h-5 text-gray-600" />
                                )}
                              </div>
                            ) : (
                              <span className="truncate text-gray-300">{val || '-'}</span>
                            )}
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={USER_COLUMNS.length + 1} className="px-6 py-12 text-center text-gray-500">
                    Không tìm thấy người dùng nào
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
