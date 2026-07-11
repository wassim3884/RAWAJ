require('dotenv').config();
const bcrypt = require('bcryptjs');
const db = require('../config/db');

async function seed() {
  try {
    // Admin user
    const passwordHash = await bcrypt.hash('Admin@12345', 12);
    await db.query(
      `INSERT INTO users (full_name, email, password_hash, role, is_email_verified)
       VALUES ('Platform Admin', 'admin@rawaj.com', $1, 'admin', TRUE)
       ON CONFLICT (email) DO NOTHING`,
      [passwordHash]
    );

    // Categories
    const categories = [
      ['ملابس', 'clothing'],
      ['رياضة', 'sports'],
      ['منتجات موسمية', 'seasonal'],
      ['إلكترونيات', 'electronics'],
      ['منزل وحديقة', 'home-garden'],
      ['جمال وصحة', 'beauty-health'],
      ['ألعاب وأطفال', 'toys-kids'],
      ['إكسسوارات', 'accessories'],
    ];
    for (const [name, slug] of categories) {
      await db.query(
        `INSERT INTO categories (name, slug) VALUES ($1, $2) ON CONFLICT (slug) DO NOTHING`,
        [name, slug]
      );
    }

    // Wilayas (Algeria's 58 provinces) with placeholder delivery fees —
    // update delivery_fee_home / delivery_fee_office per wilaya from the
    // admin dashboard once you have real rates from your delivery company.
    const wilayas = [
      ['01', 'أدرار', 'Adrar'], ['02', 'الشلف', 'Chlef'], ['03', 'الأغواط', 'Laghouat'],
      ['04', 'أم البواقي', 'Oum El Bouaghi'], ['05', 'باتنة', 'Batna'], ['06', 'بجاية', 'Béjaïa'],
      ['07', 'بسكرة', 'Biskra'], ['08', 'بشار', 'Béchar'], ['09', 'البليدة', 'Blida'],
      ['10', 'البويرة', 'Bouira'], ['11', 'تمنراست', 'Tamanrasset'], ['12', 'تبسة', 'Tébessa'],
      ['13', 'تلمسان', 'Tlemcen'], ['14', 'تيارت', 'Tiaret'], ['15', 'تيزي وزو', 'Tizi Ouzou'],
      ['16', 'الجزائر', 'Alger'], ['17', 'الجلفة', 'Djelfa'], ['18', 'جيجل', 'Jijel'],
      ['19', 'سطيف', 'Sétif'], ['20', 'سعيدة', 'Saïda'], ['21', 'سكيكدة', 'Skikda'],
      ['22', 'سيدي بلعباس', 'Sidi Bel Abbès'], ['23', 'عنابة', 'Annaba'], ['24', 'قالمة', 'Guelma'],
      ['25', 'قسنطينة', 'Constantine'], ['26', 'المدية', 'Médéa'], ['27', 'مستغانم', 'Mostaganem'],
      ['28', 'المسيلة', "M'Sila"], ['29', 'معسكر', 'Mascara'], ['30', 'ورقلة', 'Ouargla'],
      ['31', 'وهران', 'Oran'], ['32', 'البيض', 'El Bayadh'], ['33', 'إليزي', 'Illizi'],
      ['34', 'برج بوعريريج', 'Bordj Bou Arréridj'], ['35', 'بومرداس', 'Boumerdès'],
      ['36', 'الطارف', 'El Tarf'], ['37', 'تندوف', 'Tindouf'], ['38', 'تيسمسيلت', 'Tissemsilt'],
      ['39', 'الوادي', 'El Oued'], ['40', 'خنشلة', 'Khenchela'], ['41', 'سوق أهراس', 'Souk Ahras'],
      ['42', 'تيبازة', 'Tipaza'], ['43', 'ميلة', 'Mila'], ['44', 'عين الدفلى', 'Aïn Defla'],
      ['45', 'النعامة', 'Naâma'], ['46', 'عين تموشنت', 'Aïn Témouchent'], ['47', 'غرداية', 'Ghardaïa'],
      ['48', 'غليزان', 'Relizane'], ['49', 'تيميمون', 'Timimoun'], ['50', 'برج باجي مختار', 'Bordj Badji Mokhtar'],
      ['51', 'أولاد جلال', 'Ouled Djellal'], ['52', 'بني عباس', 'Béni Abbès'], ['53', 'عين صالح', 'In Salah'],
      ['54', 'عين قزام', 'In Guezzam'], ['55', 'تقرت', 'Touggourt'], ['56', 'جانت', 'Djanet'],
      ['57', 'المغير', "M'Ghair"], ['58', 'المنيعة', "El M'Ghair"],
    ];
    for (const [code, nameAr, nameFr] of wilayas) {
      await db.query(
        `INSERT INTO wilayas (code, name_ar, name_fr, delivery_fee_home, delivery_fee_office)
         VALUES ($1,$2,$3,600,400) ON CONFLICT (code) DO NOTHING`,
        [code, nameAr, nameFr]
      );
    }

    // Testimonials
    const testimonials = [
      ['Sara M.', 'مسوّقة بالعمولة', 'رواج سهّلت عليّ إيجاد المنتجات والبدء بالربح خلال أسبوع.', 5],
      ['Karim B.', 'مسوّق بالعمولة', 'المكتبة التسويقية الجاهزة وفّرت عليّ وقتًا كبيرًا في تحضير الإعلانات.', 5],
      ['Elena R.', 'مسوّقة VIP', 'متجري الخاص على رواج ساعدني أضاعف مبيعاتي الشهرية.', 5],
    ];
    for (const [name, role, quote, rating] of testimonials) {
      await db.query(
        `INSERT INTO testimonials (name, role, quote, rating) VALUES ($1,$2,$3,$4)`,
        [name, role, quote, rating]
      );
    }

    // FAQs
    const faqs = [
      ['كيف أصبح مسوّقًا بالعمولة؟', 'أنشئ حسابًا مجانيًا، فعّل بريدك الإلكتروني، وابدأ بتصفح المنتجات وطلب الموافقة على ترويجها.'],
      ['كيف ومتى أستلم أرباحي؟', 'تُحتسب عمولتك بمجرد تسليم الطلب للزبون، ويمكنك سحبها عبر BaridiMob أو Flexy أو RedotPay خلال 48 ساعة من تأكيد طلب السحب.'],
      ['كيف أقدّم طلبًا لزبون وجدته؟', 'من صفحة "تقديم عرض" اختر المنتج، أدخل بيانات الزبون والولاية، وسيتصل فريقنا لتأكيد الطلب قبل الشحن.'],
    ];
    for (const [question, answer] of faqs) {
      await db.query(`INSERT INTO faqs (question, answer) VALUES ($1, $2)`, [question, answer]);
    }

    // Homepage site settings
    await db.query(
      `INSERT INTO site_settings (key, value) VALUES ('homepage_hero', $1)
       ON CONFLICT (key) DO UPDATE SET value = $1`,
      [JSON.stringify({
        headline: 'روّج للمنتجات، واربح من كل عملية بيع',
        subheadline: 'رواج يمنحك كل ما تحتاجه للتسويق بالعمولة في مكان واحد.',
        ctaText: 'ابدأ الآن',
      })]
    );

    // Wholesale Telegram channel — update the URL from Admin → Wholesale once you have your real channel
    await db.query(
      `INSERT INTO site_settings (key, value) VALUES ('wholesale_telegram_url', $1)
       ON CONFLICT (key) DO UPDATE SET value = $1`,
      [JSON.stringify('https://t.me/your_wholesale_channel')]
    );

    // VIP resources placeholder — edit from Admin → VIP → Resources
    await db.query(
      `INSERT INTO site_settings (key, value) VALUES ('vip_resources', $1)
       ON CONFLICT (key) DO UPDATE SET value = $1`,
      [JSON.stringify({
        bestSellers: ['أضف هنا أفضل المنتجات مبيعًا حاليًا'],
        marketingTips: 'أضف هنا نصائح وخطط التسويق لأعضاء VIP.',
        landingImages: [],
      })]
    );

    console.log('✔ Seed complete. Admin login: admin@rawaj.com / Admin@12345');
  } catch (err) {
    console.error('✘ Seed failed:', err.message);
  } finally {
    await db.pool.end();
  }
}

seed();
