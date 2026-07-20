import Link from 'next/link';
import Image from 'next/image';
import { Star, Heart } from 'lucide-react';
import { formatDZD } from '../lib/currency';

export default function ProductCard({ product }) {
  return (
    <div className="card group relative flex flex-col overflow-hidden !p-0">
      <button className="absolute right-3 top-3 z-10 rounded-full bg-white/90 p-2 text-slate-500 shadow hover:text-red-500 dark:bg-slate-800/90">
        <Heart size={16} />
      </button>

      <Link href={`/products/${product.slug}`} className="relative block aspect-square w-full overflow-hidden bg-slate-100 dark:bg-slate-800">
        {product.primary_image ? (
          <Image
            src={product.primary_image}
            alt={product.title}
            fill
            className="object-cover transition duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-slate-300">No image</div>
        )}
        {product.commission_percent && (
          <span className="absolute left-3 top-3 rounded-full bg-accent px-2.5 py-1 text-xs font-semibold text-white">
            {product.commission_percent}% commission
          </span>
        )}
      </Link>

      <div className="flex flex-1 flex-col gap-2 p-4">
        {product.category_name && (
          <span className="text-xs font-medium uppercase tracking-wide text-primary">{product.category_name}</span>
        )}
        <Link href={`/products/${product.slug}`} className="line-clamp-2 font-semibold text-slate-800 hover:text-primary dark:text-slate-100">
          {product.title}
        </Link>

        {product.avg_rating > 0 && (
          <div className="flex items-center gap-1 text-sm text-amber-500">
            <Star size={14} fill="currentColor" />
            <span>{Number(product.avg_rating).toFixed(1)}</span>
          </div>
        )}

        <div className="mt-auto flex items-center justify-between pt-2">
          <span className="text-lg font-bold text-slate-900 dark:text-white">{formatDZD(product.price)}</span>
          {product.compare_at_price && (
            <span className="text-sm text-slate-400 line-through">{formatDZD(product.compare_at_price)}</span>
          )}
        </div>
      </div>
    </div>
  );
}
