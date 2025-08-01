# MANUAL .replit FILE CONFIGURATION

## Current Problem
Your `.replit` file contains this problematic configuration:
```toml
[deployment]
deploymentTarget = "autoscale"
run = ["sh", "-c", "npm run dev"]
```

## Required Fix
You must manually edit the `.replit` file to change the deployment configuration.

## Step-by-Step Instructions

### 1. Access the .replit File
- In your Replit workspace file tree (left sidebar)
- Click the three dots menu (⋯) at the top
- Select "Show hidden files"
- Open the `.replit` file

### 2. Replace the Deployment Section
Find this section:
```toml
[deployment]
deploymentTarget = "autoscale"
run = ["sh", "-c", "npm run dev"]
```

Replace it with:
```toml
[deployment]
deploymentTarget = "autoscale"
build = ["sh", "-c", "npm run build"]
run = ["sh", "-c", "node replit-deploy.js"]
```

### 3. Add Environment Configuration
Add this section if not present:
```toml
[env]
NODE_ENV = "production"
PORT = "5000"
```

### 4. Save and Deploy
- Save the `.replit` file
- Click "Deploy" in Replit
- Your deployment will now use production commands

## Alternative Run Commands
If `node replit-deploy.js` doesn't work, try:
- `npm start`
- `node deploy-simple.js`
- `npm run build && npm start`

## Why This is Required
- Replit blocks `npm run dev` for security in production
- Your app needs production build and start commands
- Environment must be set to production mode