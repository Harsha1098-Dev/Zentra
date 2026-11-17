# Zentra — Multi-Tenant HRMS SaaS Platform

Zentra is an enterprise-grade multi-tenant HRMS and Payroll SaaS platform designed as a scalable modular monolith.

## Core Product Rules

1. **One Global User Identity Per Person**: An individual maintains a single user identity across all organizations and products. Users never have separate accounts for Zentra People and Zentra Payroll.
2. **Strict Tenant Data Isolation**: Every tenant-owned table contains `organization_id`. `organization_id` is derived server-side from the authenticated session and is never accepted from client inputs for authorization.
3. **Product Entitlements**: Access to Zentra People and Zentra Payroll is governed by organizational subscriptions, not by user accounts.
4. **Tenant-Scoped RBAC**: Roles and permissions are strictly scoped to the active organization membership.
5. **No Duplicate User Accounts**: Globally unique, normalized lowercase email addresses. Inviting an existing email links their existing identity to the organization.
6. **Immutable Audit Logging**: All sensitive actions (registration, login, invitation, role assignment, password reset) are logged with sensitive data (passwords, tokens) strictly redacted.

---

## Tech Stack

- **Monorepo**: pnpm workspaces
- **Frontend**: Next.js 15, TypeScript, Tailwind CSS, Lucide Icons
- **Backend**: NestJS, TypeScript, Passport JWT, Zod
- **Database & Cache**: Neon Serverless PostgreSQL (Dual pooled & direct connections, RLS), Prisma ORM, Redis 7
- **CI / CD**: GitHub Actions (Lint, Typecheck, Unit Tests, Build, Neon Preview Branching)
- **Infra**: Docker Compose
- **Testing**: Jest, ts-jest

---

## Repository Structure

```
zentra/
├── apps/
│   ├── web/                    # Next.js 15 Web Application
│   │   └── src/app/            # App router pages (/, login, register, dashboard, etc.)
│   └── api/                    # NestJS REST API
│       ├── prisma/             # Prisma schema, migrations, and seed script
│       └── src/
│           ├── auth/           # Authentication & session endpoints
│           ├── users/          # Global user identity management
│           ├── organizations/  # Tenant management & invitations
│           ├── memberships/    # User-tenant memberships
│           ├── roles/          # RBAC roles
│           ├── permissions/    # Base system permissions
│           ├── audit/          # Audit logging with secret redaction
│           ├── health/         # GET /api/v1/health
│           └── common/         # Guards, pipes, decorators, filters
├── packages/
│   ├── shared-types/           # Shared TypeScript types, enums, & Zod schemas
│   └── ui/                     # Design-system Tailwind UI components
├── infra/
│   ├── docker/                 # Production & dev Dockerfiles (API & Web)
│   └── database/               # PostgreSQL init DDL scripts
├── docs/
│   ├── architecture.md         # Comprehensive architectural guide
│   ├── api.md                  # REST API specification
│   ├── database.md             # Entity-Relationship diagram & schema docs
│   └── setup.md                # Development, Neon, and CI/CD setup guide
├── .github/
│   └── workflows/
│       ├── ci.yml              # Monorepo CI verification pipeline
│       └── neon-branch.yml     # Automated Neon PR preview branch lifecycle
├── CONTRIBUTING.md             # Git branching, commit conventions, and PR flow
├── .env.example                # Template environment variables
├── docker-compose.yml          # Local multi-container development environment
├── package.json                # Root workspace configuration
└── pnpm-workspace.yaml         # pnpm workspace definition
```

---

## Quickstart with Docker Compose

The easiest way to run the entire platform (PostgreSQL, Redis, NestJS API, and Next.js Web) locally is via Docker Compose:

1. **Clone the repository and copy the environment file:**
   ```bash
   cp .env.example .env
   ```

2. **Start all services in detached mode:**
   ```bash
   docker compose up -d
   ```

3. **Verify running containers:**
   ```bash
   docker compose ps
   ```

4. **Access the applications:**
   - **Web Application**: [http://localhost:3000](http://localhost:3000)
   - **REST API**: [http://localhost:4000/api/v1](http://localhost:4000/api/v1)
   - **Health Check**: [http://localhost:4000/api/v1/health](http://localhost:4000/api/v1/health)

5. **Stop containers:**
   ```bash
   docker compose down
   ```

---

## Local Development (pnpm)

### Prerequisites
- Node.js >= 20.x
- pnpm >= 10.x
- PostgreSQL 16 & Redis running locally (or via Docker Compose: `docker compose up -d postgres redis`)

### 1. Install Dependencies
```bash
pnpm install
```

### 2. Configure Environment
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

### 3. Build Shared Packages
```bash
pnpm --filter @zentra/shared-types build
pnpm --filter @zentra/ui build
```

### 4. Database Setup
Generate Prisma client, apply migrations, and seed base roles and permissions:
```bash
pnpm db:generate
pnpm db:migrate
pnpm db:seed
```

### 5. Start Development Servers
Start both backend API and frontend web app concurrently:
```bash
pnpm dev
```
Or start individually:
```bash
pnpm dev:api   # API runs on http://localhost:4000/api/v1
pnpm dev:web   # Web runs on http://localhost:3000
```

---

## Running Automated Tests

Run backend unit and integration test suites:
```bash
pnpm test
```
To run tests with coverage reporting:
```bash
pnpm test:cov
```

All 17 test suites cover:
- Authentication & password hashing
- Duplicate email prevention (globally unique identity)
- Organization selection & token scoping
- Tenant data isolation & server-side session derivation
- Role-based permissions guard (`PermissionsGuard`)
- Employee invitations & user linking (avoiding duplicate user creation)
- Sensitive audit log sanitization (redacting passwords & tokens)

---

## Acceptance Criteria Walkthrough

1. **Register a Company**:
   - Navigate to [http://localhost:3000/register/company](http://localhost:3000/register/company).
   - Enter Company Name (e.g. `Acme Corp`), your name, work email, and password.
   - Click **Create Company & Account**.
   - Notice the Super Admin role assignment and 30-day Zentra People trial entitlement.
2. **Email Verification**:
   - In development mode, the verification link is displayed directly on the confirmation card (and logged in the API console).
   - Click the link or navigate to `/verify-email?token=<token>`.
3. **Log In**:
   - Navigate to [http://localhost:3000/login](http://localhost:3000/login).
   - Enter your credentials. Since you have exactly one organization, you are auto-directed into the organization dashboard.
4. **Organization Dashboard**:
   - See your company details, trial entitlement badge for Zentra People, and role badge (`SUPER_ADMIN`).
5. **Invite an Employee**:
   - Go to the **Team & Invitations** tab.
   - Enter an employee's email (e.g. `jane@acme.com`) and choose role (e.g. `EMPLOYEE` or `HR_ADMIN`).
   - Click **Send Invitation**.
   - Copy the invitation link shown in the success alert (`/invite/accept?token=<token>`).
6. **Accept Invitation & Log In as Employee**:
   - Open the invitation link in an incognito window or log out.
   - Enter the employee's name and set a password.
   - Sign in as the employee. Notice they are restricted to permitted self-service views and cannot access administrative modules.
7. **Duplicate Email Prevention**:
   - Try to register or invite the same email again; the system reuses the existing user identity and links memberships without creating a duplicate record.
8. **Audit Logs**:
   - Log back in as Super Admin and view the **Audit Logs** tab to inspect recorded events for user registration, login, invitation, and role assignment.
