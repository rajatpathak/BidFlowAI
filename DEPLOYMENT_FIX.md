# 🚨 URGENT PRODUCTION FIX

## Problem
Your VPS deployment is returning HTML instead of JSON for API calls, causing the error:
```
Error: Unexpected token '<', "<!DOCTYPE "... is not valid JSON
```

## Root Cause
The production server is serving static HTML files before API routes are processed.

## Solution Applied

### 1. Created Production Server (`server/production.js`)
- API routes registered BEFORE static file serving
- Explicit JSON content-type headers for all `/api/*` routes
- Proper error handling with JSON responses

### 2. Updated Deployment Process
Replace your `.github/workflows/bidflowai.yml` with the content from `deployment-fix.yml`

Key changes:
```bash
# In the deploy step, now uses:
pm2 start server/production.js --name BidFlowAI --env production
# Instead of:
pm2 restart BidFlowAI
```

### 3. Manual Fix (If You Can't Wait for GitHub Actions)

SSH into your VPS and run:

```bash
cd /var/www/html/BidFlowAI

# Stop current process
pm2 delete BidFlowAI

# Start with production server
pm2 start server/production.js --name BidFlowAI --env production
pm2 save

# Test API
curl -H "Content-Type: application/json" http://localhost:3000/api/health
```

### 4. Verification

After deployment, test these endpoints:
- `POST /api/auth/login` - Should return JSON with token
- `GET /api/dashboard/stats` - Should return JSON statistics
- `GET /api/tenders` - Should return JSON tender list

All should return proper JSON responses, not HTML.

### 5. Environment Variables

Ensure your VPS has:
- `DATABASE_URL` - Your PostgreSQL connection string
- `NODE_ENV=production`
- `PORT=3000` (or your preferred port)

## Expected Result

After this fix:
✅ API endpoints return JSON (not HTML)
✅ Authentication works properly
✅ Dashboard loads with real data
✅ No more "Unexpected token" errors

The production server now ensures API routes are handled before static file serving, preventing HTML responses for API calls.