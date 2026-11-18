# Zentra API Specification

Base URL: `http://localhost:4000/api/v1`

All requests expecting authentication require the header:
```http
Authorization: Bearer <access_token>
```

---

## 1. Authentication Endpoints

### Register Company
`POST /auth/register-company`

Creates user, organization, membership, assigns `SUPER_ADMIN`, and starts `ZENTRA_PEOPLE` 30-day trial.

**Request Body:**
```json
{
  "companyName": "Acme Technologies",
  "firstName": "Alex",
  "lastName": "Smith",
  "email": "alex@acme.com",
  "password": "Password123!"
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "message": "Company registered successfully. A verification email has been sent to your address.",
  "user": {
    "id": "c1f7a0b2-...",
    "email": "alex@acme.com",
    "firstName": "Alex",
    "lastName": "Smith",
    "isEmailVerified": false
  },
  "organization": {
    "id": "e8d2c1a4-...",
    "name": "Acme Technologies",
    "slug": "acme-technologies-a1b2"
  }
}
```

---

### Login
`POST /auth/login`

Validates credentials, returns JWT tokens and available organizations. If exactly 1 organization exists, auto-selects it.

**Request Body:**
```json
{
  "email": "alex@acme.com",
  "password": "Password123!"
}
```

**Response (200 OK):**
```json
{
  "accessToken": "eyJhbGciOi...",
  "refreshToken": "4a7f...",
  "user": {
    "id": "c1f7a0b2-...",
    "email": "alex@acme.com",
    "firstName": "Alex",
    "lastName": "Smith",
    "isEmailVerified": true,
    "status": "ACTIVE",
    "createdAt": "2026-11-17T12:00:00.000Z"
  },
  "organizations": [
    {
      "id": "e8d2c1a4-...",
      "name": "Acme Technologies",
      "slug": "acme-technologies-a1b2",
      "status": "ACTIVE",
      "role": { "id": "...", "name": "Super Admin", "code": "SUPER_ADMIN" },
      "products": [{ "code": "ZENTRA_PEOPLE", "status": "TRIAL", "trialEndsAt": "..." }]
    }
  ],
  "activeOrganizationId": "e8d2c1a4-..."
}
```

---

### Refresh Tokens
`POST /auth/refresh`

Rotates refresh tokens and issues fresh access token.

**Request Body:**
```json
{
  "refreshToken": "4a7f..."
}
```

---

### Logout
`POST /auth/logout`

Revokes the refresh token.

---

### Forgot Password
`POST /auth/forgot-password`

**Request Body:**
```json
{
  "email": "alex@acme.com"
}
```

---

### Reset Password
`POST /auth/reset-password`

**Request Body:**
```json
{
  "token": "reset_token_hex",
  "password": "NewSecurePassword123!"
}
```

---

### Verify Email
`POST /auth/verify-email`

**Request Body:**
```json
{
  "token": "verification_token_hex"
}
```

---

### Resend Verification
`POST /auth/resend-verification`

**Request Body:**
```json
{
  "email": "alex@acme.com"
}
```

---

## 2. User & Session Endpoints

### Get Current User Profile & Active Context
`GET /me`

Returns user profile, active organization summary, roles, and permissions in the current organization.

---

### Get User Organizations
`GET /me/organizations`

Returns all active organizations the user belongs to.

---

### Select Active Organization
`POST /me/select-organization`

Switches the active organization context and issues an organization-scoped JWT.

**Request Body:**
```json
{
  "organizationId": "e8d2c1a4-..."
}
```

---

## 3. Team Invitations Endpoints

### Invite Employee to Organization
`POST /organizations/:organizationId/invitations`
*(Requires permission `user.invite`)*

**Request Body:**
```json
{
  "email": "employee@acme.com",
  "roleId": "role-uuid-here",
  "firstName": "John",
  "lastName": "Doe"
}
```

---

### Accept Invitation
`POST /invitations/:token/accept`
*(Public endpoint)*

**Request Body:**
```json
{
  "password": "Password123!",
  "firstName": "John",
  "lastName": "Doe"
}
```

---

## 4. RBAC & Audit Endpoints

### List Available Roles
`GET /roles`
*(Requires permission `role.read`)*

