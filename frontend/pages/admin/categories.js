import { useEffect, useState } from 'react';
import Image from 'next/image';
import { LayoutDashboard, Users, Package, Wallet, Settings, Tag, Crown, Truck, Store, ImageOff } from 'lucide-react';
import toast from 'react-hot-toast';
import DashboardSidebar from '../../components/DashboardSidebar';
import FileUploader from '../../components/FileUploader';
import api from '../../lib/api';
import { CATEGORY_FALLBACK_ICON } from '../../lib/categoryIcons';

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

// Every category gets a working icon on day one even before an admin uploads
// a real photo — the affiliate products page also falls back to this same
// mapping (lib/categoryIcons.js is the single source of truth).

export default function AdminCategories() {
  const [categories, setCategories] = useState([]);
  const [newName, setNewName] = useState('');
  const [newSlug, setNewSlug] = useState('');
  const [creating, setCreating] = useState(false);

  const load = () => api.get('/admin/categories').then(({ data }) => setCategories(data.categories)).catch(() => {});
  useEffect(() => { load(); }, []);

  const updateIcon = async (cat, urls) => {
    try {
      await api.put(`/admin/categories/${cat.id}`, { iconUrl: urls[0] || '' });
      toast.success('تم تحديث صورة التصنيف.');
      load();
    } catch {
      toast.error('فشل تحديث الصورة.');
    }
  };

  const createCategory = async (e) => {
    e.preventDefault();
    if (!newName || !newSlug) return;
    setCreating(true);
    try {
      await api.post('/admin/categories', { name: newName, slug: newSlug });
      toast.success('تم إنشاء التصنيف.');
      setNewName(''); setNewSlug('');
      load();
    } catch (err) {
      toast.error(err.response?.data?.error || 'فشل إنشاء التصنيف.');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="flex min-h-[80vh] flex-col md:flex-row">
      <DashboardSidebar links={links} />
      <div className="flex-1 p-6">
        <h1 className="mb-2 text-2xl font-bold">التصنيفات</h1>
        <p className="mb-6 text-sm text-slate-500 dark:text-slate-400">
          ارفع صورة معبّرة لكل تصنيف — تظهر في شريط التصنيفات بصفحة المنتجات لدى المسوّقين. التصنيفات بدون صورة تعرض أيقونة افتراضية مؤقتًا.
        </p>

        <form onSubmit={createCategory} className="card mb-6 flex flex-wrap items-end gap-3">
          <div className="flex-1">
            <label className="mb-1 block text-sm font-medium">اسم تصنيف جديد</label>
            <input value={newName} onChange={(e) => setNewName(e.target.value)} className="input" placeholder="مثال: أدوات منزلية" />
          </div>
          <div className="flex-1">
            <label className="mb-1 block text-sm font-medium">Slug (بالإنجليزية، بدون مسافات)</label>
            <input value={newSlug} onChange={(e) => setNewSlug(e.target.value)} className="input" placeholder="home-tools" />
          </div>
          <button type="submit" disabled={creating} className="btn-primary !py-2.5">
            {creating ? 'جاري الإنشاء...' : 'إضافة تصنيف'}
          </button>
        </form>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((c) => (
            <div key={c.id} className="card flex items-center gap-4">
              <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                {c.icon_url ? (
                  <Image src={c.icon_url} alt={c.name} fill className="object-cover" />
                ) : (
                  <div className="flex h-full items-center justify-center text-2xl">
                    {CATEGORY_FALLBACK_ICON[c.slug] || <ImageOff size={22} className="text-slate-300" />}
                  </div>
                )}
              </div>
              <div className="flex-1">
                <p className="font-semibold">{c.name}</p>
                <p className="mb-2 text-xs text-slate-400">{c.slug}</p>
                <FileUploader
                  label=""
                  value={c.icon_url ? [c.icon_url] : []}
                  onChange={(urls) => updateIcon(c, urls)}
                  resourceType="image"
                  multiple={false}
                  maxFiles={1}
                />
                {c.icon_url && <p className="mt-1 text-xs text-slate-400">لتغيير الصورة، احذف الحالية أولاً ثم ارفع جديدة.</p>}
              </div>
            </div>
          ))}
          {!categories.length && <p className="col-span-full text-slate-400">لا توجد تصنيفات بعد.</p>}
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
    </div>
  );
}
