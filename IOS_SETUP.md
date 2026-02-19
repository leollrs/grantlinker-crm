# iOS App Store Distribution Setup

This document outlines the steps to prepare your CRM app for iOS App Store distribution using Capacitor.

## Current Status

✅ **Completed:**
- All dashboard pages converted to client components
- API endpoints created for all data operations
- Capacitor configuration updated
- Next.js app ready for deployment

## Architecture

The app uses a **hybrid web app** approach:
- **Backend**: Next.js API routes (deployed to a server)
- **Frontend**: Next.js client components (loaded by Capacitor)
- **Mobile**: Capacitor wraps the web app and loads it from the deployed URL

## Deployment Steps

### 1. Deploy Next.js App

Deploy your Next.js app to a hosting service (Vercel, Railway, Render, etc.):

```bash
# Example for Vercel
npm install -g vercel
vercel deploy
```

After deployment, note your app URL (e.g., `https://your-app.vercel.app`)

### 2. Update Capacitor Configuration

Update `capacitor.config.ts` with your deployed URL:

```typescript
server: {
  url: 'https://your-app.vercel.app',
  cleartext: false  // Use HTTPS in production
}
```

### 3. Build and Sync Capacitor

```bash
# Build Next.js app
npm run build

# Sync web assets to Capacitor
npx cap sync ios
```

### 4. Configure iOS App

1. Open Xcode:
   ```bash
   npx cap open ios
   ```

2. Update App Info:
   - Set Bundle Identifier in `ios/App/App.xcodeproj`
   - Configure signing & capabilities
   - Set app display name and version

3. Configure App Store Connect:
   - Create app in App Store Connect
   - Set up app metadata, screenshots, etc.

### 5. Build for App Store

```bash
# In Xcode:
# Product > Archive
# Then upload to App Store Connect
```

## Environment Variables

Make sure your deployed Next.js app has these environment variables set:

- `NEXTAUTH_URL` - Your deployed app URL
- `NEXTAUTH_SECRET` - Random secret for NextAuth
- `DATABASE_URL` - Database connection string
- `GOOGLE_CLIENT_ID` - Google OAuth client ID
- `GOOGLE_CLIENT_SECRET` - Google OAuth client secret
- `META_APP_ID` - Meta/Facebook App ID
- `META_APP_SECRET` - Meta/Facebook App Secret

## Important Notes

1. **API Routes**: All API routes are server-side and require a Node.js server. They cannot be statically exported.

2. **Authentication**: NextAuth requires server-side session handling. Ensure your deployment supports this.

3. **Database**: Use a hosted PostgreSQL database (for example Supabase) that is accessible from your deployed server.

4. **CORS**: If you need to access the API from different origins, configure CORS in your API routes.

5. **Capacitor Server URL**: The `server.url` in `capacitor.config.ts` is used during development. For production builds, you may want to remove it and let Capacitor load from the app's origin.

## Alternative: Static Export Approach

If you want a true native app with offline capabilities, you would need to:

1. Separate backend API (Express, Fastify, etc.)
2. Convert Next.js to static export (`output: 'export'`)
3. Deploy backend separately
4. Update frontend to call backend API
5. Bundle static files with Capacitor

This requires more setup but provides better offline support.

## Testing

Before submitting to App Store:

1. Test on physical iOS device
2. Test all API endpoints
3. Test authentication flows
4. Test OAuth integrations (Google, Meta)
5. Test offline behavior (if applicable)

## Troubleshooting

- **App won't load**: Check `capacitor.config.ts` server URL
- **API errors**: Verify environment variables in deployment
- **OAuth redirects**: Update OAuth redirect URLs to match deployed URL
- **Database errors**: Ensure database is accessible from deployed server
