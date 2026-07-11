import Link from 'next/link';
import { useRouter } from 'next/router';

export default function DashboardSidebar({ links }) {
  const router = useRouter();
  return (
    <aside className="w-full shrink-0 border-r border-slate-100 bg-white p-4 dark:border-slate-800 dark:bg-slate-950 md:w-56">
      <nav className="space-y-1">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
              router.pathname === link.href
                ? 'bg-primary/10 text-primary'
                : 'text-slate-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-900'
            }`}
          >
            <link.icon size={18} />
            {link.label}
          </Link>
        ))}
      </nav>
    </aside>
  );
}
