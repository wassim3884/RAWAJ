import { useEffect, useState } from 'react';
import { LayoutDashboard, Users, Package, Wallet, Settings, Tag, Crown, Truck, Store } from 'lucide-react';
import toast from 'react-hot-toast';
import DashboardSidebar from '../../components/DashboardSidebar';
import api from '../../lib/api';

const links = [
  { href: '/admin/dashboard', label: 'نظرة عامة', icon: LayoutDashboard },
  { href: '/admin/users', label: 'المسوّقون', icon: Users },
  { href: '/admin/products', label: 'المنتجات', icon: Package },
  { href: '/admin/orders', label: 'الطلبات', icon: Wallet },
  { href: '/admin/withdrawals', label: 'السحوبات', icon: Wallet },
  { href: '/admin/delivery-rates', label: 'أسعار التوصيل', icon: Truck },
  { href: '/admin/wholesale', label: 'الجملة', icon: Store },
  { href: '/admin/vip', label: 'VIP', icon: Crown },
  { href: '/admin/categories', label: 'التصنيفات', icon: Tag },
  { href: '/admin/settings', label: 'إعدادات الموقع', icon: Settings },
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

  const deleteAffiliate = async (user) => {
    const confirmed = window.confirm(
      `هل أنت متأكد من حذف "${user.full_name}" نهائيًا؟ هذا الإجراء لا يمكن التراجع عنه.`
    );
    if (!confirmed) return;
    try {
      await api.delete(`/admin/users/${user.id}`);
      toast.success('تم حذف المسوّق نهائيًا.');
      load();
    } catch (err) {
      toast.error(err.response?.data?.error || 'فشل حذف المسوّق.');
    }
  };

  return (
    <div className="flex min-h-[80vh] flex-col md:flex-row">
      <DashboardSidebar links={links} />
      <div className="flex-1 p-6">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold">المستخدمون</h1>
          <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}
            className="rounded-xl border border-slate-200 px-4 py-2 text-sm dark:border-slate-700 dark:bg-slate-900">
            <option value="">كل الأدوار</option>
            <option value="seller">البائعون</option>
            <option value="affiliate">المسوّقون</option>
            <option value="customer">الزبائن</option>
            <option value="admin">المدراء</option>
          </select>
        </div>

        <div className="overflow-x-auto rounded-2xl border border-slate-100 dark:border-slate-800">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 dark:bg-slate-900">
              <tr>
                <th className="px-4 py-3">الاسم</th>
                <th className="px-4 py-3">البريد الإلكتروني</th>
                <th className="px-4 py-3">الدور</th>
                <th className="px-4 py-3">الحالة</th>
                <th className="px-4 py-3">تاريخ الانضمام</th>
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
                    {u.role === 'affiliate' && (
                      <button onClick={() => deleteAffiliate(u)} className="mr-3 text-sm font-medium text-red-600">
                        حذف نهائيًا
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {!users.length && <tr><td colSpan={6} className="px-4 py-6 text-center text-slate-400">لا يوجد مستخدمون.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
