# Netlify & Puppeteer Integration Guide

## The Problem 🔴

Your project uses **Puppeteer** for web scraping portfolio data. On Netlify:

- **Free Plan**: 26-second timeout limit
- **Pro Plan**: 60-second timeout limit
- **Enterprise**: Custom timeouts

Puppeteer operations typically take **30-90+ seconds**, which will timeout on Netlify.

## Impact on Your Features

### ❌ Affected Features (On Netlify Free)

- `POST /api/portfolio/cron/trigger` - Portfolio scraping (will timeout)
- Scheduled cron jobs - Background portfolio updates (not supported)

### ✅ Working Features

- `GET /api/health` - Health check (< 1 second)
- `GET /api/portfolio/latest` - Read cached data (< 2 seconds)
- All frontend features - Authentication, dashboard, payments

## Solutions

### Solution 1: Use Netlify Pro ✅ Simplest

**Cost**: $19/month

**Pros**:

- 60-second timeout (enough for most scraping)
- Scheduled functions support
- No code changes needed
- Best performance

**Cons**:

- Additional monthly cost

**Steps**:

1. Upgrade to Netlify Pro
2. Update `netlify.toml` function timeout to 60:

```toml
[functions]
timeout = 60
memory = 1024
```

3. Deploy with scheduled functions:

```toml
[[functions]]
name = "api"
schedule = "0 */6 * * *"  # Every 6 hours
```

### Solution 2: External Scraping API ✅ Recommended

**Cost**: Free tier available, paid plans from $29-99/month

**Popular Options**:

- **ScraperAPI** - Most popular, easy integration
- **Bright Data** - Powerful, enterprise-grade
- **Apify** - Great for complex scraping
- **Oxylabs** - High quality proxies

**Pros**:

- Works on free Netlify plan
- Scales easily
- Better reliability
- No browser dependencies on server

**Cons**:

- Additional service to manage
- API costs
- Dependency on third-party service

**Example with ScraperAPI**:

```typescript
// src/lib/scraperService.ts
const SCRAPER_API_URL = "http://api.scraperapi.com";
const SCRAPER_API_KEY = process.env.SCRAPER_API_KEY;

export async function scrapePortfolioData(url: string) {
  const response = await fetch(
    `${SCRAPER_API_URL}?api_key=${SCRAPER_API_KEY}&url=${encodeURIComponent(
      url
    )}`
  );
  return response.text();
}
```

Update `.env.example`:

```env
SCRAPER_API_KEY=your-api-key-here
```

### Solution 3: Separate Backend Server ✅ Enterprise

**Cost**: Depends on hosting choice

**Options**:

- **Heroku** (legacy) - Not recommended
- **Railway** - $5-20/month
- **Render** - $7-25/month
- **AWS EC2** - $10-50/month
- **DigitalOcean** - $6-40/month

**Pros**:

- Complete control
- No time limits
- Can run complex jobs
- Better for heavy scraping

**Cons**:

- More infrastructure to manage
- Additional costs
- More complex deployment

**Architecture**:

```
Frontend (Netlify) → Backend API (Separate Server) → Scraper
```

### Solution 4: Hybrid Approach ✅ Balanced

Combine multiple solutions:

1. **Netlify** - Frontend + lightweight APIs
2. **External Scraper** - Portfolio scraping
3. **Scheduled Job Service** - Cron jobs (EasyCron, AWS EventBridge)

**Recommended Setup**:

```
┌─────────────────────────────────────────┐
│ Frontend (Netlify)                      │
│ - UI Components                         │
│ - Authentication                        │
│ - Dashboard Display                     │
│ - User Settings                         │
└────────────┬────────────────────────────┘
             │
    ┌────────┼────────┐
    │        │        │
    ▼        ▼        ▼
Supabase  ScraperAPI EasyCron
(Database) (Scraping) (Scheduling)
```

## Implementation Steps

### Step 1: Choose Your Solution

Review the options above and choose what works best:

- **Simplest**: Netlify Pro
- **Best Value**: External Scraper + EasyCron
- **Most Control**: Separate Backend

### Step 2: For External Scraper (Most Recommended)

1. **Sign up** for ScraperAPI, Bright Data, or Apify
2. **Get API key** from their dashboard
3. **Add environment variable** to `.env.example`:

```env
SCRAPER_API_KEY=your-key-here
```

4. **Update scraper** to use external API:

