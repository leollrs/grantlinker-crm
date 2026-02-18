# Deployment Guide

## Prerequisites
- **GitHub Account**: To host the repository.
- **Vercel Account**: For hosting the Next.js app.
- **PostgreSQL Database**: (Neon, Supabase, Railway, or standard VPS).

## Steps

### 1. Database Setup
Create a PostgreSQL database and get the connection string.
Example: `postgres://user:password@host:5432/dbname?sslmode=require`

### 2. Environment Variables
Configure the following in your hosting provider (e.g., Vercel Project Settings):

```env
DATABASE_URL="your_connection_string_here"
NEXTAUTH_SECRET="generate_a_random_string_here"
NEXTAUTH_URL="https://your-crm-app.vercel.app" # Or localhost for dev
```

### 3. Deploy
1. Push code to GitHub.
2. Import project in Vercel.
3. Add the Environment Variables.
4. Deploy.

### 4. Post-Deployment
Run database migrations (automatically handled during build if configured, or manually via local CLI pointing to production DB):
```bash
npx prisma migrate deploy
```

## Local Development
1. Clone repo.
2. `npm install`
3. Set up `.env` with a local or cloud DB URL.
4. `npx prisma generate`
5. `npm run dev`
