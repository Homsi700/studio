
# دليل دمج جهاز البصمة مع نظام "دوامي"

هذا المستند يشرح بالتفصيل عملية ربط جهاز بصمة فعلي بنظام "دوامي" لتسجيل حضور وانصراف الموظفين تلقائياً.

## المفهوم الأساسي: جسر البيانات

تطبيقات الويب (مثل "دوامي" الذي يعمل في المتصفح) لا يمكنها الاتصال مباشرة بالأجهزة المادية مثل قارئات البصمة لأسباب أمنية وتصميمية. لذلك، نحتاج إلى "جسر" (Bridge) لتمرير البيانات من جهاز البصمة إلى نظام "دوامي".

**الفكرة الأساسية:** جهاز البصمة (أو برنامج وسيط يتصل به) هو الذي سيقوم بإرسال بيانات الحضور (بعد كل عملية بصمة ناجحة) إلى نقطة استقبال مخصصة في نظام "دوامي".

## 1. نقطة الاستقبال في "دوامي" (Webhook / Server Action)

لقد تم تجهيز "دوامي" لاستقبال هذه البيانات من خلال Server Action مخصصة.

*   **الدالة المسؤولة:** `recordExternalAttendance` موجودة في `src/actions/attendanceActions.ts`.
*   **الأمان:**
    *   تتطلب هذه الدالة إرسال مفتاح سري (`deviceSecret`) مع كل طلب للتحقق من مصدره.
    *   يجب تخزين هذا المفتاح السري في ملف `.env.local` الخاص بخادم "دوامي" تحت اسم `FINGERPRINT_WEBHOOK_SECRET`.
    *   مثال: `FINGERPRINT_WEBHOOK_SECRET="YOUR_UNIQUE_AND_SECURE_SECRET_KEY"`
*   **تنسيق البيانات المتوقع:**
    يجب أن يرسل جهاز البصمة (أو البرنامج الوسيط) البيانات بتنسيق JSON يطابق الواجهة `ExternalAttendanceData` المعرفة في `src/actions/attendanceActions.ts` (والتي بدورها ستُستخدم لإنشاء `RawAttendanceEvent` في `src/lib/constants.ts`).
    ```json
    {
      "employeeId": "string", // معرف الموظف كما هو مسجل في جهاز البصمة
      "timestamp": "string", // وقت تسجيل البصمة (بتنسيق ISO 8601، مثال: "2025-05-31T09:00:00.000Z")
      "eventType": "string", // نوع الحدث ('clockIn', 'clockOut', أو 'unknown')
      "deviceSecret": "string", // المفتاح السري الذي تم إعداده في .env.local
      "deviceId": "string" // (اختياري) معرف جهاز البصمة
    }
    ```
*   **ماذا تفعل الدالة `recordExternalAttendance`؟**
    1.  تتحقق من `deviceSecret`.
    2.  تتحقق من صحة البيانات الأساسية (`employeeId`, `timestamp`, `eventType`).
    3.  تتحقق من وجود `employeeId` في قاعدة بيانات "دوامي" (مجموعة `employees`).
    4.  تُنشئ سجلاً جديداً في مجموعة `rawAttendanceEvents` في `db.json`، مع تحديد `method` كـ `'Fingerprint'`.

## 2. طرق ربط جهاز البصمة بـ "دوامي"

يعتمد هذا الجزء على إمكانيات جهاز البصمة الذي تستخدمه.

### الخيار أ: الجهاز يدفع البيانات مباشرة (Push Data / Webhook)

هذا هو الخيار الأبسط إذا كان جهاز البصمة يدعمه.

*   **المبدأ:** العديد من أجهزة البصمة الحديثة تسمح لك بإعداد عنوان URL (نقطة نهاية ويب) ليرسل إليها الجهاز بيانات الحضور تلقائياً بعد كل عملية بصمة.
*   **كيفية الإعداد (يعتمد على نوع الجهاز):**
    1.  ادخل إلى قائمة إعدادات جهاز البصمة (عادةً عبر واجهة ويب خاصة بالجهاز أو برنامج إدارة مرفق).
    2.  ابحث عن قسم يتعلق بـ "Server Settings", "Communication", "Data Push", "Webhook", أو "Cloud Settings".
    3.  في هذا القسم، ستحتاج إلى إدخال:
        *   **URL الخادم:** هذا سيكون عنوان الـ Server Action في "دوامي". إذا كان "دوامي" يعمل على كمبيوتر بعنوان IP `192.168.1.100` والمنفذ `3000`، والـ Server Action (التي هي فعلياً ليست API Route تقليدي ولكن يمكن الوصول إليها كأنها كذلك في سياق Next.js Server Actions إذا كان الطلب من نفس المصدر أو عبر CORS إذا كان خارجياً ومعداً لذلك)، يمكن أن يكون المسار شيئاً يجب تصميمه.
            *   **ملاحظة هامة حول Server Actions وطلبات POST الخارجية:** بشكل افتراضي، Server Actions في Next.js لا تُعرض كـ API Routes تقليدية يمكن الوصول إليها عبر HTTP POST من أي مكان. هي مصممة للاستدعاء من مكونات العميل أو الخادم داخل نفس التطبيق.
            *   **للاستقبال من جهاز بصمة خارجي، ستحتاج على الأرجح إلى إنشاء API Route تقليدي في Next.js (مثلاً `src/app/api/fingerprint-hook/route.ts`)** يقوم بدوره باستدعاء `recordExternalAttendance` بعد التحقق من الطلب.
            *   **مثال على URL لنقطة نهاية API Route:** `http://[Your_Dawami_Server_IP]:3000/api/fingerprint-hook`
        *   **طريقة الطلب:** POST.
        *   **تنسيق البيانات:** JSON.
        *   **مفتاح الأمان (إذا كان الجهاز يدعم إرسال Headers مخصصة أو ضمن body):** يجب أن يتم إرسال `deviceSecret` كجزء من بيانات JSON في body الطلب.
