## XENIA – AI Study Planner

AI-powered personalized learning platform. Ingest syllabi and assessments (PDF/TXT/Images), detect weak topics, generate adaptive study plans, provide an AI tutor with OCR-based question parsing and step-by-step remediations, and track tasks, sessions, XP/levels/achievements/streaks with analytics for students, teachers, and parents.

### Key Features
- **Syllabus & assessment ingestion**: PDF parsing with pdfminer; OCR for images and non-extractable PDFs using Tesseract; stored in Supabase Storage; text persisted in `artifacts`.
- **Weak-topic detection**: Heuristic analysis over assessment artifacts; optional text embeddings (Gemini by default) for future semantic use.
- **Adaptive study planner**: Performance-weighted sessions across a horizon; persisted in `plans`.
- **AI Tutor & doubt solver**: OCR of question images and stepwise remediation guidance.
- **Tracking & gamification**: Sessions, tasks; XP awards; levels; streaks; achievements hooks.
- **Dashboards**: Student analytics; optional teacher and parent views.
- **Supabase-powered**: Auth, Postgres, Storage, pgvector.

### Stack
- Frontend: Next.js (App Router, TypeScript, TailwindCSS)
- Backend: Python (Flask), CORS enabled
- Database & Auth: Supabase (Postgres + RLS + Storage + pgvector)
- OCR/PDF: Tesseract OCR, pdfminer.six, pdf2image, PyMuPDF (fitz)
- Embeddings: Gemini by default (`text-embedding-004`); optional OpenAI fallback

### Architecture Overview
- `frontend/`: Next.js app with pages for upload, planner, tasks, tutor, analytics, teacher, parent
- `backend/`: Flask app with blueprints:
  - `/api/upload`: Syllabus and assessment uploads
  - `/api/plan`: Generate and fetch current plan
  - `/api/tasks`: Track session, complete task (awards XP)
  - `/api/tutor`: Ask tutor with text or image
  - `/api/analytics`: Student/teacher/parent views
  - `/api/teacher`: Manual tagging, reports
  - `/api/parent`: Parent overview
- `supabase_schema.sql`: Tables, RLS policies, and profile XP/level/streak functions

### Directory Structure
```text
xenia/
  README.md
  .env.example
  supabase_schema.sql
  backend/
    run.py
    requirements.txt
    app/
      __init__.py
      config.py
      supabase_client.py
      utils.py
      routes/
        ingest.py tutor.py plan.py tasks.py analytics.py teacher.py parent.py
      services/
        ingestion.py planning.py tutor.py weaktopics.py embeddings.py gamification.py
  frontend/
    package.json tsconfig.json eslint.config.mjs .env.local.example
    src/
      lib/api.ts lib/supabaseClient.ts
      app/
        page.tsx layout.tsx globals.css
        upload/ planner/ tasks/ tutor/ analytics/ teacher/ parent/
```

### Prerequisites
- Python 3.11+ (tested on 3.13)
- Node.js 18+ (recommended 20+)
- System packages:
  - Tesseract OCR
  - Poppler utils (for PDF image conversion)

Ubuntu/Debian install:
```bash
sudo apt-get update -y
sudo apt-get install -y python3-venv tesseract-ocr poppler-utils build-essential pkg-config python3-dev
```

