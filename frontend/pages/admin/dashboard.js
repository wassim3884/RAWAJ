import { useEffect, useState } from 'react';
import { LayoutDashboard, Users, Package, Wallet, Settings, Tag, Crown, Truck, Store } from 'lucide-react';
import DashboardSidebar from '../../components/DashboardSidebar';
import api from '../../lib/api';
import { useLanguage } from '../../context/LanguageContext';
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
  { href: '/admin/settings', label: 'إعدادات الموقع', icon: Settings },
];

const PRODUCT_STATUS_LABELS = {
  active: 'متوفر', pending: 'قيد المراجعة', coming_soon: 'قادم قريبًا',
  out_of_stock: 'نفدت الكمية', rejected: 'مرفوض', draft: 'مسودة',
};
const COMMISSION_STATUS_LABELS = {
  pending: 'معلّقة', confirmed: 'مؤكدة', paid: 'مدفوعة', cancelled: 'ملغاة',
};

export default function AdminDashboard() {
  const { t } = useLanguage();
  const [data, setData] = useState(null);

  useEffect(() => {
    api.get('/admin/analytics').then(({ data }) => setData(data)).catch(() => {});
  }, []);

  const countByKey = (rows, key) => Object.fromEntries((rows || []).map((r) => [r[key], Number(r.count)]));
  const usersByRole = countByKey(data?.usersByRole, 'role');
  const productsByStatus = countByKey(data?.productsByStatus, 'status');
  const ordersByStatus = countByKey(data?.ordersByStatus, 'order_status');
  const totalProducts = Object.values(productsByStatus).reduce((sum, n) => sum + n, 0);

  return (
    <div className="flex min-h-[80vh] flex-col md:flex-row">
      <DashboardSidebar links={links} />
      <div className="flex-1 p-6">
        <h1 className="mb-6 text-2xl font-bold">{t('نظرة عامة على المنصة')}</h1>

        <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label={t('إجمالي الإيرادات (طلبات مُسلَّمة)')} value={`${formatDZD(data?.totalRevenue || 0)}`} />
          <StatCard label={t('عدد المسوّقين')} value={usersByRole.affiliate || 0} />
          <StatCard label={t('عدد المنتجات')} value={totalProducts} />
          <StatCard label={t('طلبات تم تسليمها')} value={ordersByStatus.delivered || 0} />
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <div className="card">
            <h2 className="mb-4 font-semibold">{t('المنتجات حسب الحالة')}</h2>
            <div className="space-y-2 text-sm">
              {Object.entries(productsByStatus).map(([status, count]) => (
                <div key={status} className="flex justify-between border-b border-slate-100 pb-2 dark:border-slate-800">
                  <span className="text-slate-500">{t(PRODUCT_STATUS_LABELS[status] || status)}</span>
                  <span className="font-medium">{count}</span>
                </div>
              ))}
              {!Object.keys(productsByStatus).length && <p className="text-slate-400">{t('لا توجد منتجات بعد.')}</p>}
            </div>
          </div>

          <div className="card">
            <h2 className="mb-4 font-semibold">{t('العمولات حسب الحالة')}</h2>
            <div className="space-y-2 text-sm">
              {(data?.commissionsByStatus || []).map((c) => (
                <div key={c.status} className="flex justify-between border-b border-slate-100 pb-2 dark:border-slate-800">
                  <span className="text-slate-500">{t(COMMISSION_STATUS_LABELS[c.status] || c.status)}</span>
                  <span className="font-medium">{formatDZD(c.total)}</span>
                </div>
              ))}
              {!data?.commissionsByStatus?.length && <p className="text-slate-400">{t('لا توجد عمولات بعد.')}</p>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value }) {
  return (
    <div className="card">
      <p className="text-sm text-slate-500 dark:text-slate-400">{label}</p>
      <p className="mt-1 text-2xl font-bold">{value}</p>
    </div>
  );
}
