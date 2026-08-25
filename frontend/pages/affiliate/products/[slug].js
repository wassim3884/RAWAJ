import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Image from 'next/image';
import toast from 'react-hot-toast';
import { ImageOff, Copy, Star, X, ZoomIn, Download, ChevronLeft } from 'lucide-react';
import api from '../../../lib/api';
import { formatDZD } from '../../../lib/currency';

function parseJsonArray(value) {
  if (Array.isArray(value)) return value;
  try { return JSON.parse(value || '[]'); } catch { return []; }
}

export default function AffiliateProductDetail() {
  const router = useRouter();
  const { slug } = router.query;

  const [product, setProduct] = useState(null);
  const [images, setImages] = useState({ catalog: [], real: [], landing: [] });
  const [reviews, setReviews] = useState([]);
  const [marketingKit, setMarketingKit] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeImage, setActiveImage] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [wilayas, setWilayas] = useState([]);

  const [form, setForm] = useState({
    buyerName: '', buyerPhone: '', wilayaId: '', deliveryType: 'home', notes: '', commissionAmount: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [showOrderForm, setShowOrderForm] = useState(false);

  useEffect(() => {
    if (!slug) return;
    setActiveImage(0);
    setShowOrderForm(false);
    api.get(`/products/${slug}`)
      .then(({ data }) => {
        setProduct(data.product);
        setImages(data.images || { catalog: [], real: [], landing: [] });
        setReviews(data.reviews || []);
      })
      .catch(() => setProduct(null))
      .finally(() => setLoading(false));
    api.get('/wilayas').then(({ data }) => setWilayas(data.wilayas)).catch(() => {});
  }, [slug]);

  // Marketing kit is fetched once the product — and therefore its numeric id
  // — is known, and rendered inline further down at its proper place in the
  // information hierarchy instead of a separate "المكتبة التسويقية" page.
  useEffect(() => {
    if (!product?.id) return;
    api.get(`/products/${product.id}/marketing`)
      .then(({ data }) => setMarketingKit(data.marketingAssets))
      .catch(() => {});
  }, [product?.id]);

  useEffect(() => {
    const onEsc = (e) => e.key === 'Escape' && setLightboxOpen(false);
    window.addEventListener('keydown', onEsc);
    return () => window.removeEventListener('keydown', onEsc);
  }, []);

  // Real Clipboard API usage with a proper fallback: navigator.clipboard
  // requires a secure (HTTPS) context and isn't available in every browser,
  // so a failure falls back to the classic hidden-textarea + execCommand
  // trick instead of silently doing nothing.
  const copyText = async (text, successMessage = 'تم النسخ!') => {
    if (!text) return;
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
      } else {
        throw new Error('Clipboard API unavailable');
      }
      toast.success(successMessage);
    } catch {
      try {
        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.focus();
        textarea.select();
        const ok = document.execCommand('copy');
        document.body.removeChild(textarea);
        if (ok) toast.success(successMessage);
        else throw new Error('execCommand failed');
      } catch {
        toast.error('تعذّر النسخ التلقائي. انسخ النص يدويًا.');
      }
    }
  };

  // Main product gallery = catalog + "real" (post-delivery) photos.
  // Landing-page images are a distinct marketing asset (see schema.sql:
  // product_images.category) and get their own section below, framed
  // differently so they never look like a regular product photo.
  // Real download, not a decorative button. Cloudinary lets us force a true
  // download (Content-Disposition: attachment) via the `fl_attachment` URL
  // flag — this works even cross-origin, unlike a client-side fetch+blob
  // approach which Cloudinary's video CORS policy doesn't reliably support.
  // For a non-Cloudinary URL we fall back to a plain anchor-download; that
  // only succeeds when the browser treats the resource as same-origin/
  // CORS-permissive, otherwise the browser opens it in a new tab instead of
  // downloading — a real browser limitation, not something client JS can
  // override, and we don't pretend otherwise.
  const downloadFile = (url, filename) => {
    if (!url) return;
    try {
      const downloadUrl = url.includes('res.cloudinary.com') && !url.includes('fl_attachment')
        ? url.replace('/upload/', '/upload/fl_attachment/')
        : url;
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = filename || '';
      a.target = '_blank';
      a.rel = 'noopener';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch {
      toast.error('تعذّر بدء التحميل.');
    }
  };

  const downloadAllVideos = (urls) => {
    if (!urls.length) return;
    // Staggered rather than simultaneous: browsers throttle/block several
    // downloads triggered in the same tick, so one failing shouldn't stop
    // the rest — each is an independent, isolated attempt.
    urls.forEach((url, i) => setTimeout(() => downloadFile(url, `video-${i + 1}.mp4`), i * 400));
    toast.success(`جاري تحميل ${urls.length} فيديو...`);
  };

  const gallery = [...images.catalog, ...images.real];
  const extraImages = parseJsonArray(marketingKit?.image_urls);
  const videoUrls = parseJsonArray(marketingKit?.video_urls);
  const adTitles = parseJsonArray(marketingKit?.ad_titles);
  const adCopyVariants = parseJsonArray(marketingKit?.ad_copy_variants);
  const hasSocialPosts = marketingKit?.facebook_post || marketingKit?.instagram_post || marketingKit?.tiktok_post;
  const hasMarketingTools = adTitles.length > 0 || adCopyVariants.length > 0 || hasSocialPosts;

  const selectedWilaya = wilayas.find((w) => String(w.id) === String(form.wilayaId));

  const breakdown = useMemo(() => {
    if (!product || !selectedWilaya || form.commissionAmount === '') return null;
    const cost = Number(product.price);
    const commission = Number(form.commissionAmount) || 0;
    const deliveryFee = form.deliveryType === 'office' ? Number(selectedWilaya.delivery_fee_office) : Number(selectedWilaya.delivery_fee_home);
    return { cost, commission, deliveryFee, total: cost + commission + deliveryFee };
  }, [product, selectedWilaya, form.commissionAmount, form.deliveryType]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitting) return; // guard against double-click submitting the order twice
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
      setShowOrderForm(false);
    } catch (err) {
      toast.error(err.response?.data?.error || 'فشل تقديم الطلب.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="p-16 text-center text-slate-400">جاري التحميل...</div>;
  if (!product) return <div className="p-16 text-center">المنتج غير موجود.</div>;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
      {/* Breadcrumb */}
      <nav className="mb-6 flex items-center gap-1.5 text-sm text-slate-400">
        <Link href="/affiliate/dashboard" className="hover:text-primary">الرئيسية</Link>
        <ChevronLeft size={14} />
        <Link href="/affiliate/products" className="hover:text-primary">المنتجات</Link>
        <ChevronLeft size={14} />
        <span className="line-clamp-1 text-slate-600 dark:text-slate-300">{product.title}</span>
      </nav>

      <div className="grid gap-8 lg:grid-cols-2 lg:gap-12">
        {/* ============ 1. MEDIA ============ */}
        <div>
          <button
            type="button"
            onClick={() => gallery[activeImage] && setLightboxOpen(true)}
            className="group relative mb-3 block aspect-square w-full overflow-hidden rounded-2xl bg-slate-100 dark:bg-slate-800"
          >
            {gallery[activeImage] ? (
              <>
                <Image src={gallery[activeImage].image_url} alt={product.title} fill className="object-cover" priority />
                <span className="absolute bottom-3 left-3 flex items-center gap-1 rounded-full bg-black/50 px-2.5 py-1 text-xs text-white opacity-0 transition group-hover:opacity-100">
                  <ZoomIn size={13} /> تكبير
                </span>
              </>
            ) : (
              <div className="flex h-full flex-col items-center justify-center gap-2 text-slate-300 dark:text-slate-600">
                <ImageOff size={40} />
                <span className="text-sm">لا توجد صورة متاحة</span>
              </div>
            )}
          </button>
          {gallery.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-1">
              {gallery.map((img, i) => (
                <button key={i} onClick={() => setActiveImage(i)}
                  className={`relative h-16 w-16 shrink-0 overflow-hidden rounded-lg border-2 transition ${activeImage === i ? 'border-primary' : 'border-transparent opacity-80 hover:opacity-100'}`}>
                  <Image src={img.image_url} alt="" fill className="object-cover" />
                  {img.category === 'real' && <span className="absolute bottom-0 right-0 bg-black/60 px-1 text-[9px] text-white">حقيقية</span>}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* ============ 2–6. TITLE / CATEGORY / PRICE / SHORT INFO / CTA ============ */}
        <div>
          {product.category_name && (
            <span className="w-fit rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary">{product.category_name}</span>
          )}
          <h1 className="mt-3 flex items-start gap-2 text-2xl font-bold sm:text-3xl">
            <span>{product.title}</span>
            <button
              onClick={() => copyText(product.title, 'تم نسخ العنوان')}
              aria-label="نسخ العنوان"
              title="نسخ العنوان"
              className="mt-1 shrink-0 rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-primary dark:hover:bg-slate-800"
            >
              <Copy size={16} />
            </button>
          </h1>

          <div className="mt-3 flex items-baseline gap-3">
            <span className="text-2xl font-extrabold text-slate-900 dark:text-white">{formatDZD(product.price)}</span>
            {product.compare_at_price && (
              <span className="text-sm text-slate-400 line-through">{formatDZD(product.compare_at_price)}</span>
            )}
          </div>
          <p className="mt-1 text-sm text-slate-500">هذه تكلفتك — أنت تحدد عمولتك فوقها عند تقديم الطلب.</p>
          {product.vip_price && (
            <p className="mt-1 text-sm font-medium text-accent">سعر VIP الخاص بك: {formatDZD(product.vip_price)}</p>
          )}

          {reviews.length > 0 && (
            <div className="mt-3 flex items-center gap-1.5 text-sm text-amber-500">
              <Star size={15} fill="currentColor" />
              <span className="font-medium">{Number(product.avg_rating || 0).toFixed(1)}</span>
              <span className="text-slate-400">({reviews.length} تقييم)</span>
            </div>
          )}

          {/* CTA — order form gated behind the button; buyer details stay
              hidden until the affiliate actively chooses to submit. */}
          <div className="mt-6 border-t border-slate-100 pt-6 dark:border-slate-800">
            {product.status === 'out_of_stock' ? (
              <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-900/20">نفدت الكمية حاليًا.</p>
            ) : !showOrderForm ? (
              <button onClick={() => setShowOrderForm(true)} className="btn-primary w-full !py-3 text-base">
                تقديم طلب
              </button>
            ) : (
              <>
                <h2 className="mb-4 text-lg font-bold">تقديم عرض لهذا المنتج</h2>
                <div className="mb-4 flex items-center gap-3 rounded-xl bg-slate-50 p-3 dark:bg-slate-800">
                  <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-slate-100 dark:bg-slate-700">
                    {gallery[0] ? (
                      <Image src={gallery[0].image_url} alt={product.title} fill className="object-cover" />
                    ) : (
                      <div className="flex h-full items-center justify-center text-slate-300"><ImageOff size={18} /></div>
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-semibold">{product.title}</p>
                    <p className="text-xs text-slate-500">تكلفتك: {formatDZD(product.price)}</p>
                  </div>
                </div>
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
            )}
          </div>
        </div>
      </div>

      {/* ============ 7. DESCRIPTION ============ */}
      {product.description && (
        <section className="mt-12 border-t border-slate-100 pt-8 dark:border-slate-800">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-xl font-bold">وصف المنتج</h2>
            <button
              onClick={() => copyText(product.description, 'تم نسخ الوصف')}
              className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-sm text-slate-500 transition hover:border-primary hover:text-primary dark:border-slate-700"
            >
              <Copy size={14} /> نسخ الوصف
            </button>
          </div>
          <p className="whitespace-pre-line leading-relaxed text-slate-600 dark:text-slate-300">{product.description}</p>
        </section>
      )}

      {/* ============ 8. MARKETING TOOLS (ready titles/copy/social posts) ============ */}
      {hasMarketingTools && (
        <section className="mt-10">
          <h2 className="mb-4 text-xl font-bold">أدوات تسويقية جاهزة</h2>
          <div className="space-y-6">
            {adTitles.length > 0 && (
              <div className="card">
                <h3 className="mb-3 font-semibold">عناوين جاهزة</h3>
                <div className="space-y-2">
                  {adTitles.map((title, i) => (
                    <div key={i} className="flex items-center justify-between rounded-lg bg-slate-50 p-3 text-sm dark:bg-slate-800">
                      <span>{title}</span>
                      <button onClick={() => copyText(title)} className="text-primary"><Copy size={14} /></button>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {adCopyVariants.length > 0 && (
              <div className="card">
                <h3 className="mb-3 font-semibold">نصوص إعلانية جاهزة</h3>
                <div className="space-y-2">
                  {adCopyVariants.map((copy, i) => (
                    <div key={i} className="flex items-start justify-between gap-3 rounded-lg bg-slate-50 p-3 text-sm dark:bg-slate-800">
                      <span className="whitespace-pre-line">{copy}</span>
                      <button onClick={() => copyText(copy)} className="shrink-0 text-primary"><Copy size={14} /></button>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {hasSocialPosts && (
              <div className="grid gap-4 sm:grid-cols-3">
                {['facebook_post', 'instagram_post', 'tiktok_post'].map((key) => marketingKit[key] && (
                  <div key={key} className="card">
                    <h4 className="mb-2 font-semibold capitalize">{key.replace('_post', '')}</h4>
                    <p className="mb-3 whitespace-pre-line text-sm text-slate-600 dark:text-slate-300">{marketingKit[key]}</p>
                    <button onClick={() => copyText(marketingKit[key])} className="btn-outline w-full !py-2 text-sm">
                      <Copy size={14} /> نسخ المنشور
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      {/* ============ 9. ADDITIONAL PROFESSIONAL IMAGES ============ */}
      {extraImages.length > 0 && (
        <section className="mt-10">
          <h2 className="mb-4 text-xl font-bold">صور إضافية احترافية</h2>
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-6">
            {extraImages.map((url, i) => (
              <a key={i} href={url} target="_blank" rel="noreferrer" className="block aspect-square overflow-hidden rounded-xl bg-slate-100 dark:bg-slate-800">
                {/* External marketing asset URL, not from next/image's known domains list */}
                <img src={url} alt="" className="h-full w-full object-cover transition hover:scale-105" />
              </a>
            ))}
          </div>
        </section>
      )}

      {/* ============ 10. VIDEO — real <video> players, muted, no autoplay, real downloads ============ */}
      {videoUrls.length > 0 && (
        <section className="mt-10">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-xl font-bold">الفيديوهات الإعلانية</h2>
            {videoUrls.length > 1 && (
              <button
                onClick={() => downloadAllVideos(videoUrls)}
                className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-sm text-slate-600 transition hover:border-primary hover:text-primary dark:border-slate-700 dark:text-slate-300"
              >
                <Download size={14} /> تحميل جميع الفيديوهات
              </button>
            )}
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {videoUrls.map((url, i) => (
              <div key={i} className="overflow-hidden rounded-2xl bg-black">
                <video src={url} controls muted playsInline preload="metadata" className="aspect-video w-full" />
                <button
                  onClick={() => downloadFile(url, `video-${i + 1}.mp4`)}
                  className="flex w-full items-center justify-center gap-1.5 bg-slate-900 py-2 text-sm text-white transition hover:bg-slate-800"
                >
                  <Download size={14} /> تحميل الفيديو
                </button>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ============ 11. LANDING PAGE IMAGE — visually distinct, never mistaken
           for a regular product photo, contain (never stretched/cropped) ============ */}
      {images.landing.length > 0 && (
        <section className="mt-10">
          <h2 className="mb-1 text-xl font-bold">صفحات الهبوط</h2>
          <p className="mb-4 text-sm text-slate-500">مصمَّمة خصيصًا للتسويق — استخدمها في إعلاناتك.</p>
          <div className="space-y-4">
            {images.landing.map((img, i) => (
              <div key={i} className="overflow-hidden rounded-2xl border border-dashed border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800/50">
                <div className="flex justify-center p-3">
                  <img src={img.image_url} alt="صفحة هبوط" className="max-h-[600px] w-auto object-contain" />
                </div>
                <div className="flex border-t border-slate-200 dark:border-slate-700">
                  <button
                    onClick={() => downloadFile(img.image_url, `landing-page-${i + 1}.jpg`)}
                    className="flex flex-1 items-center justify-center gap-1.5 py-2.5 text-sm text-slate-600 transition hover:text-primary dark:text-slate-300"
                  >
                    <Download size={14} /> تحميل الصورة
                  </button>
                  <div className="w-px bg-slate-200 dark:bg-slate-700" />
                  <button
                    onClick={() => copyText(img.image_url, 'تم نسخ رابط الصورة')}
                    className="flex flex-1 items-center justify-center gap-1.5 py-2.5 text-sm text-slate-600 transition hover:text-primary dark:text-slate-300"
                  >
                    <Copy size={14} /> نسخ الرابط
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ============ 12. REVIEWS ============ */}
      {reviews.length > 0 && (
        <section className="mt-12 border-t border-slate-100 pt-8 dark:border-slate-800">
          <h2 className="mb-6 text-xl font-bold">تقييمات الزبائن</h2>
          <div className="space-y-4">
            {reviews.map((r, i) => (
              <div key={i} className="card">
                <div className="mb-2 flex items-center gap-2">
                  <div className="flex text-amber-500">
                    {Array.from({ length: 5 }).map((_, s) => (
                      <Star key={s} size={14} fill={s < r.rating ? 'currentColor' : 'none'} />
                    ))}
                  </div>
                  <span className="text-sm font-medium">{r.full_name}</span>
                </div>
                {r.comment && <p className="text-sm text-slate-600 dark:text-slate-300">{r.comment}</p>}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Lightbox */}
      {lightboxOpen && gallery[activeImage] && (
        <div
          onClick={() => setLightboxOpen(false)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
        >
          <button onClick={() => setLightboxOpen(false)} aria-label="إغلاق" className="absolute right-4 top-4 text-white/80 hover:text-white">
            <X size={28} />
          </button>
          <img src={gallery[activeImage].image_url} alt={product.title} className="max-h-full max-w-full object-contain" />
        </div>
      )}

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
