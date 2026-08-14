import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { LayoutDashboard, Users, Package, Wallet, Settings, Tag, Crown, Truck, Store, Phone } from 'lucide-react';
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
  { href: '/admin/settings', label: 'إعدادات الموقع', icon: Settings },
];

const STATUS_OPTIONS = [
  { value: 'pending', label: 'جديد' },
  { value: 'contacted', label: 'تم التواصل' },
  { value: 'closed', label: 'مغلق' },
];
const STATUS_COLORS = {
  pending: 'bg-amber-100 text-amber-700',
  contacted: 'bg-blue-100 text-blue-700',
  closed: 'bg-slate-200 text-slate-600',
};

export default function WholesaleSearchRequests() {
  const [requests, setRequests] = useState([]);
  const [statusFilter, setStatusFilter] = useState('pending');

  const load = () => api.get('/wholesale/search-requests', { params: { status: statusFilter || undefined } })
    .then(({ data }) => setRequests(data.requests)).catch(() => {});
  useEffect(() => { load(); }, [statusFilter]);

  const updateStatus = async (id, status) => {
    try {
      await api.put(`/wholesale/search-requests/${id}`, { status });
      toast.success('تم التحديث.');
      load();
    } catch {
      toast.error('فشل التحديث.');
    }
  };

  return (
    <div className="flex min-h-[80vh] flex-col md:flex-row">
      <DashboardSidebar links={links} />
      <div className="flex-1 p-6">
        <div className="mb-2 flex items-center justify-between">
          <h1 className="text-2xl font-bold">طلبات البحث عن منتجات</h1>
          <Link href="/admin/wholesale" className="text-sm font-medium text-primary">← إدارة كتالوج الجملة</Link>
        </div>
        <p className="mb-6 text-sm text-slate-500 dark:text-slate-400">
          طلبات وصلت من تجار يبحثون عن منتج غير موجود في الكتالوج. ابحث عن المنتج، حدّد سعره وأصغر كمية، ثم راسلهم على واتساب.
        </p>

        <div className="mb-6">
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-xl border border-slate-200 px-4 py-2 text-sm dark:border-slate-700 dark:bg-slate-900">
            <option value="">جميع الحالات</option>
            {STATUS_OPTIONS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
        </div>

        <div className="space-y-4">
          {requests.map((r) => (
            <div key={r.id} className="card">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="max-w-xl">
                  <p className="whitespace-pre-line text-sm">{r.description}</p>
                  <p className="mt-2 flex items-center gap-2 text-sm text-primary">
                    <Phone size={14} /> {r.whatsapp_number}
                    <a href={`https://wa.me/${r.whatsapp_number.replace(/^0/, '213')}`} target="_blank" rel="noreferrer" className="underline">
                      فتح واتساب
                    </a>
                  </p>
                  <p className="mt-1 text-xs text-slate-400">{new Date(r.created_at).toLocaleString()}</p>
                </div>
                <span className={`rounded-full px-3 py-1 text-xs font-medium ${STATUS_COLORS[r.status]}`}>
                  {STATUS_OPTIONS.find((s) => s.value === r.status)?.label}
                </span>
              </div>

              {Array.isArray(r.image_urls) && r.image_urls.length > 0 && (
                <div className="mt-3 flex gap-2">
                  {r.image_urls.map((url, i) => (
                    <a key={i} href={url} target="_blank" rel="noreferrer" className="relative h-16 w-16 overflow-hidden rounded-lg">
                      <Image src={url} alt="" fill className="object-cover" />
                    </a>
                  ))}
                </div>
              )}

              <div className="mt-4 flex flex-wrap gap-2 border-t border-slate-100 pt-4 dark:border-slate-800">
                {STATUS_OPTIONS.map((s) => (
                  <button key={s.value} onClick={() => updateStatus(r.id, s.value)}
                    disabled={r.status === s.value}
                    className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                      r.status === s.value ? 'bg-primary text-white' : 'border border-slate-200 text-slate-500 hover:border-primary hover:text-primary dark:border-slate-700'
                    }`}>
                    {s.label}
                  </button>
                ))}
              </div>
            </div>
          ))}
          {!requests.length && <p className="text-slate-400">لا توجد طلبات بهذه الحالة.</p>}
        </div>
      </div>
    </div>
  );
}
