import { useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';

export default function Register() {
  const { register } = useAuth();
  const router = useRouter();
  const [form, setForm] = useState({ fullName: '', email: '', phone: '', password: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await register(form);
      toast.success('Account created! Please check your email to verify.');
      router.push('/affiliate/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center px-4 py-16">
      <h1 className="mb-2 text-2xl font-bold">Become an Affiliate</h1>
      <p className="mb-8 text-sm text-slate-500 dark:text-slate-400">
        Create your free account, browse products, and start earning commissions on every confirmed sale.
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium">Full name</label>
          <input required value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })}
            className="w-full rounded-xl border border-slate-200 px-4 py-2.5 outline-none focus:border-primary dark:border-slate-700 dark:bg-slate-900" />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Email</label>
          <input type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
            className="w-full rounded-xl border border-slate-200 px-4 py-2.5 outline-none focus:border-primary dark:border-slate-700 dark:bg-slate-900" />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Phone</label>
          <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })}
            className="w-full rounded-xl border border-slate-200 px-4 py-2.5 outline-none focus:border-primary dark:border-slate-700 dark:bg-slate-900" />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Password</label>
          <input type="password" required minLength={8} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })}
            className="w-full rounded-xl border border-slate-200 px-4 py-2.5 outline-none focus:border-primary dark:border-slate-700 dark:bg-slate-900" />
        </div>

        <button type="submit" disabled={loading} className="btn-primary w-full">
          {loading ? 'Creating account...' : 'Create Account'}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-slate-500">
        Already have an account? <Link href="/login" className="font-medium text-primary">Log in</Link>
      </p>
    </div>
  );
}
