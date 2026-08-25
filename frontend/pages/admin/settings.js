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
  { href: '/admin/categories', label: 'التصنيفات', icon: Tag },
  { href: '/admin/settings', label: 'إعدادات الموقع', icon: Settings },
];

const CONTENT_PAGES = [
  { key: 'about_content', label: 'من نحن' },
  { key: 'blog_content', label: 'المدونة' },
  { key: 'contact_content', label: 'اتصل بنا' },
  { key: 'faq_content', label: 'الأسئلة الشائعة' },
  { key: 'privacy_policy_content', label: 'سياسة الخصوصية' },
  { key: 'terms_of_service_content', label: 'شروط الاستخدام' },
];

export default function AdminSettings() {
  const [hero, setHero] = useState({ headline: '', subheadline: '', ctaText: '' });
  const [pages, setPages] = useState({}); // { key: { title, body } }
  const [savingKey, setSavingKey] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/admin/settings/homepage_hero').catch(() => ({ data: {} })),
      ...CONTENT_PAGES.map((p) => api.get(`/admin/settings/${p.key}`).catch(() => ({ data: {} }))),
    ]).then(([heroRes, ...pageResults]) => {
      if (heroRes.data.setting?.value) setHero(heroRes.data.setting.value);
      const pagesState = {};
      CONTENT_PAGES.forEach((p, i) => {
        pagesState[p.key] = pageResults[i].data.setting?.value || { title: p.label, body: '' };
      });
      setPages(pagesState);
    }).finally(() => setLoading(false));
  }, []);

  const saveHero = async (e) => {
    e.preventDefault();
    setSavingKey('hero');
    try {
      await api.put('/admin/settings/homepage_hero', { value: hero });
      toast.success('تم حفظ إعدادات الصفحة الرئيسية.');
    } catch {
      toast.error('فشل الحفظ.');
    } finally {
      setSavingKey(null);
    }
  };

  const savePage = async (key) => {
    setSavingKey(key);
    try {
      await api.put(`/admin/settings/${key}`, { value: pages[key] });
      toast.success('تم الحفظ.');
    } catch {
      toast.error('فشل الحفظ.');
    } finally {
      setSavingKey(null);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[80vh] flex-col md:flex-row">
        <DashboardSidebar links={links} />
        <div className="flex-1 p-6"><p className="text-slate-400">جاري التحميل...</p></div>
      </div>
    );
  }

  return (
    <div className="flex min-h-[80vh] flex-col md:flex-row">
      <DashboardSidebar links={links} />
      <div className="flex-1 space-y-8 p-6">
        <div>
          <h1 className="mb-2 text-2xl font-bold">إعدادات الموقع</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            تحكّم في محتوى الصفحة الرئيسية وصفحات الفوتر (من نحن، المدونة، اتصل بنا، الأسئلة الشائعة، سياسة الخصوصية، شروط الاستخدام).
          </p>
        </div>

        {/* Homepage hero */}
        <form onSubmit={saveHero} className="card max-w-2xl space-y-4">
          <h2 className="font-semibold">الصفحة الرئيسية</h2>
          <Field label="العنوان الرئيسي (Headline)">
            <input value={hero.headline} onChange={(e) => setHero({ ...hero, headline: e.target.value })} className="input" />
          </Field>
          <Field label="الوصف الفرعي (Subheadline)">
            <textarea rows={3} value={hero.subheadline} onChange={(e) => setHero({ ...hero, subheadline: e.target.value })} className="input" />
          </Field>
          <Field label="نص زر الدعوة للعمل (CTA)">
            <input value={hero.ctaText} onChange={(e) => setHero({ ...hero, ctaText: e.target.value })} className="input" />
          </Field>
          <button type="submit" disabled={savingKey === 'hero'} className="btn-primary">
            {savingKey === 'hero' ? 'جاري الحفظ...' : 'حفظ'}
          </button>
        </form>

        {/* Footer content pages */}
        {CONTENT_PAGES.map((p) => (
          <div key={p.key} className="card max-w-2xl space-y-4">
            <h2 className="font-semibold">{p.label}</h2>
            <Field label="عنوان الصفحة">
              <input
                value={pages[p.key]?.title || ''}
                onChange={(e) => setPages({ ...pages, [p.key]: { ...pages[p.key], title: e.target.value } })}
                className="input"
              />
            </Field>
            <Field label="محتوى الصفحة">
              <textarea
                rows={6}
                value={pages[p.key]?.body || ''}
                onChange={(e) => setPages({ ...pages, [p.key]: { ...pages[p.key], body: e.target.value } })}
                className="input"
              />
            </Field>
            <button onClick={() => savePage(p.key)} disabled={savingKey === p.key} className="btn-primary">
              {savingKey === p.key ? 'جاري الحفظ...' : 'حفظ'}
            </button>
          </div>
        ))}
      </div>

      <style jsx global>{`
        .input {
          width: 100%;
          border-radius: 0.75rem;
          border: 1px solid rgb(226 232 240);
          padding: 0.6rem 1rem;
          outline: none;
        }
        .dark .input { border-color: rgb(51 65 85); background: rgb(15 23 42); }
      `}</style>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium">{label}</label>
      {children}
    </div>
  );
}
