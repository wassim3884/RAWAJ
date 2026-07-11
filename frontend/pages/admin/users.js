import { useEffect, useState } from 'react';
import { LayoutDashboard, Users, Package, Wallet, Settings, Tag, Crown, Truck } from 'lucide-react';
import toast from 'react-hot-toast';
import DashboardSidebar from '../../components/DashboardSidebar';
import api from '../../lib/api';

const links = [
  { href: '/admin/dashboard', label: 'Overview', icon: LayoutDashboard },
  { href: '/admin/users', label: 'Affiliates', icon: Users },
  { href: '/admin/products', label: 'Products', icon: Package },
  { href: '/admin/orders', label: 'Orders', icon: Wallet },
  { href: '/admin/withdrawals', label: 'Withdrawals', icon: Wallet },
  { href: '/admin/delivery-rates', label: 'Delivery Rates', icon: Tag },
  { href: '/admin/wholesale', label: 'Wholesale', icon: Truck },
  { href: '/admin/vip', label: 'VIP', icon: Crown },
  { href: '/admin/settings', label: 'Site Settings', icon: Settings },
];

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [roleFilter, setRoleFilter] = useState('');

  const load = () => api.get('/admin/users', { params: { role: roleFilter || undefined } }).then(({ data }) => setUsers(data.users)).catch(() => {});
  useEffect(() => { load(); }, [roleFilter]);

  const toggleStatus = async (user) => {
    try {
      await api.put(`/admin/users/${user.id}/status`, { isActive: !user.is_active });
      toast.success(user.is_active ? 'User banned.' : 'User reactivated.');
      load();
    } catch {
      toast.error('Failed to update user.');
    }
  };

  return (
    <div className="flex min-h-[80vh] flex-col md:flex-row">
      <DashboardSidebar links={links} />
      <div className="flex-1 p-6">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold">Users</h1>
          <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}
            className="rounded-xl border border-slate-200 px-4 py-2 text-sm dark:border-slate-700 dark:bg-slate-900">
            <option value="">All roles</option>
            <option value="seller">Sellers</option>
            <option value="affiliate">Affiliates</option>
            <option value="customer">Customers</option>
            <option value="admin">Admins</option>
          </select>
        </div>

        <div className="overflow-x-auto rounded-2xl border border-slate-100 dark:border-slate-800">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 dark:bg-slate-900">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Joined</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-t border-slate-100 dark:border-slate-800">
                  <td className="px-4 py-3">{u.full_name}</td>
                  <td className="px-4 py-3">{u.email}</td>
                  <td className="px-4 py-3 capitalize">{u.role}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${u.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {u.is_active ? 'Active' : 'Banned'}
                    </span>
                  </td>
                  <td className="px-4 py-3">{new Date(u.created_at).toLocaleDateString()}</td>
                  <td className="px-4 py-3">
                    <button onClick={() => toggleStatus(u)} className="text-sm font-medium text-primary">
                      {u.is_active ? 'Ban' : 'Reactivate'}
                    </button>
                  </td>
                </tr>
              ))}
              {!users.length && <tr><td colSpan={6} className="px-4 py-6 text-center text-slate-400">No users found.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
