
# دليل تطوير مشروع "دوامي"

مرحباً بك في دليل تطوير مشروع "دوامي"! هذا المستند مخصص للمطورين الذين يرغبون في فهم بنية الكود، المساهمة في المشروع، إضافة ميزات جديدة، أو تعديل الميزات الحالية.

## بنية المجلدات الرئيسية

يتبع المشروع هيكلية تنظيمية قياسية لتطبيقات Next.js:

*   **`src/`**: المجلد الرئيسي الذي يحتوي على معظم كود التطبيق.
    *   **`src/app/`**: يحتوي على صفحات التطبيق وواجهاته الرئيسية. يستخدم Next.js App Router، حيث يمثل كل مجلد مساراً (route) في التطبيق.
        *   `page.tsx`: يمثل واجهة المستخدم الرئيسية للمسار.
        *   `layout.tsx`: يمثل الهيكل العام للصفحات ضمن مسار معين أو للمشروع ككل.
        *   `loading.tsx`: (اختياري) واجهة تحميل تعرض أثناء جلب بيانات الصفحة.
        *   `error.tsx`: (اختياري) واجهة خطأ تعرض في حال حدوث خطأ أثناء تحميل الصفحة.
    *   **`src/actions/`**: يحتوي على Next.js Server Actions. هذه هي الدوال التي تعمل على الخادم وتستخدم لتنفيذ منطق الواجهة الخلفية، مثل التفاعل مع قاعدة البيانات، المصادقة، أو أي عمليات تتطلب وصولاً آمناً.
    *   **`src/components/`**:
        *   `src/components/ui/`: يحتوي على مكونات واجهة المستخدم (UI components) من مكتبة ShadCN UI (مثل Button, Card, Input). هذه المكونات مبنية على Radix UI و Tailwind CSS.
        *   مجلدات أخرى لمكونات مخصصة خاصة بالتطبيق (مثل `AppHeader.tsx`, `AppSidebar.tsx`).
    *   **`src/lib/`**:
        *   `db.ts`: يحتوي على إعدادات Lowdb والمنطق الأساسي للتعامل مع ملف قاعدة البيانات `db.json`.
        *   `db.json`: ملف قاعدة البيانات الفعلي (JSON) الذي يخزن بيانات التطبيق. **(لا يجب تعديله يدوياً بشكل مباشر في بيئة الإنتاج)**.
        *   `constants.ts`: يحتوي على الثوابت، أنواع البيانات (TypeScript interfaces/types)، والبيانات النموذجية (mock data) المستخدمة في التطبيق.
        *   `utils.ts`: يحتوي على دوال مساعدة عامة (مثل `cn` لدمج أسماء الفئات في Tailwind CSS).
    *   **`src/ai/`**:
        *   `genkit.ts`: إعداد وتهيئة Genkit.
        *   `flows/`: يحتوي على تدفقات Genkit (Genkit Flows) التي تستخدم نماذج الذكاء الاصطناعي (مثل Gemini) لتنفيذ مهام معينة (مثل تحليل أنماط الحضور).
    *   **`public/`**: (خارج `src/`) يحتوي على الملفات الثابتة التي يتم خدمتها مباشرة (مثل الصور، الخطوط إذا لم تكن من Google Fonts).
*   **ملفات الجذر (Root Files):**
    *   `package.json`: يسرد تبعيات المشروع والسكربتات (npm scripts).
    *   `next.config.ts`: ملف إعدادات Next.js.
    *   `tailwind.config.ts`: ملف إعدادات Tailwind CSS.
    *   `tsconfig.json`: ملف إعدادات TypeScript.
    *   ملفات التوثيق (`.md`).

## كيفية عمل Server Actions

تعتبر Server Actions جزءاً أساسياً من "دوامي" للتعامل مع منطق الواجهة الخلفية.

*   **الغرض:** تسمح لك بتنفيذ كود JavaScript/TypeScript آمن على الخادم مباشرة من مكونات العميل (Client Components) أو مكونات الخادم (Server Components). هذا يلغي الحاجة إلى إنشاء نقاط نهاية API (API Routes) تقليدية للعديد من العمليات.
*   **الاستخدام:**
    1.  قم بإنشاء دالة `async` في ملف داخل `src/actions/` (أو أي ملف آخر إذا كنت تستخدم `'use server'` directive بشكل صحيح).
    2.  أضف التوجيه `'use server';` في بداية الملف أو فوق الدالة.
    3.  يمكنك الآن استيراد هذه الدالة واستدعاؤها مباشرة من مكوناتك (عادةً عند تفاعل المستخدم مثل النقر على زر).