*   **مثال على `src/app/api/fingerprint-hook/route.ts`:**
    ```typescript
    // src/app/api/fingerprint-hook/route.ts
    import { NextResponse, type NextRequest } from 'next/server';
    import { recordExternalAttendance, type ExternalAttendanceData } from '@/actions/attendanceActions';

    export async function POST(request: NextRequest) {
      try {
        const data: ExternalAttendanceData = await request.json();

        // استدعاء الـ Server Action الفعلية
        const result = await recordExternalAttendance(data);

        if (result.success) {
          return NextResponse.json({ message: result.message }, { status: 200 });
        } else {
          // لا ترجع تفاصيل خطأ محددة للمرسل الخارجي لأسباب أمنية في بعض الحالات
          return NextResponse.json({ message: result.message || "Failed to record attendance." }, { status: 400 });
        }
      } catch (error: any) {
        console.error("Error in fingerprint webhook:", error);
        // رسالة خطأ عامة
        return NextResponse.json({ message: "An error occurred on the server." }, { status: 500 });
      }
    }
    ```
*   **الميزات:** أسهل من ناحية "دوامي" لأنه فقط يستقبل البيانات.
*   **التحديات:** يتطلب جهاز بصمة يدعم هذه الميزة. التأكد من أن عنوان IP والمنفذ الخاص بـ "دوامي" ثابت ويمكن الوصول إليه من جهاز البصمة.

### الخيار ب: استخدام برنامج وسيط (Middleware Application)

إذا كان جهاز البصمة لا يدعم Push Data، أو إذا كنت ترغب في مزيد من التحكم، ستحتاج إلى برنامج وسيط.

*   **المبدأ:** برنامج صغير يعمل على كمبيوتر على نفس الشبكة المحلية لجهاز البصمة (يمكن أن يكون نفس الكمبيوتر الذي يشغل "دوامي"). هذا البرنامج يقوم بـ:
    1.  **الاتصال بجهاز البصمة:** يستخدم مكتبة خاصة بالشركة المصنعة للجهاز أو مكتبة عامة (مثل `node-zklib` لأجهزة ZKTeco) لسحب سجلات الحضور الجديدة بشكل دوري (Polling) أو الاستماع للأحداث إذا كانت المكتبة تدعم ذلك.
    2.  **معالجة البيانات:** يحول البيانات الخام من الجهاز إلى التنسيق المطلوب بواسطة `ExternalAttendanceData`.
    3.  **إرسال البيانات إلى "دوامي":** يقوم بعمل طلب HTTP POST إلى نقطة الاستقبال في "دوامي" (الـ API Route ` /api/fingerprint-hook` الذي أنشأناه)، مرسلاً البيانات ومفتاح `deviceSecret`.
