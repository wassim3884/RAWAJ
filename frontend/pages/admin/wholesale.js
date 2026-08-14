import { useEffect, useState } from 'react';
import Link from 'next/link';
import { LayoutDashboard, Users, Package, Wallet, Settings, Tag, Crown, Truck, Store, Plus, Send } from 'lucide-react';
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
  { href: '/admin/settings', label: 'إعدادات الموقع', icon: Settings },
];

const emptyForm = { title: '', description: '', imageUrl: '', wholesalePrice: '', minOrderQuantity: 1, sourceNotes: '' };

export default function AdminWholesale() {
  const [products, setProducts] = useState([]);
  const [query, setQuery] = useState('');
  const [form, setForm] = useState(emptyForm);
  const [showForm, setShowForm] = useState(false);
  const [telegramUrl, setTelegramUrl] = useState('');

  const load = () => api.get('/wholesale/mine', { params: { q: query || undefined } }).then(({ data }) => setProducts(data.products)).catch(() => {});

  useEffect(() => {
    load();
    api.get('/admin/settings/wholesale_telegram_url').then(({ data }) => setTelegramUrl(data.setting?.value || '')).catch(() => {});
  }, []);

  const saveTelegram = async () => {
    try {
      await api.put('/admin/settings/wholesale_telegram_url', { value: telegramUrl });
      toast.success('Telegram channel link saved.');
    } catch {
      toast.error('Failed to save link.');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/wholesale', form);
      toast.success('Wholesale product added.');
      setForm(emptyForm);
      setShowForm(false);
      load();
    } catch {
      toast.error('Failed to add wholesale product.');
    }
  };

  const deleteProduct = async (id) => {
    if (!confirm('Delete this wholesale product?')) return;
    try {
      await api.delete(`/wholesale/${id}`);
      toast.success('Deleted.');
      load();
    } catch {
      toast.error('Failed to delete.');
    }
  };

  return (
    <div className="flex min-h-[80vh] flex-col md:flex-row">
      <DashboardSidebar links={links} />
      <div className="flex-1 p-6">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold">كتالوج الجملة</h1>
          <Link href="/admin/wholesale-requests" className="text-sm font-medium text-primary">طلبات البحث عن منتجات ←</Link>
        </div>

        <div className="card mb-8">
          <p className="mb-2 font-semibold">قناة تيليغرام</p>
          <p className="mb-3 text-sm text-slate-500 dark:text-slate-400">
            Merchants can view the full wholesale catalog on your Telegram channel. This link appears on the public /wholesale page.
          </p>
          <div className="flex gap-2">
            <input value={telegramUrl} onChange={(e) => setTelegramUrl(e.target.value)} placeholder="https://t.me/your_channel"
              className="input" />
            <button onClick={saveTelegram} className="btn-primary !py-2 text-sm"><Send size={14} /> Save</button>
          </div>
        </div>

        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <div className="flex gap-2">
            <input value={query} onChange={(e) => setQuery(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && load()}
              placeholder="Search your wholesale catalog..." className="w-64 input" />
            <button onClick={load} className="btn-outline !py-2 text-sm">بحث</button>
          </div>
          <button onClick={() => setShowForm(!showForm)} className="btn-primary">
            <Plus size={16} /> Add Wholesale Product
          </button>
        </div>

        {showForm && (
          <form onSubmit={handleSubmit} className="card mb-8 space-y-4">
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Found a product in the market you want to offer merchants in bulk? Add it here — it becomes searchable on your public wholesale page.
            </p>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Product Title"><input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="input" /></Field>
              <Field label="صورة المنتج">
                <FileUploader
                  value={form.imageUrl ? [form.imageUrl] : []}
                  onChange={(urls) => setForm({ ...form, imageUrl: urls[urls.length - 1] || '' })}
                  resourceType="image"
                  multiple={false}
                  maxFiles={1}
                />
              </Field>
              <Field label="Wholesale Price ($)"><input type="number" step="0.01" required value={form.wholesalePrice} onChange={(e) => setForm({ ...form, wholesalePrice: e.target.value })} className="input" /></Field>
              <Field label="Minimum Order Quantity"><input type="number" value={form.minOrderQuantity} onChange={(e) => setForm({ ...form, minOrderQuantity: e.target.value })} className="input" /></Field>
            </div>
            <Field label="Description (shown publicly)">
              <textarea rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="input" />
            </Field>
            <Field label="Source Notes (private — where you found this product)">
              <textarea rows={2} value={form.sourceNotes} onChange={(e) => setForm({ ...form, sourceNotes: e.target.value })} className="input" />
            </Field>
            <button type="submit" className="btn-primary">إضافة للكتالوج</button>
          </form>
        )}

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((p) => (
            <div key={p.id} className="card">
              <p className="font-semibold">{p.title}</p>
              <p className="text-sm text-slate-500">{formatDZD(p.wholesale_price)} · MOQ {p.min_order_quantity}</p>
              {p.source_notes && <p className="mt-1 text-xs italic text-slate-400">{p.source_notes}</p>}
              <button onClick={() => deleteProduct(p.id)} className="mt-3 text-sm text-red-500">حذف</button>
            </div>
          ))}
          {!products.length && <p className="text-slate-400">لا توجد منتجات جملة بعد.</p>}
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
