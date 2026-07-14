import { useEffect, useState } from 'react';
import { LayoutDashboard, Users, Package, Wallet, Settings, Tag, Crown, Truck } from 'lucide-react';
import toast from 'react-hot-toast';
import DashboardSidebar from '../../components/DashboardSidebar';
import api from '../../lib/api';

const links = [
  { href: '/admin/dashboard', label: 'نظرة عامة', icon: LayoutDashboard },
  { href: '/admin/users', label: 'المسوّقون', icon: Users },
  { href: '/admin/products', label: 'المنتجات', icon: Package },
  { href: '/admin/orders', label: 'الطلبات', icon: Wallet },
  { href: '/admin/withdrawals', label: 'السحوبات', icon: Wallet },
  { href: '/admin/delivery-rates', label: 'أسعار التوصيل', icon: Tag },
  { href: '/admin/wholesale', label: 'الجملة', icon: Truck },
  { href: '/admin/vip', label: 'VIP', icon: Crown },
  { href: '/admin/settings', label: 'إعدادات الموقع', icon: Settings },
];

export default function AdminSettings() {
  const [form, setForm] = useState({ headline: '', subheadline: '', ctaText: '' });
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/admin/settings/homepage_hero')
      .then(({ data }) => {
        if (data.setting?.value) setForm(data.setting.value);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.put('/admin/settings/homepage_hero', { value: form });
      toast.success('تم حفظ إعدادات الصفحة الرئيسية.');
    } catch {
      toast.error('فشل الحفظ.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex min-h-[80vh] flex-col md:flex-row">
      <DashboardSidebar links={links} />
      <div className="flex-1 p-6">
        <h1 className="mb-2 text-2xl font-bold">إعدادات الموقع</h1>
        <p className="mb-6 text-sm text-slate-500 dark:text-slate-400">
          تحكّم في العنوان الرئيسي والوصف الظاهر في أعلى الصفحة الرئيسية للمسوّقين.
        </p>

        {loading ? (
          <p className="text-slate-400">جاري التحميل...</p>
        ) : (
          <form onSubmit={handleSubmit} className="card max-w-2xl space-y-4">
            <Field label="العنوان الرئيسي (Headline)">
              <input value={form.headline} onChange={(e) => setForm({ ...form, headline: e.target.value })} className="input" />
            </Field>
            <Field label="الوصف الفرعي (Subheadline)">
              <textarea rows={3} value={form.subheadline} onChange={(e) => setForm({ ...form, subheadline: e.target.value })} className="input" />
            </Field>
            <Field label="نص زر الدعوة للعمل (CTA)">
              <input value={form.ctaText} onChange={(e) => setForm({ ...form, ctaText: e.target.value })} className="input" />
            </Field>
            <button type="submit" disabled={saving} className="btn-primary">
              {saving ? 'جاري الحفظ...' : 'حفظ'}
            </button>
          </form>
        )}
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
