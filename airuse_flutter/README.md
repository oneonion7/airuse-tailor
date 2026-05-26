## AirUse Flutter App

A cross-platform Flutter app for **iOS**, **Android**, and **Web** — built on top of the existing AirUse backend.

### Features
- 🔐 Email/Password + Google OAuth login
- 📊 Dashboard with ATS score stats
- ✨ AI Resume Builder (calls existing backend API)
- 📄 View & download tailored resumes
- 🌙 Premium dark theme

### Project Structure
```
lib/
├── main.dart                         # App entry + Supabase init
├── core/
│   ├── theme/app_theme.dart          # Dark theme tokens
│   └── router/app_router.dart        # GoRouter + auth guards
└── features/
    ├── landing/screens/              # Landing page
    ├── auth/
    │   ├── screens/                  # Login, Signup, Callback
    │   └── widgets/                  # AuthCard, GoogleButton, Divider
    ├── dashboard/screens/            # Resume list + stats
    └── builder/screens/              # Resume builder + result
```

### Setup

1. **Install Flutter**: https://docs.flutter.dev/get-started/install/windows
2. **Run on Web**:
   ```bash
   flutter pub get
   flutter run -d chrome
   ```
3. **Run on Android**:
   ```bash
   flutter run -d android
   ```
4. **Build for production**:
   ```bash
   # Web
   flutter build web --release
   # Android APK
   flutter build apk --release
   # iOS (requires Mac)
   flutter build ios --release
   ```

### Android Setup (for Google Sign-In)
Add your SHA-1 key to Firebase/Google Cloud Console:
```bash
cd android
./gradlew signingReport
```

### Environment
- Supabase URL: `https://xlcnkjzczobpoopyavmd.supabase.co`
- Backend API: `https://airuse-tailor-4pej.vercel.app/api`
