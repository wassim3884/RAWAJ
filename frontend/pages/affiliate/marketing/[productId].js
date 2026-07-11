import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { LayoutDashboard, Search, Wallet, Bell, ClipboardList, Truck, Crown, Clock, Heart, Copy, Video, Image as ImageIcon } from 'lucide-react';
import toast from 'react-hot-toast';
import DashboardSidebar from '../../../components/DashboardSidebar';
import api from '../../../lib/api';

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

function parseJsonArray(value) {
  if (Array.isArray(value)) return value;
  try { return JSON.parse(value || '[]'); } catch { return []; }
}

export default function MarketingKit() {
  const router = useRouter();
  const { productId } = router.query;
  const [kit, setKit] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!productId) return;
    api.get(`/products/${productId}/marketing`).then(({ data }) => setKit(data.marketingAssets)).catch(() => {}).finally(() => setLoading(false));
  }, [productId]);

  const copyText = (text) => {
    navigator.clipboard.writeText(text);
    toast.success('تم النسخ!');
  };

  if (loading) return <div className="p-16 text-center text-slate-400">جاري التحميل...</div>;

  return (
    <div className="flex min-h-[80vh] flex-col md:flex-row">
      <DashboardSidebar links={links} />
      <div className="flex-1 p-6">
        <h1 className="mb-6 text-2xl font-bold">المكتبة التسويقية</h1>

        {!kit ? (
          <p className="text-slate-400">لا توجد مواد تسويقية جاهزة لهذا المنتج بعد.</p>
        ) : (
          <div className="space-y-6">
            {parseJsonArray(kit.ad_titles).length > 0 && (
              <div className="card">
                <h2 className="mb-3 font-semibold">عناوين جاهزة</h2>
                <div className="space-y-2">
                  {parseJsonArray(kit.ad_titles).map((title, i) => (
                    <div key={i} className="flex items-center justify-between rounded-lg bg-slate-50 p-3 text-sm dark:bg-slate-800">
                      <span>{title}</span>
                      <button onClick={() => copyText(title)} className="text-primary"><Copy size={14} /></button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {parseJsonArray(kit.ad_copy_variants).length > 0 && (
              <div className="card">
                <h2 className="mb-3 font-semibold">نصوص إعلانية جاهزة</h2>
                <div className="space-y-2">
                  {parseJsonArray(kit.ad_copy_variants).map((copy, i) => (
                    <div key={i} className="flex items-start justify-between gap-3 rounded-lg bg-slate-50 p-3 text-sm dark:bg-slate-800">
                      <span className="whitespace-pre-line">{copy}</span>
                      <button onClick={() => copyText(copy)} className="shrink-0 text-primary"><Copy size={14} /></button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="grid gap-4 sm:grid-cols-3">
              {['facebook_post', 'instagram_post', 'tiktok_post'].map((key) => kit[key] && (
                <div key={key} className="card">
                  <h3 className="mb-2 font-semibold capitalize">{key.replace('_post', '')}</h3>
                  <p className="mb-3 whitespace-pre-line text-sm text-slate-600 dark:text-slate-300">{kit[key]}</p>
                  <button onClick={() => copyText(kit[key])} className="btn-outline w-full !py-2 text-sm">
                    <Copy size={14} /> نسخ المنشور
                  </button>
                </div>
              ))}
            </div>

            {parseJsonArray(kit.image_urls).length > 0 && (
              <div className="card">
                <h2 className="mb-3 flex items-center gap-2 font-semibold"><ImageIcon size={18} /> صور احترافية</h2>
                <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
                  {parseJsonArray(kit.image_urls).map((url, i) => (
                    <a key={i} href={url} target="_blank" rel="noreferrer" className="block overflow-hidden rounded-lg">
                      <img src={url} alt="" className="h-24 w-full object-cover" />
                    </a>
                  ))}
                </div>
              </div>
            )}

            {parseJsonArray(kit.video_urls).length > 0 && (
              <div className="card">
                <h2 className="mb-3 flex items-center gap-2 font-semibold"><Video size={18} /> فيديوهات</h2>
                <div className="space-y-2">
                  {parseJsonArray(kit.video_urls).map((url, i) => (
                    <a key={i} href={url} target="_blank" rel="noreferrer" className="block rounded-lg bg-slate-50 p-3 text-sm text-primary dark:bg-slate-800">
                      {url}
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
