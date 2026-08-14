import Image from 'next/image';
import { Phone, Send } from 'lucide-react';
import api from '../../lib/api';
import { formatDZD } from '../../lib/currency';

export default function VipStore({ store, products }) {
  if (!store) {
    return <div className="p-16 text-center text-slate-400">هذا المتجر غير متوفر حاليًا.</div>;
  }

  return (
    <div>
      <section className="relative overflow-hidden bg-gradient-to-br from-primary to-primary-dark py-20 text-white">
        {store.banner_url && (
          <div className="absolute inset-0 opacity-20">
            <Image src={store.banner_url} alt="" fill className="object-cover" />
          </div>
        )}
        <div className="relative mx-auto max-w-4xl px-4 text-center">
          <h1 className="text-3xl font-extrabold sm:text-5xl">{store.headline}</h1>
          {store.subheadline && <p className="mx-auto mt-4 max-w-2xl text-lg text-white/90">{store.subheadline}</p>}
          <p className="mt-6 text-sm text-white/70">بواسطة {store.affiliate_name}</p>

          <div className="mt-8 flex flex-wrap justify-center gap-3">
            {store.contact_phone && (
              <a href={`tel:${store.contact_phone}`} className="flex items-center gap-2 rounded-xl bg-white px-5 py-2.5 font-semibold text-primary">
                <Phone size={16} /> {store.contact_phone}
              </a>
            )}
            {store.contact_telegram && (
              <a href={store.contact_telegram} target="_blank" rel="noreferrer" className="flex items-center gap-2 rounded-xl border border-white/40 bg-white/10 px-5 py-2.5 font-semibold text-white backdrop-blur">
                <Send size={16} /> Contact
              </a>
            )}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <h2 className="mb-8 text-2xl font-bold">منتجاتنا</h2>
        <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-4">
          {products.map((p) => {
            const displayPrice = p.vip_price || p.price;
            return (
              <div key={p.id} className="card !p-0 overflow-hidden">
                <div className="relative aspect-square bg-slate-100 dark:bg-slate-800">
                  {p.primary_image && <Image src={p.primary_image} alt={p.title} fill className="object-cover" />}
                </div>
                <div className="p-4">
                  <p className="font-semibold">{p.title}</p>
                  <div className="mt-2 flex items-center gap-2">
                    <span className="text-lg font-bold">{formatDZD(displayPrice)}</span>
                    {p.vip_price && <span className="text-sm text-slate-400 line-through">{formatDZD(p.price)}</span>}
                  </div>
                </div>
              </div>
            );
          })}
          {!products.length && <p className="text-slate-400">لا توجد منتجات معروضة بعد.</p>}
        </div>
      </section>
    </div>
  );
}

export async function getServerSideProps({ params }) {
  try {
    const { data } = await api.get(`/store/${params.slug}`);
    return { props: { store: data.store, products: data.products } };
  } catch {
    return { props: { store: null, products: [] } };
  }
}
