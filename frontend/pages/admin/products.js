import { useEffect, useState } from 'react';
import Link from 'next/link';
import { LayoutDashboard, Users, Package, Wallet, Settings, Tag, Plus, Trash2, Crown, Truck, Star } from 'lucide-react';
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

const emptyForm = {
  title: '', description: '', price: '', commissionPercent: 10,
  stockQuantity: 0, sku: '', images: [''], categoryId: '', vipPrice: '', status: 'active',
};

export default function AdminProducts() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [showForm, setShowForm] = useState(false);

  const loadProducts = () => api.get('/products/mine').then(({ data }) => setProducts(data.products)).catch(() => {});
  useEffect(() => {
    loadProducts();
    api.get('/categories').then(({ data }) => setCategories(data.categories)).catch(() => {});
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/products', { ...form, images: form.images.filter(Boolean), categoryId: form.categoryId || null, vipPrice: form.vipPrice || null });
      toast.success('Product added and published.');
      setForm(emptyForm);
      setShowForm(false);
      loadProducts();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to create product.');
    }
  };

  const deleteProduct = async (id) => {
    if (!confirm('Delete this product?')) return;
    try {
      await api.delete(`/products/${id}`);
      toast.success('Product deleted.');
      loadProducts();
    } catch {
      toast.error('Failed to delete product.');
    }
  };

  const toggleFeatured = async (product) => {
    try {
      await api.put(`/products/${product.id}`, { isFeatured: !product.is_featured });
      toast.success(product.is_featured ? 'Removed from trending.' : 'Marked as trending on homepage!');
      loadProducts();
    } catch {
      toast.error('Failed to update product.');
    }
  };

  return (
    <div className="flex min-h-[80vh] flex-col md:flex-row">
      <DashboardSidebar links={links} />
      <div className="flex-1 p-6">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold">المنتجات</h1>
          <button onClick={() => setShowForm(!showForm)} className="btn-primary">
            <Plus size={16} /> Add Product
          </button>
        </div>

        {showForm && (
          <form onSubmit={handleSubmit} className="card mb-8 space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Title"><input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="input" /></Field>
              <Field label="Category">
                <select value={form.categoryId} onChange={(e) => setForm({ ...form, categoryId: e.target.value })} className="input">
                  <option value="">No category</option>
                  {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </Field>
              <Field label="Availability">
                <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className="input">
                  <option value="active">متوفر الآن (Active)</option>
                  <option value="coming_soon">قادم قريبًا (Coming Soon)</option>
                </select>
              </Field>
              <Field label="SKU"><input value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} className="input" /></Field>
              <Field label="Price ($)"><input type="number" step="0.01" required value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} className="input" /></Field>
              <Field label="VIP Price ($) — optional, shown only to VIP affiliates"><input type="number" step="0.01" value={form.vipPrice} onChange={(e) => setForm({ ...form, vipPrice: e.target.value })} className="input" /></Field>
              <Field label="Affiliate Commission (%)"><input type="number" step="0.1" value={form.commissionPercent} onChange={(e) => setForm({ ...form, commissionPercent: e.target.value })} className="input" /></Field>
              <Field label="Stock Quantity"><input type="number" value={form.stockQuantity} onChange={(e) => setForm({ ...form, stockQuantity: e.target.value })} className="input" /></Field>
            </div>
            <Field label="Description">
              <textarea rows={4} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="input" />
            </Field>
            <Field label="Image URLs (multiple)">
              {form.images.map((url, i) => (
                <div key={i} className="mb-2 flex gap-2">
                  <input value={url} placeholder="https://..." onChange={(e) => {
                    const next = [...form.images]; next[i] = e.target.value; setForm({ ...form, images: next });
                  }} className="input" />
                  <button type="button" onClick={() => setForm({ ...form, images: form.images.filter((_, j) => j !== i) })} className="text-red-500"><Trash2 size={16} /></button>
                </div>
              ))}
              <button type="button" onClick={() => setForm({ ...form, images: [...form.images, ''] })} className="text-sm text-primary">+ Add another image</button>
            </Field>
            <button type="submit" className="btn-primary">Publish Product</button>
          </form>
        )}

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((p) => (
            <div key={p.id} className="card">
              {p.category_name && <span className="text-xs font-medium uppercase tracking-wide text-primary">{p.category_name}</span>}
              <p className="font-semibold">{p.title}</p>
              <p className="text-sm text-slate-500">${Number(p.price).toFixed(2)} · {p.commission_percent}% commission · {p.stock_quantity} in stock</p>
              {p.vip_price && <p className="text-xs text-accent">VIP price: ${Number(p.vip_price).toFixed(2)}</p>}
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
                  <button onClick={() => toggleFeatured(p)} title="Mark as trending on homepage"
                    className={p.is_featured ? 'text-accent' : 'text-slate-300 hover:text-accent'}>
                    <Star size={16} fill={p.is_featured ? 'currentColor' : 'none'} />
                  </button>
                  <button onClick={() => deleteProduct(p.id)} className="text-sm text-red-500">Delete</button>
                </div>
              </div>
              <Link href={`/admin/marketing/${p.id}`} className="btn-outline mt-3 block w-full !py-2 text-center text-sm">
                المكتبة التسويقية
              </Link>
            </div>
          ))}
          {!products.length && <p className="text-slate-400">No products yet — add your first one!</p>}
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
