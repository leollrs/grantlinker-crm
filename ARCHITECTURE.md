# Architecture Documentation

## Overview
This CRM foundation is a multi-tenant web application designed for small service businesses. It uses a **Discriminator Column** strategy for multi-tenancy, ensuring data isolation at the application level while sharing a single database for operational simplicity and cost-effectiveness.

## Tech Stack
- **Framework**: Next.js 14+ (App Router)
- **Language**: TypeScript
- **Database**: PostgreSQL
- **ORM**: Prisma
- **Auth**: NextAuth.js (v4) with Prisma Adapter
- **Styling**: Tailwind CSS + shadcn/ui components

## Multi-Tenancy Strategy
Every core entity (`User`, `Lead`, `Client`, `Appointment`, `Activity`) has a `tenantId` column.
- **Data Isolation**: All database queries MUST include `where: { tenantId: session.user.tenantId }`.
- **Authentication**: Usage of `next-auth` ensures `tenantId` is available in the session.
- **Middleware**: API routes and Server Actions validate the session before performing operations.

## Project Structure
- `/src/app`: App Router pages and API routes.
- `/src/components`: UI components (Button, Card, etc.) and feature-specific components.
- `/src/lib`: Utility functions, Prisma singleton (`db.ts`), and Auth config.
- `/src/lib/actions`: Server Actions for data mutation (Leads, Clients, etc.).
- `/prisma`: Database schema and migrations.

## Scalability
- The shared database approach handles thousands of tenants efficiently.
- For higher scale, we can migrate to a **Row Level Security (RLS)** policy in Postgres or move to a **Schema-per-tenant** approach if strict data compliance is required.
