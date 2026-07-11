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

export default function DeliveryRates() {
  const [wilayas, setWilayas] = useState([]);
  const [edited, setEdited] = useState({});

  const load = () => api.get('/wilayas').then(({ data }) => setWilayas(data.wilayas)).catch(() => {});
  useEffect(() => { load(); }, []);

  const handleChange = (id, field, value) => {
    setEdited((prev) => ({ ...prev, [id]: { ...prev[id], [field]: value } }));
  };

  const saveRow = async (wilaya) => {
    const changes = edited[wilaya.id];
    if (!changes) return;
    try {
      await api.put(`/wilayas/${wilaya.id}`, {
        deliveryFeeHome: changes.delivery_fee_home ?? wilaya.delivery_fee_home,
        deliveryFeeOffice: changes.delivery_fee_office ?? wilaya.delivery_fee_office,
      });
      toast.success(`Updated ${wilaya.name_ar}`);
      load();
    } catch {
      toast.error('Failed to update delivery rate.');
    }
  };

  return (
    <div className="flex min-h-[80vh] flex-col md:flex-row">
      <DashboardSidebar links={links} />
      <div className="flex-1 p-6">
        <h1 className="mb-2 text-2xl font-bold">Delivery Rates by Wilaya</h1>
        <p className="mb-6 text-sm text-slate-500 dark:text-slate-400">
          These fees are shown to affiliates so they can quote accurate delivery costs to their buyers.
        </p>

        <div className="overflow-x-auto rounded-2xl border border-slate-100 dark:border-slate-800">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 dark:bg-slate-900">
              <tr>
                <th className="px-4 py-3">Code</th>
                <th className="px-4 py-3">Wilaya</th>
                <th className="px-4 py-3">Home Delivery ($)</th>
                <th className="px-4 py-3">Office / Stopdesk ($)</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {wilayas.map((w) => (
                <tr key={w.id} className="border-t border-slate-100 dark:border-slate-800">
                  <td className="px-4 py-3">{w.code}</td>
                  <td className="px-4 py-3">{w.name_ar} / {w.name_fr}</td>
                  <td className="px-4 py-3">
                    <input type="number" step="0.01" defaultValue={w.delivery_fee_home}
                      onChange={(e) => handleChange(w.id, 'delivery_fee_home', e.target.value)}
                      className="w-24 rounded-lg border border-slate-200 px-2 py-1 dark:border-slate-700 dark:bg-slate-900" />
                  </td>
                  <td className="px-4 py-3">
                    <input type="number" step="0.01" defaultValue={w.delivery_fee_office}
                      onChange={(e) => handleChange(w.id, 'delivery_fee_office', e.target.value)}
                      className="w-24 rounded-lg border border-slate-200 px-2 py-1 dark:border-slate-700 dark:bg-slate-900" />
                  </td>
                  <td className="px-4 py-3">
                    <button onClick={() => saveRow(w)} className="text-sm font-medium text-primary">Save</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
