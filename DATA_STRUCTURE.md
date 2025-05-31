
# هيكل وإدارة البيانات في مشروع "دوامي"

هذا المستند يشرح كيفية تخزين البيانات في مشروع "دوامي"، بنية كل "مجموعة" (Collection) من البيانات في قاعدة البيانات المدمجة، والعلاقات الأساسية بينها.

## قاعدة البيانات: Lowdb

يستخدم مشروع "دوامي" مكتبة **Lowdb** كقاعدة بيانات مدمجة. هذا يعني أن جميع بيانات التطبيق تُخزن في ملف JSON واحد موجود في المشروع.

*   **ملف قاعدة البيانات:** `src/lib/db.json`
*   **الوصول إلى البيانات:** يتم التعامل مع قاعدة البيانات (القراءة والكتابة) من خلال الدوال المساعدة والـ Server Actions، وذلك باستخدام الإعدادات المعرفة في `src/lib/db.ts`.

## بنية مجموعات البيانات (Collections)

يحتوي ملف `db.json` على كائن رئيسي يضم المجموعات التالية:

### 1. `employees`: (معلومات الموظفين)

يحتوي على مصفوفة من كائنات الموظفين. كل كائن يمثل موظفاً واحداً بالتفاصيل التالية:

```json
{
  "id": "string", // معرف فريد للموظف (uuid v4)
  "name": "string", // اسم الموظف
  "department": "string", // القسم الذي يعمل به
  "jobTitle": "string", // المسمى الوظيفي
  "email": "string", // البريد الإلكتروني
  "phone": "string", // رقم الهاتف
  "avatarUrl": "string", // (اختياري) رابط لصورة الموظف الرمزية
  "hashedPin": "string", // (اختياري) الرقم السري (PIN) الخاص بالموظف، مخزن بشكل مشفر (bcrypt)
  "payrollSettings": { // إعدادات الراتب الخاصة بالموظف
    "baseSalary": "number", // الراتب الأساسي
    "currency": "string", // عملة الراتب الأساسي ('SYP' أو 'USD')
    "allowances": [ // مصفوفة من البدلات
      {
        "id": "string", // معرف فريد للبدل
        "name": "string", // اسم البدل (مثال: بدل سكن)
        "amount": "number" // قيمة البدل (بنفس عملة الراتب الأساسي)
      }
    ],
    "deductions": [ // مصفوفة من الخصومات الثابتة
      {
        "id": "string", // معرف فريد للخصم
        "name": "string", // اسم الخصم (مثال: سلفة)
        "amount": "number" // قيمة الخصم (بنفس عملة الراتب الأساسي)
      }
    ]
  },
  "payrollHistory": [ // (اختياري) سجل كشوف الرواتب الشهرية المحسوبة لهذا الموظف
    // بنية كائن PayrollRecord ستُشرح لاحقاً
  ]
}
```

### 2. `attendanceRecords`: (سجلات الحضور المجمعة)

يحتوي على مصفوفة من سجلات الحضور اليومية المجمعة للموظفين. كل سجل يمثل دوام يوم واحد لموظف.

```json
{
  "id": "string", // معرف فريد لسجل الحضور (uuid v4)
  "employeeId": "string", // معرف الموظف (يرتبط بـ id في مجموعة employees)
  "employeeName": "string", // اسم الموظف (للتسهيل، لكن المصدر هو مجموعة employees)
  "date": "string", // تاريخ الدوام (بتنسيق YYYY-MM-DD)
  "clockIn": "string", // وقت تسجيل الدخول (بتنسيق HH:MM)
  "clockOut": "string | null", // وقت تسجيل الخروج (HH:MM) أو null إذا كان الموظف لا يزال في الدوام
  "totalDuration": "string | null", // المدة الإجمالية للدوام (مثال: "8 ساعات و 15 دقيقة") أو null
  "status": "string", // حالة الدوام ('onTime', 'late', 'earlyLeave', 'absent', 'onDuty')
  "method": "string", // (اختياري) طريقة تسجيل الدوام ('PIN', 'Fingerprint', 'Manual')
  "deviceId": "string" // (اختياري) معرف الجهاز المستخدم للتسجيل (إذا كان من بصمة أو نظام خارجي)
}
```

### 3. `leaveRequests`: (طلبات الإجازات)

يحتوي على مصفوفة من طلبات الإجازة.

```json
{
  "id": "string", // معرف فريد لطلب الإجازة (uuid v4)
  "employeeId": "string", // معرف الموظف مقدم الطلب (يرتبط بـ id في employees)
  "employeeName": "string", // اسم الموظف
  "startDate": "string", // تاريخ بدء الإجازة (YYYY-MM-DD)
  "endDate": "string", // تاريخ انتهاء الإجازة (YYYY-MM-DD)
  "reason": "string", // سبب طلب الإجازة
  "status": "string" // حالة الطلب ('pending', 'approved', 'rejected')
}
```

