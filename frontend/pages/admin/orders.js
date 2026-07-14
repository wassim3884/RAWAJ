import { useEffect, useState } from 'react';
import { LayoutDashboard, Users, Package, Wallet, Settings, Tag, Phone, Crown, Truck } from 'lucide-react';
import toast from 'react-hot-toast';
import DashboardSidebar from '../../components/DashboardSidebar';
import api from '../../lib/api';

const links = [
  { href: '/admin/dashboard', label: 'نظرة عامة', icon: LayoutDashboard },
  { href: '/admin/users', label: 'المسوّقون', icon: Users },
  { href: '/admin/products', label: 'المنتجات', icon: Package },
  { href: '/admin/orders', label: 'الطلبات', icon: Wallet },
  { href: '/admin/withdrawals', label: 'السحوبات', icon: Wallet },
  { href: '/admin/delivery-rates', label: 'أسعار التوصيل', icon: Tag },
  { href: '/admin/wholesale', label: 'الجملة', icon: Truck },
  { href: '/admin/vip', label: 'VIP', icon: Crown },
  { href: '/admin/settings', label: 'إعدادات الموقع', icon: Settings },
];

const STATUS_OPTIONS = [
  { value: 'pending', label: 'بانتظار الاتصال' },
  { value: 'confirmed', label: 'تم الاتصال' },
  { value: 'no_answer', label: 'تعذّر الوصول' },
  { value: 'processing', label: 'قيد التحضير' },
  { value: 'shipped', label: 'في التوصيل' },
  { value: 'delivered', label: 'تم التوصيل' },
  { value: 'cancelled', label: 'إلغاء' },
  { value: 'refunded', label: 'استرجاع' },
];
const FAILURE_STATUSES = ['no_answer', 'cancelled', 'refunded'];

export default function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [statusFilter, setStatusFilter] = useState('pending');
  const [reasonPrompt, setReasonPrompt] = useState(null); // { orderId, status } | null
  const [reasonText, setReasonText] = useState('');

  const load = () => api.get('/orders', { params: { status: statusFilter || undefined } }).then(({ data }) => setOrders(data.orders)).catch(() => {});
  useEffect(() => { load(); }, [statusFilter]);

  const updateStatus = async (id, status, failureReason) => {
    try {
      await api.put(`/orders/${id}/status`, { status, failureReason });
      toast.success('تم تحديث الطلب.');
      load();
    } catch (err) {
      toast.error(err.response?.data?.error || 'فشل التحديث.');
    }
  };

  const handleStatusClick = (order, status) => {
    if (FAILURE_STATUSES.includes(status)) {
      setReasonPrompt({ orderId: order.id, status });
      setReasonText('');
    } else {
      updateStatus(order.id, status);
    }
  };

  const submitReason = () => {
    if (!reasonText.trim()) {
      toast.error('يرجى كتابة سبب الفشل حتى يراه المسوّق.');
      return;
    }
    updateStatus(reasonPrompt.orderId, reasonPrompt.status, reasonText.trim());
    setReasonPrompt(null);
  };

  return (
    <div className="flex min-h-[80vh] flex-col md:flex-row">
      <DashboardSidebar links={links} />
      <div className="flex-1 p-6">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold">الطلبات — طابور تأكيد المكالمات</h1>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-xl border border-slate-200 px-4 py-2 text-sm dark:border-slate-700 dark:bg-slate-900">
            <option value="">جميع الحالات</option>
            {STATUS_OPTIONS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
        </div>

        <div className="space-y-4">
          {orders.map((o) => (
            <div key={o.id} className="card">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="font-mono text-xs text-slate-400">{o.order_number}</p>
                  <p className="mt-1 font-semibold">{o.product_title}</p>
                  <p className="mt-2 flex items-center gap-2 text-sm">
                    <Phone size={14} className="text-primary" /> {o.buyer_name} — {o.buyer_phone}
                  </p>
                  <p className="text-sm text-slate-500">{o.wilaya_name_ar} / {o.wilaya_name_fr} · {o.delivery_type === 'home' ? 'توصيل منزلي' : 'مكتب / stopdesk'}</p>
                  {o.notes && <p className="mt-1 text-xs italic text-slate-400">&ldquo;{o.notes}&rdquo;</p>}
                  {o.failure_reason && <p className="mt-1 text-xs text-red-500">آخر سبب فشل مسجّل: {o.failure_reason}</p>}
                  <p className="mt-2 text-xs text-slate-400">المسوّق: {o.affiliate_name} ({o.affiliate_email})</p>
                </div>

                <div className="text-right">
                  <p className="text-sm text-slate-500">الإجمالي (عند التسليم)</p>
                  <p className="text-xl font-bold">${Number(o.final_total).toFixed(2)}</p>
                  <p className="text-xs text-slate-400">منتج ${Number(o.product_price).toFixed(2)} + عمولة ${Number(o.commission_amount).toFixed(2)} + توصيل ${Number(o.delivery_fee).toFixed(2)}</p>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-2 border-t border-slate-100 pt-4 dark:border-slate-800">
                {STATUS_OPTIONS.map((s) => (
                  <button
                    key={s.value}
                    onClick={() => handleStatusClick(o, s.value)}
                    className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                      o.order_status === s.value ? 'bg-primary text-white' : 'border border-slate-200 text-slate-500 hover:border-primary hover:text-primary dark:border-slate-700'
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>
          ))}
          {!orders.length && <p className="text-slate-400">لا توجد طلبات بهذه الحالة.</p>}
        </div>
      </div>

      {reasonPrompt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 dark:bg-slate-900">
            <h2 className="mb-2 font-semibold">سبب الفشل</h2>
            <p className="mb-3 text-sm text-slate-500">سيظهر هذا السبب للمسوّق في صفحة طلباته.</p>
            <textarea rows={3} value={reasonText} onChange={(e) => setReasonText(e.target.value)}
              placeholder="مثال: الزبون لم يرد على 3 مكالمات، أو غيّر رأيه بخصوص السعر..."
              className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm dark:border-slate-700 dark:bg-slate-800" />
            <div className="mt-4 flex gap-2">
              <button onClick={submitReason} className="btn-primary flex-1 !py-2 text-sm">تأكيد</button>
              <button onClick={() => setReasonPrompt(null)} className="btn-outline flex-1 !py-2 text-sm">إلغاء</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
