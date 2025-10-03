# Overview

This is a personal invoice generator web application for MOLLA ENTERPRISES, designed as a complete fullstack solution for creating, managing, and generating professional invoices. The application features a modern React frontend with a Node.js/Express backend, using PostgreSQL for data persistence and supporting PDF generation for invoices.

The system is specifically branded for MOLLA ENTERPRISES with custom styling using Lora and Inter fonts, blue gradient themes, and company-specific branding elements. It supports multi-currency invoicing, client management, and comprehensive invoice tracking with various status states.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture

The client-side is built with modern React using Vite as the build tool and development server. The application follows a component-based architecture with these key decisions:

- **UI Framework**: Uses Radix UI primitives with Tailwind CSS for styling, providing accessibility and consistency
- **State Management**: React Query (@tanstack/react-query) for server state management and caching
- **Routing**: Wouter for lightweight client-side routing
- **Form Management**: React Hook Form with Zod validation for type-safe forms
- **Styling**: Tailwind CSS with custom CSS variables for theming and responsive design

The frontend implements a single-page application pattern with dedicated pages for Dashboard, Clients, Invoices, and Settings, all wrapped in a consistent navigation layout.

## Backend Architecture

The server uses Express.js with TypeScript, following a RESTful API design pattern:

- **Framework**: Express.js with TypeScript for type safety
- **Database Layer**: Drizzle ORM for type-safe database queries and schema management
- **API Structure**: RESTful endpoints organized by resource (clients, invoices, settings)
- **Error Handling**: Centralized error handling middleware with proper HTTP status codes
- **Development Tools**: Vite integration for hot module replacement in development

The backend implements a storage abstraction layer that separates database operations from route handlers, making the system more maintainable and testable.

## Data Storage Solutions

The application uses PostgreSQL as the primary database with Drizzle ORM for schema management:

- **Database**: PostgreSQL via Neon Database service
- **ORM**: Drizzle ORM with automatic migration support
- **Schema Design**: Relational design with proper foreign key constraints
- **Data Types**: Uses appropriate PostgreSQL types including enums for status and currency
- **Connection Management**: Connection pooling with @neondatabase/serverless

The database schema includes tables for clients, invoices, invoice items, and settings, with proper relationships and constraints to ensure data integrity.

## PDF Generation

The system implements dual PDF generation capabilities:

- **Frontend Generation**: html2canvas + jsPDF for client-side PDF creation
- **Backend Generation**: Puppeteer for server-side PDF generation (prepared but not fully implemented)
- **Template System**: Custom invoice templates with company branding
- **Styling**: CSS-based invoice layouts that render consistently in PDF format

## Authentication and Authorization

The application implements secure authentication using Replit's OAuth integration, which supports multiple authentication providers including Google, GitHub, Apple, and email/password:

- **Authentication Provider**: Replit Auth via OpenID Connect (OIDC)
- **Session Management**: PostgreSQL-backed session storage using express-session
- **Authentication Middleware**: Passport.js with openid-client for OAuth 2.0 / OIDC flows
- **Token Management**: Automatic access token refresh using refresh tokens
- **Protected Routes**: All API endpoints require authentication via isAuthenticated middleware
- **User Management**: Automatic user profile creation and updates on login

The system uses a landing page for unauthenticated users with a "Sign In with Google" button. Once authenticated, users can access the full invoice management system. A logout button in the navigation allows users to end their session securely.

## Component Architecture

The frontend uses a hierarchical component structure:

- **UI Components**: Reusable UI primitives based on Radix UI
- **Feature Components**: Business logic components (InvoiceForm, ClientModal)
- **Layout Components**: Navigation and page structure components
- **Page Components**: Top-level route components

## Development and Build System

The project uses modern tooling for development efficiency:

- **Build Tool**: Vite for fast development and optimized production builds
- **Type Checking**: TypeScript across both frontend and backend
- **Code Quality**: ESLint and TypeScript compiler for code validation
- **Development Experience**: Hot module replacement and error overlays for rapid development

# External Dependencies

## Database Services

- **Neon Database**: PostgreSQL hosting service with serverless capabilities
- **Connection Pooling**: @neondatabase/serverless for efficient database connections

## UI and Styling

- **Radix UI**: Comprehensive set of accessible UI primitives including dialogs, dropdowns, forms, and navigation components
- **Tailwind CSS**: Utility-first CSS framework for responsive design
- **Google Fonts**: Lora and Inter fonts for brand-consistent typography
- **Lucide Icons**: Icon library for consistent iconography throughout the application

## PDF Generation

- **html2canvas**: Client-side HTML to canvas rendering for PDF generation
- **jsPDF**: JavaScript PDF generation library
- **Puppeteer**: Server-side browser automation for PDF generation (prepared for future use)

## Authentication

- **Passport.js**: Authentication middleware for Node.js
- **openid-client**: OpenID Connect client library for OAuth flows
- **express-session**: Session middleware for Express
- **connect-pg-simple**: PostgreSQL session store for express-session
- **memoizee**: Memoization library for caching OIDC configuration

## Development Tools

- **Vite**: Build tool and development server with React plugin
- **Replit Integration**: Development environment plugins for banner and cartographer
- **ESBuild**: Fast JavaScript bundler for production builds

## Form and Data Management

- **React Hook Form**: Form state management with validation
- **Zod**: TypeScript-first schema validation
- **React Query**: Server state management and caching
- **Drizzle ORM**: Type-safe database queries and schema management

## Utility Libraries

- **date-fns**: Date manipulation and formatting
- **clsx**: Conditional className utility
- **nanoid**: URL-safe unique string generator
- **class-variance-authority**: Variant-based component styling utility

The application integrates these dependencies to create a cohesive system that supports the complete invoice generation workflow from client management through PDF export.

# Replit Environment Setup

## Configuration

The application is configured to run in the Replit environment with the following setup:

### Development Workflow
- **Command**: `npm run dev`
- **Port**: 5000
- **Host**: 0.0.0.0 (required for Replit proxy)
- **Output Type**: webview

### Database Setup
- **Type**: PostgreSQL (Render managed external database)
- **Connection**: Uses environment variable `DATABASE_URL` with SSL enabled
- **SSL Configuration**: Configured with `?sslmode=require` for secure connections
- **Schema Management**: Drizzle ORM with `npm run db:push` for migrations
- **Tables**: users, sessions, clients, invoices, invoice_items, settings
- **Note**: Both `server/db.ts` and `drizzle.config.ts` are configured for SSL connections required by Render

### Deployment Configuration
- **Target**: Autoscale deployment (stateless web application)
- **Build Command**: `npm run build` (builds frontend with Vite and backend with esbuild)
- **Start Command**: `npm run start` (runs production server)
- **Port**: 5000

### Environment Variables
The following environment variables are automatically configured by Replit:
- `DATABASE_URL`: PostgreSQL connection string
- `PGHOST`, `PGPORT`, `PGUSER`, `PGPASSWORD`, `PGDATABASE`: Individual database credentials
- `SESSION_SECRET`: Secure secret for session management
- `REPLIT_DOMAINS`: Comma-separated list of domains for OAuth callbacks
- `REPL_ID`: Replit application ID for OAuth
- `ISSUER_URL`: OAuth issuer URL (defaults to https://replit.com/oidc)

### Important Notes
- The Vite server is configured with `allowedHosts: true` to work with Replit's proxy
- The Express server binds to `0.0.0.0:5000` to be accessible through Replit's web view
- Hot module replacement (HMR) is enabled for rapid development