import { useEffect, useState } from 'react';
import { LayoutDashboard, Search, Wallet, Bell, Truck, Crown, Clock, Heart, MapPin } from 'lucide-react';
import DashboardSidebar from '../../components/DashboardSidebar';
import api from '../../lib/api';
import { formatDZD } from '../../lib/currency';

const links = [
  { href: '/affiliate/dashboard', label: 'نظرة عامة', icon: LayoutDashboard },
  { href: '/affiliate/products', label: 'منتجات', icon: Search },
  { href: '/affiliate/upcoming', label: 'قادمة قريبًا', icon: Clock },
  { href: '/affiliate/saved', label: 'المحفوظة', icon: Heart },
  { href: '/affiliate/delivery-rates', label: 'أسعار التوصيل', icon: MapPin },
  { href: '/affiliate/orders', label: 'طلباتي', icon: Truck },
  { href: '/affiliate/earnings', label: 'الأرباح', icon: Wallet },
  { href: '/affiliate/vip', label: 'VIP', icon: Crown },
  { href: '/affiliate/notifications', label: 'الإشعارات', icon: Bell },
];

export default function AffiliateDeliveryRates() {
  const [wilayas, setWilayas] = useState([]);

  useEffect(() => {
    api.get('/wilayas').then(({ data }) => setWilayas(data.wilayas)).catch(() => {});
  }, []);

  return (
    <div className="flex min-h-[80vh] flex-col md:flex-row">
      <DashboardSidebar links={links} />
      <div className="flex-1 p-6">
        <h1 className="mb-2 text-2xl font-bold">أسعار التوصيل حسب الولاية</h1>
        <p className="mb-6 text-sm text-slate-500 dark:text-slate-400">
          استخدم هذه الأسعار لتحديد مصاريف التوصيل بدقة عند تقديم عرض لزبونك.
        </p>

        <div className="overflow-x-auto rounded-2xl border border-slate-100 dark:border-slate-800">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 dark:bg-slate-900">
              <tr>
                <th className="px-4 py-3">الرمز</th>
                <th className="px-4 py-3">الولاية</th>
                <th className="px-4 py-3">توصيل للمنزل</th>
                <th className="px-4 py-3">مكتب / Stopdesk</th>
              </tr>
            </thead>
            <tbody>
              {wilayas.map((w) => (
                <tr key={w.id} className="border-t border-slate-100 dark:border-slate-800">
                  <td className="px-4 py-3">{w.code}</td>
                  <td className="px-4 py-3">{w.name_ar} / {w.name_fr}</td>
                  <td className="px-4 py-3">{formatDZD(w.delivery_fee_home)}</td>
                  <td className="px-4 py-3">{formatDZD(w.delivery_fee_office)}</td>
                </tr>
              ))}
              {!wilayas.length && (
                <tr><td colSpan={4} className="px-4 py-6 text-center text-slate-400">جاري التحميل...</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}