# Setup & Run

## First-time / after pull

1. **Install dependencies**
   ```bash
   rm -rf node_modules .next
   npm install
   ```
2. **Start the dev server**
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000).

## Handy scripts

- `npm run dev` — start Next.js dev server

## If you see "command not found" for next

Make sure install finished without errors and no other terminal is running `npm install` or deleting `node_modules`. Then run:

```bash
rm -rf node_modules .next
npm install
npm run dev
```

## If the app doesn’t load (blank page, Safari, etc.)

1. **Use the right URL and port**  
   The dev server runs on **http://localhost:3000**. If you see “Port 3000 is in use… using 3001”, either:
   - Open **http://localhost:3001** in the browser, or  
   - Free port 3000 and restart: `lsof -ti :3000 | xargs kill -9` then `npm run dev`.

2. **Try the login page directly**  
   Open **http://localhost:3000/login**. If that loads but the home page doesn’t, the redirect-from-home fix is in place; you can use /login or /dashboard from there.

3. **Check .env**  
   In the project root, `.env` should include:
   - `NEXTAUTH_URL=http://localhost:3000` (same port as the dev server)
   - `DATABASE_URL="postgresql://postgres.<project-ref>:<password>@aws-0-<region>.pooler.supabase.com:6543/postgres?pgbouncer=true&uselibpqcompat=true&sslmode=require"`

## UI-only mode (no DB/auth, for frontend work)

If you just need to work on UI and navigation, create `.env.local` with:

```bash
NEXT_PUBLIC_UI_ONLY_MODE=true
```

Then run `npm run dev`.  
This enables mock data and bypasses auth redirects in main dashboard screens.

4. **If you see “Something went wrong”**  
   Use “Go to login” on the error screen. If the error persists, check the terminal where `npm run dev` is running for stack traces (e.g. PostgreSQL connection/query errors).
