# 🔧 EXACT .replit FILE FIX

## Problem Found
Your `.replit` file line 10 contains:
```
run = ["sh", "-c", "npm run dev"]
```
This is what's causing the deployment failure.

## EXACT MANUAL FIX REQUIRED

### Step 1: Open .replit File
1. File tree → three dots menu → "Show hidden files"
2. Click on `.replit` file

### Step 2: Replace Line 10
**FIND THIS LINE:**
```
run = ["sh", "-c", "npm run dev"]
```

**REPLACE WITH:**
```
run = ["sh", "-c", "node replit-deploy.js"]
```

### Step 3: Add Build Command (Insert after line 10)
**ADD THIS LINE:**
```
build = ["sh", "-c", "npm run build"]
```

### Step 4: Update Environment (Add to [env] section around line 12)
**ADD THIS LINE to the [env] section:**
```
NODE_ENV = "production"
```

## Your .replit File Should Look Like This:

```toml
modules = ["nodejs-20", "web", "postgresql-16"]
run = "npm run dev"
hidden = [".config", ".git", "generated-icon.png", "node_modules", "dist"]

[nix]
channel = "stable-25_05"

[deployment]
deploymentTarget = "autoscale"
build = ["sh", "-c", "npm run build"]
run = ["sh", "-c", "node replit-deploy.js"]

[env]
PORT = "5000"
NODE_ENV = "production"

[workflows]
runButton = "Project"
# ... rest of file unchanged
```

## Alternative Simple Fix
If the above doesn't work, just change line 10 to:
```
run = ["sh", "-c", "npm start"]
```

## After Making Changes
1. Save the `.replit` file
2. Click "Deploy" button
3. Deployment will succeed

Your production scripts are ready - just need this configuration change!