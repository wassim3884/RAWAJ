import { useEffect, useState } from 'react';
import { LayoutDashboard, Users, Package, Wallet, Settings, Tag, Crown, Truck } from 'lucide-react';
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

export default function AdminDashboard() {
  const [data, setData] = useState(null);

  useEffect(() => {
    api.get('/admin/analytics').then(({ data }) => setData(data)).catch(() => {});
  }, []);

  const countByKey = (rows, key) => Object.fromEntries((rows || []).map((r) => [r[key], Number(r.count)]));
  const usersByRole = countByKey(data?.usersByRole, 'role');
  const productsByStatus = countByKey(data?.productsByStatus, 'status');

  return (
    <div className="flex min-h-[80vh] flex-col md:flex-row">
      <DashboardSidebar links={links} />
      <div className="flex-1 p-6">
        <h1 className="mb-6 text-2xl font-bold">Platform Overview</h1>

        <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Total Revenue" value={`$${Number(data?.totalRevenue || 0).toFixed(2)}`} />
          <StatCard label="Sellers" value={usersByRole.seller || 0} />
          <StatCard label="Affiliates" value={usersByRole.affiliate || 0} />
          <StatCard label="Customers" value={usersByRole.customer || 0} />
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <div className="card">
            <h2 className="mb-4 font-semibold">Products by Status</h2>
            <div className="space-y-2 text-sm">
              {Object.entries(productsByStatus).map(([status, count]) => (
                <div key={status} className="flex justify-between border-b border-slate-100 pb-2 dark:border-slate-800">
                  <span className="capitalize text-slate-500">{status}</span>
                  <span className="font-medium">{count}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="card">
            <h2 className="mb-4 font-semibold">Commissions by Status</h2>
            <div className="space-y-2 text-sm">
              {(data?.commissionsByStatus || []).map((c) => (
                <div key={c.status} className="flex justify-between border-b border-slate-100 pb-2 dark:border-slate-800">
                  <span className="capitalize text-slate-500">{c.status}</span>
                  <span className="font-medium">${Number(c.total).toFixed(2)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value }) {
  return (
    <div className="card">
      <p className="text-sm text-slate-500 dark:text-slate-400">{label}</p>
      <p className="mt-1 text-2xl font-bold">{value}</p>
    </div>
  );
}
