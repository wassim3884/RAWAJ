import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import Image from 'next/image';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { Megaphone } from 'lucide-react';
import api from '../../../lib/api';
import { formatDZD } from '../../../lib/currency';

export default function AffiliateProductDetail() {
  const router = useRouter();
  const { slug } = router.query;

  const [product, setProduct] = useState(null);
  const [images, setImages] = useState({ catalog: [], real: [], landing: [] });
  const [loading, setLoading] = useState(true);
  const [activeImage, setActiveImage] = useState(0);
  const [wilayas, setWilayas] = useState([]);
  const [requesting, setRequesting] = useState(false);

  const [form, setForm] = useState({
    buyerName: '', buyerPhone: '', wilayaId: '', deliveryType: 'home', notes: '', commissionAmount: '',
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!slug) return;
    api.get(`/products/${slug}`)
      .then(({ data }) => {
        setProduct(data.product);
        setImages(data.images || { catalog: [], real: [], landing: [] });
      })
      .catch(() => setProduct(null))
      .finally(() => setLoading(false));
    api.get('/wilayas').then(({ data }) => setWilayas(data.wilayas)).catch(() => {});
  }, [slug]);

  const gallery = [...images.catalog, ...images.real];
  const selectedWilaya = wilayas.find((w) => String(w.id) === String(form.wilayaId));

  const breakdown = useMemo(() => {
    if (!product || !selectedWilaya || form.commissionAmount === '') return null;
    const cost = Number(product.price);
    const commission = Number(form.commissionAmount) || 0;
    const deliveryFee = form.deliveryType === 'office' ? Number(selectedWilaya.delivery_fee_office) : Number(selectedWilaya.delivery_fee_home);
    return { cost, commission, deliveryFee, total: cost + commission + deliveryFee };
  }, [product, selectedWilaya, form.commissionAmount, form.deliveryType]);

  const requestApproval = async () => {
    setRequesting(true);
    try {
      await api.post('/affiliate/requests', { productId: product.id });
      toast.success('تم إرسال طلب الموافقة!');
      setProduct({ ...product, request_status: 'pending' });
    } catch (err) {
      toast.error(err.response?.data?.error || 'حدث خطأ.');
    } finally {
      setRequesting(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!breakdown) {
      toast.error('أكمل بيانات الولاية والعمولة أولاً.');
      return;
    }
    setSubmitting(true);
    try {
      await api.post('/orders', {
        productId: product.id,
        buyerName: form.buyerName,
        buyerPhone: form.buyerPhone,
        wilayaId: form.wilayaId,
        deliveryType: form.deliveryType,
        notes: form.notes,
        commissionAmount: Number(form.commissionAmount) || 0,
      });
      toast.success('تم إرسال الطلب! سيتصل فريقنا بالزبون للتأكيد.');
      setForm({ buyerName: '', buyerPhone: '', wilayaId: '', deliveryType: 'home', notes: '', commissionAmount: '' });
    } catch (err) {
      toast.error(err.response?.data?.error || 'فشل تقديم الطلب.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="p-16 text-center text-slate-400">جاري التحميل...</div>;
  if (!product) return <div className="p-16 text-center">المنتج غير موجود.</div>;

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="grid gap-10 lg:grid-cols-2">
        {/* Gallery */}
        <div>
          <div className="relative mb-4 aspect-square overflow-hidden rounded-2xl bg-slate-100 dark:bg-slate-800">
            {gallery[activeImage] && (
              <Image src={gallery[activeImage].image_url} alt={product.title} fill className="object-cover" />
            )}
          </div>
          {gallery.length > 1 && (
            <div className="flex gap-2 overflow-x-auto">
              {gallery.map((img, i) => (
                <button key={i} onClick={() => setActiveImage(i)}
                  className={`relative h-16 w-16 shrink-0 overflow-hidden rounded-lg border-2 ${activeImage === i ? 'border-primary' : 'border-transparent'}`}>
                  <Image src={img.image_url} alt="" fill className="object-cover" />
                  {img.category === 'real' && <span className="absolute bottom-0 right-0 bg-black/60 px-1 text-[9px] text-white">حقيقية</span>}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Info + order form */}
        <div>
          {product.category_name && <span className="text-sm font-medium text-primary">{product.category_name}</span>}
          <h1 className="mt-1 text-2xl font-bold sm:text-3xl">{product.title}</h1>
          <p className="mt-3 text-slate-600 dark:text-slate-300">{product.description}</p>
          <p className="mt-4 text-sm text-slate-500">تكلفتك (سعر الأساس): <span className="font-bold text-slate-800 dark:text-slate-100">{formatDZD(product.price)}</span></p>
          {product.vip_price && <p className="text-sm text-accent">سعر VIP: {formatDZD(product.vip_price)}</p>}
          <p className="mt-1 text-sm text-slate-500">{product.stock_quantity} قطعة متوفرة</p>

          <Link href={`/affiliate/marketing/${product.id}`} className="btn-outline mt-4 inline-flex items-center gap-1 !py-2 text-sm">
            <Megaphone size={14} /> المكتبة التسويقية
          </Link>

          <div className="mt-6 border-t border-slate-100 pt-6 dark:border-slate-800">
            {product.status === 'out_of_stock' ? (
              <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-900/20">نفدت الكمية حاليًا.</p>
            ) : product.request_status === 'approved' ? (
              <>
                <h2 className="mb-4 text-lg font-bold">تقديم عرض لهذا المنتج</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
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
                        {wilayas.map((w) => <option key={w.id} value={w.id}>{w.code} — {w.name_ar}</option>)}
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
                    <textarea rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="input" />
                  </Field>

                  {breakdown && (
                    <div className="rounded-xl bg-slate-50 p-4 text-sm dark:bg-slate-800">
                      <Row label="التكلفة" value={breakdown.cost} />
                      <Row label="عمولتك" value={breakdown.commission} accent />
                      <Row label="مصاريف التوصيل" value={breakdown.deliveryFee} />
                      <div className="mt-2 border-t border-slate-200 pt-2 dark:border-slate-700">
                        <Row label="الإجمالي (اعرضه على الزبون)" value={breakdown.total} bold />
                      </div>
                    </div>
                  )}

                  <button type="submit" disabled={submitting} className="btn-primary w-full">
                    {submitting ? 'جاري الإرسال...' : 'تقديم الطلب'}
                  </button>
                </form>
              </>
            ) : product.request_status === 'pending' ? (
              <span className="inline-block rounded-full bg-amber-100 px-3 py-1 text-sm text-amber-700">بانتظار الموافقة على الترويج</span>
            ) : (
              <button onClick={requestApproval} disabled={requesting} className="btn-primary w-full">
                {requesting ? 'جاري الإرسال...' : 'اطلب الموافقة على ترويج هذا المنتج'}
              </button>
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
    <div className="flex justify-between py-0.5">
      <span className={accent ? 'text-accent' : 'text-slate-500'}>{label}</span>
      <span className={bold ? 'text-base font-bold' : 'font-medium'}>{formatDZD(value)}</span>
    </div>
  );
}
