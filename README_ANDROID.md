# تشغيل التطبيق على أندرويد (Android)

هذا المشروع مهيأ للعمل كـ تطبيق أندرويد باستخدام **Capacitor**.

## المتطلبات الأساسية
1. تثبيت [Node.js](https://nodejs.org/).
2. تثبيت [Android Studio](https://developer.android.com/studio).
3. تثبيت [Java SDK (JDK)](https://www.oracle.com/java/technologies/downloads/).

## كيفية التشغيل محلياً
بعد تحميل المشروع من GitHub:

1. **تثبيت المكونات**:
   ```bash
   npm install
   ```

2. **بناء المشروع**:
   ```bash
   npm run build
   ```

3. **مزامنة ملفات الأندرويد**:
   ```bash
   npx cap sync
   ```

4. **فتح المشروع في Android Studio**:
   ```bash
   npx cap open android
   ```
   أو يمكنك فتح مجلد `android` يدوياً داخل Android Studio.

5. **بناء APK**:
   داخل Android Studio، اذهب إلى `Build` -> `Build Bundle(s) / APK(s)` -> `Build APK(s)`.

## ملاحظات
- تم إضافة مجلد `android` وبداخله كافة إعدادات المشروع.
- يمكنك تعديل أيقونة التطبيق وشاشة البداية (Splash Screen) من داخل مجلد `android/app/src/main/res`.
