import { useEffect, useState } from 'react';
import { LayoutDashboard, Search, Wallet, Bell, ClipboardList, Truck, Crown, Clock, Heart } from 'lucide-react';
import DashboardSidebar from '../../components/DashboardSidebar';
import api from '../../lib/api';
import { useLanguage } from '../../context/LanguageContext';
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

export default function AffiliateDashboard() {
  const { t } = useLanguage();
  const [stats, setStats] = useState(null);

  useEffect(() => {
    api.get('/affiliate/stats').then(({ data }) => setStats(data)).catch(() => {});
  }, []);

  const vipProgress = Math.min(100, Math.round(((stats?.deliveredOrders || 0) / 30) * 100));

  return (
    <div className="flex min-h-[80vh] flex-col md:flex-row">
      <DashboardSidebar links={links} />
      <div className="flex-1 p-6">
        <h1 className="mb-6 text-2xl font-bold">{t('نظرة عامة')}</h1>

        <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <StatCard label={t('طلبات تم تسليمها')} value={stats?.deliveredOrders ?? '—'} />
          <StatCard label={t('الرصيد المتاح')} value={`${formatDZD(stats?.profile?.balance || 0)}`} highlight />
          <div className="card">
            <p className="text-sm text-slate-500 dark:text-slate-400">{t('تقدّم VIP')}</p>
            <p className="mt-1 text-2xl font-bold">{stats?.deliveredOrders ?? 0} / 30</p>
            <div className="mt-2 h-2 w-full rounded-full bg-slate-100 dark:bg-slate-800">
              <div className="h-2 rounded-full bg-accent" style={{ width: `${vipProgress}%` }} />
            </div>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <MoneyCard label={t('عمولات معلّقة')} value={stats?.commissions?.pending} color="amber" />
          <MoneyCard label={t('عمولات مؤكدة')} value={stats?.commissions?.confirmed} color="blue" />
          <MoneyCard label={t('عمولات مدفوعة')} value={stats?.commissions?.paid} color="green" />
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, highlight }) {
  return (
    <div className={`card ${highlight ? 'border-2 border-primary' : ''}`}>
      <p className="text-sm text-slate-500 dark:text-slate-400">{label}</p>
      <p className="mt-1 text-2xl font-bold">{value}</p>
    </div>
  );
}

function MoneyCard({ label, value, color }) {
  const colorMap = {
    amber: 'text-amber-600 bg-amber-50 dark:bg-amber-900/20',
    blue: 'text-blue-600 bg-blue-50 dark:bg-blue-900/20',
    green: 'text-green-600 bg-green-50 dark:bg-green-900/20',
  };
  return (
    <div className={`rounded-2xl p-6 ${colorMap[color]}`}>
      <p className="text-sm opacity-80">{label}</p>
      <p className="mt-1 text-2xl font-bold">{formatDZD(value || 0)}</p>
    </div>
  );
}
