import { useEffect, useState } from 'react';
import { LayoutDashboard, Search, Wallet, Bell, ClipboardList, Truck, Crown, MapPin, Star, Clock, Heart } from 'lucide-react';
import toast from 'react-hot-toast';
import DashboardSidebar from '../../components/DashboardSidebar';
import api from '../../lib/api';
import { formatDZD } from '../../lib/currency';
import { AFFILIATE_NAV_LINKS } from '../../lib/affiliateNav';

export default function AffiliateVip() {
  const [eligibility, setEligibility] = useState(null);
  const [store, setStore] = useState(null);
  const [resources, setResources] = useState(null);
  const [approvedProducts, setApprovedProducts] = useState([]);
  const [form, setForm] = useState({
    storeSlug: '', headline: '', subheadline: '', bannerUrl: '', contactPhone: '', contactTelegram: '', productIds: [],
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get('/vip/eligibility').then(({ data }) => setEligibility(data)).catch(() => {});
    api.get('/affiliate/products').then(({ data }) => setApprovedProducts(data.products.filter((p) => p.request_status === 'approved'))).catch(() => {});
  }, []);

  useEffect(() => {
    if (eligibility?.isVip) {
      api.get('/vip/store').then(({ data }) => {
        if (data.store) {
          setStore(data.store);
          setForm({
            storeSlug: data.store.store_slug,
            headline: data.store.headline || '',
            subheadline: data.store.subheadline || '',
            bannerUrl: data.store.banner_url || '',
            contactPhone: data.store.contact_phone || '',
            contactTelegram: data.store.contact_telegram || '',
            productIds: Array.isArray(data.store.product_ids) ? data.store.product_ids : JSON.parse(data.store.product_ids || '[]'),
          });
        }
      }).catch(() => {});
      api.get('/vip/resources').then(({ data }) => setResources(data.resources)).catch(() => {});
    }
  }, [eligibility?.isVip]);

  const toggleProduct = (id) => {
    setForm((prev) => ({
      ...prev,
      productIds: prev.productIds.includes(id) ? prev.productIds.filter((x) => x !== id) : [...prev.productIds, id],
    }));
  };

  const saveStore = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const { data } = await api.put('/vip/store', form);
      setStore(data.store);
      toast.success('Store saved!');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to save store.');
    } finally {
      setSaving(false);
    }
  };

  if (!eligibility) {
    return (
      <div className="flex min-h-[80vh] flex-col md:flex-row">
        <DashboardSidebar links={AFFILIATE_NAV_LINKS} />
        <div className="flex-1 p-6">Loading...</div>
      </div>
    );
  }

  return (
    <div className="flex min-h-[80vh] flex-col md:flex-row">
      <DashboardSidebar links={AFFILIATE_NAV_LINKS} />
      <div className="flex-1 p-6">
        <h1 className="mb-6 flex items-center gap-2 text-2xl font-bold">
          <Crown className="text-accent" size={26} /> VIP Program
        </h1>

        {!eligibility.isVip && (
          <div className="card mb-8">
            <p className="mb-2 font-semibold">Your progress toward VIP</p>
            <p className="mb-3 text-sm text-slate-500 dark:text-slate-400">
              Reach {eligibility.threshold} delivered orders to become eligible. You have {eligibility.deliveredOrders}.
            </p>
            <div className="h-3 w-full rounded-full bg-slate-100 dark:bg-slate-800">
              <div className="h-3 rounded-full bg-accent transition-all"
                style={{ width: `${Math.min(100, (eligibility.deliveredOrders / eligibility.threshold) * 100)}%` }} />
            </div>
            {eligibility.isEligible && (
              <p className="mt-3 rounded-lg bg-green-50 p-3 text-sm text-green-700 dark:bg-green-900/20">
                🎉 You&apos;re eligible for VIP! Our team will reach out to activate your account, or contact support directly.
              </p>
            )}
          </div>
        )}

        {eligibility.isVip && (
          <div className="space-y-8">
            <div className="card">
              <div className="mb-4 flex items-center gap-2 text-accent">
                <Star fill="currentColor" size={18} />
                <span className="font-semibold">You are a VIP affiliate</span>
              </div>

              <form onSubmit={saveStore} className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="رابط المتجر">
                    <input required value={form.storeSlug} onChange={(e) => setForm({ ...form, storeSlug: e.target.value })} className="input" placeholder="my-store" />
                  </Field>
                  <Field label="العنوان الرئيسي">
                    <input value={form.headline} onChange={(e) => setForm({ ...form, headline: e.target.value })} className="input" />
                  </Field>
                </div>
                <Field label="الوصف الفرعي">
                  <textarea rows={2} value={form.subheadline} onChange={(e) => setForm({ ...form, subheadline: e.target.value })} className="input" />
                </Field>
                <div className="grid gap-4 sm:grid-cols-3">
                  <Field label="رابط صورة الغلاف">
                    <input value={form.bannerUrl} onChange={(e) => setForm({ ...form, bannerUrl: e.target.value })} className="input" />
                  </Field>
                  <Field label="رقم الهاتف">
                    <input value={form.contactPhone} onChange={(e) => setForm({ ...form, contactPhone: e.target.value })} className="input" />
                  </Field>
                  <Field label="تيليغرام / واتساب">
                    <input value={form.contactTelegram} onChange={(e) => setForm({ ...form, contactTelegram: e.target.value })} className="input" />
                  </Field>
                </div>

                <Field label="المنتجات المميزة">
                  <div className="grid max-h-56 gap-2 overflow-y-auto rounded-xl border border-slate-200 p-3 dark:border-slate-700 sm:grid-cols-2">
                    {approvedProducts.map((p) => (
                      <label key={p.id} className="flex items-center gap-2 text-sm">
                        <input type="checkbox" checked={form.productIds.includes(p.id)} onChange={() => toggleProduct(p.id)} />
                        {p.title} — {formatDZD(p.price)}
                      </label>
                    ))}
                    {!approvedProducts.length && <p className="text-sm text-slate-400">No approved products yet.</p>}
                  </div>
                </Field>

                <button type="submit" disabled={saving} className="btn-primary">
                  {saving ? 'Saving...' : 'Save Store'}
                </button>

                {store && (
                  <p className="text-sm text-slate-500">
                    Your store is live at: <a href={`/store/${store.store_slug}`} target="_blank" rel="noreferrer" className="font-medium text-primary">/store/{store.store_slug}</a>
                  </p>
                )}
              </form>
            </div>

            {resources && (
              <div className="card">
                <h2 className="mb-4 font-semibold">VIP Resources — Support &amp; Marketing</h2>
                {resources.bestSellers?.length > 0 && (
                  <div className="mb-4">
                    <p className="mb-2 text-sm font-medium text-slate-500">Best-selling products right now</p>
                    <ul className="list-inside list-disc text-sm">
                      {resources.bestSellers.map((item, i) => <li key={i}>{item}</li>)}
                    </ul>
                  </div>
                )}
                {resources.marketingTips && (
                  <div className="mb-4">
                    <p className="mb-2 text-sm font-medium text-slate-500">Marketing plan &amp; tips</p>
                    <p className="whitespace-pre-line text-sm">{resources.marketingTips}</p>
                  </div>
                )}
                {resources.landingImages?.length > 0 && (
                  <div>
                    <p className="mb-2 text-sm font-medium text-slate-500">Ready-made landing page images</p>
                    <div className="grid grid-cols-3 gap-2">
                      {resources.landingImages.map((url, i) => (
                        <a key={i} href={url} target="_blank" rel="noreferrer" className="block overflow-hidden rounded-lg">
                          <img src={url} alt="" className="h-24 w-full object-cover" />
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
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
