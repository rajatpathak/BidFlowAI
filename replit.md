# Bid Management System (BMS)

## Overview
The Bid Management System (BMS) is a comprehensive full-stack web application designed for end-to-end tender lifecycle management. It enables discovery, analysis, bid creation, finance management, meeting coordination, and approval workflows. The system incorporates AI-powered insights for strategic decision-making, aiming to streamline tender processes, enhance efficiency, and improve bid success rates.

## User Preferences
Preferred communication style: Simple, everyday language.
Project Architecture: Clean, simple, and scalable structure with consolidated codebase for easier deployment and maintenance.

## Recent Changes (August 3, 2025)
- **Upload Functionality Fixed (August 3, 2025)**: Resolved critical upload errors in active tenders page by fixing multer configuration for Excel/CSV file uploads, created simple Excel processor, and updated all upload endpoints to use proper file type validation.
- **SelectItem Component Error Fixed (August 3, 2025)**: Fixed React crashes caused by SelectItem components with empty values by updating filter logic to use "all" values instead of empty strings.
- **Production Deployment Scripts (August 3, 2025)**: Created production deployment scripts that properly build and copy static files for server hosting.

## Previous Changes (August 2, 2025)
- **Replit Migration Completed (August 2, 2025)**: Successfully migrated BMS project from Replit Agent to standard Replit environment. Fixed dependency installation issues, created PostgreSQL database, resolved UUID comparison errors in activity logging, and added missing db:seed script for production deployments.

## Previous Changes (August 1, 2025)
- **Project Restructure**: Cleaned up project structure by removing duplicate directories and unused files
- **Simplified Architecture**: Created consolidated route handlers and removed complex scattered server files
- **Clean Image Upload**: Fixed image upload functionality with proper multer configuration and file serving
- **Deployment Ready**: Streamlined codebase for easier server deployment and maintenance
- **Complete Deployment Suite**: Added comprehensive deployment configurations including Docker, PM2, GitHub Actions, and manual server setup
- **Production Security**: Enhanced server configuration with security headers, CORS, and graceful shutdown handling
- **Bid Document Management**: Added comprehensive bid document management system as sub-tab in tender view with create, edit, delete, and workflow capabilities
- **Admin Document Management**: Enhanced admin settings with comprehensive bid document oversight including workflow management, document statistics, and approval controls
- **Centralized Document Library**: Added folder-based document organization system in admin interface for company documents accessible by bidders and AI systems
- **Replit Deployment Fix (FINAL SOLUTION - August 1, 2025)**: Successfully resolved Replit deployment error "Run command contains 'dev' which is blocked for security reasons". Created `replit-deploy.js` production deployment script that automatically builds and starts the server without using any dev commands. Production build tested and verified working (816KB JS, 78KB CSS, 140KB server bundle). The solution includes manual configuration instructions since the `.replit` file cannot be programmatically modified. User must manually change the deployment run command from `npm run dev` to `node replit-deploy.js` in Replit deployment settings.
- **Enhanced VPS Deployment Configuration (August 1, 2025)**: Completely updated VPS deployment configurations with improved Docker setup, optimized PM2 cluster mode, enhanced security with Nginx rate limiting and security headers, automated GitHub Actions deployment pipeline, and comprehensive deployment scripts with health checks and rollback capabilities.

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

### Replit Deployment Error Resolution (FINAL - August 1, 2025)
Successfully resolved the deployment security error: "Run command contains 'dev' which is blocked for security reasons"

**Applied Fixes:**
1. ✅ **Smart Deployment Script**: Created `replit-deploy.js` - production script that auto-builds and starts server
2. ✅ **Production Build**: Optimized build with `npm run build` (816KB JS, 78KB CSS, 140KB server bundle)
3. ✅ **Environment Configuration**: Proper `NODE_ENV=production` and port settings
4. ✅ **Security Compliance**: No development commands used in production deployment
5. ✅ **Manual Configuration Required**: Since `.replit` file cannot be modified programmatically

### Deployment Commands
- **Recommended**: `node replit-deploy.js` (auto-builds if needed, production-ready)
- **Alternative**: `npm start` (requires manual build first)
- **Build**: `npm run build` (creates optimized production bundle)

### Manual Steps Required
User must manually update Replit deployment settings:
1. Go to Deploy tab in Replit
2. Change run command from `npm run dev` to `node replit-deploy.js`
3. Set environment variables: `NODE_ENV=production`, `PORT=5000`

### Files Created
- `replit-deploy.js` - Smart deployment script with auto-build
- `DEPLOYMENT_INSTRUCTIONS.md` - Complete manual configuration guide

### Deployment Status ✅
- Production build tested and verified working
- Deployment script functional with graceful shutdown
- Manual configuration instructions provided
- Ready for Replit deployment once user updates settings