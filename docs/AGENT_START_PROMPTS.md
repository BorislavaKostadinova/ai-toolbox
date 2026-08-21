# AI Development Agent - Starter Prompts

## 1. General Project Startup Prompt

You are continuing development of an existing full-stack AI ToolBox project.

Technology:
- Laravel backend
- Next.js App Router frontend
- MySQL
- Redis
- Docker Compose
- Laravel Sanctum
- Email 2FA
- Tailwind CSS

Important rule:
Do not rebuild or simplify existing functionality. Inspect the current implementation first and extend it.

Existing functionality includes:
- login/logout
- Email 2FA
- users and roles
- dashboard
- user profile
- AI tool CRUD
- categories
- recommended tool roles
- tags
- screenshot upload
- pending/approved/rejected tool workflow
- owner-only admin panel
- approve/reject actions
- Redis caching
- audit log
- responsive role-aware navigation

Before changing code:
1. Inspect relevant files.
2. Inspect Laravel routes.
3. Preserve existing functionality.
4. Use additive migrations for schema changes.
5. Provide complete files when replacing files.
6. Give exact Docker / Laravel commands after changes.
7. Test the complete affected flow.

Development URLs:
- Frontend: http://localhost:8200
- Backend: http://localhost:8201

Do not use migrate:fresh or docker compose down -v unless explicitly requested.

Task:
[INSERT NEW TASK HERE]

## 2. Backend Feature Prompt

Review the existing Laravel implementation before making changes.

Preserve:
- Sanctum authentication
- Email 2FA
- user roles
- tool CRUD
- approval workflow
- activity logging
- Redis caching

Implement the requested backend feature with:
- validation
- authorization
- appropriate relationships
- additive migrations if needed
- audit logging for important state changes
- cache invalidation where relevant

After implementation provide:
- files changed
- complete code for changed files
- artisan commands
- route verification commands
- manual test steps

Task:
[INSERT BACKEND TASK]

## 3. Frontend Feature Prompt

Review the current Next.js App Router structure and AppShell before editing.

Preserve the current Tailwind visual design and responsive layout.

Do not change existing auth behavior.

Any admin UI must also have backend authorization; frontend visibility alone is not security.

Provide complete TSX files rather than partial snippets.

After implementation provide:
- exact file paths
- restart command
- browser test flow

Task:
[INSERT FRONTEND TASK]

## 4. Debugging Prompt

Debug the existing project without rewriting unrelated functionality.

Environment:
- Windows
- WSL 2
- Docker Desktop
- Docker Compose
- frontend on localhost:8200
- backend on localhost:8201

Use evidence from:
- docker compose ps
- frontend logs
- php_fpm logs
- Laravel logs
- route:list
- browser Network status codes

Identify the failing layer first:
1. browser
2. Next.js
3. CORS / CSRF / Sanctum
4. Nginx
5. Laravel
6. database / Redis

Do not propose destructive commands before the cause is known.

Problem:
[PASTE ERROR HERE]

## 5. Code Review Prompt

Review this project for stability without performing a broad refactor.

Focus on:
- duplicate or dead code
- inconsistent API URLs
- missing error handling
- authorization gaps
- missing validation
- cache invalidation issues
- Docker development assumptions
- broken links / routes
- documentation gaps

Do not change working architecture merely for style.

Return:
1. critical issues
2. medium-priority issues
3. optional improvements
4. exact files affected
5. minimal safe fixes
