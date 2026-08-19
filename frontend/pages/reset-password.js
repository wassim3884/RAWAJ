import { useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { CheckCircle2 } from 'lucide-react';
import api from '../lib/api';

// Same minimum length enforced server-side (auth.controller.js resetPassword)
// — kept in sync rather than inventing a separate rule.
const MIN_PASSWORD_LENGTH = 8;

export default function ResetPassword() {
  const router = useRouter();
  const { token } = router.query;
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!token) {
      toast.error('رابط إعادة التعيين غير صالح. اطلب رابطًا جديدًا.');
      return;
    }
    if (password.length < MIN_PASSWORD_LENGTH) {
      toast.error(`كلمة المرور يجب أن تكون ${MIN_PASSWORD_LENGTH} أحرف على الأقل.`);
      return;
    }
    if (password !== confirmPassword) {
      toast.error('كلمتا المرور غير متطابقتين.');
      return;
    }
    setLoading(true);
    try {
      await api.post('/auth/reset-password', { token, password });
      setDone(true);
      toast.success('تم تغيير كلمة المرور بنجاح!');
    } catch (err) {
      // Backend returns "Invalid or expired reset link." for both an
      // already-used token and an expired one (see resetPassword) — surfaced
      // as-is rather than guessing which case it was.
      toast.error(err.response?.data?.error || 'فشل تعيين كلمة المرور.');
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    return (
      <div className="mx-auto flex min-h-[70vh] max-w-md flex-col items-center justify-center px-4 py-16 text-center">
        <CheckCircle2 size={48} className="mb-4 text-green-500" />
        <h1 className="mb-2 text-2xl font-bold">تم تغيير كلمة المرور</h1>
        <p className="mb-6 text-sm text-slate-500 dark:text-slate-400">يمكنك الآن تسجيل الدخول بكلمة المرور الجديدة.</p>
        <Link href="/login" className="btn-primary inline-block px-8 py-2.5">تسجيل الدخول</Link>
      </div>
    );
  }

  if (!router.isReady) return null;

  if (!token) {
    return (
      <div className="mx-auto flex min-h-[70vh] max-w-md flex-col items-center justify-center px-4 py-16 text-center">
        <h1 className="mb-2 text-2xl font-bold">رابط غير صالح</h1>
        <p className="mb-6 text-sm text-slate-500 dark:text-slate-400">هذا الرابط غير صالح أو ناقص. اطلب رابط إعادة تعيين جديدًا.</p>
        <Link href="/forgot-password" className="font-medium text-primary">طلب رابط جديد</Link>
      </div>
    );
  }

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center px-4 py-16">
      <h1 className="mb-2 text-2xl font-bold">تعيين كلمة مرور جديدة</h1>
      <p className="mb-8 text-sm text-slate-500 dark:text-slate-400">اختر كلمة مرور جديدة لحسابك.</p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium">كلمة المرور الجديدة</label>
          <input
            type="password" required value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-xl border border-slate-200 px-4 py-2.5 outline-none focus:border-primary dark:border-slate-700 dark:bg-slate-900"
          />
          <p className="mt-1 text-xs text-slate-400">{MIN_PASSWORD_LENGTH} أحرف على الأقل</p>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">تأكيد كلمة المرور</label>
          <input
            type="password" required value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full rounded-xl border border-slate-200 px-4 py-2.5 outline-none focus:border-primary dark:border-slate-700 dark:bg-slate-900"
          />
        </div>
        <button type="submit" disabled={loading} className="btn-primary w-full">
          {loading ? 'جاري الحفظ...' : 'تعيين كلمة المرور'}
        </button>
      </form>
    </div>
  );
}
