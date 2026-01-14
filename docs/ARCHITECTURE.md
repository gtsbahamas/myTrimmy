# Architecture Diagrams - myTrimmy-prep

Generated: 2026-01-14

---

## Overview

This document provides C4 model architecture diagrams for myTrimmy-prep using Mermaid syntax. The C4 model visualizes software architecture at four levels of abstraction: Context, Container, Component, and Code.

**Rendering:** These diagrams use Mermaid syntax. View them in:
- GitHub/GitLab (native support)
- VS Code with Mermaid extension
- [Mermaid Live Editor](https://mermaid.live)

---

## Level 1: System Context

The System Context diagram shows myTrimmy-prep and its relationships with users and external systems.

```mermaid
C4Context
    title System Context Diagram - myTrimmy-prep

    Person(user, "User", "Primary application user who interacts with the system")
    Person(admin, "Administrator", "Manages system configuration and user access")

    System(app, "myTrimmy-prep", "Web application providing core business functionality")

    System_Ext(auth, "Supabase Auth", "Authentication and user management service")
    System_Ext(db, "Supabase Database", "PostgreSQL database with Row Level Security")
    System_Ext(storage, "Supabase Storage", "File and media storage service")
    System_Ext(email, "Email Service", "Transactional email delivery (Resend/SendGrid)")
    System_Ext(analytics, "Analytics", "User behavior tracking (PostHog/Mixpanel)")

    Rel(user, app, "Uses", "HTTPS")
    Rel(admin, app, "Administers", "HTTPS")
    Rel(app, auth, "Authenticates via", "HTTPS/JWT")
    Rel(app, db, "Reads/Writes data", "PostgreSQL/REST")
    Rel(app, storage, "Stores files", "HTTPS")
    Rel(app, email, "Sends emails via", "HTTPS/API")
    Rel(app, analytics, "Tracks events", "HTTPS")

    UpdateLayoutConfig($c4ShapeInRow="3", $c4BoundaryInRow="1")
```

### Context Narrative

myTrimmy-prep is a web application that serves users and administrators. The system leverages Supabase for:

- **Authentication**: Secure user sign-up, login, and session management
- **Database**: PostgreSQL with Row Level Security for data isolation
- **Storage**: Secure file uploads with access control


---

## Level 2: Container Diagram

The Container diagram shows the high-level technical building blocks of myTrimmy-prep.

```mermaid
C4Container
    title Container Diagram - myTrimmy-prep

    Person(user, "User", "Application user")

    Container_Boundary(app, "myTrimmy-prep") {
        Container(web, "Web Application", "Next.js 14", "React-based SPA with App Router, server components, and API routes")
        Container(api, "API Routes", "Next.js API", "RESTful endpoints for")
        Container(middleware, "Middleware", "Next.js", "Auth protection, rate limiting, security headers")
    }

    Container_Boundary(supabase, "Supabase Platform") {
        ContainerDb(db, "PostgreSQL", "Supabase DB", "Stores with RLS policies")
        Container(auth, "Auth Service", "Supabase Auth", "JWT-based authentication, OAuth providers")
        Container(storage, "Storage", "Supabase Storage", "File uploads with bucket policies")
        Container(realtime, "Realtime", "Supabase Realtime", "WebSocket subscriptions for live updates")
    }

    Container_Boundary(external, "External Services") {
        Container(email, "Email", "Resend", "Transactional emails")
        Container(analytics, "Analytics", "PostHog", "Event tracking")
    }

    Rel(user, web, "Uses", "HTTPS")
    Rel(web, api, "Calls", "HTTP")
    Rel(web, middleware, "Protected by", "")
    Rel(api, db, "Queries", "SQL/REST")
    Rel(api, auth, "Validates tokens", "JWT")
    Rel(api, storage, "Manages files", "REST")
    Rel(web, realtime, "Subscribes", "WebSocket")
    Rel(api, email, "Sends", "API")
    Rel(web, analytics, "Tracks", "JS SDK")

    UpdateLayoutConfig($c4ShapeInRow="3", $c4BoundaryInRow="2")
```

### Container Responsibilities

| Container | Technology | Responsibility |
|-----------|------------|----------------|
| Web Application | Next.js 14 + React | UI rendering, client-side state, server components |
| API Routes | Next.js API Routes | Business logic, validation, data access |
| Middleware | Next.js Middleware | Auth guards, rate limiting, headers |
| PostgreSQL | Supabase | Data persistence with RLS |
| Auth Service | Supabase Auth | User identity, sessions, OAuth |
| Storage | Supabase Storage | File management with policies |

---

## Level 3: Component Diagram

The Component diagram shows the internal structure of key containers.

### Web Application Components

```mermaid
C4Component
    title Component Diagram - Web Application

    Container_Boundary(web, "Web Application") {
        Component(pages, "Page Components", "React/Next.js", "Route handlers:, /settings, /admin")
        Component(layouts, "Layout Components", "React", "Dashboard layout, auth layout, root layout")
        Component(ui, "UI Components", "shadcn/ui", "Button, Card, Dialog, Table, Form components")
        Component(forms, "Form Components", "React Hook Form + Zod", "Entity CRUD forms with validation")
        Component(hooks, "Custom Hooks", "React", "useAuth, useApi, useToast, useDebounce")
        Component(stores, "State Management", "React Context/Zustand", "Auth state, UI state, cache")
    }

    Container_Boundary(lib, "Library Layer") {
        Component(apiClient, "API Client", "TypeScript", "Type-safe fetch wrappers with React Query")
        Component(validation, "Validation", "Zod", "Input schemas for")
        Component(auth, "Auth Utils", "TypeScript", "Session management, guards")
        Component(i18n, "Internationalization", "TypeScript", "Translation helpers, locale detection")
    }

    Rel(pages, layouts, "Uses")
    Rel(pages, ui, "Renders")
    Rel(pages, forms, "Includes")
    Rel(pages, hooks, "Calls")
    Rel(hooks, stores, "Reads/Writes")
    Rel(hooks, apiClient, "Fetches via")
    Rel(forms, validation, "Validates with")
    Rel(hooks, auth, "Checks auth via")

    UpdateLayoutConfig($c4ShapeInRow="4", $c4BoundaryInRow="1")
```

### API Layer Components

```mermaid
C4Component
    title Component Diagram - API Layer

    Container_Boundary(api, "API Routes") {
        Component(apiWebhooks, "Webhooks API", "Next.js Route", "POST /api/webhooks - HMAC verified")
        Component(apiAuth, "Auth Callbacks", "Next.js Route", "OAuth callbacks, magic links")
    }

    Container_Boundary(lib, "Library Layer") {
        Component(repos, "Repositories", "TypeScript", "Database access:")
        Component(validation, "Validation", "Zod", "Request body validation")
        Component(errors, "Error Handling", "TypeScript", "Result types, error mappers")
        Component(jobs, "Background Jobs", "TypeScript", "Async task queue")
    }

    Container_Boundary(infra, "Infrastructure") {
        Component(supabase, "Supabase Client", "TypeScript", "Server-side client with service role")
        Component(rateLimit, "Rate Limiter", "Upstash Redis", "Sliding window algorithm")
        Component(analytics, "Analytics", "TypeScript", "Event tracking abstraction")
    }

    Rel(repos, supabase, "Queries via")
    Rel(repos, errors, "Returns")
    Rel(apiWebhooks, jobs, "Enqueues")

    UpdateLayoutConfig($c4ShapeInRow="3", $c4BoundaryInRow="1")
```

### Component Inventory

| Layer | Component | Purpose |
|-------|-----------|---------|
| API | Webhooks | External event ingestion |
| Library | Repositories | Data access abstraction |
| Library | Validation | Input sanitization |
| Library | Error Handling | Consistent error responses |
| UI | Page Components | Route-based views |
| UI | Form Components | Data entry with validation |
| UI | UI Components | Reusable design system |

---

## Level 4: Code (Entity Relationships)

The Code level diagram shows the data model and entity relationships.

### Entity Relationship Diagram

```mermaid
erDiagram

    USER ||--o{ IMAG : "has many"
    USER ||--o{ PRESET : "has many"
    USER ||--o{ BATCH_JOB : "has many"
    BATCH_JOB ||--o{ BATCH_IMAG : "has many"
    PRESET ||--o{ BATCH_JOB : "has many"
    IMAGE ||--o{ BATCH_IMAGE : "has many"
    BATCH_JOB ||--o{ BATCH_IMAGE : "has many"
```

### Domain Type Definitions

```typescript
// Branded ID types (prevent ID type confusion)

// Entity interfaces
```

### Relationship Summary

| From | To | Type | Foreign Key | On Delete |
|------|----|----- |-------------|-----------|
| Imag | User | many-to-one | user_id | CASCADE |
| Preset | User | many-to-one | user_id | CASCADE |
| BatchJob | User | many-to-one | user_id | CASCADE |
| BatchImag | BatchJob | many-to-one | batch_job_id | CASCADE |
| BatchJob | Preset | many-to-one | preset_id | CASCADE |
| BatchImage | Image | many-to-one | image_id | CASCADE |
| BatchImage | BatchJob | many-to-one | batch_job_id | CASCADE |

---

## Data Flow Diagrams

### User Authentication Flow

```mermaid
sequenceDiagram
    participant U as User
    participant W as Web App
    participant M as Middleware
    participant A as Supabase Auth
    participant D as Database

    U->>W: Navigate to /login
    W->>U: Render login form
    U->>W: Submit credentials
    W->>A: signInWithPassword()
    A->>A: Validate credentials
    A->>D: Fetch user profile
    A-->>W: Return session + JWT
    W->>W: Store session
    W-->>U: Redirect to /dashboard

    Note over M: Subsequent requests
    U->>W: Request protected page
    W->>M: Check auth
    M->>A: Verify JWT
    A-->>M: Valid session
    M-->>W: Allow request
    W-->>U: Render page
```

### Entity CRUD Flow

```mermaid
sequenceDiagram
    participant U as User
    participant W as Web App
    participant V as Validation
    participant A as API Route
    participant R as Repository
    participant D as Database

    U->>W: Submit form
    W->>V: Validate input (Zod)
    alt Validation fails
        V-->>W: Validation errors
        W-->>U: Display errors
    else Validation passes
        V-->>W: Valid data
        W->>A: POST /api/entity
        A->>A: Check auth
        A->>R: createEntity(input)
        R->>D: INSERT with RLS
        D-->>R: New record
        R-->>A: Result<Entity, Error>
        A-->>W: 201 Created + data
        W-->>U: Success toast + redirect
    end
```

---

## Key Architectural Decisions

### 1. Authentication Strategy

**Decision:** Supabase Auth with JWT tokens

**Rationale:**
- Built-in RLS integration for data isolation
- OAuth provider support (Google, GitHub, etc.)
- Session management handled by platform
- Secure token refresh mechanism

### 2. Data Access Pattern

**Decision:** Repository pattern with Result types

**Rationale:**
- Explicit error handling (no thrown exceptions)
- Type-safe database operations
- Testable data layer
- RLS policies at database level

### 3. API Design

**Decision:** RESTful routes with typed contracts

**Rationale:**
- Standard HTTP methods (GET, POST, PATCH, DELETE)
- Consistent response format (`{ success, data, error }`)
- OpenAPI documentation
- Type generation from database schema

### 4. State Management

**Decision:** Server components + React Query for client state

**Rationale:**
- Minimize client-side JavaScript
- Automatic cache invalidation
- Optimistic updates where appropriate
- SSR-first approach


---

## Integration Points

### External Service Integration

| Service | Purpose | Integration Method | Error Handling |
|---------|---------|-------------------|----------------|
| Supabase Auth | User authentication | SDK + JWT | Redirect to login |
| Supabase DB | Data persistence | SDK + REST | Result type errors |
| Supabase Storage | File uploads | SDK | Upload retry logic |
| Email (Resend) | Transactional email | REST API | Queue for retry |
| Analytics | Event tracking | JS SDK | Fire and forget |

### Webhook Endpoints

| Endpoint | Source | Verification | Handler |
|----------|--------|--------------|---------|
| `/api/webhooks` | External services | HMAC signature | Event router |
| `/api/auth/callback` | OAuth providers | State parameter | Session creation |

---

## Security Architecture

### Authentication Layers

```mermaid
flowchart TB
    subgraph Client
        U[User Browser]
    end

    subgraph Edge["Edge Layer"]
        M[Middleware]
        RL[Rate Limiter]
    end

    subgraph App["Application Layer"]
        A[API Routes]
        V[Validation]
    end

    subgraph Data["Data Layer"]
        RLS[Row Level Security]
        DB[(PostgreSQL)]
    end

    U -->|"1. HTTPS Request"| M
    M -->|"2. Check JWT"| RL
    RL -->|"3. Rate Check"| A
    A -->|"4. Validate Input"| V
    V -->|"5. Query with auth.uid()"| RLS
    RLS -->|"6. Apply Policies"| DB

    style RLS fill:#f9f,stroke:#333
    style M fill:#bbf,stroke:#333
```

### RLS Policy Strategy

All tables with user data enforce Row Level Security:

```sql
-- Example: Users can only access their own data
CREATE POLICY "Users can view own data"
    ON entity
    FOR SELECT
    USING (auth.uid() = user_id);

-- Team access uses SECURITY DEFINER functions to avoid recursion
CREATE FUNCTION is_team_member(team_id UUID, user_id UUID)
RETURNS BOOLEAN AS $$
    SELECT EXISTS (SELECT 1 FROM team_members WHERE ...);
$$ LANGUAGE SQL SECURITY DEFINER STABLE;
```

---

## Deployment Architecture

```mermaid
flowchart TB
    subgraph Users
        U[End Users]
    end

    subgraph CDN["CDN (Vercel Edge)"]
        E[Edge Network]
        MW[Edge Middleware]
    end

    subgraph Compute["Compute (Vercel)"]
        SSR[Server Components]
        API[API Routes]
        ISR[Incremental Static Regen]
    end

    subgraph Supabase["Supabase Platform"]
        PG[(PostgreSQL)]
        AUTH[Auth Service]
        STOR[Storage]
        RT[Realtime]
    end

    subgraph Monitoring
        LOG[Logging]
        APM[Performance]
        ERR[Error Tracking]
    end

    U --> E
    E --> MW
    MW --> SSR
    MW --> API
    SSR --> PG
    API --> PG
    API --> AUTH
    API --> STOR
    SSR --> RT

    API --> LOG
    SSR --> APM
    API --> ERR
```

### Environment Configuration

| Environment | URL Pattern | Database | Purpose |
|-------------|-------------|----------|---------|
| Development | localhost:3000 | Local/Branch DB | Feature development |
| Preview | pr-*.vercel.app | Branch DB | PR review |
| Staging | staging.*.com | Staging DB | Pre-production testing |
| Production | *.com | Production DB | Live users |

---

## Appendix: Diagram Legend

### C4 Diagram Shapes

| Shape | Meaning |
|-------|---------|
| Person | Human user or actor |
| System | Software system (yours or external) |
| Container | Deployable unit (app, database, etc.) |
| Component | Module within a container |

### Relationship Lines

| Line Style | Meaning |
|------------|---------|
| Solid arrow | Direct dependency |
| Dashed arrow | Async/eventual |
| Double line | Bidirectional |

### Entity Relationship Cardinality

| Symbol | Meaning |
|--------|---------|
| `\|\|` | Exactly one |
| `o\|` | Zero or one |
| `\|{` | One or more |
| `o{` | Zero or more |

---

*Generated by Mental Models SDLC - Architecture-First Design*
