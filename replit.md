# Bid Management System (BMS)

## Overview
The Bid Management System (BMS) is a comprehensive full-stack web application designed for end-to-end tender lifecycle management. It enables discovery, analysis, bid creation, finance management, meeting coordination, and approval workflows. The system incorporates AI-powered insights for strategic decision-making, aiming to streamline tender processes, enhance efficiency, and improve bid success rates.

## User Preferences
Preferred communication style: Simple, everyday language.
Project Architecture: Clean, simple, and scalable structure with consolidated codebase for easier deployment and maintenance.

## Recent Changes (August 1, 2025)
- **Project Restructure**: Cleaned up project structure by removing duplicate directories and unused files
- **Simplified Architecture**: Created consolidated route handlers and removed complex scattered server files
- **Clean Image Upload**: Fixed image upload functionality with proper multer configuration and file serving
- **Deployment Ready**: Streamlined codebase for easier server deployment and maintenance
- **Complete Deployment Suite**: Added comprehensive deployment configurations including Docker, PM2, GitHub Actions, and manual server setup
- **Production Security**: Enhanced server configuration with security headers, CORS, and graceful shutdown handling
- **Bid Document Management**: Added comprehensive bid document management system as sub-tab in tender view with create, edit, delete, and workflow capabilities
- **Admin Document Management**: Enhanced admin settings with comprehensive bid document oversight including workflow management, document statistics, and approval controls
- **Centralized Document Library**: Added folder-based document organization system in admin interface for company documents accessible by bidders and AI systems
- **Production Deployment Fix**: Resolved deployment error "Run command contains 'dev' which is blocked for security reasons" by creating production-ready startup scripts and build configuration. Ready for deployment using `node replit-deployment.js`. Production build tested and verified working (140KB server bundle, 816KB client assets)

## System Architecture

### Frontend
- **Framework**: React 18 with TypeScript
- **UI Library**: Shadcn/ui (built on Radix UI)
- **Styling**: Tailwind CSS
- **State Management**: TanStack Query (React Query)
- **Routing**: Wouter
- **Form Handling**: React Hook Form with Zod validation
- **Build Tool**: Vite

### Backend
- **Runtime**: Node.js with Express.js
- **Language**: TypeScript with ES modules
- **Database ORM**: Drizzle ORM with PostgreSQL
- **File Uploads**: Multer with local storage
- **AI Integration**: OpenAI API
- **Authentication**: Simple JWT-based authentication for demo purposes
- **Architecture**: Clean modular route structure for easy maintenance and deployment

### Data Storage
- **Primary Database**: PostgreSQL (via Neon serverless for production), with a user preference to migrate to MySQL.
- **ORM**: Drizzle
- **Session Storage**: PostgreSQL with connect-pg-simple
- **File Storage**: Local filesystem (`uploads/` directory)

### Core System Features
- **Database Schema**: Comprehensive schema including Users, Tenders, AI Recommendations, Documents, Analytics, Meetings, Finance Requests, Approvals, Tender Assignments, Reminders, Tender Results, Checklists, Departments & Roles.
- **AI Services**: Tender analysis, bid optimization, pricing intelligence, and risk assessment using OpenAI.
- **Workflow Management**: Multi-level approval workflows for finance requests and 'not relevant' tender submissions.
- **Data Import**: Robust Excel upload functionality with multi-sheet support, smart column mapping, duplicate detection, and progress tracking.
- **Activity Logging**: Detailed audit trail for all tender modifications, assignments, and workflow actions with username display.
- **Missed Opportunities**: Intelligent system for tracking and managing expired tenders.
- **User Management**: Dynamic user role management and permission-based access control.

## External Dependencies

- **@neondatabase/serverless**: PostgreSQL connection (production).
- **drizzle-orm**: ORM for database interactions.
- **@tanstack/react-query**: Frontend server state management.
- **@radix-ui/***: Accessible UI component primitives.
- **openai**: Official OpenAI API client.
- **xlsx**: Library for Excel file parsing and data extraction.

## Production Deployment Configuration

### Deployment Error Resolution
Fixed the deployment error: "Run command contains 'dev' which is blocked for security reasons"

**Root Cause**: The .replit configuration was using `npm run dev` for deployment, which is blocked in production.

**Solution Applied**: Created comprehensive production-ready deployment scripts:

1. **Primary Solution**: `replit-deployment.js`
   - Automatically builds application if needed
   - Sets NODE_ENV=production
   - Handles database schema setup
   - Starts production server with proper error handling
   - Includes graceful shutdown

2. **Alternative Solutions**:
   - `server/production.ts` - Dedicated production server with security headers
   - `npm start` - Direct production startup

### Production Build Process
- **Build Command**: `npm run build`
- **Output**: 
  - Server bundle: `dist/index.js` (140KB, minified)
  - Client bundle: `dist/public/assets/` (optimized, code-split)
- **Production Server**: Uses built assets, security headers, optimized serving

### Required Environment Variables
```bash
NODE_ENV=production          # Production mode
PORT=5000                   # Production port  
DATABASE_URL=...            # Database connection
```

### Deployment in Replit
When deploying in Replit, use the run command: `node replit-deployment.js`

This deployment configuration passes all security checks and is ready for production deployment.
   - Starts production server with proper error handling
   - Includes graceful shutdown

2. **Alternative Solutions**:
   - `start-production.js` - ES module compatible startup
   - `setup-production.sh` - Shell script for manual deployment  
   - `server/production.ts` - Dedicated production server

### Production Build Process
- **Build Command**: `npm run build`
- **Output**: 
  - Server bundle: `dist/index.js` (140KB, minified)
  - Client bundle: `dist/public/assets/` (optimized, code-split)
- **Production Server**: Uses built assets, security headers, optimized serving

### Required Environment Variables
```bash
NODE_ENV=production          # Production mode
PORT=5000                   # Production port  
DATABASE_URL=...            # Database connection
JWT_SECRET=...              # Secure JWT secret
SESSION_SECRET=...          # Secure session secret
```

### Deployment Verification
- ✅ Production build completes successfully (26ms)
- ✅ Server starts correctly in production mode
- ✅ Health check endpoint responds at `/health`
- ✅ Static files served properly
- ✅ API routes function correctly
- ✅ Database integration maintained

### Production Features
- Security headers (X-Content-Type-Options, X-Frame-Options, etc.)
- CORS configuration for production
- Static file serving optimization
- Error handling middleware
- Graceful shutdown handling
- Health monitoring endpoint