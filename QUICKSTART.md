# Quick Start Guide

## Step 1: Install Dependencies

```bash
cd e:\Mydev\financial\next-finance
npm install
```

**Note:** This will take 10-15 minutes as it includes Puppeteer (browser automation tool).

## Step 2: Setup Environment Variables

Create `.env.local` file in the project root:

```bash
cp .env.example .env.local
```

Edit `.env.local` and add your credentials:

```env
# Supabase (Required)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here

# Supabase Service Role (Required for backend APIs)
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here

# PayPal (Required for subscription features)
NEXT_PUBLIC_PAYPAL_CLIENT_ID=your-paypal-client-id-here

# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:3000

# Portfolio Scraper (For investing.com scraping)
INVESTING_COOKIES=your-cookies-json-here

# Environment
NODE_ENV=development
```

## Step 3: Run Development Server

```bash
npm run dev
```

The application will be available at: **http://localhost:3000**

## Step 4: Build for Production

```bash
npm run build
npm start
```

## Available Commands

```bash
npm run dev          # Start development server with hot reload
npm run build        # Build optimized production bundle
npm start            # Start production server
npm run lint         # Run ESLint
npm run type-check   # Check TypeScript types
npm test             # Run tests
npm run test:watch   # Run tests in watch mode
```

## Project Information

- **Framework:** Next.js 15 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **UI Components:** shadcn/ui (Radix UI)
- **Auth:** Supabase Auth
- **Database:** Supabase (PostgreSQL)
- **Backend:** Next.js API Routes + Puppeteer Scraper
- **Payments:** PayPal integration

## Migration Status

| Phase | Component                 | Status         |
| ----- | ------------------------- | -------------- |
| 1     | Project Setup             | ✅ Complete    |
| 2     | UI Components & Utilities | ⏳ In Progress |
| 3     | Pages & Routing           | ⏳ Pending     |
| 4     | Backend API Routes        | ⏳ Pending     |
| 5     | Testing & Deployment      | ⏳ Pending     |

See `PHASE_1_COMPLETED.md` and `MIGRATION_PLAN.md` for details.

## Troubleshooting

### Puppeteer Installation Issues

If Puppeteer fails to install:

```bash
npm install --legacy-peer-deps
```

### Chrome/Edge Not Found

The scraper will auto-detect Chrome/Edge. If not found, specify the path in `.env.local`:

```env
CHROME_EXECUTABLE_PATH=C:\Program Files\Google\Chrome\Application\chrome.exe
```

### Supabase Connection Failed

- Check that `NEXT_PUBLIC_SUPABASE_URL` is correct
- Verify `NEXT_PUBLIC_SUPABASE_ANON_KEY` is valid
- Ensure your Supabase project is running

### Port Already in Use

If port 3000 is in use, use:

```bash
npm run dev -- -p 3001
```

## Next: Copy Components

After installation and verification, the next step is to copy UI components:

1. Copy all files from `frontend/src/components/ui/` → `next-finance/src/components/ui/`
2. Copy feature components from `frontend/src/components/`
3. Copy contexts and hooks
4. Create pages with Next.js routing

Run this to see the progress:

```bash
npm run type-check
```

---

**Ready to start?** Run: `npm install`
