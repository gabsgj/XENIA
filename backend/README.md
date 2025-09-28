# XENIA Backend

**Live API**: [https://xenia-backend-1f0z.onrender.com](https://xenia-backend-1f0z.onrender.com)

## Tech Stack
- **Framework**: Flask (Python 3.11+)
- **AI Integration**: Gemini 2.0 Flash with fallback to OpenAI/Anthropic
- **Database**: Supabase (PostgreSQL with RLS)
- **File Processing**: PyPDF2, python-docx, PIL for OCR
- **Embeddings**: Gemini text-embedding-004
- **Testing**: Pytest with comprehensive coverage

## Environment Setup

Create a `.env` file with:
```bash
# Supabase Configuration
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# AI Providers
GEMINI_API_KEY=your_gemini_api_key
OPENAI_API_KEY=your_openai_api_key  # Optional fallback
ANTHROPIC_API_KEY=your_anthropic_api_key  # Optional fallback
YOUTUBE_API_KEY=your_youtube_api_key

# Application Settings
FLASK_ENV=development  # or production
FLASK_DEBUG=false
LOG_LEVEL=INFO
```

## Local Development

```bash
# Create virtual environment
python -m venv .venv

# Activate virtual environment
# Windows:
.venv\Scripts\activate
# macOS/Linux:
source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run the server
python run.py
```

The backend will be available at http://localhost:8000

## API Endpoints

### Health Check
- `GET /health` - Check if the API is running

### Upload & Processing
- `POST /api/upload/syllabus` - Upload and process syllabus
- `POST /api/upload/assessment` - Upload assessment for weak topic detection
- `GET /api/upload/status/{id}` - Check processing status

### Study Planning
- `POST /api/plan/generate` - Generate study plan from filtered topics
- `GET /api/plan/current` - Get active study plan
- `PUT /api/plan/adjust` - Adjust plan based on progress
- `DELETE /api/plan/reset` - Reset current plan

### AI Features
- `POST /api/ai/filter-topics` - AI topic filtering and prioritization
- `POST /api/ai/get-resources` - Get resource suggestions
- `POST /api/tutor/ask` - Ask AI tutor questions

### Analytics
- `GET /api/analytics/student` - Student progress dashboard
- `GET /api/analytics/teacher` - Teacher overview
- `GET /api/analytics/parent` - Parent monitoring

## Deployment

The backend is currently deployed on Render at: https://xenia-backend-1f0z.onrender.com

### Deploy on Render
1. Connect your GitHub repository
2. Set environment variables in Render dashboard
3. Build command: `pip install -r requirements.txt`
4. Start command: `gunicorn run:app`

### Deploy on Heroku
1. Create a `Procfile` with: `web: gunicorn run:app`
2. Set environment variables using Heroku CLI or dashboard
3. Deploy using Git push or GitHub integration

## Testing

```bash
# Run all tests
python -m pytest tests/ -v

# Run with coverage
python -m pytest tests/ --cov=app --cov-report=html

# Test specific module
python -m pytest tests/test_ai_service.py -v
```

## Error Codes

The API uses structured error codes:
- `UPLOAD_400`: Invalid upload request
- `UPLOAD_500`: Upload processing error
- `AI_500`: AI service error
- `PLAN_404`: Plan not found
- `PLAN_500`: Plan generation error
- `DB_500`: Database error
