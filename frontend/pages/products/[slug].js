import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Image from 'next/image';
import { Star, ImageOff } from 'lucide-react';
import api from '../../lib/api';
import { formatDZD } from '../../lib/currency';

export default function ProductDetail() {
  const router = useRouter();
  const { slug } = router.query;
  const [product, setProduct] = useState(null);
  // GET /api/products/:slug returns images grouped by category:
  // { catalog: [...], real: [...], landing: [...] } — not a flat array.
  const [images, setImages] = useState({ catalog: [], real: [], landing: [] });
  const [reviews, setReviews] = useState([]);
  const [activeImage, setActiveImage] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) return;
    setActiveImage(0);
    api.get(`/products/${slug}`)
      .then(({ data }) => {
        setProduct(data.product);
        setImages(data.images || { catalog: [], real: [], landing: [] });
        setReviews(data.reviews || []);
      })
      .catch(() => setProduct(null))
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) return <div className="p-16 text-center text-slate-400">جاري التحميل...</div>;
  if (!product) return <div className="p-16 text-center">المنتج غير موجود.</div>;

  // Catalog images are the main showcase; real (post-delivery) photos are shown
  // alongside them to build buyer trust — same gallery pattern used in
  // pages/affiliate/products/[slug].js.
  const gallery = [...(images.catalog || []), ...(images.real || [])];

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="grid gap-10 md:grid-cols-2">
        <div>
          <div className="relative mb-4 aspect-square overflow-hidden rounded-2xl bg-slate-100 dark:bg-slate-800">
            {gallery[activeImage] ? (
              <Image src={gallery[activeImage].image_url} alt={product.title} fill className="object-cover" />
            ) : (
              <div className="flex h-full flex-col items-center justify-center gap-2 text-slate-300 dark:text-slate-600">
                <ImageOff size={40} />
                <span className="text-sm">لا توجد صورة متاحة</span>
              </div>
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

        <div>
          {product.category_name && <span className="text-sm font-medium text-primary">{product.category_name}</span>}
          <h1 className="mt-1 text-3xl font-bold">{product.title}</h1>

          {product.avg_rating > 0 && (
            <div className="mt-2 flex items-center gap-1 text-amber-500">
              <Star size={16} fill="currentColor" />
              <span className="text-sm">{Number(product.avg_rating).toFixed(1)} ({reviews?.length || 0} تقييم)</span>
            </div>
          )}

          <p className="mt-4 text-3xl font-extrabold">{formatDZD(product.price)}</p>
          {product.vip_price && (
            <p className="text-sm text-accent">سعر VIP: {formatDZD(product.vip_price)}</p>
          )}
          <p className="mt-4 text-slate-600 dark:text-slate-300">{product.description}</p>
          <p className="mt-2 text-sm text-slate-500">عمولتك: {product.commission_percent}%</p>
        </div>
      </div>

      {/* Reviews */}
      <div className="mt-16">
        <h2 className="mb-6 text-xl font-bold">تقييمات الزبائن</h2>
        <div className="space-y-4">
          {(reviews || []).map((r, i) => (
            <div key={i} className="card">
              <div className="mb-2 flex items-center gap-2">
                <div className="flex text-amber-500">
                  {Array.from({ length: r.rating }).map((_, j) => <Star key={j} size={14} fill="currentColor" />)}
                </div>
                <span className="text-sm font-medium">{r.full_name}</span>
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-300">{r.comment}</p>
            </div>
          ))}
          {!reviews?.length && <p className="text-sm text-slate-400">لا توجد تقييمات بعد.</p>}
        </div>
      </div>
    </div>
  );
}
