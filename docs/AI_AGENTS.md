# AI Agent Development Guide

## Purpose

This document gives future AI development agents enough context to work safely on the project.

## Core Rule

Always extend the existing application.

Do not replace working modules with simplified versions.

Before changing a file:

1. Read the existing file.
2. Identify existing functionality.
3. Preserve that functionality.
4. Make the smallest required change.
5. Validate routes, migrations and behavior after the change.

## Existing Functional Areas

### Authentication

The application uses Laravel Sanctum and includes:

- email/password login
- CSRF protection
- cookie-based sessions
- email 2FA
- logout

Do not bypass 2FA in future auth work.

### User Roles

Current roles include:

- owner
- backend
- frontend

Authorization must be enforced on the backend. Hiding frontend links is not sufficient.

### Tools

Tools support:

- create
- read
- update
- delete
- categories
- recommended roles
- tags
- documentation URL
- description
- usage
- examples
- difficulty
- screenshots

New tools are submitted as `pending`. Only approved tools appear in the normal list.

### Admin Workflow

Owners can:

- view all tools
- filter tools
- approve tools
- reject tools
- view status counts
- view the audit log

### Audit Log

Important actions include:

- login
- logout
- tool creation
- tool update
- approval
- rejection
- deletion

### Redis

Redis is used for:

- Laravel cache
- temporary 2FA state
- cached categories
- cached tool statistics

When changing cached data, remember invalidation.

## Docker Development

Ports:

```text
8200 - Next.js
8201 - Laravel/Nginx
8202 - PHP-FPM
8203 - MySQL
8204 - Redis
8205 - tools container
```

The frontend uses Node 20 Alpine.

Avoid mixing Windows-generated `node_modules` with Linux container dependencies.

## Safe Change Workflow

Before implementing a task, inspect:

```bash
docker compose ps
docker compose exec php_fpm php artisan route:list
docker compose exec php_fpm php artisan migrate:status
```

For Laravel changes:

```bash
docker compose exec php_fpm php artisan optimize:clear
```

For frontend changes:

```bash
docker compose restart frontend
docker compose logs --tail=100 frontend
```

For database changes:

- use additive migrations
- do not rewrite migrations that already ran
- do not use `migrate:fresh` unless data loss is explicitly intended

## Important Constraints

Do not:

- delete existing users
- remove existing roles
- replace the Tool model with a reduced version
- remove existing relationships
- remove Sanctum
- bypass backend authorization
- use `docker compose down -v` casually
- mix `localhost` and `127.0.0.1` in auth configuration without checking cookies and Sanctum

## Frontend Conventions

Important pages:

```text
/login
/verify-2fa
/dashboard
/tools
/tools/new
/tools/[id]
/tools/[id]/edit
/profile
/admin
/admin/tools
/admin/activity
```

The authenticated shared layout uses `AppShell`.

Preserve the current Tailwind design and responsive behavior.

## Backend Conventions

Protected API routes use Sanctum.

Admin routes additionally require the owner role.

When adding a new admin endpoint, follow:

```text
auth:sanctum
+
owner role middleware
```

Validate incoming data using Laravel validation or Form Requests.

## Testing Checklist

After a meaningful change, test:

1. Login loads.
2. Valid credentials trigger 2FA.
3. Valid 2FA authenticates.
4. Dashboard loads.
5. Tools list loads.
6. New tool can be submitted.
7. New tool is pending.
8. Owner sees pending tool.
9. Owner can approve it.
10. Approved tool appears in the normal list.
11. Non-owner cannot access admin API.
12. Audit log records important actions.
13. Categories and filters load.
14. Logout works.

## Documentation Expectations

When adding a major feature, update:

- README if setup or usage changes
- this file if architecture changes
- AGENT_START_PROMPTS.md if startup context changes
