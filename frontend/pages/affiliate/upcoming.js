import { useEffect, useState } from 'react';
import { LayoutDashboard, Search, Wallet, Bell, ClipboardList, Truck, Crown, Clock, Heart } from 'lucide-react';
import toast from 'react-hot-toast';
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

export default function UpcomingProducts() {
  const [products, setProducts] = useState([]);

  const load = () => api.get('/products/upcoming').then(({ data }) => setProducts(data.products)).catch(() => {});
  useEffect(() => { load(); }, []);

  const toggleInterest = async (product) => {
    try {
      if (product.is_interested) {
        await api.delete(`/products/${product.id}/interest`);
        toast.success('تم إلغاء اهتمامك.');
      } else {
        await api.post(`/products/${product.id}/interest`);
        toast.success('سنُعلمك فور توفر هذا المنتج!');
      }
      load();
    } catch (err) {
      toast.error(err.response?.data?.error || 'حدث خطأ.');
    }
  };

  return (
    <div className="flex min-h-[80vh] flex-col md:flex-row">
      <DashboardSidebar links={links} />
      <div className="flex-1 p-6">
        <h1 className="mb-2 text-2xl font-bold">منتجات قادمة قريبًا</h1>
        <p className="mb-6 text-sm text-slate-500 dark:text-slate-400">
          هذه منتجات لم تصل بعد. اضغط &quot;مهتم&quot; لتصلك رسالة فور توفرها — كما تساعدنا معرفة عدد المهتمين على تحديد أولوية توفير المنتج.
        </p>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((p) => (
            <div key={p.id} className="card">
              {p.category_name && <span className="text-xs font-medium uppercase tracking-wide text-primary">{p.category_name}</span>}
              <p className="font-semibold">{p.title}</p>
              <p className="text-sm text-slate-500">{formatDZD(p.price)}</p>
              <p className="mt-1 text-xs text-slate-400">{p.interest_count} مسوّق مهتم بهذا المنتج</p>
              <button
                onClick={() => toggleInterest(p)}
                className={`mt-3 w-full rounded-xl px-4 py-2 text-sm font-medium transition ${
                  p.is_interested ? 'bg-accent/10 text-accent' : 'btn-primary'
                }`}
              >
                {p.is_interested ? '✓ أنت مهتم' : 'مهتم'}
              </button>
            </div>
          ))}
          {!products.length && <p className="text-slate-400">لا توجد منتجات قادمة حاليًا.</p>}
        </div>
      </div>
    </div>
  );
}
