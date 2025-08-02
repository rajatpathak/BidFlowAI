# BMS Server Port Configuration Guide

## Current Issue Resolution

You're getting "Unexpected token '<', "<!DOCTYPE "... is not valid JSON" because you're accessing the wrong port.

### Correct Access URLs:
- **Main Application**: `http://147.93.28.195:5000` ← **Use this URL**
- **API Health Check**: `http://147.93.28.195:5000/api/health`
- **API Base**: `http://147.93.28.195:5000/api/`

### Wrong URLs (Don't use):
- ❌ `http://147.93.28.195:3000` - This port is not used by BMS

## Why This Happens:
1. BMS runs on a single Express server (port 5000)
2. This server handles both frontend and API routes
3. When you access port 3000, you're hitting a different service
4. That service returns HTML, not JSON, causing the parsing error

## Production Server Commands:
```bash
# Start the application (runs on port 5000)
npm start

# Check if running
curl http://localhost:5000/api/health

# View logs
pm2 logs bms-app  # if using PM2
```

## Environment Variables for Production:
```bash
export NODE_ENV=production
export PORT=5000
export DATABASE_URL="your_postgres_connection_string"
```

## Firewall Configuration:
Make sure port 5000 is open on your server:
```bash
sudo ufw allow 5000
```

## Access Your Application:
Open: **http://147.93.28.195:5000**

Login with:
- Admin: admin / admin123
- Manager: manager / manager123
- Bidder: bidder / bidder123