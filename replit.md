# Bid Management System (BMS)

## Overview

This is a comprehensive Bid Management System built as a full-stack web application using React/TypeScript for the frontend, Express.js for the backend, and PostgreSQL with Drizzle ORM for data persistence. The system provides end-to-end tender lifecycle management including discovery, analysis, bid creation, finance management, meeting coordination, approval workflows, and AI-powered insights for strategic decision-making.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **UI Library**: Shadcn/ui components built on Radix UI primitives
- **Styling**: Tailwind CSS with CSS variables for theming
- **State Management**: TanStack Query (React Query) for server state
- **Routing**: Wouter for client-side routing
- **Form Handling**: React Hook Form with Zod validation
- **Build Tool**: Vite with custom configurations

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript with ES modules
- **Database ORM**: Drizzle ORM with PostgreSQL
- **File Uploads**: Multer middleware
- **Development**: Hot reload with Vite middleware integration
- **External Services**: OpenAI API integration for AI features

### Data Storage
- **Primary Database**: PostgreSQL via Neon serverless
- **ORM**: Drizzle with type-safe schema definitions
- **Session Storage**: PostgreSQL with connect-pg-simple
- **File Storage**: Local filesystem with Multer (uploads/ directory)
- **Development Fallback**: In-memory storage for development

## Key Components

### Database Schema (shared/schema.ts)
- **Users**: Authentication, user management, and role assignments
- **Tenders**: Core tender/bid information with comprehensive status tracking
- **AI Recommendations**: ML-generated insights and strategic suggestions
- **Documents**: File attachments and document management for tenders
- **Analytics**: Dashboard metrics, pipeline data, and performance tracking
- **Meetings**: Meeting scheduling, coordination, and minutes tracking
- **Finance Requests**: EMD/PBG management, approval workflows, and financial tracking
- **Approvals**: Multi-level approval workflows for requests and bids
- **Tender Assignments**: Task assignments and team coordination
- **Reminders**: Automated reminder system for deadlines and follow-ups
- **Tender Results**: Final outcomes and post-tender analysis
- **Checklists**: Task management and compliance tracking
- **Departments & Roles**: Organizational structure and permissions
- **User Roles**: Role-based access control and permissions

### AI Services (server/services/openai.ts)
- **Tender Analysis**: Match scoring between tenders and company capabilities
- **Bid Optimization**: Content improvement suggestions
- **Pricing Intelligence**: Data-driven pricing recommendations
- **Risk Assessment**: Automated risk evaluation

### Frontend Pages
- **Dashboard**: Comprehensive overview with stats, pipeline data, and AI recommendations
- **Tenders**: Complete CRUD operations for tender lifecycle management
- **Create Bid**: Form-based bid creation with AI assistance and document uploads
- **Finance**: EMD/PBG management, approval workflows, and financial tracking
- **Meetings**: Meeting scheduling, coordination, and minutes management
- **AI Insights**: Interactive AI tools for tender analysis and recommendations

### Storage Layer
- **Interface-based Design**: IStorage interface for swappable implementations
- **Memory Storage**: Development fallback (MemStorage class)
- **Production Ready**: PostgreSQL integration via Drizzle

## Data Flow

### Request Flow
1. Client makes API request through React Query
2. Express middleware handles authentication and logging
3. Route handlers process business logic
4. Storage layer abstracts database operations
5. AI services provide ML-enhanced responses
6. JSON responses sent back to client

### File Upload Flow
1. Multer middleware processes multipart uploads
2. Files stored in uploads/ directory
3. Metadata persisted to documents table
4. File paths tracked for retrieval

### AI Integration Flow
1. User triggers AI analysis from frontend
2. Backend calls OpenAI API with structured prompts
3. Responses processed and formatted
4. Results stored as recommendations
5. Frontend displays insights with interactive UI

## External Dependencies

