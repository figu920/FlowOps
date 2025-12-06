# FlowOps

## Overview

FlowOps is a mobile-first restaurant operations management application designed specifically for university dining environments. The application prioritizes speed, clarity, and effortless use with a "one-tap" interaction model requiring zero training. Built as a Progressive Web App (PWA), it provides a native iOS-like experience with role-based access control for managing inventory, equipment, checklists, tasks, team communication, and menu portion control.

The application follows a modern full-stack architecture with React on the frontend, Express on the backend, and PostgreSQL for data persistence, utilizing session-based authentication and real-time features for team collaboration.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Technology Stack:**
- **Framework:** React 18 with TypeScript
- **Routing:** Wouter (lightweight client-side routing)
- **State Management:** Zustand with persistence middleware
- **Data Fetching:** TanStack Query (React Query) for server state management
- **UI Components:** Radix UI primitives with shadcn/ui component library
- **Styling:** Tailwind CSS with custom design tokens for dark mode
- **Animations:** Framer Motion for iOS-like transitions

**Design System:**
- Dark mode by default with Apple-inspired minimalistic design
- Custom color palette: Green (#32D74B) for OK states, Yellow (#F7D154) for warnings, Red (#FF453A) for errors/broken states
- Inter font family as proxy for San Francisco
- Mobile-first responsive design with PWA capabilities

**Key Architectural Decisions:**
- Component-based architecture with clear separation between pages, layouts, and reusable UI components
- Centralized API layer (`lib/api.ts`) abstracting all HTTP requests
- Custom hooks pattern (`lib/hooks.ts`) for data fetching and mutations
- Type-safe schema definitions shared between frontend and backend via `shared/schema.ts`

### Backend Architecture

**Technology Stack:**
- **Runtime:** Node.js with TypeScript
- **Framework:** Express.js
- **ORM:** Drizzle ORM with PostgreSQL dialect
- **Session Management:** express-session with connect-pg-simple for PostgreSQL-backed sessions
- **Authentication:** bcrypt for password hashing, session-based authentication
- **Build Tool:** esbuild for production bundling

**API Design:**
- RESTful API architecture with resource-based endpoints
- Session-based authentication with httpOnly cookies
- Role-based authorization middleware checking user permissions
- Separation of concerns: routes (`routes.ts`), database layer (`db.ts`), storage abstraction (`storage.ts`)

**Key Architectural Decisions:**
- Storage layer abstraction (`IStorage` interface) providing clean separation between business logic and data access
- Session persistence in PostgreSQL for scalability and reliability
- Database schema co-located with application code in `shared/schema.ts` for type safety
- Seed script (`seed.ts`) for initial data and system admin creation

### Data Storage

**Database:** PostgreSQL accessed via Drizzle ORM

**Schema Design:**
- **users:** Core authentication and role management (employee, lead, manager, admin with system admin flag)
- **inventory:** Items tracking with status (OK/LOW/OUT), comments, and establishment assignment
- **equipment:** Equipment tracking with status (Working/Attention/Broken) and issue reporting
- **checklistItems:** Categorized checklists (opening, shift, closing) with assignment and completion tracking
- **weeklyTasks:** Recurring tasks with photo verification requirement for completion
- **taskCompletions:** Historical record of task completions with photo proofs and timestamps
- **chatMessages:** Team communication with text and action message types
- **timelineEvents:** Audit trail of significant system events
- **menuItems:** Menu dishes with categories
- **ingredients:** Portion size specifications with measurements

**Key Design Patterns:**
- UUID primary keys for all tables
- Establishment-based multi-tenancy with global system admin override
- Soft delete pattern via status fields (active/pending/removed)
- Timestamp tracking for audit trails
- Composite relationships (e.g., menuItems -> ingredients one-to-many)

### Authentication & Authorization

**Authentication Strategy:**
- Session-based authentication using express-session
- PostgreSQL session store for persistent sessions across server restarts
- bcrypt password hashing with configurable salt rounds
- Registration workflow with pending approval status

**Authorization Model:**
- Four-tier role system: Employee -> Lead -> Manager -> Admin
- System admin flag (`isSystemAdmin`) grants global cross-establishment access
- Establishment-based data isolation for regular users
- Permission checks at both API route level and storage layer
- Role-specific UI rendering based on current user permissions

**User Approval Workflow:**
- New registrations enter "pending" status
- Managers can approve/reject users and assign roles
- Only active users can access application features
- System admin can manage users across all establishments

### External Dependencies

**Third-Party Libraries:**
- **@radix-ui/*:** Accessible UI component primitives (dialogs, dropdowns, popovers, etc.)
- **@tanstack/react-query:** Server state management and caching
- **framer-motion:** Animation library for smooth transitions
- **drizzle-orm & drizzle-kit:** Type-safe ORM and migration tooling
- **bcrypt:** Password hashing
- **date-fns:** Date formatting and manipulation
- **zod:** Runtime type validation and schema definition
- **connect-pg-simple:** PostgreSQL session store adapter

**Development Tools:**
- **Vite:** Frontend build tool and dev server
- **esbuild:** Backend production bundling
- **TypeScript:** Type safety across full stack
- **Tailwind CSS:** Utility-first styling
- **tsx:** TypeScript execution for Node.js

**Replit-Specific Integrations:**
- Custom Vite plugins for Replit development experience (cartographer, dev banner, runtime error overlay)
- Meta images plugin for dynamic OpenGraph image resolution
- Environment-based conditional plugin loading

**Database:**
- PostgreSQL database provisioned via DATABASE_URL environment variable
- Drizzle migrations stored in `./migrations` directory
- Database schema synchronization via `npm run db:push`