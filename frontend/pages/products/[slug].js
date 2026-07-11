import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Image from 'next/image';
import { Star } from 'lucide-react';
import api from '../../lib/api';

export default function ProductDetail() {
  const router = useRouter();
  const { slug } = router.query;
  const [product, setProduct] = useState(null);
  const [images, setImages] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [activeImage, setActiveImage] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) return;
    api.get(`/products/${slug}`)
      .then(({ data }) => {
        setProduct(data.product);
        setImages(data.images || []);
        setReviews(data.reviews || []);
      })
      .catch(() => setProduct(null))
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) return <div className="p-16 text-center text-slate-400">جاري التحميل...</div>;
  if (!product) return <div className="p-16 text-center">Product not found.</div>;

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="grid gap-10 md:grid-cols-2">
        <div>
          <div className="relative mb-4 aspect-square overflow-hidden rounded-2xl bg-slate-100 dark:bg-slate-800">
            {images?.[activeImage] && (
              <Image src={images[activeImage].image_url} alt={product.title} fill className="object-cover" />
            )}
          </div>
          <div className="flex gap-2">
            {images?.map((img, i) => (
              <button key={i} onClick={() => setActiveImage(i)}
                className={`relative h-16 w-16 overflow-hidden rounded-lg border-2 ${activeImage === i ? 'border-primary' : 'border-transparent'}`}>
                <Image src={img.image_url} alt="" fill className="object-cover" />
              </button>
            ))}
          </div>
        </div>

        <div>
          {product.category_name && <span className="text-sm font-medium text-primary">{product.category_name}</span>}
          <h1 className="mt-1 text-3xl font-bold">{product.title}</h1>

          {product.avg_rating > 0 && (
            <div className="mt-2 flex items-center gap-1 text-amber-500">
              <Star size={16} fill="currentColor" />
              <span className="text-sm">{Number(product.avg_rating).toFixed(1)} ({reviews?.length || 0} reviews)</span>
            </div>
          )}

          <p className="mt-4 text-3xl font-extrabold">${Number(product.price).toFixed(2)}</p>
          {product.vip_price && (
            <p className="text-sm text-accent">سعر VIP: ${Number(product.vip_price).toFixed(2)}</p>
          )}
          <p className="mt-4 text-slate-600 dark:text-slate-300">{product.description}</p>
          <p className="mt-2 text-sm text-slate-500">عمولتك: {product.commission_percent}%</p>

          <p className="mt-4 text-sm text-slate-500">{product.stock_quantity} in stock</p>
        </div>
      </div>

      {/* Reviews */}
      <div className="mt-16">
        <h2 className="mb-6 text-xl font-bold">Customer Reviews</h2>
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
          {!reviews?.length && <p className="text-sm text-slate-400">No reviews yet.</p>}
        </div>
      </div>
    </div>
  );
}