*   **التفاعل مع قاعدة البيانات:** معظم Server Actions في "دوAMI" تقوم بالتفاعل مع Lowdb (عبر `src/lib/db.ts`) لجلب البيانات أو تعديلها.
*   **إعادة التحقق من المسارات (Revalidation):** بعد تعديل البيانات، غالباً ما ستحتاج إلى استخدام `revalidatePath('/')` أو `revalidateTag('...')` من `next/cache` لتحديث البيانات المعروضة في الصفحات التي تعتمد على تلك البيانات.

## استخدام TypeScript

يستخدم "دوامي" لغة TypeScript لزيادة موثوقية الكود وتقليل الأخطاء أثناء التطوير.

*   **الفوائد:**
    *   التحقق من الأنواع (Type Checking) أثناء الكتابة ووقت البناء.
    *   تحسين تجربة المطور (Developer Experience) من خلال الإكمال التلقائي الأفضل وفهم أوضح لبنية البيانات.
    *   تسهيل صيانة الكود وتطويره على المدى الطويل.
*   **التطبيق:**
    *   تعريف الواجهات (Interfaces) والأنواع (Types) للبيانات (موجودة بشكل كبير في `src/lib/constants.ts`).
    *   استخدام الأنواع في تعريف الدوال والمتغيرات والحالات (useState).

## إضافة ميزات جديدة

عند إضافة ميزة جديدة، اتبع هذه الإرشادات العامة:

1.  **تخطيط البيانات:**
    *   حدد البيانات التي تحتاجها الميزة الجديدة.
    *   إذا لزم الأمر، قم بتحديث/إضافة واجهات وأنواع في `src/lib/constants.ts`.
    *   قم بتعديل `src/lib/db.ts` و `db.json` (البيانات الافتراضية) لتعكس أي تغييرات في بنية البيانات.
2.  **إنشاء Server Actions:**
    *   قم بإنشاء الدوال اللازمة في `src/actions/` للتعامل مع منطق الواجهة الخلفية للميزة (جلب، إضافة، تعديل، حذف البيانات).
    *   لا تنسَ إضافة `'use server';` واستخدام `revalidatePath` عند الضرورة.
3.  **بناء واجهة المستخدم (UI):**
    *   قم بإنشاء صفحة جديدة في `src/app/` أو مكون جديد في `src/components/`.
    *   استخدم مكونات ShadCN UI أو أنشئ مكونات مخصصة.
    *   قم باستدعاء Server Actions التي أنشأتها للتفاعل مع الواجهة الخلفية.
    *   استخدم `useState` و `useEffect` لإدارة حالة الواجهة والتفاعلات.
    *   أضف مؤشرات تحميل (loading indicators) ورسائل للمستخدم (باستخدام `useToast`).
4.  **التنقل (Navigation):**
    *   إذا كانت الميزة صفحة رئيسية، قم بإضافة رابط لها في `src/lib/constants.ts` (ضمن `navItems`) ليظهر في القائمة الجانبية.
5.  **التوثيق (Documentation):**
    *   قم بتحديث ملفات التوثيق ذات الصلة (مثل `DATA_STRUCTURE.md` أو `README.md`) لتعكس الميزة الجديدة.

## المكتبات الخارجية الهامة

*   **`lowdb`**: لقاعدة البيانات المدمجة المستندة إلى JSON.
*   **`uuid`**: لتوليد معرفات فريدة عالمياً (UUIDs).
*   **`bcryptjs`**: لتشفير وفك تشفير كلمات المرور / PINs بشكل آمن.
*   **`date-fns`**: لمعالجة وتنسيق التواريخ والأوقات.
*   **`lucide-react`**: لمجموعة أيقونات SVG خفيفة الوزن.
*   **`recharts`**: لإنشاء الرسوم البيانية (مستخدمة في لوحة القيادة).
*   **`genkit` و `@genkit-ai/googleai`**: لإمكانيات الذكاء الاصطناعي.
*   **`tailwindcss` و `tailwind-merge` و `clsx` و `tailwindcss-animate`**: لأدوات التصميم.
*   مكونات ShadCN UI (مبنية على Radix UI).

هذا الدليل يوفر نقطة انطلاق لفهم وتطوير مشروع "دوامي". لا تتردد في استكشاف الكود بشكل أعمق وطرح الأسئلة عند الحاجة.