```typescript
// src/api/services/scraperService.ts
export async function scrapeWithExternalAPI(
  url: string,
  options: ScrapeOptions
) {
  const scraperKey = process.env.SCRAPER_API_KEY;

  if (!scraperKey) {
    throw new Error("SCRAPER_API_KEY not configured");
  }

  try {
    const response = await fetch("https://api.scraperapi.com/scrape", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        apikey: scraperKey,
        url: url,
        render: true, // For JS-heavy sites
      }),
    });

    return response.text();
  } catch (error) {
    console.error("External scraper error:", error);
    throw error;
  }
}
```

5. **Update portfolio scraper** to call external API instead of Puppeteer
6. **Add to Netlify environment** variables

### Step 3: For Scheduled Tasks (EasyCron)

1. **Sign up** at [easycron.com](https://www.easycron.com/)
2. **Create cron job** pointing to your Netlify endpoint
3. **Set schedule** (e.g., every 6 hours)
4. **Add authentication token** to `.env`
5. **Update trigger endpoint** to verify request origin

Example cron setup:

```
URL: https://your-site.netlify.app/api/portfolio/cron/trigger
Method: POST
Headers: Authorization: Bearer YOUR_TOKEN
Schedule: 0 */6 * * * (every 6 hours)
```

### Step 4: For Netlify Pro (If Chosen)

```toml
# netlify.toml
[build]
  command = "npm run build"
  functions = "netlify/functions"
  publish = ".next"

[build.environment]
  NODE_VERSION = "20"

[[functions]]
  name = "api"
  timeout = 60

[[functions]]
  name = "cron-trigger"
  schedule = "0 */6 * * *"
```

## Recommended Configuration

For your use case, we recommend:

1. **Frontend**: Deploy to Netlify (Free)
2. **Scraping**: Use ScraperAPI or Bright Data ($29-99/month)
3. **Scheduling**: Use EasyCron (Free for basic use)
4. **Database**: Supabase (generous free tier)

**Total Cost**: $29-99/month (or less with free tiers)

**Benefits**:

- ✅ Works on Netlify free
- ✅ Scalable and reliable
- ✅ No complex backend to manage
- ✅ Easy to monitor
- ✅ No timeout issues

## Testing Before Production

### Test Locally

```bash
# Make sure scraping works
npm run build
npm start
# Visit http://localhost:3000/api/portfolio/cron/trigger
```

### Test on Netlify

1. Deploy to Netlify with chosen solution
2. Test API endpoints:
   - `GET /api/health` - Should return 200
   - `GET /api/portfolio/latest` - Should return data
3. Monitor logs in Netlify dashboard
4. If using external scraper, verify API calls in logs

## Monitoring & Debugging

### Check Netlify Logs

```bash
# Install Netlify CLI
npm install -g netlify-cli

# View logs
netlify logs functions --tail
```

### Monitor External Services

- **ScraperAPI**: Dashboard shows request history
- **EasyCron**: Email notifications on failure
- **Supabase**: Built-in monitoring

### Set Up Alerts

1. Go to Netlify Site Settings → Notifications
2. Enable email alerts for deploy failures
3. Enable error tracking (e.g., Sentry)

## Troubleshooting

### Scraping still timing out?

- Solution: Use Netlify Pro or external scraper
- Check if external API is configured correctly
- Verify API key in environment variables

### EasyCron not triggering?

- Check cron URL is correct
- Verify authorization token matches
- Check Netlify function logs
- Test manually via browser

### High costs?

- Compare scraper prices (ScraperAPI vs Bright Data)
- Use free tiers for low volume
- Consider Netlify Pro ($19) instead for simpler setup

## FAQ

**Q: Can I use Puppeteer on Netlify?**
A: Not for long-running tasks. Puppeteer works locally but not for 30+ second operations on Netlify free tier.

**Q: What's the cheapest solution?**
A: Free Netlify + ScraperAPI free tier + EasyCron free tier = Mostly free (small scraping costs).

**Q: Can I disable scraping?**
A: Yes, you can disable the cron trigger endpoint and only use cached data from Supabase.

**Q: Will this affect my app?**
A: No impact on user experience. Portfolio data is fetched from cache, so scraping happens in background.

**Q: How do I test the solution?**
A: Deploy to a staging environment first and test all features before going to production.

---

**Next Steps**: Choose a solution above and follow the implementation steps.
