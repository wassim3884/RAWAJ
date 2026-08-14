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
  { href: '/admin/settings', label: 'إعدادات الموقع', icon: Settings },
];

export default function DeliveryRates() {
  const [wilayas, setWilayas] = useState([]);
  const [edited, setEdited] = useState({});

  const load = () => api.get('/wilayas/all').then(({ data }) => setWilayas(data.wilayas)).catch(() => {});
  useEffect(() => { load(); }, []);

  const handleChange = (id, field, value) => {
    setEdited((prev) => ({ ...prev, [id]: { ...prev[id], [field]: value } }));
  };

  const saveRow = async (wilaya) => {
    const changes = edited[wilaya.id];
    if (!changes) return;
    try {
      await api.put(`/wilayas/${wilaya.id}`, {
        deliveryFeeHome: changes.delivery_fee_home ?? wilaya.delivery_fee_home,
        deliveryFeeOffice: changes.delivery_fee_office ?? wilaya.delivery_fee_office,
      });
      toast.success(`تم تحديث ${wilaya.name_ar}`);
      load();
    } catch {
      toast.error('فشل التحديث.');
    }
  };

  const toggleAvailable = async (wilaya) => {
    try {
      await api.put(`/wilayas/${wilaya.id}`, { isActive: !wilaya.is_active });
      toast.success(wilaya.is_active ? `تم تعطيل التوصيل إلى ${wilaya.name_ar}` : `تم تفعيل التوصيل إلى ${wilaya.name_ar}`);
      load();
    } catch {
      toast.error('فشل التحديث.');
    }
  };

  return (
    <div className="flex min-h-[80vh] flex-col md:flex-row">
      <DashboardSidebar links={links} />
      <div className="flex-1 p-6">
        <h1 className="mb-2 text-2xl font-bold">أسعار التوصيل حسب الولاية</h1>
        <p className="mb-6 text-sm text-slate-500 dark:text-slate-400">
          هذه الأسعار تظهر للمسوّقين ليقدّموا سعرًا دقيقًا للتوصيل لزبائنهم. إذا كانت إحدى الولايات لا يمكن التوصيل إليها حاليًا، عطّلها من زر "متوفر" — ستختفي تلقائيًا من قائمة الولايات التي يختار منها المسوّقون.
        </p>

        <div className="overflow-x-auto rounded-2xl border border-slate-100 dark:border-slate-800">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 dark:bg-slate-900">
              <tr>
                <th className="px-4 py-3">الرمز</th>
                <th className="px-4 py-3">الولاية</th>
                <th className="px-4 py-3">توصيل للمنزل (د.ج)</th>
                <th className="px-4 py-3">مكتب / Stopdesk (د.ج)</th>
                <th className="px-4 py-3">الحالة</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {wilayas.map((w) => (
                <tr key={w.id} className={`border-t border-slate-100 dark:border-slate-800 ${!w.is_active ? 'opacity-50' : ''}`}>
                  <td className="px-4 py-3">{w.code}</td>
                  <td className="px-4 py-3">{w.name_ar} / {w.name_fr}</td>
                  <td className="px-4 py-3">
                    <input type="number" step="0.01" defaultValue={w.delivery_fee_home}
                      onChange={(e) => handleChange(w.id, 'delivery_fee_home', e.target.value)}
                      className="w-24 rounded-lg border border-slate-200 px-2 py-1 dark:border-slate-700 dark:bg-slate-900" />
                  </td>
                  <td className="px-4 py-3">
                    <input type="number" step="0.01" defaultValue={w.delivery_fee_office}
                      onChange={(e) => handleChange(w.id, 'delivery_fee_office', e.target.value)}
                      className="w-24 rounded-lg border border-slate-200 px-2 py-1 dark:border-slate-700 dark:bg-slate-900" />
                  </td>
                  <td className="px-4 py-3">
                    <button onClick={() => toggleAvailable(w)}
                      className={`rounded-full px-3 py-1 text-xs font-medium ${w.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {w.is_active ? 'متوفر' : 'غير متوفر'}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <button onClick={() => saveRow(w)} className="text-sm font-medium text-primary">حفظ</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
