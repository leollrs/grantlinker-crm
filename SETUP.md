# Setup & Run

## First-time / after pull

1. **Install dependencies and generate Prisma client**
   ```bash
   rm -rf node_modules .next
   npm install
   ```
   `postinstall` runs `prisma generate` automatically.

2. **Ensure database is in sync** (optional; already done if you had `prisma/dev.db`)
   ```bash
   npm run db:push
   ```

3. **Start the dev server**
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000).

## Handy scripts

- `npm run dev` — start Next.js dev server
- `npm run db:generate` — regenerate Prisma client after schema changes
- `npm run db:push` — push schema to the database (no migrations)

## If you see "command not found" for next or prisma

Make sure install finished without errors and no other terminal is running `npm install` or deleting `node_modules`. Then run:

```bash
rm -rf node_modules .next
npm install
npm run dev
```
