# Bid Management System (BMS)

## Overview
The Bid Management System (BMS) is a comprehensive full-stack web application for end-to-end tender lifecycle management. It facilitates tender discovery, analysis, bid creation, financial management, meeting coordination, and approval workflows. The system leverages AI for strategic decision-making to streamline processes, enhance efficiency, and improve bid success rates, providing a competitive edge in tender acquisition.

## User Preferences
Preferred communication style: Simple, everyday language.
Project Architecture: Clean, simple, and scalable structure with consolidated codebase for easier deployment and maintenance.

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
- **Database ORM**: Drizzle ORM
- **File Uploads**: Multer with local storage
- **AI Integration**: OpenAI API
- **Authentication**: Simple JWT-based authentication
- **Architecture**: Clean, modular route structure with a controller pattern and service layer for business logic.

### Data Storage
- **Primary Database**: PostgreSQL (via Neon serverless for production), with a user preference to migrate to MySQL.
- **ORM**: Drizzle
- **Session Storage**: PostgreSQL with connect-pg-simple
- **File Storage**: Local filesystem (`uploads/` directory)

### Core System Features
- **Comprehensive Database Schema**: Includes Users, Tenders, AI Recommendations, Documents, Analytics, Meetings, Finance Requests, Approvals, Tender Assignments, Reminders, Tender Results, Checklists, Departments & Roles.
- **AI Services**: Tender analysis, bid optimization, pricing intelligence, and risk assessment using OpenAI.
- **Workflow Management**: Multi-level approval workflows for finance requests and tender submissions.
- **Advanced Tender Filtering**: Comprehensive filtering system for active tenders including search by ID/keyword, organization ID, category, state, city, ownership, department, closing date, website, quantity, tender value, GeM/Non-GeM, MSME/Startup exemption, AI Summary, and BOQ.
- **Real-time Statistics & Display**: Dashboard cards for tender statistics, filterable status tabs, smart sorting options, and enhanced tender cards with bid value, EMD, days left, corrigendum indicators, and action buttons for assigning tenders and marking as not relevant.
- **Robust Data Import**: Excel upload functionality with multi-sheet support, smart column mapping, duplicate detection, real-time progress tracking via Server-Sent Events, and detailed import statistics.
- **Activity Logging**: Detailed audit trail for tender modifications, assignments, and workflow actions.
- **Missed Opportunities**: System for tracking and managing expired tenders.
- **User Management**: Dynamic user role management and permission-based access control.
- **Bid Document Management**: Comprehensive system for managing bid documents within tender views and central library.
- **Production-Ready Architecture**: Restructured server for separation of concerns, enhanced security (helmet, rate limiting, CORS), compression, comprehensive error handling, and audit logging.

## External Dependencies

- **@neondatabase/serverless**: PostgreSQL connection (production).
- **drizzle-orm**: ORM for database interactions.
- **@tanstack/react-query**: Frontend server state management.
- **@radix-ui/***: Accessible UI component primitives.
- **openai**: Official OpenAI API client.
- **xlsx**: Library for Excel file parsing and data extraction.