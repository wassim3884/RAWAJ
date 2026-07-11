import { useEffect, useMemo, useState } from 'react';
import { LayoutDashboard, Search, Wallet, Bell, ClipboardList, Truck, Crown, Clock, Heart } from 'lucide-react';
import toast from 'react-hot-toast';
import DashboardSidebar from '../../components/DashboardSidebar';
import api from '../../lib/api';

const links = [
  { href: '/affiliate/dashboard', label: 'Overview', icon: LayoutDashboard },
  { href: '/affiliate/products', label: 'Browse Products', icon: Search },
  { href: '/affiliate/upcoming', label: 'Coming Soon', icon: Clock },
  { href: '/affiliate/saved', label: 'Saved', icon: Heart },
  { href: '/affiliate/submit-order', label: 'Submit Order', icon: ClipboardList },
  { href: '/affiliate/orders', label: 'My Orders', icon: Truck },
  { href: '/affiliate/earnings', label: 'Earnings', icon: Wallet },
  { href: '/affiliate/vip', label: 'VIP', icon: Crown },
  { href: '/affiliate/notifications', label: 'Notifications', icon: Bell },
];

export default function SubmitOrder() {
  const [products, setProducts] = useState([]);
  const [wilayas, setWilayas] = useState([]);
  const [form, setForm] = useState({
    productId: '', buyerName: '', buyerPhone: '', wilayaId: '', deliveryType: 'home', notes: '',
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    // Only products this affiliate is approved to promote (or that don't require approval)
    api.get('/affiliate/products').then(({ data }) => {
      setProducts(data.products.filter((p) => p.request_status === 'approved' || !p.requires_approval));
    }).catch(() => {});
    api.get('/wilayas').then(({ data }) => setWilayas(data.wilayas)).catch(() => {});
  }, []);

  const selectedProduct = products.find((p) => String(p.id) === String(form.productId));
  const selectedWilaya = wilayas.find((w) => String(w.id) === String(form.wilayaId));

  const breakdown = useMemo(() => {
    if (!selectedProduct || !selectedWilaya) return null;
    const productPrice = Number(selectedProduct.price);
    const commission = (productPrice * Number(selectedProduct.commission_percent)) / 100;
    const deliveryFee = form.deliveryType === 'office'
      ? Number(selectedWilaya.delivery_fee_office)
      : Number(selectedWilaya.delivery_fee_home);
    return {
      productPrice,
      commission,
      deliveryFee,
      total: productPrice + commission + deliveryFee,
    };
  }, [selectedProduct, selectedWilaya, form.deliveryType]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!breakdown) {
      toast.error('Please select a product and a wilaya first.');
      return;
    }
    setSubmitting(true);
    try {
      await api.post('/orders', form);
      toast.success('Order submitted! Our team will call the buyer to confirm.');
      setForm({ productId: '', buyerName: '', buyerPhone: '', wilayaId: '', deliveryType: 'home', notes: '' });
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to submit order.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-[80vh] flex-col md:flex-row">
      <DashboardSidebar links={links} />
      <div className="flex-1 p-6">
        <h1 className="mb-2 text-2xl font-bold">Submit an Order</h1>
        <p className="mb-6 text-sm text-slate-500 dark:text-slate-400">
          Got an interested buyer? Enter their details below — our team will call them to confirm before shipping.
        </p>

        <div className="grid gap-6 lg:grid-cols-3">
          <form onSubmit={handleSubmit} className="card lg:col-span-2 space-y-4">
            <Field label="Product">
              <select required value={form.productId} onChange={(e) => setForm({ ...form, productId: e.target.value })} className="input">
                <option value="">Select a product...</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>{p.title} — ${Number(p.price).toFixed(2)}</option>
                ))}
              </select>
              {!products.length && (
                <p className="mt-1 text-xs text-amber-600">
                  You have no approved products yet. Go to &quot;Browse Products&quot; and request approval first.
                </p>
              )}
            </Field>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Buyer's Name">
                <input required value={form.buyerName} onChange={(e) => setForm({ ...form, buyerName: e.target.value })} className="input" />
              </Field>
              <Field label="Buyer's Phone">
                <input required value={form.buyerPhone} onChange={(e) => setForm({ ...form, buyerPhone: e.target.value })} className="input" placeholder="05XX XX XX XX" />
              </Field>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Wilaya">
                <select required value={form.wilayaId} onChange={(e) => setForm({ ...form, wilayaId: e.target.value })} className="input">
                  <option value="">Select wilaya...</option>
                  {wilayas.map((w) => (
                    <option key={w.id} value={w.id}>{w.code} — {w.name_ar} / {w.name_fr}</option>
                  ))}
                </select>
              </Field>
              <Field label="Delivery Type">
                <select value={form.deliveryType} onChange={(e) => setForm({ ...form, deliveryType: e.target.value })} className="input">
                  <option value="home">Home Delivery</option>
                  <option value="office">Office / Stopdesk</option>
                </select>
              </Field>
            </div>

            <Field label="Notes (address details, buyer preferences, etc.)">
              <textarea rows={3} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="input" />
            </Field>

            <button type="submit" disabled={submitting || !breakdown} className="btn-primary w-full">
              {submitting ? 'Submitting...' : 'Submit Order'}
            </button>
          </form>

          <div className="card h-fit">
            <h2 className="mb-4 font-semibold">Price Breakdown</h2>
            {breakdown ? (
              <div className="space-y-3 text-sm">
                <Row label="Product price" value={breakdown.productPrice} />
                <Row label="Your commission" value={breakdown.commission} accent />
                <Row label="Delivery fee" value={breakdown.deliveryFee} />
                <div className="border-t border-slate-200 pt-3 dark:border-slate-700">
                  <Row label="Total (quote to buyer)" value={breakdown.total} bold />
                </div>
                <p className="mt-3 rounded-lg bg-primary/5 p-3 text-xs text-slate-500 dark:text-slate-400">
                  This is the exact amount the buyer pays on delivery (COD). Share this total with them before submitting.
                </p>
              </div>
            ) : (
              <p className="text-sm text-slate-400">Select a product and a wilaya to see the price breakdown.</p>
            )}
          </div>
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

function Row({ label, value, accent, bold }) {
  return (
    <div className="flex justify-between">
      <span className={accent ? 'text-accent' : 'text-slate-500'}>{label}</span>
      <span className={bold ? 'text-lg font-bold' : 'font-medium'}>${Number(value).toFixed(2)}</span>
    </div>
  );
}
