import { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import { LayoutDashboard, Search, Wallet, Bell, Truck, Crown, Clock, Heart, MapPin, ImageOff } from 'lucide-react';
import toast from 'react-hot-toast';
import DashboardSidebar from '../../components/DashboardSidebar';
import api from '../../lib/api';
import { useLanguage } from '../../context/LanguageContext';
import { formatDZD } from '../../lib/currency';

const links = [
  { href: '/affiliate/dashboard', label: 'نظرة عامة', icon: LayoutDashboard },
  { href: '/affiliate/products', label: 'منتجات', icon: Search },
  { href: '/affiliate/upcoming', label: 'قادمة قريبًا', icon: Clock },
  { href: '/affiliate/saved', label: 'المحفوظة', icon: Heart },
  { href: '/affiliate/delivery-rates', label: 'أسعار التوصيل', icon: MapPin },
  { href: '/affiliate/orders', label: 'طلباتي', icon: Truck },
  { href: '/affiliate/earnings', label: 'الأرباح', icon: Wallet },
  { href: '/affiliate/vip', label: 'VIP', icon: Crown },
  { href: '/affiliate/notifications', label: 'الإشعارات', icon: Bell },
];

export default function SubmitOrder() {
  const { t } = useLanguage();
  const [products, setProducts] = useState([]);
  const [wilayas, setWilayas] = useState([]);
  const [form, setForm] = useState({
    productId: '', buyerName: '', buyerPhone: '', wilayaId: '', deliveryType: 'home', notes: '', commissionAmount: '',
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    api.get('/affiliate/products').then(({ data }) => {
      setProducts(data.products.filter((p) => p.request_status === 'approved' || !p.requires_approval));
    }).catch(() => {});
    api.get('/wilayas').then(({ data }) => setWilayas(data.wilayas)).catch(() => {});
  }, []);

  const selectedProduct = products.find((p) => String(p.id) === String(form.productId));
  const selectedWilaya = wilayas.find((w) => String(w.id) === String(form.wilayaId));

  const breakdown = useMemo(() => {
    if (!selectedProduct || !selectedWilaya || form.commissionAmount === '') return null;
    const productPrice = Number(selectedProduct.price);
    const commission = Number(form.commissionAmount) || 0;
    const deliveryFee = form.deliveryType === 'office'
      ? Number(selectedWilaya.delivery_fee_office)
      : Number(selectedWilaya.delivery_fee_home);
    return { productPrice, commission, deliveryFee, total: productPrice + commission + deliveryFee };
  }, [selectedProduct, selectedWilaya, form.commissionAmount, form.deliveryType]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!breakdown) {
      toast.error('يرجى اختيار منتج وولاية وكتابة عمولتك أولاً.');
      return;
    }
    setSubmitting(true);
    try {
      await api.post('/orders', { ...form, commissionAmount: Number(form.commissionAmount) || 0 });
      toast.success('تم إرسال الطلب! سيتصل فريقنا بالزبون للتأكيد.');
      setForm({ productId: '', buyerName: '', buyerPhone: '', wilayaId: '', deliveryType: 'home', notes: '', commissionAmount: '' });
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
        <h1 className="mb-2 text-2xl font-bold">{t('تقديم عرض')}</h1>
        <p className="mb-6 text-sm text-slate-500 dark:text-slate-400">
          وجدت زبونًا مهتمًا؟ أدخل بياناته أدناه — سيتصل فريقنا به للتأكيد قبل الشحن.
        </p>

        <div className="grid gap-6 lg:grid-cols-3">
          <form onSubmit={handleSubmit} className="card lg:col-span-2 space-y-4">
            <Field label="المنتج">
              <select required value={form.productId} onChange={(e) => setForm({ ...form, productId: e.target.value })} className="input">
                <option value="">اختر منتجًا...</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>{p.title} — {formatDZD(p.price)}</option>
                ))}
              </select>
              {!products.length && (
                <p className="mt-1 text-xs text-amber-600">
                  لا توجد منتجات معتمدة بعد. اذهب إلى &quot;منتجات&quot; واطلب الموافقة أولاً.
                </p>
              )}
            </Field>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="اسم الزبون">
                <input required value={form.buyerName} onChange={(e) => setForm({ ...form, buyerName: e.target.value })} className="input" />
              </Field>
              <Field label="هاتف الزبون">
                <input required value={form.buyerPhone} onChange={(e) => setForm({ ...form, buyerPhone: e.target.value })} className="input" placeholder="05XX XX XX XX" />
              </Field>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="الولاية">
                <select required value={form.wilayaId} onChange={(e) => setForm({ ...form, wilayaId: e.target.value })} className="input">
                  <option value="">اختر الولاية...</option>
                  {wilayas.map((w) => (
                    <option key={w.id} value={w.id}>{w.code} — {w.name_ar} / {w.name_fr}</option>
                  ))}
                </select>
              </Field>
              <Field label="نوع التوصيل">
                <select value={form.deliveryType} onChange={(e) => setForm({ ...form, deliveryType: e.target.value })} className="input">
                  <option value="home">توصيل للمنزل</option>
                  <option value="office">مكتب / Stopdesk</option>
                </select>
              </Field>
            </div>

            <Field label="عمولتك (د.ج) — أضفها فوق التكلفة كما تريد">
              <input required type="number" min="0" step="1" value={form.commissionAmount}
                onChange={(e) => setForm({ ...form, commissionAmount: e.target.value })} className="input" placeholder="مثال: 500" />
            </Field>

            <Field label="ملاحظات (تفاصيل العنوان، تفضيلات الزبون...)">
              <textarea rows={3} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="input" />
            </Field>

            <button type="submit" disabled={submitting || !breakdown} className="btn-primary w-full">
              {submitting ? 'جاري الإرسال...' : 'تقديم الطلب'}
            </button>
          </form>

          <div className="card h-fit">
            <h2 className="mb-4 font-semibold">تفصيل السعر</h2>
            {selectedProduct && (
              <div className="mb-4 flex items-center gap-3 border-b border-slate-100 pb-4 dark:border-slate-800">
                <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-slate-100 dark:bg-slate-800">
                  {selectedProduct.primary_image ? (
                    <Image src={selectedProduct.primary_image} alt={selectedProduct.title} fill className="object-cover" />
                  ) : (
                    <div className="flex h-full items-center justify-center text-slate-300"><ImageOff size={18} /></div>
                  )}
                </div>
                <span className="line-clamp-2 text-sm font-medium">{selectedProduct.title}</span>
              </div>
            )}
            {breakdown ? (
              <div className="space-y-3 text-sm">
                <Row label="سعر المنتج (تكلفتك)" value={breakdown.productPrice} />
                <Row label="عمولتك" value={breakdown.commission} accent />
                <Row label="مصاريف التوصيل" value={breakdown.deliveryFee} />
                <div className="border-t border-slate-200 pt-3 dark:border-slate-700">
                  <Row label="الإجمالي (اعرضه على الزبون)" value={breakdown.total} bold />
                </div>
              </div>
            ) : (
              <p className="text-sm text-slate-400">اختر منتجًا وولاية واكتب عمولتك لرؤية تفصيل السعر.</p>
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
      <span className={bold ? 'text-lg font-bold' : 'font-medium'}>{formatDZD(value)}</span>
    </div>
  );
}