### Environment Variables
Copy `.env.example` to `.env` in the project root and fill values:
```bash
cp .env.example .env
```
- `SUPABASE_URL`: Supabase project URL (e.g., https://xxxx.supabase.co)
- `SUPABASE_ANON_KEY`: Supabase anon key
- `SUPABASE_SERVICE_ROLE_KEY`: Service role key (recommended for backend; do not expose to frontend)
- `GEMINI_API_KEY`: Gemini API key (preferred embeddings provider)
- `OPENAI_API_KEY`: Optional; set and use `EMBEDDING_PROVIDER=openai` to switch
- `ARTIFACTS_BUCKET`: Storage bucket name (default `artifacts`)
- `EMBEDDING_PROVIDER`: `gemini` (default) or `openai`
- `EMBEDDING_MODEL`: `text-embedding-004` (Gemini) or an OpenAI embedding model

Frontend environment (`frontend/.env.local`):
```bash
cp frontend/.env.local.example frontend/.env.local
```
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_API_URL` (e.g., http://localhost:8000)

### Supabase Setup
1) Create a new Supabase project
2) In SQL editor, run the contents of `supabase_schema.sql`
3) Create a Storage bucket named `artifacts`
4) Keep RLS enabled (policies are included in the SQL)

### Backend: Run Locally
```bash
cd backend
python3 -m venv ../venv
source ../venv/bin/activate
pip install -r requirements.txt

# Ensure .env exists one level up (project root)
export $(grep -v '^#' ../.env | xargs -d '\n' -I {} echo {})

# Dev server
python run.py

# Or with gunicorn
# gunicorn -w 2 -b 0.0.0.0:8000 run:app
```
Health check:
```bash
curl http://127.0.0.1:8000/health
```

### Frontend: Run Locally
```bash
cd frontend
npm install
cp .env.local.example .env.local # fill values
npm run dev
# open http://localhost:3000
```

### API Endpoints (summary)
- `GET /health`: Service health
- `POST /api/upload/syllabus`: multipart form `file`, `user_id`
- `POST /api/upload/assessment`: multipart form `file`, `user_id`
- `POST /api/plan/generate`: json `{ user_id, horizon_days }`
- `GET /api/plan/current?user_id=...`
- `POST /api/tasks/track`: json `{ user_id, topic, duration_min, notes? }`
- `POST /api/tasks/complete`: json `{ user_id, task_id }`
- `POST /api/tutor/ask`: either multipart form with `file` (image) and `user_id`, or json `{ question, user_id }`
- `GET /api/analytics/student?user_id=...`
- `GET /api/analytics/teacher?class_id=...`
- `GET /api/analytics/parent?parent_id=...`
- `POST /api/teacher/tag`: json `{ user_id, teacher_id, topic, tag }`
- `GET /api/teacher/reports?class_id=...`
- `GET /api/parent/overview?parent_id=...`

Sample upload (assessment):
```bash
curl -X POST http://127.0.0.1:8000/api/upload/assessment \
  -F "user_id=demo-user" \
  -F "file=@/path/to/answer-sheet.jpg"
```

Generate plan:
```bash
curl -X POST http://127.0.0.1:8000/api/plan/generate \
  -H "Content-Type: application/json" \
  -d '{"user_id":"demo-user","horizon_days":14}'
```

Tutor with image:
```bash
curl -X POST http://127.0.0.1:8000/api/tutor/ask \
  -F "user_id=demo-user" \
  -F "file=@/path/to/question.jpg"
```

### Embeddings and AI
- Default embeddings provider is **Gemini**; set `GEMINI_API_KEY` and (optionally) `EMBEDDING_MODEL=text-embedding-004`.
- To use **OpenAI** instead, set `EMBEDDING_PROVIDER=openai` and `OPENAI_API_KEY`, and adjust `EMBEDDING_MODEL`.
- Embeddings are computed during ingestion (if key present) and stored in `artifacts.embedding` (pgvector).

### OCR and PDF Parsing
- Primary text extraction with pdfminer.six; fallback to OCR for PDFs by converting pages to images with pdf2image and running Tesseract.
- Image uploads are OCR’d directly via Tesseract.

### Analytics and Gamification
- Sessions and tasks support XP awards (e.g., logging sessions awards XP). Profile level and streaks are recomputed via SQL functions in `supabase_schema.sql`.
- Student, teacher, and parent analytics endpoints aggregate basic stats; extend as needed.

### Security Notes
- Enable RLS (default in schema). Do not expose `SUPABASE_SERVICE_ROLE_KEY` to the frontend.
- Backend uses CORS with credentials support; lock down origins in production.
- Store secrets in environment variables (not in source control).

### Troubleshooting
- If OCR fails: verify `tesseract-ocr` is installed and available in PATH.
- If PDF text is empty: `poppler-utils` required for PDF-to-image fallback; ensure installed.
- If embeddings are `null`: verify `GEMINI_API_KEY` (or `OPENAI_API_KEY`) and check `EMBEDDING_PROVIDER`.
- Supabase insert/storage errors: confirm `.env` values and that the `artifacts` bucket exists.

### License
This project is provided as-is for educational purposes. Review dependencies’ licenses before commercial use.

