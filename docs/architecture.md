# Zentra Platform Architecture

Zentra is a multi-tenant SaaS HRMS and Payroll platform designed as a scalable modular monolith.

## Core Architectural Pillars

```
┌────────────────────────────────────────────────────────────────────────┐
│                          GLOBAL USER IDENTITY                          │
│        (One email, one password, one identity across all tenants)      │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ belongs to
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                        ORGANIZATION MEMBERSHIP                         │
│           (Scopes the user to an organization with active roles)       │
└───────────────────┬────────────────────────────────┬───────────────────┘
                    │                                │
                    ▼                                ▼
       ┌────────────────────────┐      ┌─────────────────────────┐
       │      TENANT DATA       │      │   PRODUCT ENTITLEMENT   │
       │    organization_id     │      │   - Zentra People       │
       │   strict isolation     │      │   - Zentra Payroll      │
       └────────────────────────┘      └─────────────────────────┘
```

### 1. Unified Global Identity (Single User Identity)
- Each individual person has **exactly one** global user record (`User`), keyed by a globally unique, normalized lowercase email address.
- A user never has separate accounts for Zentra People and Zentra Payroll.
- A single user may belong to one or more organizations via `OrganizationMembership`.
- When an employee is invited to a new organization, the system checks for an existing user identity and links the existing account rather than creating a duplicate.

### 2. Tenant Isolation & Active Organization Derivation
- **Every tenant-owned table** strictly includes `organization_id`.
- The client is **never trusted** to specify `organization_id` for authorization.
- The active organization is derived securely from the authenticated session / JWT (`sub: userId, orgId: organizationId`).
- If an endpoint includes an `:organizationId` route parameter (e.g., invitations), the system verifies that the parameter matches the active session organization (`req.user.organizationId`), rejecting mismatches with `403 Forbidden`.

### 3. Product Entitlements
- Access to products (`ZENTRA_PEOPLE`, `ZENTRA_PAYROLL`) is controlled at the organization level via `OrganizationProduct` records.
- Creating a company automatically activates a 30-day trial entitlement for `ZENTRA_PEOPLE`.
- Future products (e.g., Zentra Payroll) are unlocked via organizational subscription without altering user identity.

### 4. Role-Based Access Control (RBAC)
- Roles and permissions are scoped to the active organization membership (`UserRole` -> `Role` -> `RolePermission` -> `Permission`).
- Base System Roles:
  - `SUPER_ADMIN`: Full administrative control across the organization.
  - `HR_ADMIN`: Team management, invitations, user management, and audit logs.
  - `MANAGER`: Department and team view permissions.
  - `EMPLOYEE`: Self-service employee access.
- `PermissionsGuard` enforces that:
  1. The user is authenticated.
  2. The user has an active, un-suspended membership in the session's active organization.
  3. The user holds all required permissions for the endpoint.

### 5. Sensitive Action Audit Logging
- All sensitive operations are recorded in `AuditLog` with:
  - `organization_id`
  - `actor_user_id`
  - `action` (e.g., `USER_REGISTER`, `LOGIN_SUCCESS`, `INVITATION_SENT`, `ROLE_ASSIGN`)
  - `entity_type` & `entity_id`
  - `old_values` & `new_values`
  - `ip_address` & `user_agent`
  - `created_at`
- **Zero-Secret Logging**: Passwords, hashes, tokens, refresh tokens, and credentials are automatically sanitized to `[REDACTED]` prior to persistence.

### 6. Neon Serverless PostgreSQL & Row-Level Security (RLS)
- **Primary Database**: Neon PostgreSQL serves both production and development environments.
- **Dual Connections**:
  - `DATABASE_URL`: Connection pooler (`-pooler` hostname) for application runtime.
  - `DIRECT_DATABASE_URL`: Direct connection compute endpoint for Prisma migrations and schema introspection.
- **PostgreSQL Row-Level Security**:
  - All tenant-owned tables enforce RLS (`FORCE ROW LEVEL SECURITY`).
  - Isolated database role `zentra_app` executes application queries without `BYPASSRLS`.
  - `app.current_organization_id` is set per request; without active tenant context, access to tenant data is completely prevented at the PostgreSQL engine level.
- **Neon Branching**: Development, testing, and migration verification are isolated on Neon database branches before deploying to production.


---

## Modular Monolith Structure (NestJS)

Direct cross-module database access is prohibited. Modules interact strictly via exported service interfaces:

```
apps/api/src/
├── auth/            # Registration, login, token refresh, forgot/reset password
├── users/           # User lifecycle and email normalization
├── organizations/   # Organization tenancy, product entitlement, invitations
├── memberships/     # Membership status and user-organization relations
├── roles/           # RBAC roles and membership role assignments
├── permissions/     # Permission definitions
├── audit/           # Audit logging with automatic secret redaction
└── health/          # Health check endpoint
```
