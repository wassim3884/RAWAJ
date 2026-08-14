import { useEffect, useState } from 'react';
import { LayoutDashboard, Users, Package, Wallet, Settings, Tag, Crown, Truck, Store } from 'lucide-react';
import toast from 'react-hot-toast';
import DashboardSidebar from '../../components/DashboardSidebar';
import api from '../../lib/api';
import { formatDZD } from '../../lib/currency';

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

const STATUS_OPTIONS = [
  { value: 'pending', label: 'في الانتظار' },
  { value: 'under_review', label: 'يتم التحقق' },
  { value: 'approved', label: 'مؤكدة (48 ساعة)' },
  { value: 'paid', label: 'مدفوعة' },
  { value: 'rejected', label: 'مرفوضة' },
];
const STATUS_COLORS = {
  pending: 'bg-amber-100 text-amber-700',
  under_review: 'bg-blue-100 text-blue-700',
  approved: 'bg-indigo-100 text-indigo-700',
  paid: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-700',
};

function hoursSince(dateStr) {
  if (!dateStr) return null;
  return (Date.now() - new Date(dateStr).getTime()) / 36e5;
}

export default function AdminWithdrawals() {
  const [withdrawals, setWithdrawals] = useState([]);
  const [statusFilter, setStatusFilter] = useState('pending');
  const [noteDraft, setNoteDraft] = useState({});

  const load = () => api.get('/withdrawals', { params: { status: statusFilter || undefined } }).then(({ data }) => setWithdrawals(data.withdrawals)).catch(() => {});
  useEffect(() => { load(); }, [statusFilter]);

  const decide = async (id, decision) => {
    try {
      await api.put(`/withdrawals/${id}/decision`, { decision, adminNote: noteDraft[id] || undefined });
      toast.success('تم تحديث الطلب.');
      load();
    } catch (err) {
      toast.error(err.response?.data?.error || 'فشل التحديث.');
    }
  };

  return (
    <div className="flex min-h-[80vh] flex-col md:flex-row">
      <DashboardSidebar links={links} />
      <div className="flex-1 p-6">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold">طلبات السحب</h1>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-xl border border-slate-200 px-4 py-2 text-sm dark:border-slate-700 dark:bg-slate-900">
            <option value="">جميع الحالات</option>
            {STATUS_OPTIONS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
        </div>

        <div className="space-y-4">
          {withdrawals.map((w) => {
            const hrs = w.status === 'approved' ? hoursSince(w.approved_at) : null;
            const overdue = hrs !== null && hrs > 48;
            return (
              <div key={w.id} className="card">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="font-semibold">{w.full_name} ({w.email})</p>
                    {w.method === 'products' && Array.isArray(w.payout_details?.products) ? (
                      <div className="mt-1 text-sm text-slate-500">
                        <p className="font-medium">استلام كمنتجات:</p>
                        <ul className="list-inside list-disc">
                          {w.payout_details.products.map((p, i) => <li key={i}>{p.title} — {Number(p.price).toLocaleString('en-US', { minimumFractionDigits: 2 })} د.ج</li>)}
                        </ul>
                      </div>
                    ) : (
                      <p className="text-sm text-slate-500">الطريقة: {w.method} · التفاصيل: {w.payout_details?.contact || JSON.stringify(w.payout_details)}</p>
                    )}
                    <p className="text-xs text-slate-400">طُلب في {new Date(w.requested_at).toLocaleString()}</p>
                    {w.status === 'approved' && (
                      <p className={`mt-1 text-xs font-medium ${overdue ? 'text-red-500' : 'text-indigo-500'}`}>
                        {overdue ? `⚠ تجاوز 48 ساعة (${Math.floor(hrs)} ساعة)` : `متبقٍ ${Math.max(0, Math.ceil(48 - hrs))} ساعة على الموعد النهائي`}
                      </p>
                    )}
                  </div>
                  <div className="text-left">
                    <span className={`inline-block rounded-full px-3 py-1 text-xs font-medium ${STATUS_COLORS[w.status]}`}>
                      {STATUS_OPTIONS.find((s) => s.value === w.status)?.label}
                    </span>
                    <p className="mt-2 text-xl font-bold">{formatDZD(w.amount)}</p>
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-4 dark:border-slate-800">
                  <input
                    placeholder="ملاحظة (اختياري)"
                    value={noteDraft[w.id] || ''}
                    onChange={(e) => setNoteDraft({ ...noteDraft, [w.id]: e.target.value })}
                    className="w-48 rounded-lg border border-slate-200 px-3 py-1.5 text-xs dark:border-slate-700 dark:bg-slate-900"
                  />
                  {STATUS_OPTIONS.map((s) => (
                    <button
                      key={s.value}
                      onClick={() => decide(w.id, s.value)}
                      disabled={w.status === s.value}
                      className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                        w.status === s.value ? 'bg-primary text-white' : 'border border-slate-200 text-slate-500 hover:border-primary hover:text-primary dark:border-slate-700'
                      }`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
          {!withdrawals.length && <p className="text-slate-400">لا توجد طلبات سحب بهذه الحالة.</p>}
        </div>
      </div>
    </div>
  );
}
