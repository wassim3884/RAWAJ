import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../context/AuthContext';

// Paths reachable without being logged in.
const PUBLIC_PATHS = [
  '/login', '/register', '/verify-email', '/verify-notice',
  '/about', '/blog', '/contact', '/faq', '/privacy-policy', '/terms-of-service',
];
// Path prefixes reachable without being logged in (public storefronts, wholesale funnel).
const PUBLIC_PREFIXES = ['/store/', '/wholesale'];

function isPublicPath(pathname) {
  if (PUBLIC_PATHS.includes(pathname)) return true;
  return PUBLIC_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

export default function AuthGuard({ children }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const isPublic = isPublicPath(router.pathname);

  useEffect(() => {
    if (loading) return;

    // Not logged in and trying to reach a gated page → send to login
    if (!user && !isPublic) {
      router.replace('/login');
      return;
    }

    // Logged in but email not verified yet → send to the verification notice,
    // except for the pages needed to actually verify.
    if (user && !user.is_email_verified && !isPublic && router.pathname !== '/verify-notice') {
      router.replace('/verify-notice');
      return;
    }

    // Already logged in and verified → no reason to sit on login/register
    if (user && user.is_email_verified && ['/login', '/register'].includes(router.pathname)) {
      const redirectMap = { admin: '/admin/dashboard', affiliate: '/affiliate/dashboard' };
      router.replace(redirectMap[user.role] || '/');
    }
  }, [user, loading, router.pathname, isPublic]);

  // Avoid flashing gated content before the redirect above fires
  if (loading) return null;
  if (!user && !isPublic) return null;
  if (user && !user.is_email_verified && !isPublic && router.pathname !== '/verify-notice') return null;

  return children;
}
