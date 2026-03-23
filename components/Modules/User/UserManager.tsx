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

  const USER_COLUMNS = useMemo(() => [
    { key: 'username', header: 'TÊN ĐĂNG NHẬP', width: 200 },
    { key: 'password', header: 'MẬT KHẨU', width: 150 },
    { key: 'tongKhoVatTu', header: 'TỔNG KHO VẬT TƯ', width: 120 },
    { key: 'nghiepVuWeb', header: 'NGHIỆP VỤ WEB', width: 120 },
    { key: 'nghiepVuMobile', header: 'NGHIỆP VỤ MOBILE', width: 120 },
    { key: 'kiemKeMobile', header: 'KIỂM KÊ MOBILE', width: 120 },
    { key: 'kiemKeWeb', header: 'KIỂM KÊ WEB', width: 120 },
    { key: 'quanLyVatTu', header: 'QUẢN LÝ VẬT TƯ', width: 120 },
  ], []);

  const initialWidths = useMemo(() => {
    const widths: Record<string, number> = {};
    USER_COLUMNS.forEach(col => widths[col.key] = col.width);
    return widths;
  }, [USER_COLUMNS]);

  const { colWidths, handleMouseDown } = useColumnResize(initialWidths);

  const totalTableWidth = useMemo(() => {
    return Object.values(colWidths).reduce((acc, w) => acc + w, 0) + 50;
  }, [colWidths]);

  const [isAdding, setIsAdding] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedUsernames, setSelectedUsernames] = useState<Set<string>>(new Set());
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [newUser, setNewUser] = useState<User>({
    username: '',
    password: '',
    tongKhoVatTu: false,
    nghiepVuWeb: false,
    nghiepVuMobile: false,
    kiemKeMobile: false,
    kiemKeWeb: false,
    quanLyVatTu: false,
  });

  const { data: users = [], isLoading, isFetching, error } = useQuery({
    queryKey: ['users'],
    queryFn: UserService.fetchUsers,
  });

  const updateMutation = useMutation({
    mutationFn: ({ user, operation }: { user: User, operation: 'add' | 'edit' | 'delete' }) => 
      UserService.updateUser(user, operation),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setIsAdding(false);
      setNewUser({
        username: '',
        password: '',
        tongKhoVatTu: false,
        nghiepVuWeb: false,
        nghiepVuMobile: false,
        kiemKeMobile: false,
        kiemKeWeb: false,
        quanLyVatTu: false,
      });
    },
    onError: (err) => {
      alert(`Lỗi: ${err instanceof Error ? err.message : 'Không thể thực hiện thao tác'}`);
    }
  });

  const filteredUsers = useMemo(() => {
    return users.filter(u => u.username.toLowerCase().includes(searchTerm.toLowerCase()));
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
      setSelectedUsernames(new Set(filteredUsers.map(u => u.username)));
    } else {
      setSelectedUsernames(new Set());
    }
  };

  const handleBulkDelete = () => {
    if (selectedUsernames.size === 0) return;
    
    const usersToDelete = users.filter(u => selectedUsernames.has(u.username));
    
    usersToDelete.forEach(user => {
      // Optimistic update
      queryClient.setQueryData(['users'], (old: User[] | undefined) => {
        if (!old) return old;
        return old.filter(u => u.username !== user.username);
      });

      updateMutation.mutate({ user, operation: 'delete' });
    });
    
    setSelectedUsernames(new Set());
  };

  const handleEditClick = () => {
    if (selectedUsernames.size !== 1) return;
    const username = Array.from(selectedUsernames)[0];
    const userToEdit = users.find(u => u.username === username);
    if (userToEdit) {
      setEditingUser({ ...userToEdit });
      setIsEditing(true);
      setIsAdding(false);
    }
  };

  const handleSaveEdit = () => {
    if (!editingUser) return;
    
    // Optimistic update
    queryClient.setQueryData(['users'], (old: User[] | undefined) => {
      if (!old) return old;
      return old.map(u => u.username === editingUser.username ? editingUser : u);
    });

    updateMutation.mutate({ user: editingUser, operation: 'edit' }, {
      onSuccess: () => {
        setIsEditing(false);
        setEditingUser(null);
        setSelectedUsernames(new Set());
      }
    });
  };

  const handleAdd = () => {
    if (!newUser.username) {
      addToast('Vui lòng nhập tên đăng nhập', 'warning');
      return;
    }
    
    updateMutation.mutate({ user: newUser, operation: 'add' });
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
                <label className="block text-xs text-gray-400 uppercase mb-2">Tên đăng nhập</label>
                <input 
                  type="text" 
                  value={newUser.username}
                  onChange={e => setNewUser({...newUser, username: e.target.value})}
                  className="w-full bg-slate-950 border border-white/10 rounded-lg px-4 py-3 text-sm focus:border-brand-purple outline-none transition-colors"
                  placeholder="Nhập tên đăng nhập..."
                />
              </div>
              <div>
                <label className="block text-xs text-gray-400 uppercase mb-2">Mật khẩu</label>
                <input 
                  type="text" 
                  value={newUser.password}
                  onChange={e => setNewUser({...newUser, password: e.target.value})}
                  className="w-full bg-slate-950 border border-white/10 rounded-lg px-4 py-3 text-sm focus:border-brand-purple outline-none transition-colors"
                  placeholder="Nhập mật khẩu..."
                />
              </div>
            </div>
            
            <div className="mb-2">
              <label className="block text-xs text-gray-400 uppercase mb-3">Phân quyền truy cập</label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 bg-slate-950/50 p-4 rounded-lg border border-white/5">
                {[
                  { key: 'tongKhoVatTu', label: 'Tổng kho vật tư' },
                  { key: 'nghiepVuWeb', label: 'Nghiệp vụ Web' },
                  { key: 'nghiepVuMobile', label: 'Nghiệp vụ Mobile' },
                  { key: 'kiemKeMobile', label: 'Kiểm kê Mobile' },
                  { key: 'kiemKeWeb', label: 'Kiểm kê Web' },
                  { key: 'quanLyVatTu', label: 'Quản lý vật tư' }
                ].map(({ key, label }) => (
                  <label key={key} className="flex items-center gap-3 cursor-pointer group">
                    <div className="relative flex items-center justify-center">
                      <input 
                        type="checkbox" 
                        checked={newUser[key as keyof User] as boolean}
                        onChange={e => setNewUser({...newUser, [key]: e.target.checked})}
                        className="sr-only"
                      />
                      <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${
                        newUser[key as keyof User] 
                          ? 'bg-brand-purple border-brand-purple' 
                          : 'bg-slate-900 border-white/20 group-hover:border-brand-purple/50'
                      }`}>
                        {newUser[key as keyof User] && <CheckSquare className="w-4 h-4 text-white" />}
                      </div>
                    </div>
                    <span className="text-sm text-gray-300 group-hover:text-white transition-colors">{label}</span>
                  </label>
                ))}
              </div>
            </div>

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
                <Edit className="w-6 h-6" /> Phân quyền người dùng: <span className="text-white">{editingUser.username}</span>
              </h3>
              <button onClick={() => setIsEditing(false)} className="text-gray-400 hover:text-white transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <label className="block text-xs text-gray-400 uppercase mb-2">Tên đăng nhập</label>
                <input 
                  type="text" 
                  value={editingUser.username}
                  disabled
                  className="w-full bg-slate-950/50 border border-white/5 rounded-lg px-4 py-3 text-sm text-gray-500 cursor-not-allowed outline-none"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-400 uppercase mb-2">Mật khẩu</label>
                <input 
                  type="text" 
                  value={editingUser.password}
                  onChange={e => setEditingUser({...editingUser, password: e.target.value})}
                  className="w-full bg-slate-950 border border-white/10 rounded-lg px-4 py-3 text-sm focus:border-orange-500 outline-none transition-colors"
                  placeholder="Nhập mật khẩu mới..."
                />
              </div>
            </div>
            
            <div className="mb-2">
              <label className="block text-xs text-gray-400 uppercase mb-3">Phân quyền truy cập</label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 bg-slate-950/50 p-4 rounded-lg border border-white/5">
                {[
                  { key: 'tongKhoVatTu', label: 'Tổng kho vật tư' },
                  { key: 'nghiepVuWeb', label: 'Nghiệp vụ Web' },
                  { key: 'nghiepVuMobile', label: 'Nghiệp vụ Mobile' },
                  { key: 'kiemKeMobile', label: 'Kiểm kê Mobile' },
                  { key: 'kiemKeWeb', label: 'Kiểm kê Web' },
                  { key: 'quanLyVatTu', label: 'Quản lý vật tư' }
                ].map(({ key, label }) => (
                  <label key={key} className="flex items-center gap-3 cursor-pointer group">
                    <div className="relative flex items-center justify-center">
                      <input 
                        type="checkbox" 
                        checked={editingUser[key as keyof User] as boolean}
                        onChange={e => setEditingUser({...editingUser, [key]: e.target.checked})}
                        className="sr-only"
                      />
                      <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${
                        editingUser[key as keyof User] 
                          ? 'bg-orange-500 border-orange-500' 
                          : 'bg-slate-900 border-white/20 group-hover:border-orange-500/50'
                      }`}>
                        {editingUser[key as keyof User] && <CheckSquare className="w-4 h-4 text-white" />}
                      </div>
                    </div>
                    <span className="text-sm text-gray-300 group-hover:text-white transition-colors">{label}</span>
                  </label>
                ))}
              </div>
            </div>

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

            {selectedUsernames.size > 0 && (
              <span className="text-sm text-gray-400 ml-2">Đã chọn {selectedUsernames.size}</span>
            )}
          </div>

          <div className="flex items-center gap-3">
            <div className="relative w-[300px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input 
                type="text" 
                placeholder="Tìm kiếm người dùng..." 
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
                    style={{ width: colWidths[col.key], minWidth: colWidths[col.key] }}
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
                    key={user.username} 
                    onClick={() => handleSelectRow(user.username)}
                    className={`h-[36px] transition-all duration-75 group border-l-4 cursor-pointer hover:bg-brand-purple/20 ${selectedUsernames.has(user.username) ? 'bg-brand-purple/10 border-l-brand-purple' : 'border-transparent'} ${index % 2 === 0 ? '' : 'bg-slate-800/30'}`}
                  >
                    <td className="px-4 py-0 border-r border-gray-800 group-hover:border-gray-700 text-center" style={{ width: 50 }} onClick={(e) => e.stopPropagation()}>
                      <input 
                        type="checkbox" 
                        checked={selectedUsernames.has(user.username)}
                        onChange={() => handleSelectRow(user.username)}
                        className="w-4 h-4 rounded border-gray-600 bg-slate-800 text-brand-purple focus:ring-brand-purple/50 cursor-pointer"
                      />
                    </td>
                    <td 
                      style={{ width: colWidths['username'] }}
                      className="px-4 py-0 text-gray-300 text-sm font-bold border-r border-gray-800 group-hover:border-gray-700 overflow-hidden whitespace-nowrap"
                    >
                      <div className="flex items-center h-full w-full">
                        <span className="w-full truncate text-left">{user.username}</span>
                      </div>
                    </td>
                    <td 
                      style={{ width: colWidths['password'] }}
                      className="px-4 py-0 border-r border-gray-800 group-hover:border-gray-700 overflow-hidden whitespace-nowrap"
                    >
                      <div className="flex items-center h-full w-full">
                        <span className="w-full truncate text-left text-sm font-bold text-orange-500">{user.password || '-'}</span>
                      </div>
                    </td>
                    
                    {/* Permissions Checkboxes */}
                    {[
                      'tongKhoVatTu', 
                      'nghiepVuWeb', 
                      'nghiepVuMobile', 
                      'kiemKeMobile', 
                      'kiemKeWeb', 
                      'quanLyVatTu'
                    ].map(field => (
                      <td 
                        key={field} 
                        style={{ width: colWidths[field] }}
                        className="px-4 py-0 text-center border-r border-gray-800 group-hover:border-gray-700 overflow-hidden whitespace-nowrap"
                      >
                        <div className="flex items-center justify-center h-full w-full">
                          <div className="inline-flex items-center justify-center">
                            {user[field as keyof User] ? (
                              <CheckSquare className="w-5 h-5 text-orange-500 fill-orange-500/20" />
                            ) : (
                              <Square className="w-5 h-5 text-gray-600" />
                            )}
                          </div>
                        </div>
                      </td>
                    ))}
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={9} className="px-6 py-12 text-center text-gray-500">
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