*   **مثال على كود البرنامج الوسيط (Node.js باستخدام `node-zklib` و `axios`):**
    (الكود مشابه للمثال الذي قدمته، مع التأكيد على استخدام URL الـ API Route الصحيح ومفتاح الأمان)
    ```typescript
    // fingerprint-middleware.js (يعمل كبرنامج منفصل)
    import ZKLib from 'node-zklib'; // قد تحتاج لتثبيتها: npm install node-zklib
    import axios from 'axios';      // قد تحتاج لتثبيتها: npm install axios

    const FINGERPRINT_DEVICE_IP = '192.168.1.201'; // IP جهاز البصمة
    const FINGERPRINT_DEVICE_PORT = 4370;
    const DAWAMY_API_URL = 'http://localhost:3000/api/fingerprint-hook'; // عنوان API Route في دوامي
    const DAWAMY_SECRET_KEY = process.env.FINGERPRINT_WEBHOOK_SECRET || 'YOUR_DAWAMY_SECRET_KEY_FROM_ENV_FILE'; // يجب أن يتطابق مع .env.local في دوامي

    async function fetchAndSendAttendance() {
      let zkInstance;
      try {
        zkInstance = new ZKLib(FINGERPRINT_DEVICE_IP, FINGERPRINT_DEVICE_PORT, 5000, 5000);
        await zkInstance.createSocket();
        console.log('Connected to fingerprint device.');

        // اختياري: الحصول على معلومات الجهاز
        // const deviceVersion = await zkInstance.getVersion();
        // console.log('Device Version:', deviceVersion);

        const attendances = await zkInstance.getAttendances();

        if (attendances && attendances.data && attendances.data.length > 0) {
          console.log(`Found ${attendances.data.length} new attendance records.`);
          for (const record of attendances.data) {
            const dataToSend: ExternalAttendanceData = {
              employeeId: String(record.userId), // تأكد من أن هذا هو المعرف الصحيح للموظف
              timestamp: new Date(record.timestamp).toISOString(),
              // قد تحتاج إلى منطق لتحديد eventType إذا كان الجهاز لا يوفره بوضوح
              // بناءً على آخر سجل للموظف أو قواعد معينة.
              // حالياً، 'unknown' قد يكون بداية جيدة إذا لم يكن واضحاً.
              eventType: record.type === 0 ? 'clockIn' : record.type === 1 ? 'clockOut' : 'unknown', // هذا مثال، تحقق من قيم type لجهازك
              deviceSecret: DAWAMY_SECRET_KEY,
              deviceId: FINGERPRINT_DEVICE_IP, // أو معرف آخر للجهاز
            };

            try {
              await axios.post(DAWAMY_API_URL, dataToSend);
              console.log(`Sent attendance for ${dataToSend.employeeId} at ${dataToSend.timestamp}`);
            } catch (apiError: any) {
              console.error(`Failed to send data for ${dataToSend.employeeId}:`, apiError.response?.data || apiError.message);
            }
          }
          // **هام جداً:** بعد الإرسال الناجح، يجب مسح سجلات الحضور من ذاكرة الجهاز
          // لتجنب إرسالها مرة أخرى في كل مرة يتم فيها السحب.
          // تأكد من أن الإرسال إلى "دوامي" تم بنجاح قبل المسح.
          // await zkInstance.clearAttendanceLog(); // استخدم بحذر شديد!
          // console.log("Attendance log cleared from device (simulated - implement with care).");
        } else {
          console.log('No new attendance records found.');
        }
      } catch (e: any) {
        console.error("Error during fingerprint processing:", e.message);
      } finally {
        if (zkInstance) {
          await zkInstance.disconnect();
          console.log('Disconnected from fingerprint device.');
        }
      }
    }

    // تشغيل الدالة بشكل دوري (مثلاً كل دقيقة أو حسب الحاجة)
    const POLLING_INTERVAL_MS = 1 * 60 * 1000; // كل دقيقة
    setInterval(fetchAndSendAttendance, POLLING_INTERVAL_MS);
    console.log(`Fingerprint middleware started. Polling every ${POLLING_INTERVAL_MS / 1000} seconds...`);
    fetchAndSendAttendance(); // تشغيل فوري عند البدء
    ```
*   **الميزات:** تحكم كامل في عملية سحب ومعالجة البيانات قبل إرسالها.
*   **التحديات:** يتطلب تشغيل برنامج إضافي بشكل دائم. الحاجة إلى التعامل مع إدارة الأخطاء والاتصال بالجهاز بشكل موثوق.

## 3. نصائح هامة

*   **مطابقة `employeeId`:** تأكد من أن المعرفات المستخدمة للموظفين في جهاز البصمة (`userId` أو ما شابه) هي نفسها المعرفات (`id`) المستخدمة في نظام "دوامي". إذا كانت مختلفة، ستحتاج إلى آلية لربطها (Mapping) إما في البرنامج الوسيط أو عند استقبال البيانات في "دوامي".
*   **المنطقة الزمنية (Timezone):** تأكد من أن جهاز البصمة والكمبيوتر الذي يشغل "دوامي" (والبرنامج الوسيط إذا استخدم) مضبوطان على نفس المنطقة الزمنية، أو قم بمعالجة فروقات التوقيت بشكل صحيح عند تسجيل `timestamp`. "دوامي" يستخدم Asia/Damascus.
*   **التعامل مع الأخطاء:** يجب أن يكون هناك آلية قوية للتعامل مع أخطاء الاتصال (بالجهاز أو بـ "دوAMI")، وإعادة المحاولة، وتسجيل الأخطاء للمراجعة.
*   **تحديد `eventType` (`clockIn` / `clockOut`):** بعض أجهزة البصمة قد لا ترسل نوع الحدث بشكل صريح. قد تحتاج إلى منطق لتحديد ما إذا كانت البصمة هي "دخول" أم "خروج" بناءً على آخر بصمة مسجلة للموظف في نفس اليوم. `recordExternalAttendance` حالياً يستقبل هذا النوع. إذا كان البرنامج الوسيط هو الذي سيحدد النوع، يجب تعديله.

هذا الدليل يوفر الخطوات الأساسية لدمج جهاز البصمة. يتطلب الأمر بعض التجربة والتعديل بناءً على نوع جهاز البصمة والبيئة الخاصة بك.
