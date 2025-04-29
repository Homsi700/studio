# Network Pilot - Unified Network Management Dashboard

## English

### Project Goal

Network Pilot is a web-based dashboard designed to provide unified management and monitoring for various network devices, specifically focusing on Mikrotik routers, Mimosa, and Ubiquiti (UBNT) wireless equipment commonly used by Internet Service Providers (ISPs) or network administrators. It aims to simplify common tasks like user management (PPPoE), device status monitoring, and basic troubleshooting through a single, intuitive interface.

### Key Features

*   **Unified Dashboard:** View the status (connectivity, signal strength, user count, traffic) of Mikrotik, Mimosa, and UBNT devices in one place.
*   **Real-time Updates:** Utilizes WebSockets for live status updates and alerts.
*   **Mikrotik PPPoE User Management:**
    *   Add, enable, disable, renew, and delete PPPoE users.
    *   View user status (online/offline), assigned speed, IP address, uptime, MAC address, registration date, and expiry date.
    *   Automatic disabling of users created with a short expiry duration (<= 30 days).
*   **Device Actions:** Restart Mikrotik servers and wireless towers directly from the dashboard. Access device web interfaces.
*   **Tower Monitoring:**
    *   Monitor signal strength and traffic for Mimosa and UBNT devices.
    *   Visual alerts (warnings/errors) based on predefined thresholds (signal strength, traffic).
*   **User Authentication:** Secure login and signup functionality.
*   **Theme Toggle:** Switch between light and dark modes.
*   **Responsive Design:** Adapts to different screen sizes.

### Technology Stack

*   **Frontend:** Next.js (App Router), React, TypeScript
*   **UI:** ShadCN UI, Tailwind CSS
*   **State Management:** React Context API, React Hooks
*   **Real-time:** WebSockets (requires a separate backend WebSocket server implementation)
*   **Backend Simulation:** Mock data and functions within the frontend services (`src/services/*`) are used for demonstration. **A real backend implementing the corresponding APIs is required for actual device interaction.**
*   **GenAI (Optional):** Includes setup for Google Genkit for potential future AI-driven features (e.g., diagnostics, configuration suggestions).

### Installation

1.  **Prerequisites:**
    *   Node.js (version 18 or later recommended)
    *   npm (usually comes with Node.js)

2.  **Clone/Download Project:** Obtain the project files (e.g., by cloning the repository or downloading a zip archive).

3.  **Navigate to Project Directory:**
    ```bash
    cd path/to/network-pilot
    ```

4.  **Install Dependencies:**
    ```bash
    npm install
    ```
    *(You can also use the `install_deps.bat` script on Windows)*

5.  **Environment Variables (Optional):**
    *   Create a `.env` file in the project root if you need to configure specific environment variables (e.g., `NEXT_PUBLIC_WEBSOCKET_URL`, `GOOGLE_GENAI_API_KEY`). See `.env.example` if provided.

### Running the Project

1.  **Start the Development Servers:** You need to run the Next.js frontend and the Genkit development server (if using GenAI features) simultaneously.

    *   **Terminal 1 (Next.js Frontend):**
        ```bash
        npm run dev
        ```
        This will typically start the frontend on `http://localhost:9002`.

    *   **Terminal 2 (Genkit Dev Server - Optional):**
        ```bash
        npm run genkit:watch
        ```
        or
        ```bash
        npm run genkit:dev
        ```
        This starts the Genkit development environment.

    *(You can also use the `run_dev.bat` script on Windows to start both servers and open the browser)*

2.  **Access the Application:** Open your web browser and navigate to `http://localhost:9002`.

3.  **Login/Signup:** Use the login page (`/login`) or signup page (`/signup`) to create an account or log in. Default credentials might be available (e.g., admin/password123) depending on the initial mock data in `src/context/AuthContext.tsx`.

**Important Note:** This project currently uses mock services. For real-world use, you need to implement a backend service that interacts with your actual Mikrotik, Mimosa, and UBNT devices via their respective APIs (e.g., Mikrotik RouterOS API, SSH, SNMP, vendor-specific APIs) and provides the data through the expected API endpoints and WebSocket connection.

---

## العربية

### هدف المشروع

Network Pilot هو لوحة تحكم قائمة على الويب مصممة لتوفير إدارة ومراقبة موحدة لأجهزة الشبكة المختلفة، مع التركيز بشكل خاص على أجهزة توجيه Mikrotik ومعدات لاسلكية من Mimosa و Ubiquiti (UBNT) التي يشيع استخدامها من قبل مزودي خدمة الإنترنت (ISPs) أو مسؤولي الشبكات. يهدف إلى تبسيط المهام الشائعة مثل إدارة المستخدمين (PPPoE)، ومراقبة حالة الجهاز، واستكشاف الأخطاء وإصلاحها الأساسية من خلال واجهة واحدة سهلة الاستخدام.

### الميزات الرئيسية

