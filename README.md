# AI ToolBox

AI ToolBox is a full-stack application for collecting, organizing, reviewing and discovering AI tools.

The project uses Laravel, Next.js, MySQL, Redis, Docker Compose, Laravel Sanctum, Email 2FA, role-based access control, an admin approval workflow, an audit log and Tailwind CSS.

## Main Features

- User authentication with Laravel Sanctum
- Email 2FA with a 6-digit verification code
- Role-aware dashboard and navigation
- AI tool CRUD
- Categories, tags and recommended roles
- Screenshot upload
- Tool approval workflow
- Admin panel for pending / approved / rejected tools
- Filters by name, category, role, tag and status
- Redis caching
- Audit log for important user and tool actions
- Responsive frontend

## Project Structure

```text
full-stack-starter-kit/
├── backend/
│   ├── app/
│   ├── database/
│   ├── routes/
│   └── .env
├── frontend/
│   ├── src/
│   ├── package.json
│   └── postcss.config.mjs
├── docker/
├── nginx/
├── mysql/
└── docker-compose.yml
```

## Requirements

Install:

- Docker Desktop
- WSL 2 on Windows
- Git

Docker Desktop must have WSL integration enabled.

## Installation

```bash
git clone <repository-url>
cd full-stack-starter-kit
```

If needed:

```bash
cd backend
cp .env.example .env
cd ..
```

Local URLs:

```text
Frontend: http://localhost:8200
Backend:  http://localhost:8201
MySQL:    localhost:8203
Redis:    localhost:8204
```

## Start With Docker

```bash
docker compose up -d
docker compose ps
```

Expected services:

```text
frontend
backend
php_fpm
mysql
redis
tools
```

Run migrations:

```bash
docker compose exec php_fpm php artisan migrate
```

Clear Laravel caches after config changes:

```bash
docker compose exec php_fpm php artisan optimize:clear
```

Create the storage link if needed:

```bash
docker compose exec php_fpm php artisan storage:link
```

## Authentication

Authentication uses Laravel Sanctum with cookie-based SPA authentication.

Login flow:

```text
Email + Password
      ↓
Credentials validated
      ↓
6-digit Email 2FA code generated
      ↓
Code verification
      ↓
Authenticated session
      ↓
Dashboard
```

For local development, the mailer can be set to `log`. Then the verification code is available in:

```text
backend/storage/logs/laravel.log
```

## Roles and Permissions

Current user roles include:

- `owner`
- `backend`
- `frontend`

Typical access:

| Function | Owner | Backend | Frontend |
|---|---|---|---|
| Dashboard | Yes | Yes | Yes |
| View approved tools | Yes | Yes | Yes |
| Add a tool | Yes | Yes | Yes |
| Profile | Yes | Yes | Yes |
| Admin tool review | Yes | No | No |
| Audit log | Yes | No | No |

Frontend navigation is role-aware, but authorization is also enforced on the Laravel backend.

## Adding an AI Tool

After login:

1. Open `Add Tool`.
2. Enter the tool name.
3. Enter the website URL.
4. Optionally add official documentation.
5. Add a description.
6. Add usage information.
7. Add examples if available.
8. Select categories.
9. Select recommended roles.
10. Select tags.
11. Optionally upload a screenshot.
12. Save the tool.

New tools are created with:

```text
status = pending
```

They become visible in the standard tools list only after owner approval.

## Tool Approval

Owners can open:

```text
/admin/tools
```

The admin panel supports:

- all tools
- pending tools
- approved tools
- rejected tools
- filters by status
- filters by category
- filters by recommended role
- name search
- approve action
- reject action with reason

Approval flow:

```text
New Tool
   ↓
Pending
   ↓
Admin Review
   ├── Approve → Approved → Visible in Tools
   └── Reject  → Rejected
```

## Audit Log

Owners can open:

```text
/admin/activity
```

The audit log records important actions such as:

- user login
- user logout
- tool created
- tool updated
- tool approved
- tool rejected
- tool deleted

## Redis Cache

Redis is used through Laravel's cache system.

Examples of cached data:

- categories
- tool status counts

Categories are suitable for longer caching because they change infrequently. Tool statistics use a shorter cache lifetime and are invalidated when tool state changes.

## Useful Commands

```bash
docker compose up -d
docker compose down
docker compose ps
docker compose exec php_fpm php artisan route:list
docker compose exec php_fpm php artisan migrate:status
docker compose exec php_fpm php artisan optimize:clear
docker compose exec php_fpm php artisan tinker
docker compose logs --tail=100 frontend
docker compose logs --tail=100 php_fpm
```

Avoid `docker compose down -v` unless persistent data removal is intentional.

## Troubleshooting

### Frontend does not start

```bash
docker compose ps
docker compose logs --tail=150 frontend
```

The frontend requires Node 20.

### 419 CSRF error

Check:

- `credentials: "include"` in frontend requests
- Sanctum CSRF cookie initialization
- `X-XSRF-TOKEN` on protected POST requests
- CORS paths
- consistent use of `localhost`

### New tool is not visible

This is expected until an owner approves it.

Check:

```bash
docker compose exec php_fpm php artisan tinker
```

```php
App\Models\Tool::select('id', 'name', 'status')->latest()->get()->toArray();
```

## Security

Implemented:

- password hashing
- Laravel Sanctum
- CSRF protection
- Email 2FA
- backend role middleware
- rate limiting
- temporary OTP expiry
- audit logging

Potential future improvements:

- 2FA recovery codes
- Google Authenticator / TOTP
- email verification
- more granular permissions
- automated security tests
- security headers
- production mail provider
- centralized logging

## Future Improvements

Possible future features:

- comments on tools
- star ratings
- favorites
- saved collections
- comparison tools
- admin analytics
- notifications when tools are approved or rejected
- Google Authenticator 2FA
- password reset
- pagination improvements
- richer audit filters
- backend API tests
- frontend integration tests

## Development Documentation

See:

```text
docs/AI_AGENTS.md
docs/AGENT_START_PROMPTS.md
```

## License

Add the appropriate project license before public distribution.
