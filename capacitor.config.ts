import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.grantlinker.crm',
  appName: 'Grantlinker CRM',
  webDir: 'out',
  server: {
    // Update this URL to your deployed Next.js app URL
    // For development, use: url: 'http://localhost:3000'
    // For production, use your deployed URL: url: 'https://your-app.vercel.app'
    url: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000',
    cleartext: true
  }
};

export default config;