# RAWAJ — Progress / Project Memory

> هذا الملف هو "ذاكرة المشروع". يجب قراءته بالكامل في بداية أي جلسة جديدة قبل أي تعديل. لا تفترض أن شيئًا تم إنجازه — تحقق من الكود دائمًا بجانب هذا الملف.

**آخر تحديث:** بعد إنجاز Phase 1 (لم تُختبَر بعد على بيئة حية — بيئة العمل الحالية بدون node_modules/قاعدة بيانات فعلية؛ كل الاختبارات أدناه هي فحص نحوي + تتبع منطقي دقيق للكود، وليست تشغيلًا فعليًا في متصفح).

---

## القرار المعتمد (لا تعيد طرح هذا السؤال)
- **موافقة الأدمن قبل بيع المنتج**: تقرر إلغاؤها **نهائيًا لكل المنتجات** (وليس فقط تعطيل الفحص — التنفيذ الفعلي في Phase 3 القادمة).

---

## المرحلة الحالية
✅ **Phase 1 مكتملة** — بانتظار توجيه المستخدم للانتقال إلى Phase 2.

## المراحل المكتملة

### ✅ Phase 0 — Audit & Preparation
- فحص كامل: Frontend (41 صفحة)، Backend (كل controllers/routes)، Database schema.sql.
- اكتشاف أن نظام الترجمة (`i18n`) يغطي **6 صفحات فقط من أصل 41** — فجوة كبرى.
- اكتشاف أن `stock_quantity`/`sku` كانا يُرسلان لكل زائر/مسوّق عبر 4 استعلامات API (`SELECT p.*`).
- اكتشاف أن "المكتبة التسويقية" صفحة منفصلة عن صفحة المنتج.
- اكتشاف أن `forgot-password` جاهز في Backend (من جلسة سابقة) لكن **لا توجد له أي واجهة Frontend**.
- اكتشاف أن `requires_approval` هو حقل لكل منتج (وليس نظامًا شاملاً) — تم عرض القرار على المستخدم وحُسم (أعلاه).

### ✅ Phase 1 — Backend: Data Exposure Fix (المخزون)
**الهدف:** منع تسرّب `stock_quantity` و`sku` (بيانات مخزون داخلية) عبر أي API يصل إليه المسوّق أو الجمهور، مع إبقائها كاملة للأدمن فقط.

**ما تم تحديدًا:**
1. أضفت ثابتًا `SAFE_PRODUCT_COLUMNS` في `product.controller.js` — قائمة أعمدة صريحة **بدون** `stock_quantity`/`sku`، ليحل محل `SELECT p.*` في كل استعلام غير إداري.
2. استبدلت `SELECT p.*` بـ`SELECT ${SAFE_PRODUCT_COLUMNS}` في 3 استعلامات داخل `product.controller.js`:
   - `listProducts` (قائمة المنتجات العامة)
   - `getProductBySlug` (صفحة تفاصيل المنتج — عامة + مسوّق)
   - `listUpcomingProducts` (قادمة قريبًا)
3. صدّرت `SAFE_PRODUCT_COLUMNS` من `product.controller.js`، واستوردتها في `affiliate.controller.js` لاستخدامها في `browseProducts` (قائمة منتجات المسوّق الرئيسية) — لتفادي تكرار/انحراف القائمة بين ملفين.
4. **أُبقيت بدون تغيير عمدًا**: استعلام `listProductsForModeration` في `admin.controller.js` (لا يزال `SELECT p.*` كاملاً) — لأن الأدمن يجب أن يرى المخزون كاملاً، هذا مطابق تمامًا لطلب المستخدم.

**Regression اكتُشف وأُصلح فورًا (نفس المرحلة، وليس تأجيلاً):**
بعد حذف `stock_quantity` من استجابة `getProductBySlug`، صفحتان كانتا تعرضان `product.stock_quantity` مباشرة كانتا ستُظهران `undefined`:
- `frontend/pages/affiliate/products/[slug].js` — حذفت السطر (يتماشى فعليًا مع متطلب "لا يظهر المخزون للمسوّق" القادم في Phase 2، فتنفيذه الآن ضروري وليس توسعًا).
- `frontend/pages/products/[slug].js` (الصفحة العامة) — حذفت السطر أيضًا (كان يُظهر المخزون حتى للزوار غير المسجّلين، وهذا تسرّب بيانات غير مقصود أصلاً، لا علاقة له بطلب معين لكنه إصلاح جذري صحيح).

