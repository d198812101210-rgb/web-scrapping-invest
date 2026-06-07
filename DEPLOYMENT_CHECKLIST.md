# Netlify Deployment Checklist

Complete this checklist before deploying to Netlify.

## Pre-Deployment

- [ ] All code committed to git
- [ ] No console.log() or debug code in production
- [ ] No hardcoded API URLs (should use env vars)
- [ ] No sensitive data in code or .env.example
- [ ] All dependencies installed locally: `npm install`
- [ ] Project builds successfully locally: `npm run build`
- [ ] No TypeScript errors: `npm run type-check`
- [ ] ESLint passes: `npm run lint`

## Environment Setup

- [ ] Created Netlify account
- [ ] Connected GitHub repository to Netlify
- [ ] Created `.env.production.local` from `.env.production.example`
- [ ] Set all required Netlify environment variables:
  - [ ] `NEXT_PUBLIC_SUPABASE_URL`
  - [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - [ ] `SUPABASE_SERVICE_ROLE_KEY`
  - [ ] `NEXT_PUBLIC_PAYPAL_CLIENT_ID`
  - [ ] `NEXT_PUBLIC_API_URL` (Netlify domain)
  - [ ] `NODE_ENV=production`

## Configuration Files

- [ ] `netlify.toml` exists in project root
- [ ] `next.config.js` has Netlify optimizations
- [ ] `.gitignore` includes sensitive files (`.env.local`, `node_modules`, `.next`)
- [ ] `tsconfig.json` is valid
- [ ] `package.json` has correct build scripts

## Feature Testing (Local)

- [ ] Landing page loads without errors
- [ ] Authentication flow works:
  - [ ] Sign up
  - [ ] Sign in
  - [ ] Sign out
  - [ ] Password reset
- [ ] Dashboard loads and displays data
- [ ] API endpoints respond:
  - [ ] `GET /api/health`
  - [ ] `GET /api/portfolio/latest`
- [ ] Supabase connection works
- [ ] PayPal integration works (test mode)

## API Routes Check

- [ ] Short-running endpoints (< 10s):
  - [ ] `/api/health`
  - [ ] `/api/portfolio/latest`
- [ ] Medium-running endpoints (10-26s):
  - [ ] Portfolio cron endpoints - ⚠️ May timeout on Netlify free
- [ ] Long-running endpoints (> 26s):
  - [ ] Scraping functions - ❌ Requires Netlify Pro or alternative

## Deployment

- [ ] Initial deploy completed
- [ ] Deploy log shows no errors
- [ ] Site is accessible at Netlify domain
- [ ] Environment variables properly loaded

## Post-Deployment Verification

- [ ] ✅ Frontend renders correctly
- [ ] ✅ Landing page loads
- [ ] ✅ All pages load without 404
- [ ] ✅ Authentication works
  - [ ] Can sign up
  - [ ] Can sign in
  - [ ] Can sign out
- [ ] ✅ Dashboard displays correctly
- [ ] ✅ API endpoints respond:
  - [ ] `GET /api/health` returns 200
  - [ ] `GET /api/portfolio/latest` works
- [ ] ✅ No console errors in browser DevTools
- [ ] ✅ No error logs in Netlify Function logs
- [ ] ✅ Images load correctly
- [ ] ✅ Styling/CSS loads correctly
- [ ] ✅ Responsive design works on mobile

## Monitoring & Analytics

- [ ] Set up Netlify Analytics
- [ ] Set up error tracking (e.g., Sentry)
- [ ] Monitor Netlify logs for errors
- [ ] Test error pages:
  - [ ] 404 page works
  - [ ] 500 page works

## Performance

- [ ] Lighthouse score: Green (> 90)
- [ ] Core Web Vitals acceptable
- [ ] Images optimized
- [ ] No unused dependencies

## Security

- [ ] HTTPS enabled (automatic on Netlify)
- [ ] Security headers set in `netlify.toml`
- [ ] No API keys exposed in frontend code
- [ ] CORS configured correctly
- [ ] Environment variables not logged

## Post-Deployment Tasks

- [ ] Update DNS if using custom domain
- [ ] Set up redirects from old domain if applicable
- [ ] Monitor for 24 hours for issues
- [ ] Get feedback from users
- [ ] Plan for Netlify Pro upgrade if needed (for Puppeteer/Cron)

## Known Limitations on Netlify

⚠️ **These features may not work without Netlify Pro:**

- [ ] Puppeteer scraping (needs > 26s timeout)
- [ ] Node-Cron background jobs (needs scheduled functions)
- [ ] Long-running API requests

**Solutions:**

- Use external scraping service (ScraperAPI, Bright Data)
- Use external cron service (EasyCron, AWS EventBridge)
- Upgrade to Netlify Pro

## Rollback Plan

If deployment fails or has issues:

1. Go to Netlify Deploy tab
2. Click "Publish deploy" on previous successful version
3. Or revert git commit and push to trigger new deploy
4. Check logs for specific error

---

**Deployment Date**: **\*\***\_\_\_**\*\***
**Deployed By**: **\*\***\_\_\_**\*\***
**Notes**:

---
