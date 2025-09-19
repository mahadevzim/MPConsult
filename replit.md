# Overview

This is a legal process search system built for the Ministério Público de Santa Catarina (Public Ministry of Santa Catarina). The application allows users to search for legal processes by CPF (Brazilian tax ID) and provides an administrative interface for managing process data. The system is designed to help legal professionals and citizens access information about court proceedings efficiently.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
The frontend is built with React and TypeScript using Vite as the build tool. It implements a single-page application (SPA) with component-based routing managed through state rather than a traditional router. The UI leverages shadcn/ui components built on top of Radix UI primitives for accessibility and consistent design.

**Key Design Decisions:**
- **State-based routing**: Uses React state to manage page navigation instead of React Router, providing simpler state management for this focused application
- **shadcn/ui component system**: Provides consistent, accessible UI components with Tailwind CSS styling
- **TanStack Query**: Handles server state management, caching, and API interactions
- **Form validation**: Uses React Hook Form with Zod schemas for type-safe form handling

## Backend Architecture
The backend is built with Express.js and TypeScript, following a modular structure with clear separation of concerns. It provides RESTful API endpoints for process search and administrative functions.

**Key Design Decisions:**
- **Storage abstraction**: Implements an interface-based storage layer allowing for easy database switching
- **Request logging**: Custom middleware logs API requests with response times and payloads for debugging
- **Error handling**: Centralized error handling middleware with proper HTTP status codes
- **Development tooling**: Integrated Vite development server with hot module replacement

## Data Storage
The application uses PostgreSQL as the primary database with Drizzle ORM for type-safe database operations. The schema supports CPF records and associated legal processes with comprehensive process metadata.

**Key Design Decisions:**
- **Drizzle ORM**: Provides type-safe database queries with excellent TypeScript integration
- **Neon Database**: Uses Neon's serverless PostgreSQL for scalable cloud deployment
- **Schema design**: Normalized structure with CPFs and processes in separate tables linked by foreign keys
- **UUID primary keys**: Uses PostgreSQL's gen_random_uuid() for better distributed system compatibility

## Authentication and Authorization
Currently, the system operates without authentication, suggesting it's designed for internal use or public access to court records. The admin interface lacks access controls, indicating a trusted environment deployment.

**Security Considerations:**
- No authentication system implemented
- Admin routes are publicly accessible
- Database credentials managed through environment variables

# External Dependencies

## Database Services
- **Neon Database**: Serverless PostgreSQL provider for cloud-hosted database
- **PostgreSQL**: Primary database engine with UUID and array support

## UI and Styling
- **Radix UI**: Accessible component primitives for complex UI components
- **Tailwind CSS**: Utility-first CSS framework for responsive design
- **Lucide React**: Icon library providing consistent iconography
- **shadcn/ui**: Pre-built component library combining Radix UI with Tailwind styling

## Development and Build Tools
- **Vite**: Fast build tool and development server with HMR support
- **TypeScript**: Type safety across the entire application stack
- **Drizzle Kit**: Database migration and schema management tool
- **ESBuild**: Fast JavaScript bundler for production builds

## Runtime Dependencies
- **TanStack React Query**: Server state management and caching
- **React Hook Form**: Form state management with validation
- **Zod**: Runtime type validation and schema definition
- **date-fns**: Date manipulation and formatting utilities
- **class-variance-authority**: Utility for creating variant-based component APIs

## Development Environment
- **Replit Integration**: Special handling for Replit development environment with custom error overlays and development banners
- **WebSocket Support**: Configured for Neon's serverless connection pooling