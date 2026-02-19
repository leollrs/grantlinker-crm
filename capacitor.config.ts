import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.grantlinker.crm',
  appName: 'Grantlinker CRM',
  // Required by Capacitor; app loads remote URL in production.
  webDir: 'public',
  server: {
    url: 'https://grantlinkercrm.vercel.app',
    cleartext: false
  }
};

export default config;
