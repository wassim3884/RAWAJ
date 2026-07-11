import { useEffect, useState } from 'react';
import { LayoutDashboard, Users, Package, Wallet, Settings, Tag, Crown, Truck } from 'lucide-react';
import toast from 'react-hot-toast';
import DashboardSidebar from '../../components/DashboardSidebar';
import api from '../../lib/api';

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

export default function AdminVip() {
  const [affiliates, setAffiliates] = useState([]);
  const [resources, setResources] = useState({ bestSellers: [], marketingTips: '', landingImages: [] });
  const [bestSellersText, setBestSellersText] = useState('');
  const [landingImagesText, setLandingImagesText] = useState('');
  const [saving, setSaving] = useState(false);

  const load = () => api.get('/admin/vip/eligible').then(({ data }) => setAffiliates(data.affiliates)).catch(() => {});

  useEffect(() => {
    load();
    api.get('/admin/settings/vip_resources').then(({ data }) => {
      const value = data.setting?.value;
      if (value) {
        setResources(value);
        setBestSellersText((value.bestSellers || []).join('\n'));
        setLandingImagesText((value.landingImages || []).join('\n'));
      }
    }).catch(() => {});
  }, []);

  const toggleVip = async (affiliate) => {
    try {
      await api.put(`/admin/vip/${affiliate.id}`, { isVip: !affiliate.is_vip });
      toast.success(affiliate.is_vip ? 'VIP revoked.' : 'VIP granted!');
      load();
    } catch {
      toast.error('Failed to update VIP status.');
    }
  };

  const saveResources = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const value = {
        bestSellers: bestSellersText.split('\n').map((s) => s.trim()).filter(Boolean),
        marketingTips: resources.marketingTips,
        landingImages: landingImagesText.split('\n').map((s) => s.trim()).filter(Boolean),
      };
      await api.put('/admin/vip/resources', { value });
      toast.success('VIP resources updated.');
    } catch {
      toast.error('Failed to save resources.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex min-h-[80vh] flex-col md:flex-row">
      <DashboardSidebar links={links} />
      <div className="flex-1 p-6">
        <h1 className="mb-6 text-2xl font-bold">VIP Program</h1>

        <h2 className="mb-3 text-lg font-semibold">Eligible &amp; VIP Affiliates (30+ delivered orders)</h2>
        <div className="mb-8 overflow-x-auto rounded-2xl border border-slate-100 dark:border-slate-800">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 dark:bg-slate-900">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Email / Phone</th>
                <th className="px-4 py-3">Delivered Orders</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {affiliates.map((a) => (
                <tr key={a.id} className="border-t border-slate-100 dark:border-slate-800">
                  <td className="px-4 py-3">{a.full_name}</td>
                  <td className="px-4 py-3">{a.email}<br /><span className="text-xs text-slate-400">{a.phone}</span></td>
                  <td className="px-4 py-3 font-semibold">{a.delivered_orders}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${a.is_vip ? 'bg-accent/20 text-accent' : 'bg-slate-100 text-slate-500'}`}>
                      {a.is_vip ? 'VIP' : 'Eligible'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <button onClick={() => toggleVip(a)} className="text-sm font-medium text-primary">
                      {a.is_vip ? 'Revoke VIP' : 'Grant VIP'}
                    </button>
                  </td>
                </tr>
              ))}
              {!affiliates.length && <tr><td colSpan={5} className="px-4 py-6 text-center text-slate-400">No eligible affiliates yet.</td></tr>}
            </tbody>
          </table>
        </div>

        <h2 className="mb-3 text-lg font-semibold">VIP Resources — Support &amp; Marketing Content</h2>
        <form onSubmit={saveResources} className="card space-y-4">
          <Field label="Best-selling products right now (one per line)">
            <textarea rows={4} value={bestSellersText} onChange={(e) => setBestSellersText(e.target.value)} className="input" />
          </Field>
          <Field label="Marketing plan &amp; tips">
            <textarea rows={5} value={resources.marketingTips} onChange={(e) => setResources({ ...resources, marketingTips: e.target.value })} className="input" />
          </Field>
          <Field label="Ready-made landing page image URLs (one per line)">
            <textarea rows={3} value={landingImagesText} onChange={(e) => setLandingImagesText(e.target.value)} className="input" />
          </Field>
          <button type="submit" disabled={saving} className="btn-primary">{saving ? 'Saving...' : 'Save Resources'}</button>
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
