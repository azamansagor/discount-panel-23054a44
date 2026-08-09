import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.devwed.discountpanel',
  appName: 'discount-panel',
  webDir: 'dist',
  plugins: {
    CapacitorHttp: {
      enabled: true,
    },
    SocialLogin: {
      // Only Google sign-in is used (see src/pages/Login.tsx). Bundling the
      // Facebook SDK would pull in com.google.android.gms.permission.AD_ID and
      // the ACCESS_ADSERVICES_* Privacy Sandbox permissions, which forces a
      // "uses advertising ID" declaration on the Play Console.
      providers: {
        google: true,
        facebook: false,
      },
    },
  },
};

export default config;
