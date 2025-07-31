# Production Deployment Guide

## Issue Resolution: "Unexpected token '<', "<!DOCTYPE "... is not valid JSON"

The error occurs because the server is serving HTML instead of JSON for API routes in production. This has been fixed with the following changes:

### Fixed Components:

1. **API Route Middleware** (`server/routes.ts`)
   - Added explicit API route logging and JSON content-type headers
   - All `/api/*` routes now properly set `Content-Type: application/json`

2. **Server Configuration** (`server/index.ts`)
   - Routes are registered BEFORE static file serving
   - Added comprehensive error handling with JSON responses
   - API routes are processed before fallback to SPA routing

3. **Production Build** (`build-for-production.sh`)
   - Proper build process that maintains API/static file separation
   - Outputs client to `dist/public/` and server to `dist/index.js`

### GitHub Actions Deployment

Your current `.github/workflows/bidflowai.yml` should work with these updates:

```bash
# In your VPS, the build process should be:
npm install
npm run build  # Builds both client and server
pm2 restart BidFlowAI
```

### Key API Endpoints (all return JSON):

- `POST /api/auth/login` - Authentication with JWT tokens
- `GET /api/auth/user` - Current user information  
- `GET /api/tenders` - Tender listing with filters
- `GET /api/dashboard/stats` - Dashboard statistics
- `GET /api/dashboard/pipeline` - Pipeline data

### Demo Credentials:
- **Admin**: `admin` / `admin123`
- **Senior Bidder**: `rahul.kumar` / `bidder123`
- **Finance Manager**: `priya.sharma` / `finance123`

### Logs and Debugging:

The server now logs all API requests in the format:
```
🔄 API Request: POST /api/auth/login
```

If you're still getting HTML responses, check:
1. Ensure routes are registered before static file serving
2. Verify the build outputs to `dist/public/` for frontend files
3. Check PM2 is using the correct script path: `dist/index.js`

### Environment Variables:

Make sure your GitHub Actions sets:
- `DATABASE_URL` - PostgreSQL connection string
- `JWT_SECRET` - JWT signing secret (optional, has fallback)
- `NODE_ENV=production`
- `PORT=3000` (or your preferred port)

The system now properly handles API routes in production and should resolve the JSON parsing error.