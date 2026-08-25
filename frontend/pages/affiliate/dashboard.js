import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ImageOff, ArrowLeft, ArrowRight } from 'lucide-react';
import DashboardSidebar from '../../components/DashboardSidebar';
import api from '../../lib/api';
import { formatDZD } from '../../lib/currency';
import { AFFILIATE_NAV_LINKS } from '../../lib/affiliateNav';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { CATEGORY_FALLBACK_ICON } from '../../lib/categoryIcons';

export default function AffiliateDashboard() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [stats, setStats] = useState(null);
  const [newProducts, setNewProducts] = useState([]);
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    api.get('/affiliate/stats').then(({ data }) => setStats(data)).catch(() => {});
    api.get('/affiliate/products', { params: { sort: 'newest', limit: 4 } }).then(({ data }) => setNewProducts(data.products)).catch(() => {});
    api.get('/affiliate/products', { params: { featured: 'true', limit: 4 } }).then(({ data }) => setFeaturedProducts(data.products)).catch(() => {});
    api.get('/categories').then(({ data }) => setCategories(data.categories.slice(0, 8))).catch(() => {});
  }, []);

  const vipProgress = Math.min(100, Math.round(((stats?.deliveredOrders || 0) / 30) * 100));
  const firstName = user?.full_name?.split(' ')[0];

  return (
    <div className="flex min-h-[80vh] flex-col md:flex-row">
      <DashboardSidebar links={AFFILIATE_NAV_LINKS} />
      <div className="flex-1 p-4 sm:p-6">
        {/* Welcome */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold sm:text-3xl">
            {firstName ? `${t('مرحبًا')}، ${firstName} 👋` : t('مرحبًا بك في RAWAJ')}
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{t('إليك نظرة سريعة على أدائك واكتشاف منتجات جديدة لتسويقها.')}</p>
        </div>

        {/* Real stats — no invented numbers */}
        <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <StatCard label="طلبات تم تسليمها" value={stats?.deliveredOrders ?? '—'} />
          <StatCard label="الرصيد المتاح" value={formatDZD(stats?.profile?.balance || 0)} highlight />
          <div className="card">
            <p className="text-sm text-slate-500 dark:text-slate-400">تقدّم VIP</p>
            <p className="mt-1 text-2xl font-bold">{stats?.deliveredOrders ?? 0} / 30</p>
            <div className="mt-2 h-2 w-full rounded-full bg-slate-100 dark:bg-slate-800">
              <div className="h-2 rounded-full bg-accent" style={{ width: `${vipProgress}%` }} />
            </div>
          </div>
        </div>

        <div className="mb-10 grid gap-4 sm:grid-cols-3">
          <MoneyCard label="عمولات معلّقة" value={stats?.commissions?.pending} color="amber" />
          <MoneyCard label="عمولات مؤكدة" value={stats?.commissions?.confirmed} color="blue" />
          <MoneyCard label="عمولات مدفوعة" value={stats?.commissions?.paid} color="green" />
        </div>

        {/* Categories quick-access */}
        {categories.length > 0 && (
          <section className="mb-10">
            <h2 className="mb-4 text-lg font-bold">🏷️ {t('تصفّح حسب الفئة')}</h2>
            <div className="flex gap-3 overflow-x-auto pb-1">
              {categories.map((c) => (
                <Link key={c.slug} href={`/affiliate/products?category=${c.slug}`}
                  className="flex w-20 shrink-0 flex-col items-center gap-1.5 rounded-xl px-2 py-2 text-center text-slate-500 transition hover:bg-slate-50 dark:hover:bg-slate-800">
                  <span className="relative flex h-16 w-16 items-center justify-center overflow-hidden rounded-full bg-slate-100 text-2xl dark:bg-slate-800">
                    {c.icon_url ? (
                      <Image src={c.icon_url} alt={c.name} fill className="object-cover" />
                    ) : (
                      CATEGORY_FALLBACK_ICON[c.slug] || '📦'
                    )}
                  </span>
                  <span className="text-xs font-medium leading-tight">{c.name}</span>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Featured products — only shown if the admin actually featured any (real data) */}
        {featuredProducts.length > 0 && (
          <ProductRow title={`🔥 ${t('منتجات مميزة')}`} products={featuredProducts} />
        )}

        {/* Newest products */}
        {newProducts.length > 0 && (
          <ProductRow title={`🆕 ${t('أحدث المنتجات')}`} products={newProducts} />
        )}
      </div>
    </div>
  );
}

function ProductRow({ title, products }) {
  const { t, lang } = useLanguage();
  const NextArrow = lang === 'ar' ? ArrowLeft : ArrowRight;
  return (
    <section className="mb-10">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-bold">{title}</h2>
        <Link href="/affiliate/products" className="flex items-center gap-1 text-sm font-medium text-primary">
          {t('عرض الكل')} <NextArrow size={14} />
        </Link>
      </div>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {products.map((p) => (
          <Link key={p.id} href={`/affiliate/products/${p.slug}`} className="card group block !p-0 overflow-hidden">
            <div className="relative aspect-square bg-slate-100 dark:bg-slate-800">
              {p.primary_image ? (
                <Image src={p.primary_image} alt={p.title} fill className="object-cover transition group-hover:scale-105" />
              ) : (
                <div className="flex h-full items-center justify-center text-slate-300"><ImageOff size={24} /></div>
              )}
            </div>
            <div className="p-3">
              <p className="line-clamp-1 text-sm font-medium">{p.title}</p>
              <p className="text-xs text-slate-500">{formatDZD(p.price)}</p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

function StatCard({ label, value, highlight }) {
  return (
    <div className={`card ${highlight ? 'border-2 border-primary' : ''}`}>
      <p className="text-sm text-slate-500 dark:text-slate-400">{label}</p>
      <p className="mt-1 text-2xl font-bold">{value}</p>
    </div>
  );
}

function MoneyCard({ label, value, color }) {
  const colorMap = {
    amber: 'text-amber-600 bg-amber-50 dark:bg-amber-900/20',
    blue: 'text-blue-600 bg-blue-50 dark:bg-blue-900/20',
    green: 'text-green-600 bg-green-50 dark:bg-green-900/20',
  };
  return (
    <div className={`rounded-2xl p-6 ${colorMap[color]}`}>
      <p className="text-sm opacity-80">{label}</p>
      <p className="mt-1 text-2xl font-bold">{formatDZD(value || 0)}</p>
    </div>
  );
}