*   **لوحة تحكم موحدة:** عرض حالة (الاتصال، قوة الإشارة، عدد المستخدمين، حركة المرور) لأجهزة Mikrotik و Mimosa و UBNT في مكان واحد.
*   **تحديثات في الوقت الفعلي:** يستخدم WebSockets لتحديثات الحالة والتنبيهات الحية.
*   **إدارة مستخدمي Mikrotik PPPoE:**
    *   إضافة، تفعيل، تعطيل، تجديد، وحذف مستخدمي PPPoE.
    *   عرض حالة المستخدم (متصل/غير متصل)، السرعة المخصصة، عنوان IP، مدة الاتصال، عنوان MAC، تاريخ التسجيل، وتاريخ انتهاء الصلاحية.
    *   التعطيل التلقائي للمستخدمين الذين تم إنشاؤهم بمدة صلاحية قصيرة (<= 30 يومًا).
*   **إجراءات الجهاز:** إعادة تشغيل سيرفرات Mikrotik والأبراج اللاسلكية مباشرة من لوحة التحكم. الوصول إلى واجهات الويب الخاصة بالجهاز.
*   **مراقبة الأبراج:**
    *   مراقبة قوة الإشارة وحركة المرور لأجهزة Mimosa و UBNT.
    *   تنبيهات مرئية (تحذيرات/أخطاء) بناءً على عتبات محددة مسبقًا (قوة الإشارة، حركة المرور).
*   **مصادقة المستخدم:** وظائف تسجيل دخول وتسجيل آمنة.
*   **تبديل المظهر:** التبديل بين الوضع الفاتح والداكن.
*   **تصميم متجاوب:** يتكيف مع أحجام الشاشات المختلفة.

### التقنيات المستخدمة

*   **الواجهة الأمامية:** Next.js (App Router), React, TypeScript
*   **واجهة المستخدم:** ShadCN UI, Tailwind CSS
*   **إدارة الحالة:** React Context API, React Hooks
*   **الوقت الفعلي:** WebSockets (يتطلب تطبيق خادم WebSocket خلفي منفصل)
*   **محاكاة الواجهة الخلفية:** يتم استخدام بيانات ووظائف وهمية داخل خدمات الواجهة الأمامية (`src/services/*`) للعرض التوضيحي. **مطلوب واجهة خلفية حقيقية تنفذ واجهات برمجة التطبيقات المقابلة للتفاعل الفعلي مع الجهاز.**
*   **الذكاء الاصطناعي التوليدي (اختياري):** يتضمن إعدادًا لـ Google Genkit للميزات المستقبلية المحتملة القائمة على الذكاء الاصطناعي (مثل التشخيصات واقتراحات التكوين).

### التثبيت

1.  **المتطلبات الأساسية:**
    *   Node.js (يوصى بالإصدار 18 أو أحدث)
    *   npm (يأتي عادةً مع Node.js)

2.  **استنساخ/تنزيل المشروع:** احصل على ملفات المشروع (على سبيل المثال، عن طريق استنساخ المستودع أو تنزيل أرشيف zip).

3.  **الانتقال إلى دليل المشروع:**
    ```bash
    cd path/to/network-pilot
    ```

4.  **تثبيت الاعتماديات:**
    ```bash
    npm install
    ```
    *(يمكنك أيضًا استخدام البرنامج النصي `install_deps.bat` على نظام التشغيل Windows)*

5.  **متغيرات البيئة (اختياري):**
    *   أنشئ ملف `.env` في جذر المشروع إذا كنت بحاجة إلى تكوين متغيرات بيئة محددة (مثل `NEXT_PUBLIC_WEBSOCKET_URL`, `GOOGLE_GENAI_API_KEY`). انظر `.env.example` إذا كان متوفرًا.

### تشغيل المشروع

1.  **بدء خوادم التطوير:** تحتاج إلى تشغيل الواجهة الأمامية Next.js وخادم تطوير Genkit (إذا كنت تستخدم ميزات GenAI) في وقت واحد.

    *   **الطرفية 1 (الواجهة الأمامية Next.js):**
        ```bash
        npm run dev
        ```
        سيؤدي هذا عادةً إلى بدء الواجهة الأمامية على `http://localhost:9002`.

    *   **الطرفية 2 (خادم تطوير Genkit - اختياري):**
        ```bash
        npm run genkit:watch
        ```
        أو
        ```bash
        npm run genkit:dev
        ```
        يبدأ هذا بيئة تطوير Genkit.

    *(يمكنك أيضًا استخدام البرنامج النصي `run_dev.bat` على نظام التشغيل Windows لبدء كلا الخادمين وفتح المتصفح)*

2.  **الوصول إلى التطبيق:** افتح متصفح الويب الخاص بك وانتقل إلى `http://localhost:9002`.

3.  **تسجيل الدخول/التسجيل:** استخدم صفحة تسجيل الدخول (`/login`) أو صفحة التسجيل (`/signup`) لإنشاء حساب أو تسجيل الدخول. قد تكون بيانات الاعتماد الافتراضية متاحة (مثل admin/password123) اعتمادًا على البيانات الوهمية الأولية في `src/context/AuthContext.tsx`.

**ملاحظة مهمة:** يستخدم هذا المشروع حاليًا خدمات وهمية. للاستخدام في العالم الحقيقي، تحتاج إلى تطبيق خدمة خلفية تتفاعل مع أجهزة Mikrotik و Mimosa و UBNT الفعلية الخاصة بك عبر واجهات برمجة التطبيقات الخاصة بها (مثل Mikrotik RouterOS API و SSH و SNMP وواجهات برمجة التطبيقات الخاصة بالبائع) وتوفر البيانات من خلال نقاط نهاية API المتوقعة واتصال WebSocket.
