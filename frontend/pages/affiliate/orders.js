import { useEffect, useState } from 'react';
import { LayoutDashboard, Search, Wallet, Bell, ClipboardList, Truck, Crown, Clock, Heart } from 'lucide-react';
import DashboardSidebar from '../../components/DashboardSidebar';
import api from '../../lib/api';
import { formatDZD } from '../../lib/currency';

const links = [
  { href: '/affiliate/dashboard', label: 'نظرة عامة', icon: LayoutDashboard },
  { href: '/affiliate/products', label: 'تصفح المنتجات', icon: Search },
  { href: '/affiliate/upcoming', label: 'قادمة قريبًا', icon: Clock },
  { href: '/affiliate/saved', label: 'المحفوظة', icon: Heart },
  { href: '/affiliate/submit-order', label: 'تقديم عرض', icon: ClipboardList },
  { href: '/affiliate/orders', label: 'طلباتي', icon: Truck },
  { href: '/affiliate/earnings', label: 'الأرباح', icon: Wallet },
  { href: '/affiliate/vip', label: 'VIP', icon: Crown },
  { href: '/affiliate/notifications', label: 'الإشعارات', icon: Bell },
];

const STATUS_META = {
  pending: { label: 'بانتظار الاتصال', color: 'bg-amber-100 text-amber-700' },
  confirmed: { label: 'تم الاتصال', color: 'bg-blue-100 text-blue-700' },
  no_answer: { label: 'تعذّر الوصول للزبون', color: 'bg-orange-100 text-orange-700' },
  processing: { label: 'قيد التحضير', color: 'bg-indigo-100 text-indigo-700' },
  shipped: { label: 'في التوصيل', color: 'bg-purple-100 text-purple-700' },
  delivered: { label: 'تم التوصيل', color: 'bg-green-100 text-green-700' },
  cancelled: { label: 'فشلت العملية', color: 'bg-red-100 text-red-700' },
  refunded: { label: 'تم الاسترجاع', color: 'bg-slate-200 text-slate-700' },
};

export default function AffiliateOrders() {
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    api.get('/orders/mine').then(({ data }) => setOrders(data.orders)).catch(() => {});
  }, []);

  return (
    <div className="flex min-h-[80vh] flex-col md:flex-row">
      <DashboardSidebar links={links} />
      <div className="flex-1 p-6">
        <h1 className="mb-6 text-2xl font-bold">طلباتي المُقدَّمة</h1>

        <div className="space-y-3">
          {orders.map((o) => {
            const meta = STATUS_META[o.order_status] || { label: o.order_status, color: 'bg-slate-100 text-slate-600' };
            const isFailed = ['no_answer', 'cancelled', 'refunded'].includes(o.order_status);
            return (
              <div key={o.id} className="card">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-mono text-xs text-slate-400">{o.order_number}</p>
                    <p className="mt-1 font-semibold">{o.product_title}</p>
                    <p className="text-sm text-slate-500">{o.buyer_name} · {o.buyer_phone}</p>
                    <p className="text-sm text-slate-500">{o.wilaya_name_ar}</p>
                  </div>
                  <div className="text-left">
                    <span className={`inline-block rounded-full px-3 py-1 text-xs font-medium ${meta.color}`}>{meta.label}</span>
                    <p className="mt-2 text-sm text-slate-500">عمولتك: <span className="font-semibold text-accent">{formatDZD(o.commission_amount)}</span></p>
                    <p className="text-sm font-semibold">{formatDZD(o.final_total)}</p>
                  </div>
                </div>

                {/* Simple progress track for the "happy path" */}
                {!isFailed && (
                  <div className="mt-4 flex items-center gap-1">
                    {['pending', 'confirmed', 'processing', 'shipped', 'delivered'].map((step, i, arr) => {
                      const currentIdx = arr.indexOf(o.order_status);
                      const reached = currentIdx >= i;
                      return (
                        <div key={step} className={`h-1.5 flex-1 rounded-full ${reached ? 'bg-primary' : 'bg-slate-100 dark:bg-slate-800'}`} />
                      );
                    })}
                  </div>
                )}

                {isFailed && o.failure_reason && (
                  <p className="mt-3 rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-900/20">
                    السبب: {o.failure_reason}
                  </p>
                )}
              </div>
            );
          })}
          {!orders.length && <p className="text-slate-400">لم تقدّم أي طلب بعد.</p>}
        </div>
      </div>
    </div>
  );
}
