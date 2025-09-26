# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

Project: XENIA – AI Study Planner (Flask backend + Next.js frontend)

Common commands

Backend (Python/Flask)
- Install deps
  - Windows (PowerShell):
    ```powershell path=null start=null
    py -3.11 -m venv backend\.venv
    backend\.venv\Scripts\Activate.ps1
    python -m pip install -r backend\requirements.txt
    ```
  - macOS/Linux:
    ```bash path=null start=null
    python3 -m venv backend/.venv
    source backend/.venv/bin/activate
    pip install -r backend/requirements.txt
    ```

- Run dev server (default: http://localhost:8000)
  ```bash path=null start=null
  python backend/run.py
  ```

- Lint/format/type-check (mirrors CI)
  ```bash path=null start=null
  # inside a venv with deps installed
  python -m pip install black isort flake8 mypy
  black --check backend/app/
  isort --check-only backend/app/
  flake8 backend/app/ --max-line-length=88 --extend-ignore=E203,W503
  mypy backend/app/ --ignore-missing-imports
  ```

- Tests (pytest) and single test selection
  ```bash path=null start=null
  # run all
  python -m pytest backend/tests -v
  # run one file
  python -m pytest backend/tests/test_foo.py -v
  # run one test by node id
  python -m pytest backend/tests/test_foo.py::test_bar -v
  # keyword filter
  python -m pytest backend/tests -k "bar and not slow" -v
  ```

- Quick health checks
  ```bash path=null start=null
  # Flask health endpoint smoke (local, no network)
  python backend/scripts/smoke_health.py
  # Exercise core API flows (requires backend running)
  python backend/scripts/health_check.py --base http://localhost:8000 --user <UUID>
  ```

Frontend (Next.js/TypeScript)
- Install deps
  ```bash path=null start=null
  cd frontend
  npm ci   # or: npm install
  ```

- Dev server (default: http://localhost:3000)
  ```bash path=null start=null
  npm run dev
  ```

- Build, start, lint, type-check
  ```bash path=null start=null
  npm run build
  npm run start
  npm run lint
  npm run type-check
  ```

- Optional E2E smoke (starts dev server, then drives a simple upload flow)
  ```bash path=null start=null
  # cross-platform Node runner
  node frontend/scripts/run_server_and_e2e.js
  # or on Windows (PowerShell)
  frontend/scripts/run_e2e.ps1
  ```

Environment and configuration
- Copy .env.example to .env (the backend reads backend/.env first, then falls back to the project root .env). Minimum required for non-mock flows: SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY. AI provider keys (GEMINI_API_KEY, OPENAI_API_KEY, ANTHROPIC_API_KEY) are optional but enable real AI features.
- Frontend expects:
  - NEXT_PUBLIC_API_URL (e.g., http://localhost:8000)
  - NEXT_PUBLIC_SUPABASE_URL
  - NEXT_PUBLIC_SUPABASE_ANON_KEY

High-level architecture and flow

Monorepo layout
- backend/ (Flask application)
- frontend/ (Next.js App Router application)

Backend (Flask)
- App creation and bootstrapping
  - backend/app/__init__.py defines create_app(), sets up CORS, structured request/response logging, global exception logging, and registers blueprints under /api/* plus /health.
- Configuration
  - backend/app/config.py loads environment via python-dotenv (backend/.env or project .env), validates required variables, and logs warnings for risky defaults. Configuration results influence AI providers, file size/timeouts, CORS, etc.
- HTTP surface (Blueprints)
  - upload: POST /api/upload/syllabus, /api/upload/assessment → ingestion pipeline
  - plan: POST /api/plan/generate, GET /api/plan/current, POST /api/plan/adjust, POST /api/plan/regenerate, etc.
  - ai/resources: GET /api/ai/get-resources
  - analytics, dashboard, teacher, parent, quiz, progress: additional domain endpoints
  - /health: lightweight app/Supabase health probe
- Ingestion pipeline (backend/app/services/ingestion.py)
  - Accepts PDF/images/text → extracts text (pdfminer + OCR fallback), AI-filters administrative noise, stores artifacts to Supabase Storage (bucket: ARTIFACTS), embeds text if available, persists metadata and topics when possible. Maintains an in-memory topic store for non-UUID dev users.
- Planning engine (backend/app/services/planning.py)
  - Builds study plans using prioritized topics and DeadlineManager. Attempts an “enhanced AI” plan first (with resource enrichment); falls back to deterministic scheduling if AI is unavailable. Persists plan to Supabase (plans table) and syncs sessions into tasks for immediate UI visibility.
- AI providers and fallbacks (backend/app/services/ai_providers.py)
  - Selects Gemini/OpenAI/Anthropic with timeouts and sensible fallback to a mock provider if keys are absent. Also powers topic/resource generation and plan adjustments.
- Supabase access (backend/app/supabase_client.py)
  - Singleton client with semaphore + circuit breaker + retry helpers. Gracefully degrades to a rich mock client if credentials are missing or demo.
- Error model
  - Central ApiError with codes (e.g., PLAN_400/500). Responses are normalized; the frontend derives user-friendly messages from error codes.

Frontend (Next.js)
- App Router under frontend/src/app with pages such as upload/, planner/, dashboard/, etc. Layout wires global providers and theming.
- API integration (frontend/src/lib/api.ts)
  - All calls go through api(), which prefixes NEXT_PUBLIC_API_URL, injects X-User-Id (from Supabase auth or a generated UUID), and maps server errors to stable error codes with lightweight response de-duping.
- Supabase client (frontend/src/lib/supabaseClient.ts)
  - Creates the browser client and persists supabase_user_id to localStorage as the canonical user identifier for backend requests.
- Error handling (frontend/src/lib/error-context.tsx)
  - Centralized error surface via toasts; consumes derived error codes.
- Middleware (frontend/src/middleware.ts)
  - Route matcher in place for potential gating of app sections.
- Upload flow (frontend/src/app/upload/page.tsx)
  - Calls /api/ingest/upload-document or /api/ingest/upload-text, then enables plan generation via /api/plan/generate using extracted topics and optional settings.

CI mirrors local workflows
- .github/workflows/ci.yml runs:
  - Backend: pip install -r backend/requirements.txt, pytest, black/isort/flake8/mypy
  - Frontend: Node 18+, npm ci, npm run lint, npm run build

Notes
- Default ports: backend 8000, frontend 3000.
- For realistic AI behavior, set at least one valid AI key; otherwise endpoints return graceful fallbacks.
- The backend health endpoint (/health) reports Supabase connectivity when configured.
