# Discount Panel

A mobile-first discount and deal discovery app built with React, Vite, and Capacitor.

## Running as a Native Android App

### Prerequisites

- Node.js & npm installed
- Android Studio installed with SDK configured
- Java JDK 17 or higher

### Setup Steps

1. **Clone and install dependencies**
   ```bash
   git clone <YOUR_GIT_URL>
   cd <YOUR_PROJECT_NAME>
   npm install
   ```

2. **Add Android platform**
   ```bash
   npx cap add android
   ```

3. **Build the web app**
   ```bash
   npm run build
   ```

4. **Sync with native platform**
   ```bash
   npx cap sync android
   ```

5. **Add Location Permissions**
   
   Open `android/app/src/main/AndroidManifest.xml` and add these permissions inside the `<manifest>` tag (before `<application>`):
   
   ```xml
   <uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
   <uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />
   ```

6. **Open in Android Studio**
   ```bash
   npx cap open android
   ```

7. **Run the app**
   - In Android Studio, select your device/emulator and click Run

### Updating After Code Changes

After making changes to the web code:
```bash
npm run build
npx cap sync android
```

Then run again from Android Studio.

---

## Web Development

### Running locally

```bash
npm install
npm run dev
```

## Technologies Used

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS
- Capacitor (for native mobile builds)
