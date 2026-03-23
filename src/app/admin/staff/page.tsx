'use client';

import { useEffect, useState } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';

interface AdminUser {
  id: number;
  username: string;
  email: string;
  full_name: string;
  is_active: number;
  role_id: number;
  roleName: string;
  two_factor_enabled: number;
  two_factor_type: string;
}

interface Role {
  id: number;
  name: string;
  description: string;
}

export default function AdminsPage() {
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newAdmin, setNewAdmin] = useState({
    username: '',
    email: '',
    fullName: '',
    password: '',
    roleId: '',
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [adminsRes, rolesRes] = await Promise.all([
        fetch('/api/admin/staff'),
        fetch('/api/admin/roles'),
      ]);

      const adminsData = await adminsRes.json();
      const rolesData = await rolesRes.json();

      if (adminsData.success) setAdmins(adminsData.data);
      if (rolesData.success) setRoles(rolesData.data);
    } catch (error) {
      console.error('Error fetching admin data:', error);
    } finally {
      setLoading(false);
    }
  };

  const createAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/admin/staff', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newAdmin),
      });

      const data = await response.json();
      if (response.ok) {
        setShowAddModal(false);
        setNewAdmin({ username: '', email: '', fullName: '', password: '', roleId: '' });
        fetchData();
      } else {
        alert(data.message || 'Lỗi khi tạo nhân viên');
      }
    } catch (error) {
      console.error('Error creating admin:', error);
    }
  };

  const updateAdmin = async (id: number, updates: any) => {
    try {
      const response = await fetch('/api/admin/staff', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, ...updates }),
      });

      if (response.ok) {
        fetchData();
      } else {
        alert('Lỗi khi cập nhật nhân viên');
      }
    } catch (error) {
      console.error('Error updating admin:', error);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Quản lý Nhân viên</h1>
            <p className="mt-1 text-sm text-gray-500">Phân quyền và quản lý tài khoản quản trị</p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition shadow-sm font-medium"
          >
            + Thêm nhân viên
          </button>
        </div>

        <div className="bg-white rounded-lg shadow overflow-hidden">
          {loading ? (
            <div className="p-8 text-center">Đang tải...</div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Nhân viên
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Username
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Vai trò (Role)
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    2FA
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Trạng thái
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {admins.map((admin) => (
                  <tr key={admin.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{admin.full_name}</div>
                      <div className="text-sm text-gray-500">{admin.email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {admin.username}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <select
                        value={admin.role_id || ''}
                        onChange={(e) =>
                          updateAdmin(admin.id, { role_id: parseInt(e.target.value) })
                        }
                        className="text-sm border border-gray-300 rounded px-2 py-1 outline-none focus:ring-2 focus:ring-black"
                      >
                        <option value="">Chưa gán</option>
                        {roles.map((role) => (
                          <option key={role.id} value={role.id}>
                            {role.name}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() =>
                          updateAdmin(admin.id, { two_factor_enabled: !admin.two_factor_enabled })
                        }
                        className={`px-3 py-1 text-[10px] font-bold uppercase rounded border ${
                          admin.two_factor_enabled
                            ? 'bg-blue-50 text-blue-700 border-blue-200'
                            : 'bg-gray-50 text-gray-500 border-gray-200'
                        }`}
                      >
                        {admin.two_factor_enabled
                          ? admin.two_factor_type === 'totp'
                            ? 'APP'
                            : 'OTP'
                          : 'OFF'}
                      </button>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => updateAdmin(admin.id, { is_active: !admin.is_active })}
                        className={`px-3 py-1 text-xs font-semibold rounded-full ${
                          admin.is_active
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {admin.is_active ? 'Đang hoạt động' : 'Tạm khóa'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Add Admin Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <h2 className="text-xl font-bold mb-4">Tạo tài khoản Nhân viên</h2>
            <form onSubmit={createAdmin} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Họ tên</label>
                <input
                  type="text"
                  required
                  value={newAdmin.fullName}
                  onChange={(e) => setNewAdmin({ ...newAdmin, fullName: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-black outline-none"
                  placeholder="Nguyễn Văn A"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
                  <input
                    type="text"
                    required
                    value={newAdmin.username}
                    onChange={(e) => setNewAdmin({ ...newAdmin, username: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-black outline-none"
                    placeholder="admin_pro"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Vai trò</label>
                  <select
                    required
                    value={newAdmin.roleId}
                    onChange={(e) => setNewAdmin({ ...newAdmin, roleId: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-black outline-none"
                  >
                    <option value="">Chọn vai trò</option>
                    {roles.map((role) => (
                      <option key={role.id} value={role.id}>
                        {role.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  required
                  value={newAdmin.email}
                  onChange={(e) => setNewAdmin({ ...newAdmin, email: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-black outline-none"
                  placeholder="admin@toanstore.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Mật khẩu</label>
                <input
                  type="password"
                  required
                  value={newAdmin.password}
                  onChange={(e) => setNewAdmin({ ...newAdmin, password: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-black outline-none"
                  placeholder="••••••••"
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition shadow-sm font-medium"
                >
                  Tạo tài khoản
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
