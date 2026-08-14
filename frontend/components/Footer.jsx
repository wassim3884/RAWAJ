import Link from 'next/link';
import { useLanguage } from '../context/LanguageContext';

export default function Footer() {
  const { lang, t } = useLanguage();
  return (
    <footer className="border-t border-slate-100 bg-slate-50 dark:border-slate-800 dark:bg-slate-900">
      <div className="mx-auto grid max-w-7xl grid-cols-2 gap-8 px-4 py-12 sm:px-6 md:grid-cols-4 lg:px-8">
        <div>
          <div className="mb-3 flex items-center gap-2 text-lg font-bold">
            <span className="rounded-lg bg-primary px-2 py-1 text-white">{lang === 'ar' ? 'ر' : 'R'}</span>
            <span>{lang === 'ar' ? 'واج' : 'awaj'}</span>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {t('منصة رواج للتسويق بالعمولة — منتجات جاهزة، مكتبة تسويقية كاملة، وعمولتك مضمونة.')}
          </p>
        </div>

        <div>
          <h4 className="mb-3 font-semibold">{t('الشركة')}</h4>
          <ul className="space-y-2 text-sm text-slate-500 dark:text-slate-400">
            <li><Link href="/about">{t('من نحن')}</Link></li>
            <li><Link href="/blog">{t('المدونة')}</Link></li>
            <li><Link href="/contact">{t('اتصل بنا')}</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="mb-3 font-semibold">{t('للمستخدمين')}</h4>
          <ul className="space-y-2 text-sm text-slate-500 dark:text-slate-400">
            <li><Link href="/register">{t('انضم كمسوّق')}</Link></li>
            <li><Link href="/faq">{t('الأسئلة الشائعة')}</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="mb-3 font-semibold">{t('قانوني')}</h4>
          <ul className="space-y-2 text-sm text-slate-500 dark:text-slate-400">
            <li><Link href="/privacy-policy">{t('سياسة الخصوصية')}</Link></li>
            <li><Link href="/terms-of-service">{t('شروط الاستخدام')}</Link></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-slate-100 py-4 text-center text-xs text-slate-400 dark:border-slate-800">
        © {new Date().getFullYear()} {lang === 'ar' ? 'رواج' : 'Rawaj'}. {t('جميع الحقوق محفوظة.')}
      </div>
    </footer>
  );
}
