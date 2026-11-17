# Contributing to Zentra

Thank you for contributing to Zentra! This document outlines our branch strategy, commit message standards, development guidelines, and pull request workflows.

---

## 1. Git Branching Strategy

Zentra follows a structured Git branching model centered on two perpetual branches:

- **`main`**: Production-ready code. Every merge into `main` represents a production-tested release.
- **`develop`**: Primary integration branch for active development. All new features and bug fixes branch off from and merge back into `develop`.

```
           feature/employee-management
                  ┌──────────────┐
                  │              ▼
develop ──────────┴──────────────┴───────► merge into main on release
                                         │
main ────────────────────────────────────┴───────────────────────────► production
```

### Branch Naming Conventions

All branch names must follow standardized prefixes in lowercase with hyphen-separated words:

| Prefix | Description | Example |
| :--- | :--- | :--- |
| `feature/` | New features or capabilities | `feature/employee-management` |
| `fix/` | Bug fixes or issue resolutions | `fix/login-validation` |
| `chore/` | Maintenance, dependencies, or migrations | `chore/database-migration` |
| `docs/` | Documentation additions or updates | `docs/neon-setup-guide` |
| `refactor/` | Code refactoring without behavior changes | `refactor/tenant-context-service` |

### Development Workflow

1. **Pull the latest `develop` branch**:
   ```bash
   git checkout develop
   git pull origin develop
   ```

2. **Create a topic branch**:
   ```bash
   git checkout -b feature/employee-management
   ```

3. **Implement, format, and test**:
   ```bash
   pnpm test
   pnpm lint
   pnpm --recursive run build
   ```

4. **Commit with conventional messages** (see below).

5. **Push and open a Pull Request**:
   - Push your topic branch: `git push -u origin feature/employee-management`
   - Open a pull request targeting **`develop`**.
   - GitHub Actions will automatically provision an isolated Neon preview branch (`preview/pr-{number}`), run Prisma migrations, execute tests, and validate the build.

6. **Release to Production**:
   - When preparing a release, a pull request is opened from `develop` into `main`.

---

## 2. Commit Message Conventions

We adhere to the [Conventional Commits](https://www.conventionalcommits.org/) standard. Each commit message must be clear, concise, and prefixed with an appropriate type:

### Structure
```
<type>(<scope>): <short description in imperative present tense>

[optional body explaining motivation and context]
```

### Common Types & Examples
- `feat`: A new feature
  - *Example:* `feat: add employee invitation flow`
  - *Example:* `feat(auth): implement company registration flow`
- `fix`: A bug fix
  - *Example:* `fix: prevent duplicate user creation`
  - *Example:* `fix(api): handle token expiration gracefully`
- `chore`: Tooling, configuration, or database migration updates
  - *Example:* `chore: configure Neon database`
  - *Example:* `chore(deps): update prisma to latest stable`
- `docs`: Documentation changes
  - *Example:* `docs: add architecture documentation`
  - *Example:* `docs(readme): add local Docker setup instructions`
- `test`: Adding or updating test suites
  - *Example:* `test(auth): add duplicate email prevention test`
- `refactor`: Code changes that neither fix a bug nor add a feature
  - *Example:* `refactor(prisma): streamline RLS tenant context binding`

---

## 3. Pull Request Guidelines

1. **Ensure CI passes**: Linting, typechecking, Prisma schema validation, and unit tests must pass before approval.
2. **Neon Preview Branches**:
   - Pull requests trigger the `.github/workflows/neon-branch.yml` workflow.
   - An ephemeral Neon database branch is automatically spun up for testing.
   - When the pull request is closed or merged, the preview branch is automatically deleted.
3. **No Secrets in Code**: Never commit `.env` files, Neon connection strings, API tokens, or private credentials. Always configure secrets via environment variables or GitHub Secrets.
