import { useState } from 'react';
import Image from 'next/image';
import { Send, Search } from 'lucide-react';
import api from '../lib/api';

export default function Wholesale({ initialProducts, telegramUrl }) {
  const [products, setProducts] = useState(initialProducts);
  const [query, setQuery] = useState('');

  const search = async () => {
    try {
      const { data } = await api.get('/wholesale', { params: { q: query || undefined } });
      setProducts(data.products);
    } catch {
      // ignore
    }
  };

  return (
    <div>
      <section className="bg-gradient-to-br from-primary to-primary-dark py-16 text-white">
        <div className="mx-auto max-w-4xl px-4 text-center">
          <h1 className="text-3xl font-extrabold sm:text-4xl">بيع بالجملة للتجار</h1>
          <p className="mx-auto mt-4 max-w-2xl text-white/90">
            تصفّح كتالوج الجملة أو انضم لقناة تيليغرام لرؤية جميع المنتجات المتوفرة أولاً بأول.
          </p>
          {telegramUrl && (
            <a href={telegramUrl} target="_blank" rel="noreferrer"
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3 font-semibold text-primary shadow-card hover:shadow-card-hover">
              <Send size={18} /> انضم لقناة تيليغرام
            </a>
          )}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="mb-8 flex items-center gap-2">
          <input value={query} onChange={(e) => setQuery(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && search()}
            placeholder="ابحث عن منتج..." className="w-full max-w-sm rounded-xl border border-slate-200 px-4 py-2.5 outline-none focus:border-primary dark:border-slate-700 dark:bg-slate-900" />
          <button onClick={search} className="btn-primary !py-2"><Search size={16} /> بحث</button>
        </div>

        <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-4">
          {products.map((p) => (
            <div key={p.id} className="card !p-0 overflow-hidden">
              <div className="relative aspect-square bg-slate-100 dark:bg-slate-800">
                {p.image_url && <Image src={p.image_url} alt={p.title} fill className="object-cover" />}
              </div>
              <div className="p-4">
                {p.category_name && <span className="text-xs font-medium uppercase tracking-wide text-primary">{p.category_name}</span>}
                <p className="font-semibold">{p.title}</p>
                <p className="mt-1 text-sm text-slate-500">{p.description}</p>
                <div className="mt-2 flex items-center justify-between">
                  <span className="text-lg font-bold">${Number(p.wholesale_price).toFixed(2)}</span>
                  <span className="text-xs text-slate-400">MOQ {p.min_order_quantity}</span>
                </div>
              </div>
            </div>
          ))}
          {!products.length && <p className="col-span-full text-center text-slate-400">لا توجد منتجات حاليًا.</p>}
        </div>
      </section>
    </div>
  );
}

export async function getServerSideProps() {
  try {
    const [productsRes, telegramRes] = await Promise.all([
      api.get('/wholesale').catch(() => ({ data: { products: [] } })),
      api.get('/wholesale/telegram-url').catch(() => ({ data: { telegramUrl: null } })),
    ]);
    return {
      props: {
        initialProducts: productsRes.data.products,
        telegramUrl: telegramRes.data.telegramUrl || '',
      },
    };
  } catch {
    return { props: { initialProducts: [], telegramUrl: '' } };
  }
}
