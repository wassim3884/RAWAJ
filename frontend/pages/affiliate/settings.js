import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import toast from 'react-hot-toast';
import { Trash2 } from 'lucide-react';
import DashboardSidebar from '../../components/DashboardSidebar';
import api from '../../lib/api';
import { AFFILIATE_NAV_LINKS } from '../../lib/affiliateNav';
import { useAuth } from '../../context/AuthContext';

export default function AffiliateSettings() {
  const { user, logout, refreshSession } = useAuth();
  const router = useRouter();

  const [profileForm, setProfileForm] = useState({ fullName: '', email: '', phone: '' });
  const [savingProfile, setSavingProfile] = useState(false);

  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [changingPassword, setChangingPassword] = useState(false);

  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (user) {
      setProfileForm({ fullName: user.full_name || '', email: user.email || '', phone: user.phone || '' });
    }
  }, [user]);

  const saveProfile = async (e) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      await api.put('/auth/me', profileForm);
      toast.success('تم تحديث بياناتك الشخصية.');
      // Keeps things like the "مرحبًا، الاسم" dashboard greeting showing
      // the new data immediately, without needing a full re-login.
      if (typeof refreshSession === 'function') refreshSession();
    } catch (err) {
      toast.error(err.response?.data?.error || 'فشل تحديث البيانات.');
    } finally {
      setSavingProfile(false);
    }
  };

  const changePassword = async (e) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error('كلمتا المرور الجديدتان غير متطابقتين.');
      return;
    }
    if (passwordForm.newPassword.length < 8) {
      toast.error('كلمة المرور الجديدة يجب أن تكون 8 أحرف على الأقل.');
      return;
    }
    setChangingPassword(true);
    try {
      await api.put('/auth/me/password', {
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });
      toast.success('تم تغيير كلمة المرور بنجاح.');
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      toast.error(err.response?.data?.error || 'فشل تغيير كلمة المرور.');
    } finally {
      setChangingPassword(false);
    }
  };

  const deleteAccount = async () => {
    if (!deletePassword) {
      toast.error('أدخل كلمة المرور لتأكيد الحذف.');
      return;
    }
    setDeleting(true);
    try {
      await api.delete('/auth/me', { data: { password: deletePassword } });
      toast.success('تم حذف حسابك نهائيًا.');
      logout();
      router.push('/');
    } catch (err) {
      toast.error(err.response?.data?.error || 'فشل حذف الحساب.');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="flex min-h-[80vh] flex-col md:flex-row">
      <DashboardSidebar links={AFFILIATE_NAV_LINKS} />
      <div className="flex-1 space-y-8 p-4 sm:p-6">
        <h1 className="text-2xl font-bold">الإعدادات</h1>

        {/* Personal info */}
        <div className="card max-w-xl">
          <h2 className="mb-4 text-lg font-semibold">المعلومات الشخصية</h2>
          <form onSubmit={saveProfile} className="space-y-4">
            <Field label="الاسم الكامل">
              <input required value={profileForm.fullName} onChange={(e) => setProfileForm({ ...profileForm, fullName: e.target.value })} className="input" />
            </Field>
            <Field label="البريد الإلكتروني">
              <input required type="email" value={profileForm.email} onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })} className="input" />
            </Field>
            <Field label="رقم الهاتف">
              <input required value={profileForm.phone} onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })} className="input" placeholder="05XX XX XX XX" />
            </Field>
            <button type="submit" disabled={savingProfile} className="btn-primary">
              {savingProfile ? 'جاري الحفظ...' : 'حفظ التغييرات'}
            </button>
          </form>
        </div>

        {/* Password */}
        <div className="card max-w-xl">
          <h2 className="mb-4 text-lg font-semibold">تغيير كلمة المرور</h2>
          <form onSubmit={changePassword} className="space-y-4">
            <Field label="كلمة المرور الحالية">
              <input required type="password" value={passwordForm.currentPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })} className="input" />
            </Field>
            <Field label="كلمة المرور الجديدة">
              <input required type="password" value={passwordForm.newPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })} className="input" />
              <p className="mt-1 text-xs text-slate-400">8 أحرف على الأقل</p>
            </Field>
            <Field label="تأكيد كلمة المرور الجديدة">
              <input required type="password" value={passwordForm.confirmPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })} className="input" />
            </Field>
            <button type="submit" disabled={changingPassword} className="btn-primary">
              {changingPassword ? 'جاري التغيير...' : 'تغيير كلمة المرور'}
            </button>
          </form>
        </div>

        {/* Danger zone */}
        <div className="card max-w-xl border border-red-200 dark:border-red-900/40">
          <h2 className="mb-2 flex items-center gap-2 text-lg font-semibold text-red-600"><Trash2 size={18} /> حذف الحساب نهائيًا</h2>
          <p className="mb-4 text-sm text-slate-500 dark:text-slate-400">
            هذا الإجراء لا يمكن التراجع عنه. إن كان لديك طلبات أو عمولات أو سحوبات سابقة، لن يُسمح بالحذف للحفاظ على سجلك المالي — تواصل مع الدعم في هذه الحالة.
          </p>
          {!deleteConfirmOpen ? (
            <button onClick={() => setDeleteConfirmOpen(true)} className="rounded-xl border border-red-300 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20">
              حذف حسابي نهائيًا
            </button>
          ) : (
            <div className="space-y-3">
              <Field label="أدخل كلمة المرور لتأكيد الحذف">
                <input type="password" value={deletePassword} onChange={(e) => setDeletePassword(e.target.value)} className="input" />
              </Field>
              <div className="flex gap-3">
                <button onClick={deleteAccount} disabled={deleting}
                  className="rounded-xl bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-60">
                  {deleting ? 'جاري الحذف...' : 'تأكيد الحذف النهائي'}
                </button>
                <button onClick={() => { setDeleteConfirmOpen(false); setDeletePassword(''); }} className="rounded-xl border border-slate-200 px-4 py-2 text-sm dark:border-slate-700">
                  إلغاء
                </button>
              </div>
            </div>
          )}
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
