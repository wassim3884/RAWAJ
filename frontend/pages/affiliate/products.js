import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { LayoutDashboard, Search, Wallet, Bell, Truck, Crown, Clock, Heart, ShoppingBag, MapPin, ChevronLeft, ChevronRight } from 'lucide-react';
import toast from 'react-hot-toast';
import DashboardSidebar from '../../components/DashboardSidebar';
import api from '../../lib/api';
import { formatDZD } from '../../lib/currency';
import { useLanguage } from '../../context/LanguageContext';
import { CATEGORY_FALLBACK_ICON } from '../../lib/categoryIcons';

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
  const scrollRef = useRef(null);

  // In RTL, "next" items sit further to the left, and modern browsers report
  // scrollLeft as 0-or-negative there (CSSOM-View spec) — so the
  // right-pointing arrow (which reads as "forward" in Arabic) scrolls by a
  // negative amount, and the left-pointing arrow by a positive one.
  const scrollCategories = (direction) => {
    const el = scrollRef.current;
    if (!el) return;
    const amount = el.clientWidth * 0.8;
    el.scrollBy({ left: direction === 'forward' ? -amount : amount, behavior: 'smooth' });
  };

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

          <div className="relative">
            {/* Arrow buttons: hidden on touch-first mobile widths where swipe
                is the natural gesture, shown from sm: up. */}
            <button
              type="button"
              onClick={() => scrollCategories('back')}
              aria-label="السابق"
              className="absolute -right-2 top-1/2 z-10 hidden -translate-y-1/2 rounded-full border border-slate-200 bg-white p-1.5 shadow-sm hover:bg-slate-50 sm:flex dark:border-slate-700 dark:bg-slate-900"
            >
              <ChevronRight size={18} />
            </button>
            <button
              type="button"
              onClick={() => scrollCategories('forward')}
              aria-label="التالي"
              className="absolute -left-2 top-1/2 z-10 hidden -translate-y-1/2 rounded-full border border-slate-200 bg-white p-1.5 shadow-sm hover:bg-slate-50 sm:flex dark:border-slate-700 dark:bg-slate-900"
            >
              <ChevronLeft size={18} />
            </button>

            <div
              ref={scrollRef}
              className="flex gap-3 overflow-x-auto scroll-smooth px-1 py-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
              style={{ scrollSnapType: 'x mandatory' }}
            >
              <button
                onClick={() => setCategory('')}
                style={{ scrollSnapAlign: 'start' }}
                className={`flex w-20 shrink-0 flex-col items-center gap-1.5 rounded-xl px-2 py-2 text-center transition ${
                  category === '' ? 'text-primary' : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                <span className={`flex h-16 w-16 items-center justify-center rounded-full text-2xl ${category === '' ? 'bg-primary/10 ring-2 ring-primary' : 'bg-primary/10'}`}>
                  <ShoppingBag size={26} className="text-primary" />
                </span>
                <span className="text-xs font-medium leading-tight">الكل</span>
              </button>
              {categories.map((c) => (
                <button
                  key={c.slug}
                  onClick={() => setCategory(c.slug === category ? '' : c.slug)}
                  style={{ scrollSnapAlign: 'start' }}
                  className={`flex w-20 shrink-0 flex-col items-center gap-1.5 rounded-xl px-2 py-2 text-center transition ${
                    category === c.slug ? 'text-primary' : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  <span className={`relative flex h-16 w-16 items-center justify-center overflow-hidden rounded-full text-2xl ${
                    category === c.slug ? 'bg-slate-100 ring-2 ring-primary dark:bg-slate-800' : 'bg-slate-100 dark:bg-slate-800'
                  }`}>
                    {c.icon_url ? (
                      <Image src={c.icon_url} alt={c.name} fill className="object-cover" />
                    ) : (
                      CATEGORY_FALLBACK_ICON[c.slug] || <ShoppingBag size={22} />
                    )}
                  </span>
                  <span className="text-xs font-medium leading-tight">{c.name}</span>
                </button>
              ))}
            </div>
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
