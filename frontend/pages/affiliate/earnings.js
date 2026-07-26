import { useEffect, useState } from 'react';
import { LayoutDashboard, Search, Wallet, Bell, ClipboardList, Truck, Crown, MapPin, Clock, Heart, Package } from 'lucide-react';
import toast from 'react-hot-toast';
import DashboardSidebar from '../../components/DashboardSidebar';
import api from '../../lib/api';
import { formatDZD } from '../../lib/currency';

const links = [
  { href: '/affiliate/dashboard', label: 'نظرة عامة', icon: LayoutDashboard },
  { href: '/affiliate/products', label: 'منتجات', icon: Search },
  { href: '/affiliate/upcoming', label: 'قادمة قريبًا', icon: Clock },
  { href: '/affiliate/saved', label: 'المحفوظة', icon: Heart }, { href: '/affiliate/delivery-rates', label: 'أسعار التوصيل', icon: MapPin },  
  { href: '/affiliate/orders', label: 'طلباتي', icon: Truck },
  { href: '/affiliate/earnings', label: 'الأرباح', icon: Wallet },
  { href: '/affiliate/vip', label: 'VIP', icon: Crown },
  { href: '/affiliate/notifications', label: 'الإشعارات', icon: Bell },
];

export default function AffiliateEarnings() {
  const [stats, setStats] = useState(null);
  const [withdrawals, setWithdrawals] = useState([]);
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState('baridimob');
  const [payoutContact, setPayoutContact] = useState('');
  const [catalogProducts, setCatalogProducts] = useState([]);
  const [selectedProductIds, setSelectedProductIds] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  const load = () => {
    api.get('/affiliate/stats').then(({ data }) => setStats(data)).catch(() => {});
    api.get('/withdrawals/mine').then(({ data }) => setWithdrawals(data.withdrawals)).catch(() => {});
  };
  useEffect(load, []);

  useEffect(() => {
    if (method === 'products' && !catalogProducts.length) {
      api.get('/products').then(({ data }) => setCatalogProducts(data.products)).catch(() => {});
    }
  }, [method]);

  const toggleProduct = (id) => {
    setSelectedProductIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const selectedProductsValue = catalogProducts
    .filter((p) => selectedProductIds.includes(p.id))
    .reduce((sum, p) => sum + Number(p.price), 0);

  const submitWithdrawal = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (method === 'products') {
        if (!selectedProductIds.length) {
          toast.error('اختر منتجًا واحدًا على الأقل.');
          setSubmitting(false);
          return;
        }
        const chosenProducts = catalogProducts.filter((p) => selectedProductIds.includes(p.id));
        await api.post('/withdrawals', {
          amount: selectedProductsValue,
          method: 'products',
          payoutDetails: { products: chosenProducts.map((p) => ({ id: p.id, title: p.title, price: p.price })) },
        });
      } else {
        await api.post('/withdrawals', { amount: Number(amount), method, payoutDetails: { contact: payoutContact } });
      }
      toast.success('تم إرسال طلب السحب!');
      setAmount(''); setPayoutContact(''); setSelectedProductIds([]);
      load();
    } catch (err) {
      toast.error(err.response?.data?.error || 'فشل الطلب.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-[80vh] flex-col md:flex-row">
      <DashboardSidebar links={links} />
      <div className="flex-1 p-6">
        <h1 className="mb-6 text-2xl font-bold">الأرباح والسحوبات</h1>

        <div className="mb-8 grid gap-6 md:grid-cols-2">
          <div className="card">
            <p className="text-sm text-slate-500">الرصيد المتاح</p>
            <p className="mb-4 text-3xl font-bold text-primary">{formatDZD(stats?.profile?.balance || 0)}</p>

            <form onSubmit={submitWithdrawal} className="space-y-3">
              <select value={method} onChange={(e) => setMethod(e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-4 py-2.5 dark:border-slate-700 dark:bg-slate-900">
                <option value="baridimob">BaridiMob</option>
                <option value="flexy">Flexy</option>
                <option value="redotpay">RedotPay</option>
                <option value="products">استلام كمنتجات من الكتالوج</option>
              </select>

              {method === 'products' ? (
                <div>
                  <p className="mb-2 text-xs text-slate-500">
                    اختر منتجات بقيمة تساوي رصيدك أو أقل. قيمة المُختار حاليًا: <strong>{formatDZD(selectedProductsValue)}</strong>
                    {' / '}{formatDZD(stats?.profile?.balance || 0)}
                  </p>
                  <div className="grid max-h-56 gap-2 overflow-y-auto rounded-xl border border-slate-200 p-3 dark:border-slate-700">
                    {catalogProducts.map((p) => (
                      <label key={p.id} className="flex items-center gap-2 text-sm">
                        <input type="checkbox" checked={selectedProductIds.includes(p.id)} onChange={() => toggleProduct(p.id)} />
                        {p.title} — {formatDZD(p.price)}
                      </label>
                    ))}
                    {!catalogProducts.length && <p className="text-sm text-slate-400">جاري التحميل...</p>}
                  </div>
                </div>
              ) : (
                <>
                  <input type="number" step="0.01" required placeholder="المبلغ (د.ج)" value={amount} onChange={(e) => setAmount(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-4 py-2.5 dark:border-slate-700 dark:bg-slate-900" />
                  <input required placeholder="رقم الهاتف / معرّف الحساب للدفع" value={payoutContact} onChange={(e) => setPayoutContact(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-4 py-2.5 dark:border-slate-700 dark:bg-slate-900" />
                </>
              )}

              <button type="submit" disabled={submitting} className="btn-primary w-full">
                {submitting ? 'جاري الإرسال...' : 'طلب سحب'}
              </button>
              <p className="text-center text-xs text-slate-400">
                {method === 'products' ? 'سنتواصل معك لتنسيق تسليم المنتجات.' : 'بعد تأكيد الطلب، يتم الدفع خلال 48 ساعة.'}
              </p>
            </form>
          </div>

          <div className="card">
            <p className="mb-4 text-sm font-semibold">تفصيل العمولات</p>
            <div className="space-y-2 text-sm">
              <Row label="معلّقة" value={stats?.commissions?.pending} />
              <Row label="مؤكدة" value={stats?.commissions?.confirmed} />
              <Row label="مدفوعة" value={stats?.commissions?.paid} />
            </div>
          </div>
        </div>

        <h2 className="mb-3 text-lg font-semibold">سجل طلبات السحب</h2>
        <div className="overflow-x-auto rounded-2xl border border-slate-100 dark:border-slate-800">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 dark:bg-slate-900">
              <tr><th className="px-4 py-3">القيمة</th><th className="px-4 py-3">الطريقة</th><th className="px-4 py-3">الحالة</th><th className="px-4 py-3">تاريخ الطلب</th></tr>
            </thead>
            <tbody>
              {withdrawals.map((w) => {
                const meta = WITHDRAWAL_STATUS_META[w.status] || { label: w.status, color: 'bg-slate-100 text-slate-600' };
                const eta = w.status === 'approved' && w.approved_at
                  ? Math.max(0, Math.ceil(48 - (Date.now() - new Date(w.approved_at).getTime()) / 36e5))
                  : null;
                return (
                  <tr key={w.id} className="border-t border-slate-100 dark:border-slate-800">
                    <td className="px-4 py-3">{formatDZD(w.amount)}</td>
                    <td className="px-4 py-3">
                      {w.method === 'products' ? (
                        <span className="flex items-center gap-1"><Package size={14} /> منتجات</span>
                      ) : (
                        <span className="capitalize">{w.method.replace('_', ' ')}</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${meta.color}`}>{meta.label}</span>
                      {eta !== null && <span className="mr-2 text-xs text-slate-400">(متبقٍ {eta} ساعة)</span>}
                    </td>
                    <td className="px-4 py-3">{new Date(w.requested_at).toLocaleDateString()}</td>
                  </tr>
                );
              })}
              {!withdrawals.length && <tr><td colSpan={4} className="px-4 py-6 text-center text-slate-400">لا توجد طلبات سحب بعد.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

const WITHDRAWAL_STATUS_META = {
  pending: { label: 'في الانتظار', color: 'bg-amber-100 text-amber-700' },
  under_review: { label: 'يتم التحقق', color: 'bg-blue-100 text-blue-700' },
  approved: { label: 'مؤكدة — قريبًا', color: 'bg-indigo-100 text-indigo-700' },
  paid: { label: 'مدفوعة', color: 'bg-green-100 text-green-700' },
  rejected: { label: 'مرفوضة', color: 'bg-red-100 text-red-700' },
};

function Row({ label, value }) {
  return (
    <div className="flex justify-between border-b border-slate-100 pb-2 dark:border-slate-800">
      <span className="text-slate-500">{label}</span>
      <span className="font-medium">{formatDZD(value || 0)}</span>
    </div>
  );
}
