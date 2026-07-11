import { useEffect, useState } from 'react';
import { LayoutDashboard, Users, Package, Wallet, Settings, Tag, Crown, Truck, BellRing } from 'lucide-react';
import toast from 'react-hot-toast';
import DashboardSidebar from '../../components/DashboardSidebar';
import api from '../../lib/api';
import { subscribeToPush } from '../../lib/push';

const links = [
  { href: '/admin/dashboard', label: 'Overview', icon: LayoutDashboard },
  { href: '/admin/users', label: 'Affiliates', icon: Users },
  { href: '/admin/products', label: 'Products', icon: Package },
  { href: '/admin/orders', label: 'Orders', icon: Wallet },
  { href: '/admin/withdrawals', label: 'Withdrawals', icon: Wallet },
  { href: '/admin/delivery-rates', label: 'Delivery Rates', icon: Tag },
  { href: '/admin/wholesale', label: 'Wholesale', icon: Truck },
  { href: '/admin/vip', label: 'VIP', icon: Crown },
  { href: '/admin/settings', label: 'Site Settings', icon: Settings },
];

export default function AdminNotifications() {
  const [notifications, setNotifications] = useState([]);
  const [enabling, setEnabling] = useState(false);

  const load = () => api.get('/notifications').then(({ data }) => setNotifications(data.notifications)).catch(() => {});
  useEffect(() => { load(); }, []);

  const markRead = async (id) => {
    try {
      await api.put(`/notifications/${id}/read`);
      load();
    } catch { /* ignore */ }
  };

  const enablePush = async () => {
    setEnabling(true);
    try {
      const result = await subscribeToPush();
      if (result === 'granted') toast.success('تم تفعيل إشعارات الهاتف! ستصلك تنبيهات الطلبات الجديدة فورًا.');
      else if (result === 'denied') toast.error('تم رفض إذن الإشعارات من المتصفح.');
      else if (result === 'unconfigured') toast.error('إشعارات الهاتف غير مُفعّلة على الخادم بعد.');
      else toast.error('متصفحك لا يدعم هذه الميزة.');
    } catch {
      toast.error('تعذّر تفعيل الإشعارات.');
    } finally {
      setEnabling(false);
    }
  };

  return (
    <div className="flex min-h-[80vh] flex-col md:flex-row">
      <DashboardSidebar links={links} />
      <div className="flex-1 p-6">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-2xl font-bold">الإشعارات</h1>
          <button onClick={enablePush} disabled={enabling} className="btn-outline !py-2 text-sm">
            <BellRing size={16} /> {enabling ? 'جاري التفعيل...' : 'تفعيل إشعارات الهاتف'}
          </button>
        </div>

        <div className="space-y-3">
          {notifications.map((n) => (
            <button key={n.id} onClick={() => markRead(n.id)}
              className={`card block w-full text-right ${!n.is_read ? 'border-2 border-primary/30' : ''}`}>
              <div className="flex items-center justify-between">
                <p className="font-semibold">{n.title}</p>
                {!n.is_read && <span className="h-2 w-2 rounded-full bg-primary" />}
              </div>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{n.message}</p>
              <p className="mt-2 text-xs text-slate-400">{new Date(n.created_at).toLocaleString()}</p>
            </button>
          ))}
          {!notifications.length && <p className="text-slate-400">لا توجد إشعارات بعد.</p>}
        </div>
      </div>
    </div>
  );
}
