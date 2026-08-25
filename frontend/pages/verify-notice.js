import { useState } from 'react';
import toast from 'react-hot-toast';
import { Mail } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function VerifyNotice() {
  const { user, resendVerification, logout } = useAuth();
  const [sending, setSending] = useState(false);

  const handleResend = async () => {
    setSending(true);
    try {
      await resendVerification();
      toast.success('تم إرسال رابط التحقق إلى بريدك الإلكتروني.');
    } catch (err) {
      toast.error(err.response?.data?.error || 'تعذّر إرسال الرابط، حاول لاحقًا.');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md flex-col items-center justify-center px-4 text-center">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
        <Mail size={28} />
      </div>
      <h1 className="mb-2 text-xl font-bold">فعّل بريدك الإلكتروني للمتابعة</h1>
      <p className="mb-6 text-sm text-slate-500 dark:text-slate-400">
        أرسلنا رابط تحقق إلى {user?.email || 'بريدك الإلكتروني'}. افتح الرابط لتفعيل حسابك ورؤية المنتجات.
      </p>
      <div className="flex gap-3">
        <button onClick={handleResend} disabled={sending} className="btn-primary">
          {sending ? 'جاري الإرسال...' : 'إعادة إرسال الرابط'}
        </button>
        <button onClick={logout} className="btn-outline">تسجيل الخروج</button>
      </div>
    </div>
  );
}
