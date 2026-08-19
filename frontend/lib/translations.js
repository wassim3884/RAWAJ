// Translation dictionary. Keys are the Arabic phrases already used throughout
// the app; t(text) looks up the phrase for the current language and falls
// back to the original Arabic text if no translation exists yet.
// To extend coverage to more pages: wrap any hardcoded Arabic string in
// t('...') and add an entry here.

const dict = {
  // Navbar
  'دخول': { en: 'Log in', fr: 'Connexion' },
  'تسجيل': { en: 'Sign up', fr: "S'inscrire" },
  'لوحة التحكم': { en: 'Dashboard', fr: 'Tableau de bord' },
  'خروج': { en: 'Log out', fr: 'Déconnexion' },
  'المنتجات': { en: 'Products', fr: 'Produits' },
  'قادمة قريبًا': { en: 'Coming Soon', fr: 'Bientôt disponible' },
  'المحفوظة': { en: 'Saved', fr: 'Enregistrés' },
  'الجملة': { en: 'Wholesale', fr: 'Gros' },

  // Affiliate dashboard (Phase 3)
  'مرحبًا': { en: 'Welcome', fr: 'Bienvenue' },
  'مرحبًا بك في RAWAJ': { en: 'Welcome to RAWAJ', fr: 'Bienvenue sur RAWAJ' },
  'إليك نظرة سريعة على أدائك واكتشاف منتجات جديدة لتسويقها.': {
    en: "Here's a quick look at your performance and new products to promote.",
    fr: "Voici un aperçu rapide de vos performances et de nouveaux produits à promouvoir.",
  },
  'تصفّح حسب الفئة': { en: 'Browse by category', fr: 'Parcourir par catégorie' },
  'منتجات مميزة': { en: 'Featured products', fr: 'Produits en vedette' },
  'أحدث المنتجات': { en: 'Newest products', fr: 'Derniers produits' },
  'عرض الكل': { en: 'View all', fr: 'Voir tout' },
  'تقديم طلب': { en: 'Place order', fr: 'Passer commande' },

  // Footer
  'الشركة': { en: 'Company', fr: 'Entreprise' },
  'من نحن': { en: 'About', fr: 'À propos' },
  'المدونة': { en: 'Blog', fr: 'Blog' },
  'اتصل بنا': { en: 'Contact', fr: 'Contact' },
  'للمستخدمين': { en: 'For Users', fr: 'Pour les utilisateurs' },
  'انضم كمسوّق': { en: 'Become an Affiliate', fr: 'Devenir affilié' },
  'الأسئلة الشائعة': { en: 'FAQ', fr: 'FAQ' },
  'قانوني': { en: 'Legal', fr: 'Légal' },
  'سياسة الخصوصية': { en: 'Privacy Policy', fr: 'Politique de confidentialité' },
  'شروط الاستخدام': { en: 'Terms of Service', fr: "Conditions d'utilisation" },
  'منصة رواج للتسويق بالعمولة — منتجات جاهزة، مكتبة تسويقية كاملة، وعمولتك مضمونة.': {
    en: 'Rawaj is an affiliate marketing platform — ready-made products, a full marketing kit, and guaranteed commissions.',
    fr: "Rawaj est une plateforme de marketing d'affiliation — produits prêts, kit marketing complet, et commissions garanties.",
  },
  'جميع الحقوق محفوظة.': { en: 'All rights reserved.', fr: 'Tous droits réservés.' },

  // Common actions
  'حفظ': { en: 'Save', fr: 'Enregistrer' },
  'حذف': { en: 'Delete', fr: 'Supprimer' },
  'بحث': { en: 'Search', fr: 'Rechercher' },
  'إلغاء': { en: 'Cancel', fr: 'Annuler' },
  'تأكيد': { en: 'Confirm', fr: 'Confirmer' },
  'جاري التحميل...': { en: 'Loading...', fr: 'Chargement...' },
  'جاري الحفظ...': { en: 'Saving...', fr: 'Enregistrement...' },

  // Admin sidebar
  'نظرة عامة': { en: 'Overview', fr: 'Aperçu' },
  'المسوّقون': { en: 'Affiliates', fr: 'Affiliés' },
  'الطلبات': { en: 'Orders', fr: 'Commandes' },
  'السحوبات': { en: 'Withdrawals', fr: 'Retraits' },
  'أسعار التوصيل': { en: 'Delivery Rates', fr: 'Frais de livraison' },
  'إعدادات الموقع': { en: 'Site Settings', fr: 'Paramètres du site' },

  // Affiliate sidebar
  'تصفح المنتجات': { en: 'Browse Products', fr: 'Parcourir les produits' },
  'تقديم عرض': { en: 'Submit Order', fr: 'Soumettre une commande' },
  'طلباتي': { en: 'My Orders', fr: 'Mes commandes' },
  'الأرباح': { en: 'Earnings', fr: 'Gains' },
  'الإشعارات': { en: 'Notifications', fr: 'Notifications' },

  // Home page
  'تصفح حسب الفئة': { en: 'Browse by Category', fr: 'Parcourir par catégorie' },
  'الأكثر رواجًا': { en: 'Most Popular', fr: 'Les plus populaires' },
  'عرض الكل ←': { en: 'View all →', fr: 'Voir tout →' },
  'كيف تعمل المنصة': { en: 'How It Works', fr: 'Comment ça marche' },
  'برنامج VIP': { en: 'VIP Program', fr: 'Programme VIP' },
  'لم يتم تحديد منتجات رائجة بعد.': { en: 'No trending products selected yet.', fr: 'Aucun produit tendance sélectionné pour le moment.' },
  'لا توجد فئات بعد.': { en: 'No categories yet.', fr: 'Aucune catégorie pour le moment.' },
  'أنشئ حسابك': { en: 'Create your account', fr: 'Créez votre compte' },
  'سجّل كمسوّق بالعمولة وابدأ بتصفح المنتجات المتاحة.': {
    en: 'Register as an affiliate and start browsing available products.',
    fr: "Inscrivez-vous comme affilié et commencez à parcourir les produits disponibles.",
  },
  'اختر منتجًا': { en: 'Pick a product', fr: 'Choisissez un produit' },
  'تصفح الكتالوج حسب الفئة واطلب الموافقة على ترويج ما يناسبك.': {
    en: 'Browse the catalog by category and request approval to promote what suits you.',
    fr: 'Parcourez le catalogue par catégorie et demandez une approbation pour promouvoir ce qui vous convient.',
  },
  'قدّم العرض': { en: 'Submit the order', fr: 'Soumettez la commande' },
  'وجدت زبونًا؟ أدخل بياناته واحصل على السعر النهائي فورًا.': {
    en: "Found a buyer? Enter their details and get the final price instantly.",
    fr: "Trouvé un acheteur ? Entrez ses coordonnées et obtenez le prix final instantanément.",
  },
  'اربح عمولتك': { en: 'Earn your commission', fr: 'Gagnez votre commission' },
  'تُحتسب عمولتك تلقائيًا بمجرد تسليم الطلب، واسحبها في أي وقت.': {
    en: 'Your commission is calculated automatically once the order is delivered — withdraw it anytime.',
    fr: 'Votre commission est calculée automatiquement une fois la commande livrée — retirez-la à tout moment.',
  },
  'الخطوة': { en: 'Step', fr: 'Étape' },

  // Auth pages
  'Welcome back': { en: 'Welcome back', fr: 'Bon retour' },
  'Log in to your Rawaj account.': { en: 'Log in to your Rawaj account.', fr: 'Connectez-vous à votre compte Rawaj.' },
  'Email': { en: 'Email', fr: 'E-mail' },
  'Password': { en: 'Password', fr: 'Mot de passe' },
  "Don't have an account?": { en: "Don't have an account?", fr: "Vous n'avez pas de compte ?" },
  'Sign up': { en: 'Sign up', fr: "S'inscrire" },
  'Already have an account?': { en: 'Already have an account?', fr: 'Vous avez déjà un compte ?' },
  'Log in': { en: 'Log in', fr: 'Connexion' },
  'Logging in...': { en: 'Logging in...', fr: 'Connexion...' },
  'Log In': { en: 'Log In', fr: 'Connexion' },
  'Become an Affiliate': { en: 'Become an Affiliate', fr: 'Devenir affilié' },
  'Full name': { en: 'Full name', fr: 'Nom complet' },
  'Phone': { en: 'Phone', fr: 'Téléphone' },
  'Creating account...': { en: 'Creating account...', fr: 'Création du compte...' },
  'Create Account': { en: 'Create Account', fr: 'Créer un compte' },
  'Account created! Please check your email to verify.': {
    en: 'Account created! Please check your email to verify.',
    fr: 'Compte créé ! Veuillez vérifier votre e-mail.',
  },
  'Create your free account, browse products, and start earning commissions on every confirmed sale.': {
    en: 'Create your free account, browse products, and start earning commissions on every confirmed sale.',
    fr: 'Créez votre compte gratuit, parcourez les produits et commencez à gagner des commissions sur chaque vente confirmée.',
  },

  // Admin dashboard
  'نظرة عامة على المنصة': { en: 'Platform Overview', fr: 'Aperçu de la plateforme' },
  'إجمالي الإيرادات (طلبات مُسلَّمة)': { en: 'Total Revenue (delivered orders)', fr: 'Revenu total (commandes livrées)' },
  'عدد المسوّقين': { en: 'Number of Affiliates', fr: "Nombre d'affiliés" },
  'عدد المنتجات': { en: 'Number of Products', fr: 'Nombre de produits' },
  'طلبات تم تسليمها': { en: 'Delivered Orders', fr: 'Commandes livrées' },
  'المنتجات حسب الحالة': { en: 'Products by Status', fr: 'Produits par statut' },
  'العمولات حسب الحالة': { en: 'Commissions by Status', fr: 'Commissions par statut' },
  'لا توجد منتجات بعد.': { en: 'No products yet.', fr: 'Aucun produit pour le moment.' },
  'لا توجد عمولات بعد.': { en: 'No commissions yet.', fr: 'Aucune commission pour le moment.' },

  // Affiliate dashboard
  'الرصيد المتاح': { en: 'Available Balance', fr: 'Solde disponible' },
  'تقدّم VIP': { en: 'VIP Progress', fr: 'Progression VIP' },
  'عمولات معلّقة': { en: 'Pending Commissions', fr: 'Commissions en attente' },
  'عمولات مؤكدة': { en: 'Confirmed Commissions', fr: 'Commissions confirmées' },
  'عمولات مدفوعة': { en: 'Paid Commissions', fr: 'Commissions payées' },

  // Status labels
  'متوفر': { en: 'Active', fr: 'Actif' },
  'قيد المراجعة': { en: 'Pending', fr: 'En attente' },
  'نفدت الكمية': { en: 'Out of Stock', fr: 'Rupture de stock' },
  'قادم قريبًا': { en: 'Coming Soon', fr: 'Bientôt disponible' },
  'مرفوض': { en: 'Rejected', fr: 'Rejeté' },
  'مسودة': { en: 'Draft', fr: 'Brouillon' },
  'معلّقة': { en: 'Pending', fr: 'En attente' },
  'مؤكدة': { en: 'Confirmed', fr: 'Confirmée' },
  'مدفوعة': { en: 'Paid', fr: 'Payée' },
  'ملغاة': { en: 'Cancelled', fr: 'Annulée' },
};

export function translate(text, lang) {
  if (lang === 'ar' || !text) return text;
  return dict[text]?.[lang] || text;
}

export default dict;
