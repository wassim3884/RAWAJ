import { useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import api from '../lib/api';

// Paths reachable without being logged in.
const PUBLIC_PATHS = [
  '/login',
  '/register',
  '/verify-email',
  '/verify-notice',
  '/forgot-password',
  '/reset-password',
  '/about',
  '/blog',
  '/contact',
  '/faq',
  '/privacy-policy',
  '/terms-of-service',
];

// Path prefixes reachable without being logged in.
const PUBLIC_PREFIXES = ['/store/', '/wholesale'];

function isPublicPath(pathname) {
  if (PUBLIC_PATHS.includes(pathname)) return true;
  return PUBLIC_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

export default function AuthGuard({ children }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const isPublic = isPublicPath(router.pathname);
  const checkedPaidNotif = useRef(false);

  useEffect(() => {
    if (loading) return;

    // Not logged in and trying to reach a protected page
    if (!user && !isPublic) {
      router.replace('/login');
      return;
    }

    // Logged in → redirect away from login/register
    if (user && ['/login', '/register'].includes(router.pathname)) {
      const redirectMap = {
        admin: '/admin/dashboard',
        affiliate: '/affiliate/dashboard',
      };

      router.replace(redirectMap[user.role] || '/');
    }
  }, [user, loading, router.pathname, isPublic]);

  // Surfaces a real, unread "withdrawal paid" notification (created by
  // decideWithdrawal in withdrawal.controller.js) as a prominent banner the
  // moment the affiliate is next in the app — not just a plain row buried in
  // the notifications list. Runs once per login session (guarded by the
  // ref), not on every page navigation, and only ever shows a real DB
  // notification — never a fabricated "success" message.
  useEffect(() => {
    if (loading || !user || user.role !== 'affiliate' || checkedPaidNotif.current) return;
    checkedPaidNotif.current = true;
    api.get('/notifications')
      .then(({ data }) => {
        const paidNotif = (data.notifications || []).find(
          // Matches ": تم الدفع" (colon-space prefix) specifically — a
          // plain `.includes('تم الدفع')` also matches the "approved"
          // message ("مؤكدة — سيتم الدفع خلال 48 ساعة"), because "تم
          // الدفع" happens to appear as a substring inside "سيتم الدفع".
          // The colon-space anchor is what decideWithdrawal always puts
          // immediately before the status label, so it only matches the
          // real "paid" notification.
          (n) => !n.is_read && n.title === 'تحديث حالة السحب' && n.message.includes(': تم الدفع')
        );
        if (paidNotif) {
          toast.success(`🎉 تهانينا! ${paidNotif.message} — تحقق من رصيدك.`, { duration: 8000 });
          api.put(`/notifications/${paidNotif.id}/read`).catch(() => {});
        }
      })
      .catch(() => {});
  }, [loading, user]);

  // Prevent flashing protected pages
  if (loading) return null;
  if (!user && !isPublic) return null;

  return children;
}