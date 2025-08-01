# Replit Deployment Fix Instructions

## Problem
Deployment failed with error: "Run command contains 'dev' which is blocked for security reasons"

## Solution
Your production scripts are ready! You need to manually update the deployment settings in Replit.

## Step 1: Update Deployment Configuration in Replit

**In the Replit interface:**

1. **Go to the "Deploy" tab** in your Replit workspace
2. **Find the "Run Command" field** 
3. **Change from**: `npm run dev`
4. **Change to one of these production commands**:

### Option A: Full-Featured Production (Recommended)
```bash
node replit-deployment.cjs
```

### Option B: Alternative Production Scripts
```bash
node start-production.js
```
or
```bash
node production-entry.js
```

### Option C: Direct Production Start
```bash
npm start
```

## Step 2: Configure Build Command (if available)

If there's a "Build Command" field:
```bash
npm run build
```

## Step 3: Set Environment Variables

In Replit Secrets/Environment Variables:
- `NODE_ENV` = `production`
- `PORT` = `5000` (or leave empty for auto-assignment)

## Verification

After deployment, your application will be available at:
- Main app: `https://your-replit-url.replit.app`
- Health check: `https://your-replit-url.replit.app/api/health`

## Available Production Scripts

Your project has these production-ready entry points:

1. **`replit-deployment.cjs`** - Full-featured CommonJS with health checks (RECOMMENDED)
2. **`start-production.js`** - Complete deployment with enhanced logging  
3. **`production-entry.js`** - Simple ES module production starter
4. **`replit-deployment.js`** - ES module version with health checks
5. **`npm start`** - Direct start after manual build

## Production Features Enabled

✅ Production environment variables  
✅ Optimized build process (816KB frontend, 140KB backend)  
✅ Security headers and CORS configuration  
✅ Health check endpoint at `/api/health`  
✅ Graceful shutdown handling  
✅ Directory creation for uploads and logs  
✅ Error handling and logging  

## Troubleshooting

If deployment still fails:

1. **Try the simplest option first**: `npm start`
2. **Check the deployment logs** for specific errors
3. **Verify build process** works by running `npm run build` in Shell
4. **Contact Replit support** if the interface doesn't allow command changes

## Next Steps

Once deployed successfully:
1. Test the application functionality
2. Verify all routes work correctly
3. Check the health endpoint responds
4. Monitor performance and logs

Your BMS application is production-ready and optimized for Replit deployment!