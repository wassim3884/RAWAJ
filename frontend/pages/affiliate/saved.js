import { useEffect, useState } from 'react';
import { LayoutDashboard, Search, Wallet, Bell, ClipboardList, Truck, Crown, MapPin, Clock, Heart } from 'lucide-react';
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

export default function SavedProducts() {
  const [products, setProducts] = useState([]);

  const load = () => api.get('/wishlist').then(({ data }) => setProducts(data.products)).catch(() => {});
  useEffect(() => { load(); }, []);

  const remove = async (id) => {
    try {
      await api.delete(`/wishlist/${id}`);
      toast.success('تمت الإزالة من القائمة.');
      load();
    } catch {
      toast.error('حدث خطأ.');
    }
  };

  return (
    <div className="flex min-h-[80vh] flex-col md:flex-row">
      <DashboardSidebar links={links} />
      <div className="flex-1 p-6">
        <h1 className="mb-2 text-2xl font-bold">قائمة الحفظ</h1>
        <p className="mb-6 text-sm text-slate-500 dark:text-slate-400">
          المنتجات التي حفظتها لتسويقها لاحقًا.
        </p>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((p) => (
            <div key={p.id} className="card">
              {p.category_name && <span className="text-xs font-medium uppercase tracking-wide text-primary">{p.category_name}</span>}
              <p className="font-semibold">{p.title}</p>
              <p className="text-sm text-slate-500">{formatDZD(p.price)} · {p.commission_percent}% عمولة</p>
              <button onClick={() => remove(p.id)} className="mt-3 text-sm text-red-500">إزالة من القائمة</button>
            </div>
          ))}
          {!products.length && <p className="text-slate-400">لم تحفظ أي منتج بعد.</p>}
        </div>
      </div>
    </div>
  );
}
