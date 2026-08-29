import { LayoutDashboard, Search, Truck, Wallet, Crown, MapPin, Clock, Heart, Bell, Settings } from 'lucide-react';

// Single source of truth for the affiliate sidebar. Every affiliate page
// previously redefined this exact array locally (10 copies) — that
// duplication is what caused "أسعار التوصيل" to appear twice in the
// sidebar earlier, and left stray whitespace/typos drifting between
// copies. Importing this one constant everywhere makes that whole class
// of bug structurally impossible: there is now only one place to add,
// rename, or reorder a link.
//
// Ordered by priority per the "Navigation" requirements: the affiliate's
// core earning loop first (browse → sell → get paid → grow), then
// secondary discovery/utility items, then notifications last.
export const AFFILIATE_NAV_LINKS = [
  { href: '/affiliate/dashboard', label: 'نظرة عامة', icon: LayoutDashboard },
  { href: '/affiliate/products', label: 'المنتجات', icon: Search },
  { href: '/affiliate/orders', label: 'طلباتي', icon: Truck },
  { href: '/affiliate/earnings', label: 'الأرباح', icon: Wallet },
  { href: '/affiliate/vip', label: 'VIP', icon: Crown },
  { href: '/affiliate/delivery-rates', label: 'أسعار التوصيل', icon: MapPin },
  { href: '/affiliate/upcoming', label: 'قادمة قريبًا', icon: Clock },
  { href: '/affiliate/saved', label: 'المحفوظة', icon: Heart },
  { href: '/affiliate/notifications', label: 'الإشعارات', icon: Bell },
  { href: '/affiliate/settings', label: 'الإعدادات', icon: Settings },
];
