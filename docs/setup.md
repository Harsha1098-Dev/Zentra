# Zentra Development & Setup Guide

This guide walks you through setting up and running **Zentra** locally and configuring Neon PostgreSQL and GitHub Actions.

---

## 1. Prerequisites

Ensure your system has the following installed:
- **Node.js**: v20.x or v22.x LTS
- **pnpm**: v9.x or v10.x (`npm install -g pnpm`)
- **Docker & Docker Compose**: v20+
- **Git**

---

## 2. Environment Configuration

1. Clone the repository:
   ```bash
   git clone https://github.com/Harsha1098-Dev/Zentra.git
   cd Zentra
   ```

2. Copy the environment template:
   ```bash
   cp .env.example .env
   cp .env.example apps/api/.env
   ```

3. Configure your Neon PostgreSQL connection strings:
   Open `.env` and configure:
   ```env
   # Neon Pooled Connection (Used by NestJS runtime)
   DATABASE_URL="postgresql://neondb_owner:YOUR_PASSWORD@ep-xxxx-pooler.us-east-2.aws.neon.tech/neondb?sslmode=require"

   # Neon Direct Connection (Used only by Prisma Migrate and Studio)
   DIRECT_DATABASE_URL="postgresql://neondb_owner:YOUR_PASSWORD@ep-xxxx.us-east-2.aws.neon.tech/neondb?sslmode=require"
   ```

   > [!IMPORTANT]
   > - `DATABASE_URL` contains `-pooler` in the hostname and uses PgBouncer in transaction pooling mode.
   > - `DIRECT_DATABASE_URL` does NOT contain `-pooler` and connects directly to the compute engine.
   > - Keep Prisma connection limit low (`connection_limit=2`) for API server instances.

---

## 3. Database Initialization & Migrations

1. Install monorepo dependencies:
   ```bash
   pnpm install
   ```

2. Generate Prisma Client:
   ```bash
   pnpm db:generate
   ```

3. Apply existing migrations to your Neon database:
   ```bash
   pnpm db:deploy
   ```

4. Seed default system roles and permissions:
   ```bash
   pnpm db:seed
   ```

---

## 4. Running the Application Locally

### Option A: Local Dev Servers (Recommended)

1. Start Redis using Docker Compose:
   ```bash
   docker compose up -d redis
   ```

2. Start both API and Web concurrently:
   ```bash
   pnpm dev
   ```
   Or start them individually:
   - Backend API (`http://localhost:4000/api/v1`):
     ```bash
     pnpm dev:api
     ```
   - Frontend Web App (`http://localhost:3000`):
     ```bash
     pnpm dev:web
     ```

### Option B: Full Docker Compose

Run all services containerized:
```bash
docker compose up -d
```

> [!NOTE]
> Neon PostgreSQL serves as the primary database for both production and development. The local `postgres` container in `docker-compose.yml` has `profiles: ["offline"]` and is reserved for offline local development only.

---

## 5. Testing & Verification

Run the test suite across all modules:
```bash
pnpm test
```

This verifies:
- Authentication & JWT token issuance/refresh
- Single user identity & duplicate email prevention
- Tenant isolation and PostgreSQL Row-Level Security (RLS)
- Organization invitations and user linking
- Organization setup and employee lifecycle transitions

---

## 6. GitHub Actions & Neon Preview Branching

To enable automated preview database branches on pull requests:

1. In your GitHub repository, navigate to **Settings > Secrets and variables > Actions**.
2. Add these repository secrets:
   - `NEON_API_KEY`: Generated from your Neon Console under Account Settings > API Keys.
   - `NEON_PROJECT_ID`: Found in your Neon Project Settings (e.g., `ep-silent-art-bdvrk9iw` or project identifier).
3. When any pull request is opened or updated targeting `develop` or `main`:
   - `.github/workflows/neon-branch.yml` automatically invokes `neondatabase/create-branch-action` to provision an isolated copy-on-write database branch named `preview/pr-{number}`.
   - Runs Prisma migrations against the preview branch.
   - Executes the test suite against the ephemeral database.
   - When the pull request is closed or merged, `neondatabase/delete-branch-action` automatically destroys the preview branch.
