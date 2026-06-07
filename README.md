# Next.js Financial Portfolio Manager

This is a unified Next.js application that combines the React frontend and Express backend from the parent project.

## Project Structure

```
next-finance/
├── src/
│   ├── app/                 # Next.js App Router
│   ├── components/          # React components
│   ├── contexts/            # React contexts
│   ├── hooks/               # Custom hooks
│   ├── lib/                 # Utility functions
│   ├── types/               # TypeScript types
│   └── api/                 # API routes (backend)
├── public/                  # Static assets
├── .gitignore              # Git ignore rules
├── .env.example            # Environment variables template
├── next.config.js          # Next.js configuration
├── tailwind.config.ts      # Tailwind CSS configuration
├── tsconfig.json           # TypeScript configuration
└── package.json            # Dependencies
```

## Getting Started

### Prerequisites

- Node.js 18+ and npm 9+

### Installation

1. Install dependencies:

```bash
npm install
```

2. Create `.env.local` from `.env.example`:

```bash
cp .env.example .env.local
```

3. Fill in your environment variables (Supabase credentials, PayPal API key, etc.)

### Development

Run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the application.

### Building

Build for production:

```bash
npm run build
npm start
```

## Architecture

### Frontend

- **Framework**: Next.js 15 with App Router
- **UI**: shadcn/ui components with Tailwind CSS
- **State Management**: React Query for server state
- **Forms**: React Hook Form + Zod validation
- **Authentication**: Supabase Auth

### Backend (API Routes)

- **Scraper**: Portfolio data scraper using Puppeteer
- **Database**: Supabase PostgreSQL
- **Cron Jobs**: Background tasks for data updates
- **API Routes**: Next.js API routes in `/src/app/api`

### Database (Supabase)

- Authentication and user profiles
- Portfolio items and item types
- Subscription data
- User customization settings

## Migration Status

### Phase 1: Project Setup ✅

- [x] Initialize Next.js project
- [x] Configure TypeScript
- [x] Set up Tailwind CSS
- [x] Configure environment variables
- [x] Create Providers component

### Phase 2: Core Migrations (In Progress)

- [ ] Migrate all UI components
- [ ] Migrate custom hooks
- [ ] Migrate TypeScript types
- [ ] Set up authentication context

### Phase 3: Frontend Pages (Pending)

- [ ] Create layout components
- [ ] Migrate public pages
- [ ] Migrate protected pages
- [ ] Migrate admin pages

### Phase 4: Backend Integration (Pending)

- [ ] Create API routes
- [ ] Migrate portfolio service
- [ ] Migrate scraper logic
- [ ] Set up cron jobs

### Phase 5: Testing & Deployment (Pending)

- [ ] Test authentication
- [ ] Test API endpoints
- [ ] Test protected routes
- [ ] Configure deployment

## Environment Variables

Create a `.env.local` file with the following:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# PayPal
NEXT_PUBLIC_PAYPAL_CLIENT_ID=your_paypal_client_id

# API
NEXT_PUBLIC_API_URL=http://localhost:3000

# Portfolio Scraper
INVESTING_COOKIES=your_cookies_json
NODE_ENV=development
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run lint` - Run ESLint
- `npm run type-check` - Check TypeScript types
- `npm test` - Run tests
- `npm run test:watch` - Run tests in watch mode

## API Routes (Backend)

### Portfolio Endpoints

- `GET /api/health` - Health check
- `GET /api/portfolio/latest?limit=100` - Get latest portfolio items
- `GET /api/portfolio/cron/status` - Get cron job status
- `POST /api/portfolio/cron/trigger` - Manually trigger scraper

## Notes

- This project combines frontend and backend into a single Next.js application
- The backend scrapes portfolio data and stores it in Supabase
- The frontend reads from Supabase directly
- API routes handle background jobs and data management
- For deployment, consider using Vercel which has built-in support for Next.js

## License

ISC
