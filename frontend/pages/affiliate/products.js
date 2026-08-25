import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import Image from 'next/image';
import { LayoutDashboard, Search, Wallet, Bell, Truck, Crown, Clock, Heart, ShoppingBag, MapPin, ChevronLeft, ChevronRight, ImageOff, ArrowLeft, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';
import DashboardSidebar from '../../components/DashboardSidebar';
import api from '../../lib/api';
import { formatDZD } from '../../lib/currency';
import { useLanguage } from '../../context/LanguageContext';
import { CATEGORY_FALLBACK_ICON } from '../../lib/categoryIcons';
import { AFFILIATE_NAV_LINKS } from '../../lib/affiliateNav';

export default function AffiliateProducts() {
  const { t, lang } = useLanguage();
  const router = useRouter();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [savedIds, setSavedIds] = useState(new Set());
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('');
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef(null);

  // Supports arriving here with a pre-selected category, e.g. the "🏷️
  // تصفّح حسب الفئة" quick links on the affiliate home page
  // (/affiliate/products?category=electronics).
  useEffect(() => {
    if (router.isReady && typeof router.query.category === 'string') {
      setCategory(router.query.category);
    }
  }, [router.isReady, router.query.category]);


  // In RTL, "next" items sit further to the left, and modern browsers report
  // scrollLeft as 0-or-negative there (CSSOM-View spec) — so the
  // right-pointing arrow (which reads as "forward" in Arabic) scrolls by a
  // negative amount, and the left-pointing arrow by a positive one. In LTR
  // (French/English), "forward" is the normal positive direction, so the
  // sign flips with the active language rather than being hardcoded.
  const scrollCategories = (direction) => {
    const el = scrollRef.current;
    if (!el) return;
    const amount = el.clientWidth * 0.8;
    const forwardSign = lang === 'ar' ? -1 : 1;
    el.scrollBy({ left: direction === 'forward' ? forwardSign * amount : -forwardSign * amount, behavior: 'smooth' });
  };

  // Lightweight mouse-drag-to-scroll for desktop trackpads/mice — no library,
  // touch devices already get native swipe for free via overflow-x-auto.
  const dragState = useRef({ down: false, startX: 0, startScroll: 0 });
  const onDragStart = (e) => {
    const el = scrollRef.current;
    if (!el) return;
    dragState.current = { down: true, startX: e.pageX, startScroll: el.scrollLeft };
  };
  const onDragMove = (e) => {
    if (!dragState.current.down || !scrollRef.current) return;
    e.preventDefault();
    scrollRef.current.scrollLeft = dragState.current.startScroll - (e.pageX - dragState.current.startX);
  };
  const endDrag = () => { dragState.current.down = false; };

  const load = () => {
    setLoading(true);
    return api
      .get('/affiliate/products', { params: { q: query || undefined, category: category || undefined } })
      .then(({ data }) => setProducts(data.products || []))
      .catch((err) => toast.error(err.response?.data?.error || 'حدث خطأ أثناء تحميل المنتجات'))
      .finally(() => setLoading(false));
  };

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
      <DashboardSidebar links={AFFILIATE_NAV_LINKS} />
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
              onMouseDown={onDragStart}
              onMouseMove={onDragMove}
              onMouseUp={endDrag}
              onMouseLeave={endDrag}
              className="flex cursor-grab gap-4 overflow-x-auto scroll-smooth px-1 py-1 active:cursor-grabbing [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
              style={{ scrollSnapType: 'x mandatory' }}
            >
              <button
                onClick={() => setCategory('')}
                style={{ scrollSnapAlign: 'start' }}
                className={`flex w-24 shrink-0 flex-col items-center gap-2 rounded-2xl px-2 py-2 text-center transition ${
                  category === '' ? 'text-primary' : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                <span className={`flex h-20 w-20 items-center justify-center rounded-full text-2xl transition sm:h-24 sm:w-24 ${category === '' ? 'bg-primary/10 ring-2 ring-primary' : 'bg-primary/10'}`}>
                  <ShoppingBag size={30} className="text-primary" />
                </span>
                <span className="text-sm font-medium leading-tight">الكل</span>
              </button>
              {categories.map((c) => (
                <button
                  key={c.slug}
                  onClick={() => setCategory(c.slug === category ? '' : c.slug)}
                  style={{ scrollSnapAlign: 'start' }}
                  className={`flex w-24 shrink-0 flex-col items-center gap-2 rounded-2xl px-2 py-2 text-center transition ${
                    category === c.slug ? 'text-primary' : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  <span className={`relative flex h-20 w-20 items-center justify-center overflow-hidden rounded-full text-2xl transition sm:h-24 sm:w-24 ${
                    category === c.slug ? 'bg-slate-100 ring-2 ring-primary dark:bg-slate-800' : 'bg-slate-100 dark:bg-slate-800'
                  }`}>
                    {c.icon_url ? (
                      <Image src={c.icon_url} alt={c.name} fill draggable={false} className="pointer-events-none object-cover" />
                    ) : (
                      CATEGORY_FALLBACK_ICON[c.slug] || <ShoppingBag size={26} />
                    )}
                  </span>
                  <span className="text-sm font-medium leading-tight">{c.name}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {loading ? (
            Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="card animate-pulse overflow-hidden !p-0">
                <div className="aspect-[4/5] bg-slate-100 dark:bg-slate-800" />
                <div className="space-y-2 p-4">
                  <div className="h-3 w-16 rounded bg-slate-100 dark:bg-slate-800" />
                  <div className="h-4 w-full rounded bg-slate-100 dark:bg-slate-800" />
                  <div className="h-3 w-20 rounded bg-slate-100 dark:bg-slate-800" />
                </div>
              </div>
            ))
          ) : products.map((p) => (
            <div key={p.id} className="card group relative flex flex-col overflow-hidden !p-0 transition hover:shadow-lg">
              <button
                onClick={(e) => toggleSave(e, p)}
                aria-label="حفظ المنتج"
                className="absolute left-3 top-3 z-10 rounded-full bg-white/90 p-2 text-slate-400 shadow-sm transition hover:text-red-500 dark:bg-slate-800/90"
              >
                <Heart size={16} fill={savedIds.has(p.id) ? 'currentColor' : 'none'} className={savedIds.has(p.id) ? 'text-red-500' : ''} />
              </button>

              <Link href={`/affiliate/products/${p.slug}`} className="relative block aspect-[4/5] w-full overflow-hidden bg-slate-100 dark:bg-slate-800">
                {p.primary_image ? (
                  <Image
                    src={p.primary_image}
                    alt={p.title}
                    fill
                    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                    className="object-cover transition duration-300 group-hover:scale-105"
                  />
                ) : (
                  <div className="flex h-full flex-col items-center justify-center gap-2 text-slate-300 dark:text-slate-600">
                    <ImageOff size={32} />
                    <span className="text-xs">لا توجد صورة</span>
                  </div>
                )}
                {p.is_featured && (
                  <span className="absolute right-3 top-3 rounded-full bg-accent px-2.5 py-1 text-xs font-semibold text-white">مميز</span>
                )}
                {p.status === 'out_of_stock' && (
                  <span className="absolute right-3 top-3 rounded-full bg-red-100 px-2.5 py-1 text-xs font-semibold text-red-700">نفدت الكمية</span>
                )}
              </Link>

              <div className="flex flex-1 flex-col gap-1.5 p-4">
                {p.category_name && (
                  <span className="w-fit rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">{p.category_name}</span>
                )}
                <Link href={`/affiliate/products/${p.slug}`} className="line-clamp-2 font-semibold text-slate-800 hover:text-primary dark:text-slate-100">
                  {p.title}
                </Link>
                <p className="text-sm text-slate-500">تكلفتك: <span className="font-bold text-slate-800 dark:text-slate-100">{formatDZD(p.price)}</span></p>
                {p.vip_price && <p className="text-xs font-medium text-accent">VIP: {formatDZD(p.vip_price)}</p>}

                <Link
                  href={`/affiliate/products/${p.slug}`}
                  className="btn-primary mt-3 flex items-center justify-center gap-1.5 !py-2.5 text-sm"
                >
                  {t('تقديم طلب')} {lang === 'ar' ? <ArrowLeft size={15} /> : <ArrowRight size={15} />}
                </Link>
              </div>
            </div>
          ))}
          {!loading && !products.length && <p className="col-span-full text-slate-400">لا توجد منتجات.</p>}
        </div>
      </div>
    </div>
  );
}
