import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.spotify3.app',
  appName: 'Spotify3',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
  },
  ios: {
    scheme: 'Spotify3',
    contentInset: 'automatic',
    preferredContentMode: 'mobile',
    backgroundColor: '#000000',
    limitsNavigationsToAppBoundDomains: false,
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 1500,
      backgroundColor: '#191414',
      showSpinner: false,
    },
  },
};

export default config;
