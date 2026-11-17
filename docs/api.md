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