---

### List System Permissions
`GET /permissions`
*(Requires permission `permission.read`)*

---

### Get Organization Audit Logs
`GET /audit-logs?limit=50&offset=0`
*(Requires permission `audit.read`)*

---

### Health Check
`GET /health`
*(Public)*

Returns database and redis health status.


---

## 5. Organization Setup Endpoints (Zentra People)

All endpoints below require authentication with an active organization membership context. `organization_id` is derived from the JWT session and never accepted from client query/body.

### Company Profile
- `GET /organizations/current/profile` - Get company profile details. (Requires `organization.read`)
- `PATCH /organizations/current/profile` - Update company profile information, contact, and identifiers. (Requires `organization.update`)
- `POST /organizations/current/profile/logo` - Upload company logo (PNG/JPG/WebP/SVG, max 5MB, multipart `file`). (Requires `organization.logo.manage`)
- `DELETE /organizations/current/profile/logo` - Remove current company logo. (Requires `organization.logo.manage`)

### Locations
- `GET /locations?status=ACTIVE&search=...` - List locations for active organization. (Requires `location.read`)
- `POST /locations` - Create a new location (supports `isHeadquarters`). (Requires `location.create`)
- `GET /locations/:id` - Get location by UUID. (Requires `location.read`)
- `PATCH /locations/:id` - Update location details. (Requires `location.update`)
- `PATCH /locations/:id/activate` - Re-activate a deactivated location. (Requires `location.activate`)
- `PATCH /locations/:id/deactivate` - Soft deactivate a location. (Requires `location.deactivate`)

### Departments
- `GET /departments?status=ACTIVE&search=...` - List departments with parent name. (Requires `department.read`)
- `POST /departments` - Create a department with optional parent department. (Requires `department.create`)
- `GET /departments/:id` - Get department details. (Requires `department.read`)
- `PATCH /departments/:id` - Update department (includes circular hierarchy prevention). (Requires `department.update`)
- `PATCH /departments/:id/activate` - Re-activate a department. (Requires `department.activate`)
- `PATCH /departments/:id/deactivate` - Soft deactivate department (prohibited if child units exist). (Requires `department.deactivate`)
- `GET /departments/tree` - Get full hierarchical recursive department tree structure. (Requires `department.read`)

### Job Designations
- `GET /designations?status=ACTIVE&departmentId=...` - List designations with linked dept & grade. (Requires `designation.read`)
- `POST /designations` - Create a new designation. (Requires `designation.create`)
- `GET /designations/:id` - Get designation details. (Requires `designation.read`)
- `PATCH /designations/:id` - Update designation. (Requires `designation.update`)
- `PATCH /designations/:id/activate` - Re-activate designation. (Requires `designation.activate`)
- `PATCH /designations/:id/deactivate` - Soft deactivate designation. (Requires `designation.deactivate`)

### Employee Grades & Bands
- `GET /grades?status=ACTIVE` - List employee grades sorted by level ascending. (Requires `grade.read`)
- `POST /grades` - Create a grade band with positive integer level rank. (Requires `grade.create`)
- `GET /grades/:id` - Get grade details. (Requires `grade.read`)
- `PATCH /grades/:id` - Update grade details. (Requires `grade.update`)
- `PATCH /grades/:id/activate` - Re-activate grade. (Requires `grade.activate`)
- `PATCH /grades/:id/deactivate` - Soft deactivate grade. (Requires `grade.deactivate`)

### Workweek Configuration
- `GET /workweek` - Get organization workweek configuration and daily shift hours. (Requires `workweek.read`)
- `PATCH /workweek` - Update working days, shift start/end hours, unpaid break, and timezone. (Requires `workweek.update`)

### Holidays
- `GET /holidays?year=2026&locationId=...` - List holidays for a given year or location. (Requires `holiday.read`)
- `POST /holidays` - Create a holiday (Public, Optional, Restricted, annual recurring). (Requires `holiday.create`)
- `PATCH /holidays/:id` - Update holiday. (Requires `holiday.update`)
- `DELETE /holidays/:id` - Delete holiday. (Requires `holiday.delete`)

