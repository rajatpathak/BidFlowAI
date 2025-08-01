# Clean BMS Deployment Guide

## Project Structure (Cleaned)
```
bid-management-system/
├── client/                   # React frontend (existing)
├── server/                   # Express backend (cleaned)
│   ├── clean-routes.ts      # All API routes in one file
│   ├── simple-index.ts      # Clean server entry point
│   ├── db.ts               # Database configuration
│   ├── auth.ts             # Authentication utilities
│   └── vite.ts             # Vite integration
├── shared/                   # Shared schemas
├── uploads/                  # File uploads directory
├── package.json             # Dependencies and scripts
└── README.md
```

## Deployment Steps

### 1. Environment Variables
```bash
DATABASE_URL=your_postgresql_connection_string
JWT_SECRET=your_jwt_secret_key
OPENAI_API_KEY=your_openai_key (optional)
NODE_ENV=production
PORT=5000
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Database Setup
```bash
npm run db:push
```

### 4. Start Production Server
```bash
# Option 1: Use simple clean server
NODE_ENV=production tsx server/simple-index.ts

# Option 2: Use existing server (if preferred)
npm run dev
```

## Key Features
- ✅ Document Templates with Image Upload
- ✅ Company Settings Management
- ✅ Excel Upload Processing
- ✅ Tender Management
- ✅ User Authentication
- ✅ File Upload and Serving
- ✅ Clean API Structure

## Server Health Check
Visit: `http://your-domain/health`

## Main Issues Resolved
1. ✅ Removed duplicate directories (backend/, frontend/)
2. ✅ Cleaned up scattered server utilities
3. ✅ Fixed image upload functionality
4. ✅ Consolidated API routes
5. ✅ Simple deployment configuration
6. ✅ Working file serving and validation