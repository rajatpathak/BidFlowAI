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

### Comprehensive BMS Features (January 2025)
- **Enhanced Database Schema**: Implemented all 15+ tables from the BMS proposal including finance, meetings, approvals, assignments, reminders, and organizational structure
- **Finance Management**: Complete EMD/PBG tracking with approval workflows, expiry monitoring, and financial overview dashboards
- **Meeting Coordination**: Full meeting lifecycle from scheduling to completion with agenda management and minutes tracking
- **Approval Workflows**: Multi-level approval system for finance requests and tender submissions
- **Task Management**: Assignment tracking, reminders system, and checklist management for tender compliance
- **Organizational Structure**: Department and role-based access control with user assignment capabilities
- **Enhanced API Layer**: 25+ new API endpoints supporting all BMS features with comprehensive CRUD operations
- **Modern Frontend**: React-based finance and meetings pages with responsive design and real-time data

### Technical Implementation Details
- **Storage Interface**: Extended IStorage with 30+ new methods for comprehensive BMS operations
- **Memory Storage**: Complete in-memory implementation for development with proper data relationships
- **Route Integration**: Comprehensive API routes for finance, meetings, approvals, assignments, and organizational management
- **Type Safety**: Full TypeScript integration with Zod validation for all new entities

The architecture prioritizes type safety, developer experience, and scalability while maintaining a clean separation between frontend, backend, and data layers. The AI integration is designed to enhance user decision-making without being intrusive to the core workflow. The system now supports complete tender lifecycle management from discovery through award with integrated financial tracking and team coordination.