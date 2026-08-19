import { useState } from 'react';
import Link from 'next/link';
import { CheckCircle2 } from 'lucide-react';
import api from '../lib/api';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      // Backend always returns the same generic message whether the email
      // exists or not (see auth.controller.js forgotPassword) — this is
      // intentional so this page never confirms/denies account existence.
      await api.post('/auth/forgot-password', { email });
      setSent(true);
    } catch {
      // Even on an unexpected error, still show the generic confirmation —
      // matches the backend's own behavior of never surfacing a specific
      // failure reason on this endpoint.
      setSent(true);
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <div className="mx-auto flex min-h-[70vh] max-w-md flex-col items-center justify-center px-4 py-16 text-center">
        <CheckCircle2 size={48} className="mb-4 text-green-500" />
        <h1 className="mb-2 text-2xl font-bold">تحقق من بريدك الإلكتروني</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          إذا كان هناك حساب مرتبط بـ<span className="font-medium">{email}</span>، فستصلك رسالة تحتوي رابط إعادة تعيين كلمة المرور خلال دقائق. الرابط صالح لمدة ساعة واحدة فقط.
        </p>
        <Link href="/login" className="mt-6 text-sm font-medium text-primary">العودة لتسجيل الدخول</Link>
      </div>
    );
  }

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center px-4 py-16">
      <h1 className="mb-2 text-2xl font-bold">نسيت كلمة السر؟</h1>
      <p className="mb-8 text-sm text-slate-500 dark:text-slate-400">
        أدخل بريدك الإلكتروني وسنرسل لك رابطًا لإعادة تعيين كلمة المرور.
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium">البريد الإلكتروني</label>
          <input
            type="email" required value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-xl border border-slate-200 px-4 py-2.5 outline-none focus:border-primary dark:border-slate-700 dark:bg-slate-900"
          />
        </div>
        <button type="submit" disabled={loading} className="btn-primary w-full">
          {loading ? 'جاري الإرسال...' : 'إرسال رابط إعادة التعيين'}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-slate-500">
        <Link href="/login" className="font-medium text-primary">العودة لتسجيل الدخول</Link>
      </p>
    </div>
  );
}
