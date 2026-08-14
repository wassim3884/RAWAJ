import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { CheckCircle, XCircle, Loader } from 'lucide-react';
import api from '../lib/api';
import { useAuth } from '../context/AuthContext';

export default function VerifyEmail() {
  const router = useRouter();
  const { refreshSession } = useAuth();
  const [status, setStatus] = useState('loading'); // loading | success | error

  useEffect(() => {
    if (!router.isReady) return;
    const { token } = router.query;
    if (!token) { setStatus('error'); return; }

    api.get('/auth/verify-email', { params: { token } })
      .then(async () => {
        setStatus('success');
        await refreshSession();
      })
      .catch(() => setStatus('error'));
  }, [router.isReady, router.query]);

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md flex-col items-center justify-center px-4 text-center">
      {status === 'loading' && (
        <>
          <Loader className="mb-4 animate-spin text-primary" size={40} />
          <p className="text-slate-500">جاري التحقق من بريدك الإلكتروني...</p>
        </>
      )}
      {status === 'success' && (
        <>
          <CheckCircle className="mb-4 text-green-500" size={48} />
          <h1 className="mb-2 text-xl font-bold">تم التحقق بنجاح!</h1>
          <p className="mb-6 text-slate-500">يمكنك الآن استخدام حسابك بالكامل.</p>
          <Link href="/affiliate/dashboard" className="btn-primary">الذهاب للوحة التحكم</Link>
        </>
      )}
      {status === 'error' && (
        <>
          <XCircle className="mb-4 text-red-500" size={48} />
          <h1 className="mb-2 text-xl font-bold">رابط غير صالح أو منتهي الصلاحية</h1>
          <p className="mb-6 text-slate-500">يمكنك طلب رابط تحقق جديد من صفحة حسابك.</p>
          <Link href="/verify-notice" className="btn-primary">إعادة الإرسال</Link>
        </>
      )}
    </div>
  );
}
