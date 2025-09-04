# XENIA – AI Study Planner

AI-powered personalized learning platform. Ingest syllabi and assessments (PDF/TXT/Images), detect weak topics, generate adaptive study plans, provide an AI tutor with OCR-based question parsing and step-by-step remediations, and track tasks, sessions, XP/levels/achievements/streaks with analytics for students, teachers, and parents.

## �� Quick Start

### Prerequisites
- Python 3.11+
- Node.js 18+
- Docker (optional)
- Supabase account

### Local Development Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd xenia-ai-study-planner
   ```

2. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your Supabase credentials
   ```

3. **Backend Setup**
   ```bash
   cd backend
   python3 -m venv venv
   #source venv/bin/activate
   On Windows: venv\Scripts\activate
   pip install -r requirements.txt
   ```

4. **Frontend Setup**
   ```bash
   cd frontend
   cp .env.local.example .env.local
   # Edit .env.local with your Supabase credentials
   npm install
   ```

5. **Run Backend & Frontend**
   ```bash
   # Terminal 1 - Backend
   cd backend
   python run.py

   # Terminal 2 - Frontend
   cd frontend
   npm run dev
   ```

6. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8000
   - Health check: http://localhost:8000/health

### Docker Setup

1. **Build and run with Docker Compose**
   ```bash
   docker-compose up --build
   ```

2. **Development with Docker Compose Override**
   ```bash
   docker-compose -f docker-compose.yml -f docker-compose.override.yml up --build
   ```

## 🧪 Testing

### Backend Tests
```bash
cd backend
python -m pytest tests/ -v
```

### Frontend Tests
```bash
cd frontend
npm run lint
npm run build
```

### Run All Tests
```bash
# Backend
cd backend && python -m pytest tests/ -v

# Frontend
cd frontend && npm run lint && npm run build
```

## 🔧 Configuration

### Environment Variables

#### Backend (.env)
```bash
# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# AI Providers (at least one recommended)
GEMINI_API_KEY=your-gemini-api-key
OPENAI_API_KEY=your-openai-api-key
ANTHROPIC_API_KEY=your-anthropic-api-key
YOUTUBE_API_KEY=your-youtube-api-key

# Embeddings
EMBEDDING_PROVIDER=gemini
EMBEDDING_MODEL=text-embedding-004

# Storage
ARTIFACTS_BUCKET=artifacts

# Backend Runtime
FLASK_ENV=development
FLASK_DEBUG=true
LOG_LEVEL=INFO
```

#### Frontend (.env.local)
```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
NEXT_PUBLIC_API_URL=http://localhost:8000
```

### Supabase Setup

1. Create a new Supabase project
2. Run the schema setup:
   ```sql
   -- Copy and paste the contents of supabase_schema.sql
   ```
3. Create a Storage bucket named `artifacts`
4. Configure RLS policies (included in schema)

## 📚 API Documentation

### Core Endpoints

- `GET /health` - Service health check
- `POST /api/upload/syllabus` - Upload syllabus file
- `POST /api/upload/assessment` - Upload assessment file
- `POST /api/plan/generate` - Generate study plan
- `GET /api/plan/current` - Get current plan
- `POST /api/tasks/track` - Track study session
- `POST /api/tasks/complete` - Complete task
- `POST /api/tutor/ask` - Ask tutor question
- `GET /api/analytics/student` - Student analytics
- `GET /api/analytics/teacher` - Teacher analytics
- `GET /api/analytics/parent` - Parent analytics

### Error Handling

All endpoints return consistent error responses:
```json
{
  "errorCode": "ERROR_CODE",
  "errorMessage": "Human readable message",
  "details": {}
}
```

## 🏗️ Architecture

### Backend (Flask)
- **Routes**: API endpoints organized by feature
- **Services**: Business logic for AI, planning, analytics
- **AI Providers**: Multi-provider fallback (Gemini → OpenAI → Anthropic)
- **Error Handling**: Global error contract with codes

### Frontend (Next.js)
- **App Router**: Modern Next.js routing
- **Components**: Reusable UI components
- **API Integration**: Type-safe API client
- **Error Handling**: User-friendly error display

### Database (Supabase)
- **PostgreSQL**: Primary database
- **RLS**: Row-level security policies
- **Storage**: File uploads and artifacts
- **pgvector**: Vector embeddings for AI

## 🔒 Security

- Row-level security (RLS) enabled by default
- Environment variable configuration
- CORS properly configured
- No secrets in source code
- Input validation and sanitization

## 🚀 Deployment

### Production Deployment

1. **Set up production environment variables**
2. **Build Docker images**
   ```bash
   docker build -t xenia-backend ./backend
   docker build -t xenia-frontend ./frontend
   ```
3. **Deploy to your preferred platform**
4. **Configure Supabase production project**

### Staging Deployment

1. Use the same setup as production
2. Configure staging environment variables
3. Use separate Supabase project for staging

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass
6. Submit a pull request

## 📝 License

This project is provided as-is for educational purposes. Review dependencies' licenses before commercial use.

## 🆘 Troubleshooting

### Common Issues

1. **OCR fails**: Ensure `tesseract-ocr` is installed
2. **PDF parsing fails**: Install `poppler-utils`
3. **Supabase connection fails**: Check environment variables
4. **AI features not working**: Ensure at least one of GEMINI_API_KEY / OPENAI_API_KEY / ANTHROPIC_API_KEY is set

### Getting Help

- Check the logs for error messages
- Verify environment variables are set correctly
- Run tests to ensure everything is working
- Provide at least one valid AI key; no mock mode available now