### 4. `shifts`: (ورديات الدوام)

يحتوي على مصفوفة من الورديات المعرفة في النظام.

```json
{
  "id": "string", // معرف فريد للوردية
  "name": "string", // اسم الوردية (مثال: الوردية الصباحية)
  "startTime": "string", // وقت بدء الوردية (HH:MM)
  "endTime": "string", // وقت انتهاء الوردية (HH:MM)
  "gracePeriodMinutes": "number" // فترة السماح للتأخير بالدقائق
}
```
*ملاحظة: حالياً، هذه المجموعة تحتوي على بيانات نموذجية ولم يتم ربطها بشكل كامل بمنطق حساب التأخيرات أو الحضور.*

### 5. `rawAttendanceEvents`: (أحداث الحضور الخام)

يحتوي على مصفوفة من أحداث الحضور الخام كما ترد من أجهزة البصمة أو الأنظمة الخارجية. كل حدث يمثل بصمة واحدة (دخول أو خروج).

```json
{
  "id": "string", // معرف فريد للحدث (uuid v4)
  "employeeId": "string", // معرف الموظف من الجهاز (يجب مطابقته مع id في employees)
  "timestamp": "string", // وقت تسجيل الحدث (بتنسيق ISO 8601، مثال: "2025-05-31T15:00:00.000Z")
  "type": "string", // نوع الحدث ('clockIn', 'clockOut', 'unknown')
  "method": "string", // طريقة التسجيل ('Fingerprint', 'OtherExternal', 'PIN')
  "deviceId": "string" // (اختياري) معرف الجهاز الذي أرسل الحدث
}
```
*ملاحظة: هذه الأحداث تحتاج إلى معالجة لاحقة لتحويلها إلى سجلات `attendanceRecords` مجمعة ليوم واحد.*

### 6. `exchangeRates`: (أسعار صرف العملات)

يحتوي على مصفوفة من أسعار الصرف التاريخية، حالياً بين الدولار الأمريكي (USD) والليرة السورية (SYP).

```json
{
  "id": "string", // معرف فريد لسعر الصرف (uuid v4)
  "date": "string", // تاريخ سعر الصرف (YYYY-MM-DD)
  "rate": "number" // قيمة 1 دولار أمريكي بالليرة السورية في هذا التاريخ (مثال: 14500)
}
```

### 7. `payrollHistory` (ضمن كائن الموظف):

يتم تخزين سجلات كشوف الرواتب الشهرية المحسوبة لكل موظف ضمن كائن الموظف نفسه في مصفوفة `payrollHistory`. كل عنصر في هذه المصفوفة هو كائن `PayrollRecord`.

```json
// (ضمن كائن الموظف في مجموعة employees)
"payrollHistory": [
  {
    "id": "string", // معرف فريد لكشف الراتب (uuid v4)
    "employeeId": "string", // معرف الموظف
    "month": "number", // الشهر (1-12)
    "year": "number", // السنة
    "baseSalarySnapshot": "number", // قيمة الراتب الأساسي وقت الحساب
    "baseSalaryCurrency": "string", // عملة الراتب الأساسي ('SYP' أو 'USD')
    "grossSalary": "number", // الراتب الإجمالي (عادةً الراتب الأساسي قبل خصومات الأداء)
    "totalAllowances": "number", // إجمالي البدلات بالعملة الأساسية
    "totalDeductions": "number", // إجمالي الخصومات (أداء + ثابتة) بالعملة الأساسية
    "netSalaryInBaseCurrency": "number", // صافي الراتب بالعملة الأساسية
    "exchangeRateApplied": "number | undefined", // سعر الصرف المستخدم إذا تم التحويل
    "convertedToCurrency": "string | undefined", // العملة التي تم التحويل إليها ('SYP' أو 'USD')
    "netSalaryInConvertedCurrency": "number | undefined", // صافي الراتب بالعملة المحولة
    "calculationDate": "string", // تاريخ حساب الكشف (ISO 8601)
    "attendanceSummary": {
      "totalWorkingHours": "number | undefined",
      "totalLateMinutes": "number | undefined",
      "totalAbsentDays": "number | undefined",
      "daysInMonth": "number | undefined",
      "workingDaysInMonth": "number | undefined",
      "actualWorkedDays": "number | undefined"
    },
    "notes": "string | undefined" // ملاحظات إضافية
  }
]
```

## العلاقات بين البيانات

*   `attendanceRecords.employeeId` يرتبط بـ `employees.id`.
*   `leaveRequests.employeeId` يرتبط بـ `employees.id`.
*   `rawAttendanceEvents.employeeId` يجب مطابقته مع `employees.id`.
*   `employees.payrollHistory` يحتوي على سجلات خاصة بذلك الموظف.

هذا الهيكل يوفر الأساس لجميع عمليات النظام. يتم تحديثه وتوسيعه حسب الحاجة مع إضافة ميزات جديدة.
