# MarketPulse APK — Android mobile se build karne ka tareeqa

Is project mein GitHub Actions workflow shamil hai jo cloud par Android debug APK banata hai.

## Zaroori baat
GitHub account aur repository chahiye. APK install karne ke liye yeh debug build hai; public Play Store release ke liye signed release build alag se tayyar karna hoga.

## Steps
1. GitHub par sign in karein aur nayi **private** repository banayein, misal ke taur par `marketpulse-app`.
2. ZIP ko apne phone mein extract karein. GitHub ki website par repository mein project ke andar ki files/folders upload karein. `marketpulse_starter` folder ke andar wali files upload honi chahiye, sirf ZIP file nahi.
3. Files upload karte waqt `.github/workflows/android-apk.yml` bhi upload hona zaroori hai. Agar phone par hidden `.github` folder upload karna mushkil ho, repository ke **Actions** tab mein workflow tab tak nahi dikhega; aisi surat mein GitHub Codespaces/desktop se upload karna asaan ho sakta hai.
4. Repository ke **Actions** tab ko kholein, **Build MarketPulse Android APK** workflow select karein, phir **Run workflow** dabayein.
5. Build complete hone par green check mark dekhein. Neeche **Artifacts** mein `MarketPulse-debug-APK` download karein.
6. ZIP artifact ko phone mein extract karein. `app-debug.apk` par tap karke install karein. Android agar pooche to browser/file manager ke liye **Allow from this source / Install unknown apps** enable karein. Kaam ke baad is permission ko dobara off kar sakte hain.

## Agar error aaye
- Actions log ka aakhri red error text copy karke support ke liye bhejein.
- Repository mein project root par `package.json`, `capacitor.config.json`, `src/`, `index.html` aur `.github/workflows/android-apk.yml` hone chahiye.

APK debug/test version hai. App ke crypto endpoints ko network ya provider restrictions affect kar sakti hain. Forex live data configured nahi hai; signals rule-based demo indicators hain, guaranteed trading advice nahi.
