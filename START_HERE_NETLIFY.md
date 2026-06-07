# 🚀 START HERE: Deploy to Netlify

Welcome! Your Next.js Finance app is ready for Netlify deployment. This guide will walk you through everything.

---

## ⏱️ Quick Timeline

- **Now**: Read this guide (2 min)
- **Step 1**: Fix TypeScript errors (5-10 min)
- **Step 2**: Test locally (2 min)
- **Step 3**: Deploy to Netlify (1 min)
- **Step 4**: Handle Puppeteer timeout (5 min or skip for now)

**Total Time**: ~15-25 minutes

---

## 🎯 What You'll Get

✅ Your app live on Netlify's CDN  
✅ Automatic deploys on git push  
✅ Free HTTPS & custom domain support  
✅ Performance monitoring & analytics

---

## 📋 Prerequisites Check

Before you start, make sure you have:

- [ ] GitHub account (for code hosting)
- [ ] Netlify account (free: https://netlify.com)
- [ ] Supabase credentials (URL + keys)
- [ ] PayPal API credentials (Client ID)
- [ ] Node.js 18+ installed locally

---

## ⚠️ Current Status

### What's Ready ✅

- `netlify.toml` - Build configuration (created)
- `.env.production.example` - Environment template (created)
- `next.config.js` - Optimized for Netlify (updated)
- Security headers configured

### What Needs Fixing ❌

- **6 TypeScript errors** must be fixed before deployment
- Puppeteer timeout issue (can be addressed later)

---

## 🔥 Step 1: Fix TypeScript Errors (REQUIRED)

Your project won't build on Netlify until these are fixed.

### Check Errors

```bash
npm run type-check
```

### Errors to Fix

**1. react-router-dom not found (2 files)**

```
File: src/components/dashboard/NavBar.tsx
File: src/components/dashboard/SimpleNavBar.tsx
```

**Action**: Remove React Router imports. Next.js uses file-based routing.

```typescript
// ❌ DELETE THIS
import { useNavigate } from "react-router-dom";

// ✅ USE THIS INSTEAD
import { useRouter } from "next/navigation";
```

**2. Missing '@/pages/Dashboard' module (2 files)**

```
File: src/components/dashboard/ChartPanel.tsx
File: src/components/dashboard/Tabs.tsx
```

**Action**: Either create the module or fix the import path.

**3. PayPal type error**

```
File: src/lib/paypal.ts:4
```

**Action**: Add type declaration:

```typescript
declare global {
  interface Window {
    paypal?: any;
  }
}
```

**4. PayPalButton props error**

```
File: src/app/(dashboard)/subscription/page.tsx:475
```

**Action**: Verify the component accepts all props being passed.

### Verify Fix

```bash
npm run type-check
# Should show: "0 errors"
```

---

## ✅ Step 2: Test Locally

Verify everything works before deploying:

```bash
# Build for production
npm run build

# Should complete without errors ✅

# Start production server
npm start

# Visit http://localhost:3000
```

**Test these features:**

- ✅ Page loads
- ✅ Sign up/login works
- ✅ Dashboard loads
- ✅ API health check: `/api/health`

---

## 🚀 Step 3: Deploy to Netlify (1 minute)

### Option A: Using Netlify UI (Easiest)

1. **Push code to GitHub**

```bash
git add .
git commit -m "Fix TypeScript errors and prepare for Netlify"
git push origin main
```

2. **Go to https://app.netlify.com**

3. **Click "New site from Git"**

   - Select GitHub
   - Authorize Netlify
   - Choose `next-finance` repository

4. **Configure build (auto-filled)**

   - Build command: `npm run build`
   - Publish directory: `.next`
   - Node version: 20
   - ✅ Click "Deploy site"

5. **Wait for build** (3-5 minutes)
   - Watch the deploy log
   - Should show "Build successful"
   - You'll get a live URL like `https://your-site.netlify.app`

### Option B: Using Netlify CLI

```bash
npm install -g netlify-cli
netlify login
netlify init
netlify deploy
```

---

## ⚙️ Step 4: Set Environment Variables (1 minute)

After deploy starts:

1. **Go to Netlify dashboard**
2. **Site Settings** → **Build & Deploy** → **Environment**
3. **Add variables** (don't use local .env file!):

```env
# Supabase (REQUIRED)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here

# PayPal (REQUIRED)
NEXT_PUBLIC_PAYPAL_CLIENT_ID=your-paypal-client-id-here

# API URL (IMPORTANT - Update this!)
NEXT_PUBLIC_API_URL=https://your-site-name.netlify.app

# Environment
NODE_ENV=production
```

⚠️ **IMPORTANT**: Replace `your-site-name` with your actual Netlify URL!

4. **Trigger deploy**: Go to **Deploys** → **Trigger deploy** → **Deploy site**

✅ **Your app is live!**

---

## 🧪 Step 5: Test After Deployment (2 minutes)

1. **Visit your Netlify URL** (e.g., `https://my-app.netlify.app`)
2. **Check these:**
   - ✅ Page loads without errors
   - ✅ No 404 errors
   - ✅ Sign up/login works
   - ✅ Dashboard displays
   - ✅ Styling looks correct
   - ✅ Images load
3. **Test API**: Visit `/api/health`
   - Should see: `{"status":"OK", ...}`

### Check Logs

If something fails:

1. Go to **Deploys** tab → click latest deploy
2. Click **View deploy log** to see build output
3. Look for "ERROR" or red text
4. See **Troubleshooting** section below

---

## ⏰ Step 6: Fix Puppeteer Timeout (Optional Now, Required Later)

Your app uses Puppeteer for portfolio scraping. On Netlify:

- ❌ Free plan: Will timeout after 26 seconds
- ✅ Pro plan: Works (60 seconds)
- ✅ External API: Recommended solution

**For now**: You can skip this. The app works without scraping.

**Later**: See `NETLIFY_PUPPETEER_GUIDE.md` for solutions:

1. Upgrade to Netlify Pro ($19/month) - Simplest
2. Use external scraper API - Recommended
3. Run scraper separately - Advanced

---

## 🆘 Troubleshooting

### Site won't load

```
Check:
1. Visit Netlify dashboard → Deploys → View deploy log
2. Look for red "ERROR" messages
3. Environment variables set correctly
4. Try: npm run build locally (must succeed)
```

### "Cannot find module" errors

```
Solution:
1. npm install locally
2. npm run type-check (verify no errors)
3. npm run build (verify builds)
4. git push (Netlify rebuilds automatically)
```

### API returns 404

```
Check:
1. API routes are in /src/app/api/
2. Build completed successfully
3. Check Netlify function logs
```

### Puppeteer timeout on `/api/portfolio/cron/trigger`

```
Expected on free Netlify. See:
NETLIFY_PUPPETEER_GUIDE.md for 3 solutions
```

---

## 📚 Documentation

All guides have been created for you:

### Quick Reference

- **This file** - START_HERE_NETLIFY.md (you are here)
- **NETLIFY_QUICK_START.md** - 5-minute overview
- **DEPLOYMENT_CHECKLIST.md** - Full verification checklist

### Detailed Guides

- **NETLIFY_DEPLOYMENT.md** - Complete guide with all options
- **NETLIFY_PUPPETEER_GUIDE.md** - Solutions for scraping timeout
- **NETLIFY_SETUP_SUMMARY.md** - What's been configured

---

## ✨ Success Indicators

Your deployment is successful when:
✅ Netlify shows "Published"  
✅ Site loads at Netlify URL  
✅ No 404 errors  
✅ Authentication works  
✅ Dashboard displays  
✅ `/api/health` returns 200

---

## 🎓 Next Steps After Deployment

1. **Monitor for 24 hours** for any issues
2. **Test all features** thoroughly
3. **Set up custom domain** (optional)
4. **Enable Netlify analytics** (optional)
5. **Consider Netlify Pro** if using Puppeteer scraping
6. **Set up error tracking** (e.g., Sentry)

---

## 🆘 Common Questions

**Q: Do I have to deploy to Netlify?**  
A: No, but it's recommended. You can also use Vercel or other platforms.

**Q: Will my app cost money?**  
A: Netlify free tier is generous. You only pay if you need Pro features ($19/month).

**Q: Can I deploy without fixing TypeScript errors?**  
A: No, Netlify's build will fail.

**Q: What about my local development?**  
A: Continues as normal. Just keep running `npm run dev`.

**Q: Can I update my app after deploying?**  
A: Yes! Just `git push origin main` and Netlify rebuilds automatically.

**Q: How do I roll back to a previous version?**  
A: Go to **Deploys** tab and click **Publish deploy** on an older version.

---

## 📞 Need Help?

1. **Check Netlify logs**: Deploys → View deploy log
2. **Check Documentation**: See files listed above
3. **TypeScript errors**: See Step 1 above
4. **Netlify support**: https://support.netlify.com/
5. **Next.js docs**: https://nextjs.org/docs/deployment/

---

## 🏁 You're Ready!

Everything is configured. Now just follow the steps above and your app will be live in 15-25 minutes!

**Let's go! 🚀**

```bash
# Step 1: Fix TypeScript errors
npm run type-check

# Step 2: Test locally
npm run build && npm start

# Step 3: Deploy to Netlify
git add .
git commit -m "Ready for Netlify deployment"
git push origin main

# Then follow the Netlify UI deployment steps above ⬆️
```

---

**Questions about specific steps?** See the detailed guides:

- NETLIFY_DEPLOYMENT.md - Full instructions
- NETLIFY_QUICK_START.md - 5-minute summary
- NETLIFY_PUPPETEER_GUIDE.md - Scraping timeout solutions