### Organization Chart
- `GET /organization-chart` - Aggregated public structure returning company profile, location hubs, recursive department tree, designations, and grade hierarchy. (Requires `organization_chart.read`)

---

## 6. Employee Management Endpoints

All employee operations are strictly scoped to the active organization (`organization_id` derived from the session membership). Role-based field masking automatically removes sensitive personal details (personal email, birth date, residential addresses, emergency contacts) when accessed by non-administrative team members.

### Directory & Lifecycle
- `GET /employees` - Search, filter, and paginate employees. Supports filters for `search`, `departmentId`, `locationId`, `designationId`, `gradeId`, `employmentType`, `status`, `page`, `limit`, `sortBy`, `sortOrder`. (Requires `employee.read_basic`)
- `POST /employees` - Create a new employee record. Supports automatic sequence generation (e.g. `ZEN-0001`). Can optionally create and send an organization invitation or save without an account. (Requires `employee.create`)
- `GET /employees/next-code` - Generate the next sequential preview employee code. (Requires `employee.create`)
- `GET /employees/me` - Self-service profile for the authenticated employee (full personal details without colleague masking). (Requires `employee.read_basic`)
- `GET /employees/:id` - Get employee details by ID. (Requires `employee.read_basic`)
- `GET /employees/:id/profile` - Comprehensive profile with placement, reporting structure, and reverse-chronological timeline. (Requires `employee.read_basic`)
- `PATCH /employees/:id` - Update general employee details, addresses, emergency contacts, probation date, and custom fields. (Requires `employee.update`)
- `DELETE /employees/:id` - Soft delete employee record (sets `deleted_at`). (Requires `employee.delete`)

### Lifecycle & Transfer Transitions
Each lifecycle transition updates the employee state and immutably records an event in `EmploymentHistory`:
- `PATCH /employees/:id/status` - Transition employee lifecycle status (`ACTIVE`, `ON_PROBATION`, `ON_NOTICE_PERIOD`, `ON_LONG_LEAVE`, `SUSPENDED`, `INACTIVE`, `RESIGNED`, `TERMINATED`, `EXITED`). (Requires `employee.status.manage`)
- `PATCH /employees/:id/reporting-manager` - Reassign reporting manager with upward ancestor cycle detection and active status validation. (Requires `employee.reporting_manager.manage`)
- `PATCH /employees/:id/department` - Transfer employee to a new department. (Requires `employee.department.manage`)
- `PATCH /employees/:id/designation` - Change employee designation / promotion. (Requires `employee.designation.manage`)
- `PATCH /employees/:id/location` - Transfer employee to a different office location. (Requires `employee.location.manage`)
- `PATCH /employees/:id/employment-type` - Change employment contract type (`FULL_TIME`, `PART_TIME`, `CONTRACT`, `INTERN`, `CONSULTANT`, `TEMPORARY`). (Requires `employee.employment_type.manage`)

### Org Tree & Team
- `GET /employees/:id/timeline` - Get reverse-chronological timeline of employee lifecycle and milestone events. (Requires `employee.timeline.read`)
- `GET /employees/:id/employment-history` - Get immutable audit trail of employment state transitions. (Requires `employee.employment_history.read`)
- `GET /employees/:id/reportees` - Get direct and indirect reportees for a manager. (Requires `employee.read_basic`)
- `GET /employees/:id/reporting-structure` - Get hierarchical structure (manager, upward leadership chain, and direct reportees). (Requires `employee.read_basic`)

### Bulk Import & Export
- `GET /employees/import-template` - Download standard CSV template with headers and sample rows. (Requires `employee.import`)
- `POST /employees/import` - Validate and execute CSV import. When `dryRun: true`, validates data without DB mutation and returns row preview and errors. When `dryRun: false`, executes import and returns job summary. (Requires `employee.import`)
- `GET /employees/import/:importId` - Get status and statistics of an import job. (Requires `employee.import`)
- `GET /employees/import/:importId/errors` - Download CSV error report for failed rows. (Requires `employee.import`)
- `POST /employees/export` - Generate role-scoped CSV export with customized query filters. (Requires `employee.export`)
- `GET /employees/export/:exportId` - Download the generated CSV export file. (Requires `employee.export`)

