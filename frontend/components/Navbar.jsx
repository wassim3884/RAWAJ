import { useState } from 'react';
import Link from 'next/link';
import { Moon, Sun, Menu, X, Globe, Bell } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';

const LANGUAGES = [
  { code: 'ar', label: 'العربية' },
  { code: 'en', label: 'English' },
  { code: 'fr', label: 'Français' },
];

export default function Navbar() {
  const { theme, toggleTheme } = useTheme();
  const { lang, setLang, t } = useLanguage();
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);

  const dashboardPath = {
    admin: '/admin/dashboard',
    affiliate: '/affiliate/dashboard',
  }[user?.role];

  const affiliateNav = [
    { href: '/affiliate/products', label: t('المنتجات') },
    { href: '/affiliate/upcoming', label: t('قادمة قريبًا') },
    { href: '/affiliate/saved', label: t('المحفوظة') },
    { href: '/affiliate/vip', label: 'VIP' },
    { href: '/wholesale', label: t('الجملة') },
  ];

  const navItems = user?.role === 'affiliate' ? affiliateNav : [];

  return (
    <header className="sticky top-0 z-50 border-b border-slate-100 bg-white/80 backdrop-blur dark:border-slate-800 dark:bg-slate-950/80">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        <Link href={user ? (dashboardPath || '/') : '/login'} className="flex items-center gap-2 text-xl font-bold">
          <span className="rounded-lg bg-primary px-2 py-1 text-white">{lang === 'ar' ? 'ر' : 'R'}</span>
          <span className="text-slate-900 dark:text-white">{lang === 'ar' ? 'واج' : 'awaj'}</span>
        </Link>

        <nav className="hidden items-center gap-6 md:flex">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href} className="text-sm font-medium text-slate-600 hover:text-primary dark:text-slate-300">
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <div className="relative">
            <button onClick={() => setLangOpen(!langOpen)} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800" aria-label="Change language">
              <Globe size={18} />
            </button>
            {langOpen && (
              <div className="absolute right-0 mt-2 w-36 rounded-xl border border-slate-100 bg-white py-1 shadow-card dark:border-slate-800 dark:bg-slate-900">
                {LANGUAGES.map((l) => (
                  <button
                    key={l.code}
                    onClick={() => { setLang(l.code); setLangOpen(false); }}
                    className={`block w-full px-4 py-2 text-left text-sm hover:bg-slate-50 dark:hover:bg-slate-800 ${lang === l.code ? 'font-semibold text-primary' : ''}`}
                  >
                    {l.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          <button onClick={toggleTheme} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800" aria-label="Toggle theme">
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>

          {user && (
            <Link href={user.role === 'admin' ? '/admin/notifications' : '/affiliate/notifications'} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800" aria-label="Notifications">
              <Bell size={18} />
            </Link>
          )}

          {user ? (
            <div className="hidden items-center gap-3 md:flex">
              <Link href={dashboardPath || '/'} className="btn-outline !px-4 !py-2 text-sm">{t('لوحة التحكم')}</Link>
              <button onClick={logout} className="text-sm font-medium text-slate-500 hover:text-red-500">{t('خروج')}</button>
            </div>
          ) : (
            <div className="hidden items-center gap-3 md:flex">
              <Link href="/login" className="text-sm font-medium text-slate-600 dark:text-slate-300">{t('دخول')}</Link>
              <Link href="/register" className="btn-primary !px-4 !py-2 text-sm">{t('تسجيل')}</Link>
            </div>
          )}

          <button className="rounded-lg p-2 md:hidden" onClick={() => setOpen(!open)}>
            {open ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {open && (
        <div className="border-t border-slate-100 px-4 py-3 md:hidden dark:border-slate-800">
          <div className="flex flex-col gap-3">
            {navItems.map((item) => (
              <Link key={item.href} href={item.href} onClick={() => setOpen(false)}>{item.label}</Link>
            ))}
            {user ? (
              <>
                <Link href={dashboardPath || '/'} onClick={() => setOpen(false)}>{t('لوحة التحكم')}</Link>
                <button onClick={logout} className="text-left text-red-500">{t('خروج')}</button>
              </>
            ) : (
              <>
                <Link href="/login" onClick={() => setOpen(false)}>{t('دخول')}</Link>
                <Link href="/register" onClick={() => setOpen(false)}>{t('تسجيل')}</Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
