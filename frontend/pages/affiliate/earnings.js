import { useEffect, useState } from 'react';
import { LayoutDashboard, Search, Wallet, Bell, ClipboardList, Truck, Crown, Clock, Heart } from 'lucide-react';
import toast from 'react-hot-toast';
import DashboardSidebar from '../../components/DashboardSidebar';
import api from '../../lib/api';

const links = [
  { href: '/affiliate/dashboard', label: 'Overview', icon: LayoutDashboard },
  { href: '/affiliate/products', label: 'Browse Products', icon: Search },
  { href: '/affiliate/upcoming', label: 'Coming Soon', icon: Clock },
  { href: '/affiliate/saved', label: 'Saved', icon: Heart },
  { href: '/affiliate/submit-order', label: 'Submit Order', icon: ClipboardList },
  { href: '/affiliate/orders', label: 'My Orders', icon: Truck },
  { href: '/affiliate/earnings', label: 'Earnings', icon: Wallet },
  { href: '/affiliate/vip', label: 'VIP', icon: Crown },
  { href: '/affiliate/notifications', label: 'Notifications', icon: Bell },
];

export default function AffiliateEarnings() {
  const [stats, setStats] = useState(null);
  const [withdrawals, setWithdrawals] = useState([]);
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState('baridimob');
  const [payoutEmail, setPayoutEmail] = useState('');

  const load = () => {
    api.get('/affiliate/stats').then(({ data }) => setStats(data)).catch(() => {});
    api.get('/withdrawals/mine').then(({ data }) => setWithdrawals(data.withdrawals)).catch(() => {});
  };
  useEffect(load, []);

  const submitWithdrawal = async (e) => {
    e.preventDefault();
    try {
      await api.post('/withdrawals', { amount: Number(amount), method, payoutDetails: { email: payoutEmail } });
      toast.success('Withdrawal request submitted!');
      setAmount(''); setPayoutEmail('');
      load();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Request failed.');
    }
  };

  return (
    <div className="flex min-h-[80vh] flex-col md:flex-row">
      <DashboardSidebar links={links} />
      <div className="flex-1 p-6">
        <h1 className="mb-6 text-2xl font-bold">Earnings & Withdrawals</h1>

        <div className="mb-8 grid gap-6 md:grid-cols-2">
          <div className="card">
            <p className="text-sm text-slate-500">Available Balance</p>
            <p className="mb-4 text-3xl font-bold text-primary">${Number(stats?.profile?.balance || 0).toFixed(2)}</p>

            <form onSubmit={submitWithdrawal} className="space-y-3">
              <input type="number" step="0.01" required placeholder="Amount" value={amount} onChange={(e) => setAmount(e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-4 py-2.5 dark:border-slate-700 dark:bg-slate-900" />
              <select value={method} onChange={(e) => setMethod(e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-4 py-2.5 dark:border-slate-700 dark:bg-slate-900">
                <option value="baridimob">BaridiMob</option>
                <option value="flexy">Flexy</option>
                <option value="redotpay">RedotPay</option>
              </select>
              <input required placeholder="Phone number / account ID for payment" value={payoutEmail} onChange={(e) => setPayoutEmail(e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-4 py-2.5 dark:border-slate-700 dark:bg-slate-900" />
              <button type="submit" className="btn-primary w-full">Request Withdrawal</button>
              <p className="text-center text-xs text-slate-400">بعد تأكيد الطلب، يتم الدفع خلال 48 ساعة.</p>
            </form>
          </div>

          <div className="card">
            <p className="mb-4 text-sm font-semibold">Commission Breakdown</p>
            <div className="space-y-2 text-sm">
              <Row label="Pending" value={stats?.commissions?.pending} />
              <Row label="Confirmed" value={stats?.commissions?.confirmed} />
              <Row label="Paid" value={stats?.commissions?.paid} />
            </div>
          </div>
        </div>

        <h2 className="mb-3 text-lg font-semibold">سجل طلبات السحب</h2>
        <div className="overflow-x-auto rounded-2xl border border-slate-100 dark:border-slate-800">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 dark:bg-slate-900">
              <tr><th className="px-4 py-3">المبلغ</th><th className="px-4 py-3">الطريقة</th><th className="px-4 py-3">الحالة</th><th className="px-4 py-3">تاريخ الطلب</th></tr>
            </thead>
            <tbody>
              {withdrawals.map((w) => {
                const meta = WITHDRAWAL_STATUS_META[w.status] || { label: w.status, color: 'bg-slate-100 text-slate-600' };
                const eta = w.status === 'approved' && w.approved_at
                  ? Math.max(0, Math.ceil(48 - (Date.now() - new Date(w.approved_at).getTime()) / 36e5))
                  : null;
                return (
                  <tr key={w.id} className="border-t border-slate-100 dark:border-slate-800">
                    <td className="px-4 py-3">${Number(w.amount).toFixed(2)}</td>
                    <td className="px-4 py-3 capitalize">{w.method.replace('_', ' ')}</td>
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
      <span className="font-medium">${Number(value || 0).toFixed(2)}</span>
    </div>
  );
}
