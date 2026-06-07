# Next.js Migration Plan

## Overview

Converting React (Vite) + Express backend into a single Next.js application.

## Structure Strategy

### Frontend Files to Migrate

```
frontend/src/ → next-finance/src/
├── components/ → components/
├── contexts/ → contexts/
├── hooks/ → hooks/
├── lib/ → lib/
├── types/ → types/
├── pages/ → app/ (with routing restructure)
└── sqls/ → (backend in api/)
```

### Backend Files to Migrate

```
backend/ → next-finance/src/api/
├── services/ → api/services/
├── scrapers/ → api/scrapers/
├── jobs/ → api/jobs/
└── server.js logic → api/route.ts files
```

## Migration Order

### 1. Copy Supporting Files (Frontend)

- [ ] `src/types/**` - All TypeScript type definitions
- [ ] `src/lib/**` - Utility functions and Supabase client
- [ ] Copy `public/**` - Static assets
- [ ] Copy configuration files if needed

### 2. Copy UI Components (Frontend)

- [ ] `src/components/ui/**` - All shadcn/ui components
- [ ] `src/components/*.tsx` - Feature components
- [ ] `src/components/dashboard/**` - Dashboard components
- [ ] `src/components/settings/**` - Settings components

### 3. Copy Core Logic (Frontend)

- [ ] `src/contexts/**` - AuthContext and other contexts
- [ ] `src/hooks/**` - Custom hooks
- [ ] Create `src/components/providers.tsx` - Provider wrapper

### 4. Create Backend API Routes

- [ ] `src/api/health/route.ts`
- [ ] `src/api/portfolio/latest/route.ts`
- [ ] `src/api/portfolio/cron/status/route.ts`
- [ ] `src/api/portfolio/cron/trigger/route.ts`
- [ ] Migrate backend services:
  - `src/api/services/portfolioService.ts`
  - `src/api/scrapers/portfolioScraper.ts`
  - `src/api/jobs/portfolioCron.ts`

### 5. Create Pages (Frontend Routes)

Route structure:

```
app/
├── (auth)/
│   ├── login/page.tsx
│   ├── signup/page.tsx
│   ├── forgot-password/page.tsx
│   └── reset-password/page.tsx
├── (dashboard)/
│   ├── layout.tsx
│   ├── dashboard/page.tsx
│   ├── profile/page.tsx
│   ├── subscription/page.tsx
│   ├── settings/page.tsx
│   └── admin/
│       ├── users/page.tsx
│       ├── finance/page.tsx
│       └── subscriptions/page.tsx
├── page.tsx (Home)
├── layout.tsx (Root)
└── not-found.tsx (404)
```

### 6. Create Middleware

- [ ] `src/middleware.ts` - Authentication middleware

### 7. Testing & Refinement

- [ ] Test all pages load
- [ ] Test authentication flows
- [ ] Test API routes
- [ ] Test background jobs

## File Mapping Reference

### Frontend → Next.js Pages

| Frontend Route         | Next.js Route                                  |
| ---------------------- | ---------------------------------------------- |
| `/`                    | `app/page.tsx`                                 |
| `/login`               | `app/(auth)/login/page.tsx`                    |
| `/signup`              | `app/(auth)/signup/page.tsx`                   |
| `/forgot-password`     | `app/(auth)/forgot-password/page.tsx`          |
| `/reset-password`      | `app/(auth)/reset-password/page.tsx`           |
| `/dashboard`           | `app/(dashboard)/dashboard/page.tsx`           |
| `/profile`             | `app/(dashboard)/profile/page.tsx`             |
| `/subscription`        | `app/(dashboard)/subscription/page.tsx`        |
| `/settings`            | `app/(dashboard)/settings/page.tsx`            |
| `/admin/users`         | `app/(dashboard)/admin/users/page.tsx`         |
| `/admin/finance`       | `app/(dashboard)/admin/finance/page.tsx`       |
| `/admin/subscriptions` | `app/(dashboard)/admin/subscriptions/page.tsx` |
| `*`                    | `app/not-found.tsx`                            |

### Backend API Routes

| Express Endpoint                   | Next.js API Route                         |
| ---------------------------------- | ----------------------------------------- |
| `GET /`                            | `app/api/route.ts`                        |
| `GET /api/health`                  | `app/api/health/route.ts`                 |
| `GET /api/portfolio/latest`        | `app/api/portfolio/latest/route.ts`       |
| `GET /api/portfolio/cron/status`   | `app/api/portfolio/cron/status/route.ts`  |
| `POST /api/portfolio/cron/trigger` | `app/api/portfolio/cron/trigger/route.ts` |

## Key Considerations

### Changes Needed During Migration

1. **Import Paths**

   - `from '@/components/...'` ✓ (already configured)
   - Vite imports work directly in Next.js

2. **Environment Variables**

   - VITE* prefix → NEXT_PUBLIC* prefix
   - `.env.local` instead of `.env`

3. **Supabase Client**

   - Vite: `import.meta.env.VITE_SUPABASE_URL`
   - Next.js: `process.env.NEXT_PUBLIC_SUPABASE_URL`

4. **React Router → Next.js Routing**

   - No need for `<BrowserRouter>` or `<Routes>`
   - File structure handles routing
   - Protected routes via middleware

5. **Backend Integration**
   - API routes run on server
   - No separate server.js needed
   - Cron jobs handled differently (Vercel Crons or scheduled tasks)

### Files to Keep as-is

These don't need changes:

- All `.tsx` and `.ts` files in components/
- All custom hooks
- TypeScript types
- Tailwind CSS styles
- UI component code

### Files Needing Conversion

These need adjustments:

- Main entry point (`main.tsx` → not needed)
- `App.tsx` → Layout hierarchy
- Router setup → File-based routing
- API calls → API routes
- Cron jobs → Different scheduling approach

## Timeline Estimate

- Phase 1 (Setup): ✅ Done
- Phase 2 (Types, Lib, UI): 30-45 minutes
- Phase 3 (Contexts, Hooks): 15-20 minutes
- Phase 4 (Pages): 45-60 minutes
- Phase 5 (API Routes & Backend): 60-90 minutes
- Phase 6 (Testing): 30-45 minutes

**Total: ~4-5 hours for complete migration**

## Success Criteria

- [ ] All pages accessible and rendering
- [ ] Authentication working (Supabase)
- [ ] Protected routes enforced
- [ ] API routes responding
- [ ] Portfolio data displaying
- [ ] Admin features working
- [ ] No console errors
- [ ] Build succeeds without warnings