## الملفات التي تم تعديلها في Phase 1
| الملف | التعديل |
|---|---|
| `backend/src/controllers/product.controller.js` | إضافة `SAFE_PRODUCT_COLUMNS` + استخدامه في 3 استعلامات + تصديره |
| `backend/src/controllers/affiliate.controller.js` | استيراد `SAFE_PRODUCT_COLUMNS` + استخدامه في `browseProducts` |
| `frontend/pages/affiliate/products/[slug].js` | حذف عرض `stock_quantity` (Regression fix) |
| `frontend/pages/products/[slug].js` | حذف عرض `stock_quantity` (Regression fix + تسرّب بيانات عام) |

## المشاكل التي تم إصلاحها
1. تسرّب `stock_quantity`/`sku` عبر 4 نقاط API مختلفة لأي مستخدم (عام أو مسوّق).
2. Regression مباشر ناتج عن الإصلاح أعلاه في صفحتي تفاصيل المنتج (عام + مسوّق).

## الاختبارات التي تم تنفيذها ونتائجها
- ✅ `node --check` على كل ملف Backend مُعدَّل → لا أخطاء نحوية.
- ✅ فحص توازن الأقواس (`()[]{}`) على كل ملف Frontend مُعدَّل → متوازن.
- ✅ تحقق برمجي مباشر (Python) من نص ثابت `SAFE_PRODUCT_COLUMNS` الفعلي في الملف: تأكيد أن `stock_quantity` و`sku` غير موجودين فيه إطلاقًا (سلبي مؤكد، وليس افتراضًا).
- ✅ تحقق يدوي أن `admin.controller.js` (`listProductsForModeration`) **لم يتأثر** ولا يزال `SELECT p.*` — الأدمن يرى المخزون كاملاً كما هو مطلوب.
- ✅ تحقق من عدم وجود `require` دائري بين `product.controller.js` و`affiliate.controller.js`.
- ❌ **لم يُختبَر**: تشغيل فعلي على متصفح/قاعدة بيانات حية (البيئة الحالية لا تحتوي `node_modules` ولا اتصال DB حي). **يوصى بأن يختبر المستخدم يدويًا بعد الرفع**: فتح صفحة منتج (عام + مسوّق) والتأكد من عدم ظهور أي خطأ JS في console، وفتح Network tab للتأكد أن استجابة `/products/:slug` لا تحتوي `stock_quantity`.

## المشاكل المتبقية (Known Issues — غير مرتبطة بـPhase 1، لم تُلمَس)
- كل النقاط المذكورة في Phase 2 إلى Phase 8 (أدناه) لم تُنفَّذ بعد.
- `seller_id` لا يزال يُرسَل ضمن `SAFE_PRODUCT_COLUMNS` (لم يُطلَب حذفه صراحة، وهو FK داخلي غير حساس تجاريًا مثل المخزون — أُبقي عمدًا لتفادي توسّع غير مطلوب في النطاق). إن أردت حذفه أيضًا، أخبرني في أي مرحلة قادمة.

## المرحلة التالية
**Phase 2 — Product Experience Page**
النطاق المتوقع:
- حذف/دمج صفحة "المكتبة التسويقية" (`affiliate/marketing/[productId].js`) داخل صفحة المنتج نفسها (فيديوهات + كل معلومات التسويق).
- إخفاء أي إشارة متبقية للمخزون في واجهة المسوّق (تحقق نهائي بعد Phase 1).
- تحسين احترافي لعرض معلومات المنتج (سعر، عمولة، وصف) في صفحة واحدة متكاملة.

**الملفات المتوقع لمسها:** `frontend/pages/affiliate/products/[slug].js`, `frontend/pages/affiliate/marketing/[productId].js` (حذف أو تحويل لمكوّن)، وربما `backend/src/controllers/product.controller.js` (`getMarketingAssets`) إن احتجنا دمج الفيديوهات في نفس استجابة `getProductBySlug`.

## الخطوة التالية التي يجب تنفيذها تحديدًا
1. فحص `getMarketingAssets` و`upsertMarketingAssets` في `product.controller.js` وجدول `product_marketing_assets` لفهم شكل بيانات الفيديوهات/المواد التسويقية بالضبط.
2. فحص محتوى `affiliate/marketing/[productId].js` بالكامل لتحديد كل عنصر يجب نقله.
3. تصميم دمج واحد داخل `affiliate/products/[slug].js` دون فقدان أي وظيفة.
4. تنفيذ + اختبار + تحديث هذا الملف.

**لا تبدأ Phase 2 في نفس الجلسة إلا إذا طلب المستخدم صراحة المتابعة.**
