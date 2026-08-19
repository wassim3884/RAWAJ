import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../context/AuthContext';

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

  // Prevent flashing protected pages
  if (loading) return null;
  if (!user && !isPublic) return null;

  return children;
}