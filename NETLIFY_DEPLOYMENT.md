# Netlify Deployment Guide

This guide will help you deploy the Next.js Finance App to Netlify.

## Prerequisites

1. **Netlify Account**: Sign up at [netlify.com](https://netlify.com)
2. **GitHub Account**: Push your code to GitHub
3. **Environment Variables Ready**: Gather all necessary credentials

## Step 1: Push Code to GitHub

```bash
git init
git add .
git commit -m "Initial commit for Netlify deployment"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/next-finance.git
git push -u origin main
```

## Step 2: Connect to Netlify

### Option A: Use Netlify UI (Recommended)

1. Go to [app.netlify.com](https://app.netlify.com)
2. Click **"New site from Git"**
3. Choose **GitHub**
4. Authorize Netlify to access your repositories
5. Select the `next-finance` repository
6. Configure build settings:
   - **Build command**: `npm run build`
   - **Publish directory**: `.next`
   - **Node version**: 20
7. Click **"Deploy site"**

### Option B: Use Netlify CLI

```bash
npm install -g netlify-cli

# Login to Netlify
netlify login

# Initialize Netlify in your project
netlify init

# Deploy
netlify deploy
```

## Step 3: Set Environment Variables

### For Production Deployment:

1. Go to your Netlify site dashboard
2. Navigate to **Site Settings → Environment**
3. Click **"Add a variable"** and set the following:

```env
# Supabase Configuration (REQUIRED)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here

# PayPal Configuration (REQUIRED for subscription features)
NEXT_PUBLIC_PAYPAL_CLIENT_ID=your-paypal-client-id-here

# API Configuration (IMPORTANT)
NEXT_PUBLIC_API_URL=https://your-site-name.netlify.app

# Portfolio Scraper (Optional - required for scraping features)
INVESTING_COOKIES=your-cookies-json-here

# Environment
NODE_ENV=production
```

### ⚠️ Critical: Update NEXT_PUBLIC_API_URL

Replace `https://your-site-name.netlify.app` with your actual Netlify domain.

## Step 4: Configure Build Settings (Optional)

If needed, go to **Site Settings → Build & Deploy → Build Settings**:

- **Build command**: `npm run build`
- **Publish directory**: `.next`
- **Functions directory**: `netlify/functions`

## Step 5: Deploy

After setting environment variables, trigger a new deploy:

1. Go to **Deploys** tab
2. Click **"Trigger deploy → Deploy site"**

Or push a new commit:

```bash
git add .
git commit -m "Deployment configuration"
git push origin main
```

## Important Considerations

### 🔴 Puppeteer & Long-Running Tasks

**Problem**: Puppeteer scraping may timeout (Netlify has a 26-second function timeout)

**Solutions**:

1. **Netlify Pro** ($19/month): Increases timeout to 60 seconds
2. **External Service**: Use external API for scraping (e.g., ScraperAPI, Bright Data)
3. **Scheduled Functions**: Use Netlify Pro with scheduled functions
4. **Alternative**: Disable scraping on Netlify and run it locally/separately

### 🔴 Node-Cron Jobs

**Problem**: Cron jobs won't work as expected on Netlify (serverless functions)

**Solutions**:

1. **Use External Service**: EasyCron, AWS EventBridge, or similar
2. **Netlify Scheduled Functions** (Pro): Use `schedule` in function config
3. **Manual Triggers**: Keep manual trigger endpoint for testing

### ✅ What Works Well on Netlify

- ✅ Frontend rendering
- ✅ API routes (up to 26 seconds)
- ✅ Supabase integration
- ✅ PayPal integration
- ✅ Authentication flows
- ✅ Database queries

## Troubleshooting

### Deploy fails with "npm install" error

**Solution**:

- Go to **Site Settings → Build & Deploy → Build Settings**
- Increase build timeout to 30-60 minutes

### "Module not found" errors

**Solution**:

```bash
# Clear local cache
rm -rf node_modules .next
npm install

# Rebuild
npm run build

# Commit and push
git add .
git commit -m "Fix dependencies"
git push
```

### Environment variables not loading

**Solution**:

1. Verify variables are set in Netlify UI
2. Make sure variable names start with `NEXT_PUBLIC_` for client-side
3. Trigger a new deploy after adding variables

### Puppeteer not working

**Solution**:

```bash
# Add to netlify.toml [functions] section
memory = 1024
timeout = 26

# Or upgrade to Netlify Pro for longer timeouts
```

### API routes returning 404

**Solution**:

- Check that API routes are in `/src/app/api/`
- Ensure `.next` directory is published correctly
- Verify build was successful

## Monitoring & Logs

1. Go to **Deploys** tab
2. Click on your latest deploy
3. View **Deploy Log** for build output
4. View **Function Log** for API errors
5. Use **Analytics** to monitor site performance

## Performance Tips

1. **Enable Caching**: Netlify CDN caches static files automatically
2. **Use Image Optimization**: Next.js Image component handles this
3. **Monitor Function Duration**: Keep API routes under 10 seconds when possible
4. **Use Supabase Connection Pooling**: For database performance

## Next Steps

1. ✅ Deploy to Netlify
2. 🔄 Test all features:
   - User authentication
   - Portfolio features
   - Payment integration
   - API endpoints
3. 🔄 Monitor logs for errors
4. 📊 Set up Netlify Analytics
5. 🚀 Consider upgrading to Netlify Pro for:
   - Longer function timeouts (needed for Puppeteer)
   - Scheduled functions (for cron jobs)
   - Better performance

## Support

- **Netlify Docs**: https://docs.netlify.com/
- **Next.js Docs**: https://nextjs.org/docs/deployment/
- **GitHub Issues**: Check your repository's issue tracker

---

**Last Updated**: 2024
**Next.js Version**: 15.1.0
**Node Version**: 18+
