import { useEffect, useState } from 'react';
import Link from 'next/link';
import { LayoutDashboard, Search, Wallet, Bell, ClipboardList, Truck, Crown, Clock, Heart, Megaphone } from 'lucide-react';
import toast from 'react-hot-toast';
import DashboardSidebar from '../../components/DashboardSidebar';
import api from '../../lib/api';

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

export default function AffiliateProducts() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [savedIds, setSavedIds] = useState(new Set());
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('');

  const load = () => api.get('/affiliate/products', { params: { q: query || undefined, category: category || undefined } })
    .then(({ data }) => setProducts(data.products)).catch(() => {});

  const loadSaved = () => api.get('/wishlist').then(({ data }) => setSavedIds(new Set(data.products.map((p) => p.id)))).catch(() => {});

  useEffect(() => {
    load();
    loadSaved();
    api.get('/categories').then(({ data }) => setCategories(data.categories)).catch(() => {});
  }, []);

  useEffect(() => { load(); }, [category]);

  const requestApproval = async (productId) => {
    try {
      await api.post('/affiliate/requests', { productId });
      toast.success('Approval requested!');
      load();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Request failed.');
    }
  };

  const toggleSave = async (product) => {
    try {
      if (savedIds.has(product.id)) {
        await api.delete(`/wishlist/${product.id}`);
        toast.success('تمت الإزالة من قائمة الحفظ.');
      } else {
        await api.post(`/wishlist/${product.id}`);
        toast.success('تم الحفظ لوقت لاحق.');
      }
      loadSaved();
    } catch {
      toast.error('حدث خطأ.');
    }
  };

  const subscribeRestock = async (productId) => {
    try {
      await api.post(`/products/${productId}/notify-restock`);
      toast.success('سنُعلمك عند توفر المنتج.');
    } catch {
      toast.error('حدث خطأ.');
    }
  };

  return (
    <div className="flex min-h-[80vh] flex-col md:flex-row">
      <DashboardSidebar links={links} />
      <div className="flex-1 p-6">
        <h1 className="mb-6 text-2xl font-bold">تصفح المنتجات</h1>

        <div className="mb-6 flex flex-wrap gap-2">
          <input
            value={query} onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && load()}
            placeholder="Search products..."
            className="w-full max-w-sm rounded-xl border border-slate-200 px-4 py-2.5 outline-none focus:border-primary dark:border-slate-700 dark:bg-slate-900"
          />
          <select value={category} onChange={(e) => setCategory(e.target.value)}
            className="rounded-xl border border-slate-200 px-4 py-2.5 outline-none focus:border-primary dark:border-slate-700 dark:bg-slate-900">
            <option value="">All categories</option>
            {categories.map((c) => <option key={c.slug} value={c.slug}>{c.name}</option>)}
          </select>
          <button onClick={load} className="btn-outline">Search</button>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((p) => (
            <div key={p.id} className="card relative">
              <button onClick={() => toggleSave(p)} className="absolute left-4 top-4 text-slate-300 hover:text-red-500">
                <Heart size={18} fill={savedIds.has(p.id) ? 'currentColor' : 'none'} className={savedIds.has(p.id) ? 'text-red-500' : ''} />
              </button>

              {p.category_name && <span className="text-xs font-medium uppercase tracking-wide text-primary">{p.category_name}</span>}
              <p className="font-semibold">{p.title}</p>
              <p className="text-sm text-slate-500">${Number(p.price).toFixed(2)} · {p.commission_percent}% commission</p>

              {p.status === 'out_of_stock' ? (
                <div className="mt-3">
                  <span className="mb-2 inline-block rounded-full bg-red-100 px-2 py-0.5 text-xs text-red-700">نفدت الكمية</span>
                  <button onClick={() => subscribeRestock(p.id)} className="btn-outline w-full !py-2 text-sm">
                    نبهني عند التوفر
                  </button>
                </div>
              ) : p.request_status === 'approved' ? (
                <div className="mt-3 space-y-2">
                  <span className="inline-block rounded-full bg-green-100 px-2 py-0.5 text-xs text-green-700">
                    Approved — go to &quot;Submit Order&quot;
                  </span>
                  <Link href={`/affiliate/marketing/${p.id}`} className="btn-outline flex w-full items-center justify-center gap-1 !py-2 text-sm">
                    <Megaphone size={14} /> المكتبة التسويقية
                  </Link>
                </div>
              ) : p.request_status === 'pending' ? (
                <span className="mt-3 inline-block rounded-full bg-amber-100 px-2 py-0.5 text-xs text-amber-700">Pending approval</span>
              ) : (
                <button onClick={() => requestApproval(p.id)} className="btn-primary mt-3 w-full !py-2 text-sm">
                  Request to Promote
                </button>
              )}
            </div>
          ))}
          {!products.length && <p className="text-slate-400">No products found.</p>}
        </div>
      </div>
    </div>
  );
}