### Core Dependencies
- **@neondatabase/serverless**: PostgreSQL connection for production
- **drizzle-orm**: Type-safe database operations
- **@tanstack/react-query**: Server state management
- **@radix-ui/***: Accessible UI component primitives
- **openai**: Official OpenAI API client

### Development Tools
- **tsx**: TypeScript execution for development
- **esbuild**: Production bundling for server
- **@replit/vite-plugin-***: Replit-specific development features

### UI and Styling
- **tailwindcss**: Utility-first CSS framework
- **class-variance-authority**: Component variant management
- **clsx**: Conditional className utility

## Deployment Strategy

### Development
- **Frontend**: Vite dev server with HMR
- **Backend**: tsx with file watching
- **Database**: Drizzle schema push for migrations
- **Environment**: Replit-optimized with specific plugins

### Production Build
- **Frontend**: Vite build to dist/public
- **Backend**: esbuild bundle to dist/index.js
- **Database**: Drizzle migrations via drizzle-kit
- **Deployment**: Single Node.js process serving both frontend and API

### Environment Configuration
- **DATABASE_URL**: PostgreSQL connection string (required)
- **OPENAI_API_KEY**: OpenAI API access (required for AI features)
- **NODE_ENV**: Environment flag for development/production modes

## Recent Implementation Highlights

### Role-Based Authentication System (January 2025)
- **Complete Login System**: Beautiful login page with demo account cards for instant access to different user roles
- **JWT-Based Authentication**: Secure token-based authentication with session management and logout functionality
- **Three User Roles**: Admin (full access), Finance Manager (financial operations), Senior Bidder (bid creation/management)
- **Permission-Based Access Control**: Granular permissions system controlling page access and feature availability
- **Protected Routes**: Role-based navigation with automatic redirection to login for unauthenticated users
- **User Interface Integration**: Role-specific sidebar navigation showing only permitted pages with user profile display

### Dynamic User Role Management & Excel Integration (January 2025)
- **Multi-Role User System**: Created demo users (Admin, Finance Manager, Senior Bidder) with proper role assignments and department structure
- **Company Settings Management**: Admin-configurable company criteria (turnover, certifications, business sectors) for AI matching
- **Excel Upload & Processing**: Complete Excel file upload system with automatic tender import from multiple worksheets
- **Enhanced Tender Management**: Advanced filtering by status, location, organization, AI match percentage with assignment capabilities
- **AI-Powered Eligibility Scoring**: Intelligent matching algorithm comparing company criteria against tender requirements
- **Upload History Tracking**: Complete audit trail of Excel imports with success/failure status and detailed logs

### Advanced Features Implementation
- **Smart AI Matching**: 
  - 100% match for turnover exempted tenders
  - Manual review (85%) for unspecified turnover requirements  
  - Proportional scoring based on company vs required turnover
- **Enhanced User Interface**:
  - Admin Settings page for company configuration
  - Enhanced Tenders page with advanced filtering and search
  - Real-time assignment of tenders to bidders with notification system
- **Excel Processing**: Multi-sheet processing with flexible column mapping (Title, Organization, Value, Deadline, Turnover, Location, Reference No)

### Technical Implementation Details
- **Extended Storage Interface**: Added company settings, Excel uploads, AI matching methods (35+ total methods)
- **File Processing**: XLSX library integration for robust Excel file parsing and data extraction  
- **Dynamic Filtering API**: Advanced query-based filtering with multiple parameter support
- **Type Safety Enhancement**: Complete TypeScript coverage for all new entities with Zod validation

### Eligibility Criteria Breakdown Feature (January 2025)
- **Detailed AI Score Analysis**: New `calculateAIMatchWithBreakdown` method providing comprehensive eligibility analysis
- **Turnover Eligibility Tracking**: Clear indication when company turnover doesn't meet requirements (e.g., "25 Cr required vs 5 Cr available = 0% AI Score")
- **Multi-Criteria Evaluation**: 
  - Annual Turnover: Proportional scoring with clear thresholds (0% for no eligibility, 30% for <50%, 70% for 50-80%, 90% for >80%)
  - Business Sectors: Matches tender domain with company's business sectors
  - Project Types: Keyword-based matching for mobile, web, software, tax collection, infrastructure projects
  - Certifications: Checks for relevant ISO and other certifications mentioned in tenders
- **Interactive UI Components**: 
  - Clickable AI score badges in tender list (both table and grid views)
  - Beautiful eligibility breakdown card showing requirement vs capability comparison
  - Color-coded scoring with clear pass/fail indicators
- **Excel Hyperlink Integration**: Successfully extracted and stored 1,896 tender links from 11 Excel files (75.3% coverage)

### Active Tender Filters Fix (January 2025)
- **Database Schema Update**: Added missing `source` field to tenders table with default value 'non_gem'
- **Data Migration**: Successfully updated all 2,519 tenders with correct source values (64 GEM, 2,455 Non-GEM)
- **Filter Implementation**: 
  - Fixed GEM/Non-GEM filter to check tender.source field directly
  - Added Eligibility Status filter (Eligible ≥70%, Not Eligible <70%)
  - Verified all filters working: Search, Source, Deadline, and Eligibility
- **Unit Testing**: Created and passed 15 comprehensive filter tests covering all filter combinations
- **Data Distribution**: 212 eligible tenders (8.4%), 2,307 not eligible (91.6%)

### Simplified Excel Upload with Progress Tracking (January 2025)
- **Streamlined Excel Upload**: 
  - Removed complex database tracking system for simplicity
  - Simplified API to just import tenders and track duplicates
  - Fixed TypeScript errors in upload processing route
- **Progress Bar Implementation**: 
  - Real-time progress bar shows during Excel file upload
  - Visual percentage indicator updates as file processes
  - Smooth animations and clear status messaging
- **Local Upload History**: 
  - Stores last 10 uploads in browser localStorage
  - Displays file name, timestamp, tenders imported, duplicates skipped
  - Status badges (success/failed) with color-coded indicators
  - Relative time display (e.g., "2 minutes ago")
- **User Experience**: Upload page now shows progress during processing and maintains history for quick reference

The architecture prioritizes type safety, developer experience, and scalability while maintaining a clean separation between frontend, backend, and data layers. The AI integration is designed to enhance user decision-making without being intrusive to the core workflow. The system now supports complete tender lifecycle management from discovery through award with integrated financial tracking and team coordination.