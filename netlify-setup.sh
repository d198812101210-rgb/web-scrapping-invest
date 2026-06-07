#!/bin/bash

# Netlify Deployment Setup Script
# This script helps configure your project for Netlify deployment

echo "================================"
echo "Netlify Deployment Setup"
echo "================================"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if netlify.toml exists
if [ -f "netlify.toml" ]; then
    echo -e "${GREEN}✓${NC} netlify.toml found"
else
    echo -e "${RED}✗${NC} netlify.toml not found - create it first"
fi

# Check if .env.production.example exists
if [ -f ".env.production.example" ]; then
    echo -e "${GREEN}✓${NC} .env.production.example found"
else
    echo -e "${RED}✗${NC} .env.production.example not found"
fi

# Check if .env is configured
if [ -f ".env.local" ]; then
    echo -e "${GREEN}✓${NC} .env.local exists"
else
    echo -e "${YELLOW}!${NC} .env.local not found - copy from .env.example"
    cp .env.example .env.local
    echo -e "${GREEN}✓${NC} Created .env.local from .env.example"
fi

echo ""
echo "Checking dependencies..."

# Check Node version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -ge 18 ]; then
    echo -e "${GREEN}✓${NC} Node.js version is $NODE_VERSION (required: 18+)"
else
    echo -e "${RED}✗${NC} Node.js version is $NODE_VERSION (required: 18+)"
fi

# Check if npm packages are installed
if [ -d "node_modules" ]; then
    echo -e "${GREEN}✓${NC} npm packages installed"
else
    echo -e "${YELLOW}!${NC} npm packages not found - running npm install..."
    npm install
fi

echo ""
echo "================================"
echo "Configuration Files:"
echo "================================"
echo ""
echo "✓ netlify.toml - Build and deployment configuration"
echo "✓ .env.production.example - Production environment variables template"
echo "✓ NETLIFY_DEPLOYMENT.md - Complete deployment guide"
echo "✓ DEPLOYMENT_CHECKLIST.md - Pre-deployment checklist"
echo ""

echo "================================"
echo "Next Steps:"
echo "================================"
echo ""
echo "1. Update .env.local with your credentials:"
echo "   - NEXT_PUBLIC_SUPABASE_URL"
echo "   - NEXT_PUBLIC_SUPABASE_ANON_KEY"
echo "   - SUPABASE_SERVICE_ROLE_KEY"
echo "   - NEXT_PUBLIC_PAYPAL_CLIENT_ID"
echo ""

echo "2. Test locally:"
echo "   npm run build"
echo "   npm start"
echo ""

echo "3. Set up GitHub repository:"
echo "   git init"
echo "   git add ."
echo "   git commit -m 'Initial commit'"
echo "   git branch -M main"
echo "   git remote add origin https://github.com/YOUR_USERNAME/next-finance.git"
echo "   git push -u origin main"
echo ""

echo "4. Connect to Netlify:"
echo "   - Go to https://app.netlify.com"
echo "   - Click 'New site from Git'"
echo "   - Select GitHub repository"
echo "   - Configure build settings"
echo "   - Set environment variables"
echo "   - Deploy!"
echo ""

echo -e "${GREEN}Setup complete!${NC}"