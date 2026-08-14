import { useEffect, useState } from 'react';
import Link from 'next/link';
import { LayoutDashboard, Users, Package, Wallet, Settings, Tag, Crown, Truck, Store, Plus, Star } from 'lucide-react';
import toast from 'react-hot-toast';
import DashboardSidebar from '../../components/DashboardSidebar';
import FileUploader from '../../components/FileUploader';
import api from '../../lib/api';
import { formatDZD } from '../../lib/currency';

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

const emptyForm = {
  title: '', description: '', price: '', stockQuantity: 0, sku: '',
  categoryId: '', vipPrice: '', status: 'active',
  catalogImages: [], realImages: [], landingImages: [], videoUrls: [],
};

export default function AdminProducts() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const loadProducts = () => api.get('/products/mine').then(({ data }) => setProducts(data.products)).catch(() => {});
  useEffect(() => {
    loadProducts();
    api.get('/categories').then(({ data }) => setCategories(data.categories)).catch(() => {});
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.catalogImages.length) {
      toast.error('أضف صورة واحدة على الأقل للمنتج.');
      return;
    }
    setSubmitting(true);
    try {
      await api.post('/products', { ...form, categoryId: form.categoryId || null, vipPrice: form.vipPrice || null });
      toast.success('تم نشر المنتج.');
      setForm(emptyForm);
      setShowForm(false);
      loadProducts();
    } catch (err) {
      toast.error(err.response?.data?.error || 'فشل إنشاء المنتج.');
    } finally {
      setSubmitting(false);
    }
  };

  const deleteProduct = async (id) => {
    if (!confirm('حذف هذا المنتج؟')) return;
    try {
      await api.delete(`/products/${id}`);
      toast.success('تم حذف المنتج.');
      loadProducts();
    } catch {
      toast.error('فشل الحذف.');
    }
  };

  const toggleFeatured = async (product) => {
    try {
      await api.put(`/products/${product.id}`, { isFeatured: !product.is_featured });
      toast.success(product.is_featured ? 'أُزيل من الأكثر رواجًا.' : 'أُضيف إلى الأكثر رواجًا!');
      loadProducts();
    } catch {
      toast.error('فشل التحديث.');
    }
  };

  return (
    <div className="flex min-h-[80vh] flex-col md:flex-row">
      <DashboardSidebar links={links} />
      <div className="flex-1 p-6">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold">المنتجات</h1>
          <button onClick={() => setShowForm(!showForm)} className="btn-primary">
            <Plus size={16} /> إضافة منتج
          </button>
        </div>

        {showForm && (
          <form onSubmit={handleSubmit} className="card mb-8 space-y-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="العنوان"><input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="input" /></Field>
              <Field label="الفئة">
                <select value={form.categoryId} onChange={(e) => setForm({ ...form, categoryId: e.target.value })} className="input">
                  <option value="">بدون فئة</option>
                  {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </Field>
              <Field label="التوفر">
                <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className="input">
                  <option value="active">متوفر الآن</option>
                  <option value="coming_soon">قادم قريبًا</option>
                </select>
              </Field>
              <Field label="رمز المنتج (SKU)"><input value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} className="input" /></Field>
              <Field label="السعر — تكلفتك (د.ج)"><input type="number" step="0.01" required value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} className="input" /></Field>
              <Field label="سعر VIP (د.ج) — اختياري"><input type="number" step="0.01" value={form.vipPrice} onChange={(e) => setForm({ ...form, vipPrice: e.target.value })} className="input" /></Field>
              <Field label="الكمية"><input type="number" value={form.stockQuantity} onChange={(e) => setForm({ ...form, stockQuantity: e.target.value })} className="input" /></Field>
            </div>

            <p className="rounded-lg bg-primary/5 p-3 text-xs text-slate-500 dark:text-slate-400">
              لا حاجة لتحديد نسبة عمولة — كل مسوّق يقرر بنفسه كم يضيف كعمولة له عند تقديم عرض لزبونه.
            </p>

            <Field label="الوصف">
              <textarea rows={4} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="input" />
            </Field>

            <FileUploader
              label="صور المنتج (يظهر أولها كصورة رئيسية في الكتالوج)"
              value={form.catalogImages}
              onChange={(urls) => setForm({ ...form, catalogImages: urls })}
              resourceType="image"
            />
            <FileUploader
              label="صور حقيقية للمنتج (بعد التسليم الفعلي، لطمأنة الزبائن)"
              value={form.realImages}
              onChange={(urls) => setForm({ ...form, realImages: urls })}
              resourceType="image"
            />
            <FileUploader
              label="صورة صفحة هبوط جاهزة (اختياري)"
              value={form.landingImages}
              onChange={(urls) => setForm({ ...form, landingImages: urls })}
              resourceType="image"
            />
            <FileUploader
              label="فيديوهات إعلانية للمنتوج (اختياري)"
              value={form.videoUrls}
              onChange={(urls) => setForm({ ...form, videoUrls: urls })}
              resourceType="video"
            />

            <button type="submit" disabled={submitting} className="btn-primary">
              {submitting ? 'جاري النشر...' : 'نشر المنتج'}
            </button>
          </form>
        )}

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((p) => (
            <div key={p.id} className="card">
              {p.category_name && <span className="text-xs font-medium uppercase tracking-wide text-primary">{p.category_name}</span>}
              <p className="font-semibold">{p.title}</p>
              <p className="text-sm text-slate-500">{formatDZD(p.price)} · {p.stock_quantity} بالمخزون</p>
              {p.vip_price && <p className="text-xs text-accent">سعر VIP: {formatDZD(p.vip_price)}</p>}
              {p.status === 'coming_soon' && Number(p.interest_count) > 0 && (
                <p className="text-xs text-amber-600">{p.interest_count} مسوّق مهتم بهذا المنتج</p>
              )}
              {p.status === 'out_of_stock' && Number(p.restock_subscriber_count) > 0 && (
                <p className="text-xs text-blue-600">{p.restock_subscriber_count} بانتظار التوفر</p>
              )}
              <div className="mt-3 flex items-center justify-between">
                <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                  p.status === 'active' ? 'bg-green-100 text-green-700' :
                  p.status === 'coming_soon' ? 'bg-blue-100 text-blue-700' :
                  p.status === 'out_of_stock' ? 'bg-orange-100 text-orange-700' : 'bg-red-100 text-red-700'
                }`}>{p.status}</span>
                <div className="flex items-center gap-3">
                  <button onClick={() => toggleFeatured(p)} title="وضعه ضمن الأكثر رواجًا"
                    className={p.is_featured ? 'text-accent' : 'text-slate-300 hover:text-accent'}>
                    <Star size={16} fill={p.is_featured ? 'currentColor' : 'none'} />
                  </button>
                  <button onClick={() => deleteProduct(p.id)} className="text-sm text-red-500">حذف</button>
                </div>
              </div>
              <Link href={`/admin/marketing/${p.id}`} className="btn-outline mt-3 block w-full !py-2 text-center text-sm">
                المكتبة التسويقية
              </Link>
            </div>
          ))}
          {!products.length && <p className="text-slate-400">لا توجد منتجات بعد — أضف أول منتج!</p>}
        </div>
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
