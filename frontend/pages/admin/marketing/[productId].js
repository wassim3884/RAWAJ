import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { LayoutDashboard, Users, Package, Wallet, Settings, Tag, Crown, Truck } from 'lucide-react';
import toast from 'react-hot-toast';
import DashboardSidebar from '../../../components/DashboardSidebar';
import api from '../../../lib/api';

const links = [
  { href: '/admin/dashboard', label: 'Overview', icon: LayoutDashboard },
  { href: '/admin/users', label: 'Affiliates', icon: Users },
  { href: '/admin/products', label: 'Products', icon: Package },
  { href: '/admin/orders', label: 'Orders', icon: Wallet },
  { href: '/admin/withdrawals', label: 'Withdrawals', icon: Wallet },
  { href: '/admin/delivery-rates', label: 'Delivery Rates', icon: Tag },
  { href: '/admin/wholesale', label: 'Wholesale', icon: Truck },
  { href: '/admin/vip', label: 'VIP', icon: Crown },
  { href: '/admin/settings', label: 'Site Settings', icon: Settings },
];

function toLines(value) {
  const arr = Array.isArray(value) ? value : (() => { try { return JSON.parse(value || '[]'); } catch { return []; } })();
  return arr.join('\n');
}
function fromLines(text) {
  return text.split('\n').map((s) => s.trim()).filter(Boolean);
}

export default function EditMarketingKit() {
  const router = useRouter();
  const { productId } = router.query;
  const [form, setForm] = useState({
    adTitles: '', videoUrls: '', imageUrls: '', adCopyVariants: '',
    facebookPost: '', instagramPost: '', tiktokPost: '',
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!productId) return;
    api.get(`/products/${productId}/marketing`).then(({ data }) => {
      const kit = data.marketingAssets;
      if (kit) {
        setForm({
          adTitles: toLines(kit.ad_titles),
          videoUrls: toLines(kit.video_urls),
          imageUrls: toLines(kit.image_urls),
          adCopyVariants: toLines(kit.ad_copy_variants),
          facebookPost: kit.facebook_post || '',
          instagramPost: kit.instagram_post || '',
          tiktokPost: kit.tiktok_post || '',
        });
      }
    }).catch(() => {});
  }, [productId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.put(`/products/${productId}/marketing`, {
        adTitles: fromLines(form.adTitles),
        videoUrls: fromLines(form.videoUrls),
        imageUrls: fromLines(form.imageUrls),
        adCopyVariants: fromLines(form.adCopyVariants).length ? form.adCopyVariants.split('\n---\n').map((s) => s.trim()).filter(Boolean) : [],
        facebookPost: form.facebookPost,
        instagramPost: form.instagramPost,
        tiktokPost: form.tiktokPost,
      });
      toast.success('تم حفظ المكتبة التسويقية.');
    } catch {
      toast.error('فشل الحفظ.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex min-h-[80vh] flex-col md:flex-row">
      <DashboardSidebar links={links} />
      <div className="flex-1 p-6">
        <h1 className="mb-6 text-2xl font-bold">تعديل المكتبة التسويقية</h1>

        <form onSubmit={handleSubmit} className="card space-y-4">
          <Field label="عناوين جاهزة (سطر لكل عنوان)">
            <textarea rows={3} value={form.adTitles} onChange={(e) => setForm({ ...form, adTitles: e.target.value })} className="input" />
          </Field>
          <Field label="نصوص إعلانية (افصل بين كل نص وآخر بسطر يحتوي ---)">
            <textarea rows={5} value={form.adCopyVariants} onChange={(e) => setForm({ ...form, adCopyVariants: e.target.value })} className="input" />
          </Field>
          <Field label="روابط فيديوهات (سطر لكل رابط)">
            <textarea rows={3} value={form.videoUrls} onChange={(e) => setForm({ ...form, videoUrls: e.target.value })} className="input" />
          </Field>
          <Field label="روابط صور احترافية (سطر لكل رابط)">
            <textarea rows={3} value={form.imageUrls} onChange={(e) => setForm({ ...form, imageUrls: e.target.value })} className="input" />
          </Field>
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="منشور فيسبوك">
              <textarea rows={4} value={form.facebookPost} onChange={(e) => setForm({ ...form, facebookPost: e.target.value })} className="input" />
            </Field>
            <Field label="منشور إنستغرام">
              <textarea rows={4} value={form.instagramPost} onChange={(e) => setForm({ ...form, instagramPost: e.target.value })} className="input" />
            </Field>
            <Field label="منشور تيك توك">
              <textarea rows={4} value={form.tiktokPost} onChange={(e) => setForm({ ...form, tiktokPost: e.target.value })} className="input" />
            </Field>
          </div>
          <button type="submit" disabled={saving} className="btn-primary">{saving ? 'جاري الحفظ...' : 'حفظ'}</button>
        </form>
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
