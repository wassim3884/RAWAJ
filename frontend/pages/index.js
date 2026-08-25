import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ShoppingBag, Users, TrendingUp, DollarSign, Search, ChevronDown } from 'lucide-react';
import api from '../lib/api';
import ProductCard from '../components/ProductCard';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

const STEPS = [
  { title: 'أنشئ حسابك', desc: 'سجّل كمسوّق بالعمولة وابدأ بتصفح المنتجات المتاحة.', icon: Users },
  { title: 'اختر منتجًا', desc: 'تصفح الكتالوج حسب الفئة واطلب الموافقة على ترويج ما يناسبك.', icon: ShoppingBag },
  { title: 'قدّم العرض', desc: 'وجدت زبونًا؟ أدخل بياناته واحصل على السعر النهائي فورًا.', icon: TrendingUp },
  { title: 'اربح عمولتك', desc: 'تُحتسب عمولتك تلقائيًا بمجرد تسليم الطلب، واسحبها في أي وقت.', icon: DollarSign },
];

export default function Home() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [categories, setCategories] = useState([]);
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [newProducts, setNewProducts] = useState([]);
  const [openFaq, setOpenFaq] = useState(null);
  const [hero, setHero] = useState({
    headline: 'روّج للمنتجات، واربح من كل عملية بيع',
    subheadline: 'رواج يمنحك كل ما تحتاجه للتسويق بالعمولة في مكان واحد.',
    ctaText: 'تصفح المنتجات',
  });

  useEffect(() => {
    if (!user) return;
    api.get('/categories').then(({ data }) => setCategories(data.categories)).catch(() => {});
    api.get('/products', { params: { featured: 'true', limit: 8 } }).then(({ data }) => setFeaturedProducts(data.products)).catch(() => {});
    // sort=newest orders by p.created_at DESC — same field/ordering already used
    // by the backend's default product listing, kept consistent end-to-end.
    api.get('/products', { params: { sort: 'newest', limit: 8 } }).then(({ data }) => setNewProducts(data.products)).catch(() => {});
    api.get('/settings/homepage_hero').then(({ data }) => {
      if (data.value) setHero((prev) => ({ ...prev, ...data.value }));
    }).catch(() => {});
  }, [user]);

  return (
    <div>
      {/* HERO */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary to-primary-dark py-24 text-white">
        <div className="mx-auto max-w-5xl px-4 text-center sm:px-6 lg:px-8">
          <h1 className="text-4xl font-extrabold leading-tight sm:text-5xl lg:text-6xl">
            {hero.headline}
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-white/90">
            {hero.subheadline}
          </p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Link href="/affiliate/products" className="rounded-xl bg-white px-6 py-3 font-semibold text-primary shadow-card hover:shadow-card-hover">
              {hero.ctaText}
            </Link>
            <Link href="/affiliate/vip" className="rounded-xl border border-white/40 bg-white/10 px-6 py-3 font-semibold text-white backdrop-blur hover:bg-white/20">
              {t('برنامج VIP')}
            </Link>
          </div>
        </div>
      </section>

      {/* CATEGORIES */}
      <section id="categories" className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <h2 className="mb-8 text-2xl font-bold text-slate-900 dark:text-white">{t('تصفح حسب الفئة')}</h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7">
          {categories.map((cat) => (
            <Link key={cat.slug} href={`/products?category=${cat.slug}`} className="card flex flex-col items-center gap-2 text-center !p-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                <ShoppingBag size={22} />
              </div>
              <span className="text-sm font-medium">{cat.name}</span>
            </Link>
          ))}
          {!categories.length && <p className="col-span-full text-slate-400">{t('لا توجد فئات بعد.')}</p>}
        </div>
      </section>

      {/* MOST POPULAR (manually curated by admin) */}
      <section className="bg-slate-50 py-16 dark:bg-slate-900">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-8 flex items-center justify-between">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">{t('الأكثر رواجًا')}</h2>
            <Link href="/affiliate/products" className="text-sm font-medium text-primary">{t('عرض الكل ←')}</Link>
          </div>
          <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-4">
            {featuredProducts.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
            {!featuredProducts.length && <p className="col-span-full text-slate-400">{t('لم يتم تحديد منتجات رائجة بعد.')}</p>}
          </div>
        </div>
      </section>

      {/* NEW PRODUCTS (newest → oldest, by created_at) */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="mb-8 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">{t('أحدث المنتجات')}</h2>
          <Link href="/affiliate/products" className="text-sm font-medium text-primary">{t('عرض الكل ←')}</Link>
        </div>
        <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-4">
          {newProducts.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
          {!newProducts.length && <p className="col-span-full text-slate-400">{t('لا توجد منتجات جديدة بعد.')}</p>}
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <h2 className="mb-10 text-center text-2xl font-bold text-slate-900 dark:text-white">{t('كيف تعمل المنصة')}</h2>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((step, i) => (
            <div key={step.title} className="card text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <step.icon size={26} />
              </div>
              <p className="mb-1 text-sm font-semibold text-accent">{t('الخطوة')} {i + 1}</p>
              <h3 className="mb-2 font-bold">{t(step.title)}</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">{t(step.desc)}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
