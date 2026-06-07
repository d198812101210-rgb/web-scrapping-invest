# Quick Start: Deploy to Netlify in 5 Minutes

## TL;DR - The Fastest Path

### Step 1: Prepare (2 minutes)

```bash
# Make sure everything builds locally
npm run build
npm start  # Test locally works
```

### Step 2: Push to GitHub (1 minute)

```bash
git push origin main
# If not initialized:
# git init && git add . && git commit -m "Deploy to Netlify" && git remote add origin YOUR_REPO && git push -u origin main
```

### Step 3: Connect Netlify (1 minute)

1. Go to [app.netlify.com](https://app.netlify.com)
2. Click **"New site from Git"** → Select **GitHub** → Choose `next-finance`
3. Build settings (auto-filled):
   - Build command: `npm run build`
   - Publish directory: `.next`
4. Click **"Deploy site"**

### Step 4: Set Environment Variables (1 minute)

After deployment starts, go to **Site Settings** → **Build & Deploy** → **Environment**:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
NEXT_PUBLIC_PAYPAL_CLIENT_ID=your-paypal-key
NEXT_PUBLIC_API_URL=https://your-site-name.netlify.app
NODE_ENV=production
```

🎉 **Done! Your site is deployed!**

---

## ⚠️ Important: Puppeteer Timeout Issue

Your app uses **Puppeteer** for portfolio scraping. On Netlify:

- ❌ Free plan: Will timeout (26 second limit)
- ✅ Pro plan: Should work (60 second limit)
- ✅ Or use external scraper service

**See `NETLIFY_PUPPETEER_GUIDE.md` for solutions** (takes 5-10 minutes to set up).

---

## Testing After Deployment

1. **Visit your site**: Click the Netlify URL
2. **Test features**:

   - ✅ Page loads
   - ✅ Sign up/login works
   - ✅ Dashboard displays
   - ✅ API health check: Visit `/api/health`

3. **Check logs**:
   - Go to **Deploys** tab → Click latest → **View deploy log**
   - Look for errors

---

## What if It Fails?

### Error: "Module not found"

```bash
rm -rf node_modules .next package-lock.json
npm install
git add .
git commit -m "Fix dependencies"
git push
```

### Error: "Build timeout"

Go to Netlify **Settings** → **Build & Deploy** → Increase **Timeout** to 60 minutes

### Error: "Environment variables not loaded"

1. Verify variables are set in Netlify UI (not local `.env`)
2. Trigger new deploy: **Deploys** → **Trigger deploy**

### Error: "API returns 404"

Check that API routes are in `/src/app/api/` and rebuild was successful.

---

## Detailed Guides

- **Full Deployment Guide**: `NETLIFY_DEPLOYMENT.md`
- **Pre-Deployment Checklist**: `DEPLOYMENT_CHECKLIST.md`
- **Puppeteer Solutions**: `NETLIFY_PUPPETEER_GUIDE.md`
- **Troubleshooting**: See section below

---

## Troubleshooting

### Site won't load

```
1. Check Netlify logs for build errors
2. Verify NODE_ENV=production is set
3. Check environment variables are correct
4. Try manual build: npm run build locally
```

### "Cannot find module" errors

```
1. npm install locally
2. npm run build locally (must succeed)
3. Commit and push: git push origin main
4. Netlify will rebuild automatically
```

### API calls failing (500 errors)

```
1. Check Netlify function logs
2. Verify SUPABASE_SERVICE_ROLE_KEY is set
3. Test API locally: npm start → visit /api/health
4. Check Supabase connection settings
```

### Puppeteer/Scraping timeout

```
See NETLIFY_PUPPETEER_GUIDE.md for solutions:
- Option 1: Upgrade to Netlify Pro ($19/month)
- Option 2: Use external scraper API (recommended)
- Option 3: Run scraper separately
```

---

## Performance Tips

1. **Monitor build time**: Under 15 minutes is healthy
2. **Monitor function duration**: Keep APIs under 10 seconds
3. **Use CDN caching**: Netlify handles this automatically
4. **Monitor uptime**: Check Netlify analytics

---

## Next Steps After Deployment

1. ✅ Site deployed and working
2. 🔧 Fix Puppeteer timeout (if using scraping)
3. 🔐 Set up custom domain (optional)
4. 📊 Enable Netlify analytics
5. 🚀 Set up CI/CD for auto-deploy on git push

---

## Useful Links

- **Netlify Docs**: https://docs.netlify.com/
- **Next.js Deployment**: https://nextjs.org/docs/deployment/
- **Supabase Docs**: https://supabase.com/docs
- **PayPal Integration**: https://developer.paypal.com/

---

**Questions?** See the detailed guides or check Netlify logs for specific errors.
