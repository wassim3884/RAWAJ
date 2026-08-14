import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { LayoutDashboard, Search, Wallet, Bell, Truck, Crown, Clock, Heart, ShoppingBag, MapPin } from 'lucide-react';
import toast from 'react-hot-toast';
import DashboardSidebar from '../../components/DashboardSidebar';
import api from '../../lib/api';
import { formatDZD } from '../../lib/currency';
import { useLanguage } from '../../context/LanguageContext';

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

const STATUS_BADGE = {
  approved: { label: 'معتمد لك', color: 'bg-green-100 text-green-700' },
  pending: { label: 'بانتظار الموافقة', color: 'bg-amber-100 text-amber-700' },
};

export default function AffiliateProducts() {
  const { t } = useLanguage();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [savedIds, setSavedIds] = useState(new Set());
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('');

  const load = () =>
  api
    .get('/affiliate/products', {
      params: {
        q: query || undefined,
        category: category || undefined,
      },
    })
    .then(({ data }) => {
      console.log("Products:", data);
      setProducts(data.products || []);
    })
    .catch((err) => {
      console.error("Affiliate Products Error:", err);
      console.error("Response:", err.response?.data);

      toast.error(
        err.response?.data?.error || "حدث خطأ أثناء تحميل المنتجات"
      );
    });

  const loadSaved = () => api.get('/wishlist').then(({ data }) => setSavedIds(new Set(data.products.map((p) => p.id)))).catch(() => {});

  useEffect(() => {
    // load() is intentionally NOT called here — the effect below (which
    // depends on `category`) already fires once on mount since `category`
    // starts as ''. Calling load() in both effects fired two parallel
    // /affiliate/products requests on every page load; when the account is
    // unverified, each 403 response triggered its own toast, so the
    // "verify your email" message appeared twice stacked.
    loadSaved();
    api.get('/categories').then(({ data }) => setCategories(data.categories)).catch(() => {});
  }, []);

  useEffect(() => { load(); }, [category]);

  const toggleSave = async (e, product) => {
    e.preventDefault();
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

  return (
    <div className="flex min-h-[80vh] flex-col md:flex-row">
      <DashboardSidebar links={links} />
      <div className="flex-1 p-6">
        <h1 className="mb-2 text-2xl font-bold">{t('تصفح المنتجات')}</h1>
        <p className="mb-6 text-sm text-slate-500 dark:text-slate-400">اضغط على أي منتج أعجبك لرؤية تفاصيله وتقديم عرض لزبونك مباشرة.</p>

        <div className="mb-6">
          <input
            value={query} onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && load()}
            placeholder="ابحث عن منتج..."
            className="mb-4 w-full max-w-sm rounded-xl border border-slate-200 px-4 py-2.5 outline-none focus:border-primary dark:border-slate-700 dark:bg-slate-900"
          />

          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => setCategory('')}
              className={`flex flex-col items-center gap-1.5 rounded-xl px-3 py-2 text-center transition ${
                category === '' ? 'text-primary' : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              <span className="flex h-11 w-11 items-center justify-center rounded-full bg-primary/10 text-primary">
                <ShoppingBag size={20} />
              </span>
              <span className="text-xs font-medium">الكل</span>
            </button>
            {categories.map((c) => (
              <button
                key={c.slug}
                onClick={() => setCategory(c.slug === category ? '' : c.slug)}
                className={`flex flex-col items-center gap-1.5 rounded-xl px-3 py-2 text-center transition ${
                  category === c.slug ? 'text-primary' : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                <span className={`flex h-11 w-11 items-center justify-center rounded-full ${category === c.slug ? 'bg-primary/10' : 'bg-slate-100 dark:bg-slate-800'}`}>
                  <ShoppingBag size={20} />
                </span>
                <span className="text-xs font-medium">{c.name}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((p) => {
            const badge = STATUS_BADGE[p.request_status];
            return (
              <Link key={p.id} href={`/affiliate/products/${p.slug}`} className="card relative block !p-0 overflow-hidden">
                <button onClick={(e) => toggleSave(e, p)} className="absolute left-3 top-3 z-10 rounded-full bg-white/90 p-2 text-slate-400 hover:text-red-500 dark:bg-slate-800/90">
                  <Heart size={16} fill={savedIds.has(p.id) ? 'currentColor' : 'none'} className={savedIds.has(p.id) ? 'text-red-500' : ''} />
                </button>

                <div className="relative aspect-square bg-slate-100 dark:bg-slate-800">
                  {p.primary_image && <Image src={p.primary_image} alt={p.title} fill className="object-cover" />}
                  {p.status === 'out_of_stock' && (
                    <span className="absolute right-3 top-3 rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">نفدت الكمية</span>
                  )}
                  {badge && (
                    <span className={`absolute bottom-3 right-3 rounded-full px-2 py-0.5 text-xs font-medium ${badge.color}`}>{badge.label}</span>
                  )}
                </div>

                <div className="p-4">
                  {p.category_name && <span className="text-xs font-medium uppercase tracking-wide text-primary">{p.category_name}</span>}
                  <p className="mt-1 font-semibold text-slate-800 dark:text-slate-100">{p.title}</p>
                  <p className="mt-1 text-sm text-slate-500">تكلفتك: {formatDZD(p.price)}</p>
                </div>
              </Link>
            );
          })}
          {!products.length && <p className="col-span-full text-slate-400">لا توجد منتجات.</p>}
        </div>
      </div>
    </div>
  );
}
