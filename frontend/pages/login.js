import { useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

export default function Login() {
  const { login } = useAuth();
  const { t } = useLanguage();
  const router = useRouter();
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const user = await login(form.email, form.password);
      toast.success(t('Welcome back'));
      const redirectMap = { admin: '/admin/dashboard', affiliate: '/affiliate/dashboard' };
      router.push(redirectMap[user.role] || '/');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Login failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center px-4 py-16">
      <h1 className="mb-2 text-2xl font-bold">{t('Welcome back')}</h1>
      <p className="mb-8 text-sm text-slate-500 dark:text-slate-400">{t('Log in to your Rawaj account.')}</p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium">{t('Email')}</label>
          <input
            type="email" required value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            className="w-full rounded-xl border border-slate-200 px-4 py-2.5 outline-none focus:border-primary dark:border-slate-700 dark:bg-slate-900"
          />
        </div>
        <div>
          <div className="mb-1 flex items-center justify-between">
            <label className="block text-sm font-medium">{t('Password')}</label>
            <Link href="/forgot-password" className="text-sm font-medium text-primary">{t('نسيت كلمة السر؟')}</Link>
          </div>
          <input
            type="password" required value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            className="w-full rounded-xl border border-slate-200 px-4 py-2.5 outline-none focus:border-primary dark:border-slate-700 dark:bg-slate-900"
          />
        </div>
        <button type="submit" disabled={loading} className="btn-primary w-full">
          {loading ? t('Logging in...') : t('Log In')}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-slate-500">
        {t("Don't have an account?")} <Link href="/register" className="font-medium text-primary">{t('Sign up')}</Link>
      </p>
    </div>
  );
}
