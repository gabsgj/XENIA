# 🎯 XENIA AI Study Planner

> **Intelligent Learning Companion powered by Gemini 2.0 Flash**

[![Python](https://img.shields.io/badge/Python-3.11+-blue.svg)](https://python.org)
[![Next.js](https://img.shields.io/badge/Next.js-14-black.svg)](https://nextjs.org)
[![Gemini](https://img.shields.io/badge/AI-Gemini%202.0%20Flash-orange.svg)](https://ai.google.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue.svg)](https://typescriptlang.org)

XENIA transforms how students learn by providing AI-powered personalized study plans, intelligent topic filtering, resource recommendations, and adaptive progress tracking. Upload any syllabus and get a structured learning path with actionable next steps.

## ✨ Key Features

### 🧠 **AI-Powered Topic Filtering**
- **Smart Content Curation**: Gemini 2.0 Flash filters syllabus content, removing administrative noise
- **Learning Path Generation**: 4-phase structured progression (Foundation → Core → Advanced → Application)
- **Prerequisite Analysis**: Intelligent topic sequencing based on dependencies
- **Difficulty Assessment**: Automated complexity scoring and time estimation

### 📚 **Comprehensive Study Planning**
- **Deadline Management**: User-specified deadlines with urgency-based scheduling
- **Learning Style Adaptation**: Customizable preferences for visual, auditory, kinesthetic learners
- **Resource Discovery**: Automatic YouTube video and learning material suggestions
- **Progress Tracking**: Real-time completion monitoring with plan adjustments

### 🎮 **Gamified Learning Experience**
- **XP System**: Earn points for task completion and streak maintenance
- **Achievement Badges**: Unlock rewards for learning milestones
- **Progress Analytics**: Visual dashboards for students, teachers, and parents
- **Streak Tracking**: Build momentum with consecutive study days

### 🤖 **AI Tutoring & Support**
- **OCR Question Parsing**: Upload handwritten or printed questions for instant help
- **Step-by-Step Solutions**: Detailed problem breakdowns with explanations
- **Weak Topic Detection**: Identify knowledge gaps through assessment analysis
- **Adaptive Remediation**: Personalized content based on learning patterns

## 🚀 Quick Start

### Prerequisites
- **Python 3.11+** with pip
- **Node.js 18+** with npm
- **Supabase account** (free tier available)
- **Google AI API key** for Gemini 2.0 Flash

### 🛠️ Installation Guide

#### 1. **Clone & Setup Environment**
```bash
git clone https://github.com/your-username/XENIA.git
cd XENIA
```

#### 2. **Backend Configuration**
```bash
cd backend

# Create virtual environment
python -m venv .venv

# Activate virtual environment
# Windows:
.venv\Scripts\activate
# macOS/Linux:
source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Configure environment variables
cp .env.example .env
# Edit .env with your API keys:
# GEMINI_API_KEY=your_gemini_api_key_here
# SUPABASE_URL=your_supabase_url
# SUPABASE_ANON_KEY=your_supabase_key
```

#### 3. **Frontend Configuration**
```bash
cd frontend

# Install dependencies
npm install

# Configure environment variables
cp .env.local.example .env.local
# Edit .env.local with your Supabase credentials
```

#### 4. **Database Setup**
```bash
# Import the schema to your Supabase instance
# Use the provided supabase_schema.sql file
```

#### 5. **Launch Application**
```bash
# Terminal 1 - Start Backend (Port 8000)
cd backend
python run.py

# Terminal 2 - Start Frontend (Port 3000)
cd frontend
npm run dev
```

### 🌐 **Access Points**
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **Upload Interface**: http://localhost:3000/upload
- **Study Planner**: http://localhost:3000/planner

## 📱 User Guide

### **Step 1: Upload Your Syllabus**
1. Navigate to `/upload`
2. Upload PDF, TXT, or image files
3. Set your learning preferences and deadline
4. Watch AI filter and prioritize topics

### **Step 2: Review Learning Path**
- **AI Filtering Results**: See which topics were kept/removed and why
- **Learning Path**: View 4-phase progression structure
- **Next Steps**: Get specific action items for Week 1

### **Step 3: Generate Study Plan**
- Click "Generate Study Plan" after filtering
- Plan uses filtered topics with intelligent scheduling
- Includes resource suggestions and deadlines

### **Step 4: Track Progress**
- Use the planner interface to mark completed tasks
- System automatically adjusts remaining schedule
- Earn XP and maintain learning streaks

## 🏗️ Architecture Overview

### **Backend Stack**
- **Framework**: Flask with modern Python patterns
- **AI Integration**: Gemini 2.0 Flash with multi-provider fallback
- **Database**: Supabase (PostgreSQL) with RLS security
- **Services**: Modular design for AI, planning, analytics
- **Testing**: Pytest with comprehensive coverage

### **Frontend Stack**
- **Framework**: Next.js 14 with App Router
- **UI Components**: Custom responsive design
- **State Management**: React hooks with local storage
- **TypeScript**: Full type safety throughout
- **Styling**: Modern CSS with mobile-first approach

### **AI Pipeline**
```
Syllabus Upload → Topic Extraction → AI Filtering → Learning Path → Study Plan
     ↓              ↓                    ↓              ↓            ↓
  File Parse    Heuristic Rules    Gemini 2.0 Flash  Sequencing   Scheduling
```

## 🔧 Configuration

### **Environment Variables**

#### Backend (.env)
```bash
# Supabase Configuration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# AI Providers (Gemini 2.0 Flash primary)
GEMINI_API_KEY=your-gemini-api-key
OPENAI_API_KEY=your-openai-api-key  # Fallback
ANTHROPIC_API_KEY=your-anthropic-api-key  # Fallback
YOUTUBE_API_KEY=your-youtube-api-key

# Application Settings
FLASK_ENV=development
FLASK_DEBUG=true
LOG_LEVEL=INFO
EMBEDDING_PROVIDER=gemini
EMBEDDING_MODEL=text-embedding-004
```

#### Frontend (.env.local)
```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
NEXT_PUBLIC_API_URL=http://localhost:8000
```

## 🧪 Testing & Quality

### **Run Tests**
```bash
# Backend tests
cd backend
python -m pytest tests/ -v

# Frontend linting and build
cd frontend
npm run lint
npm run build

# AI integration test
python test_ai_integration.py

# Complete workflow test
python test_ai_filtering_demo.py
```

### **Quality Metrics**
- **Backend Coverage**: 85%+ test coverage
- **Type Safety**: Full TypeScript implementation
- **AI Fallbacks**: 3-tier provider system
- **Error Handling**: Comprehensive error contracts

## 📚 API Reference

### **Core Endpoints**

#### Upload & Processing
- `POST /api/upload/syllabus` - Upload and process syllabus
- `POST /api/upload/assessment` - Upload assessment for weak topic detection
- `GET /api/upload/status/{id}` - Check processing status

#### Study Planning
- `POST /api/plan/generate` - Generate study plan from filtered topics
- `GET /api/plan/current` - Get active study plan
- `PUT /api/plan/adjust` - Adjust plan based on progress
- `DELETE /api/plan/reset` - Reset current plan

#### Progress Tracking
- `POST /api/tasks/complete` - Mark task as completed
- `POST /api/tasks/track` - Track study session
- `GET /api/tasks/progress` - Get progress statistics

#### AI Features
- `POST /api/ai/filter-topics` - AI topic filtering and prioritization
- `POST /api/ai/get-resources` - Get resource suggestions
- `POST /api/tutor/ask` - Ask AI tutor questions

#### Analytics
- `GET /api/analytics/student` - Student progress dashboard
- `GET /api/analytics/teacher` - Teacher overview
- `GET /api/analytics/parent` - Parent monitoring

### **Response Format**
```json
{
  "success": true,
  "data": { ... },
  "error": null,
  "timestamp": "2025-09-04T12:00:00Z"
}
```

## 🚀 Deployment Guide

### **Production Setup**

#### 1. **Supabase Configuration**
```sql
-- Run supabase_schema.sql in your production instance
-- Set up Row Level Security policies
-- Create 'artifacts' storage bucket
-- Configure authentication providers
```

#### 2. **Environment Setup**
```bash
# Set production environment variables
export FLASK_ENV=production
export GEMINI_API_KEY=your_production_key
export SUPABASE_URL=your_production_url
```

### **Monitoring & Logs**
- Health check endpoint: `/health`
- Structured logging with log levels
- Error tracking with detailed context
- Performance metrics collection

## 🔒 Security Features

- **Row-Level Security**: Supabase RLS for data isolation
- **Input Validation**: Comprehensive sanitization
- **API Rate Limiting**: Prevent abuse
- **CORS Configuration**: Secure cross-origin requests
- **Environment Isolation**: No secrets in code
- **File Upload Security**: Type and size validation

## 🤝 Contributing

### **Development Setup**
1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Set up development environment
4. Make your changes with tests
5. Ensure all tests pass: `npm run test && python -m pytest`
6. Submit a pull request

### **Code Standards**
- **Python**: Follow PEP 8, use type hints
- **TypeScript**: Strict mode, comprehensive types
- **Testing**: Maintain 80%+ coverage
- **Documentation**: Update README for new features

## 📈 Roadmap & Next Steps

### **Immediate Next Steps** (Week 1-2)
- [ ] **Mobile App Development**: React Native companion app
- [ ] **Voice Integration**: Speech-to-text for questions and answers
- [ ] **Calendar Integration**: Sync with Google Calendar/Outlook
- [ ] **Collaboration Features**: Study groups and peer interaction

### **Short-term Goals** (Month 1-3)
- [ ] **Advanced Analytics**: Learning pattern analysis and insights
- [ ] **Multi-language Support**: International expansion
- [ ] **Offline Mode**: Cached content for studying without internet
- [ ] **Integration APIs**: LMS integration (Canvas, Blackboard, Moodle)

### **Medium-term Vision** (3-6 months)
- [ ] **Adaptive AI Tutoring**: Personalized teaching styles
- [ ] **Content Creation Tools**: Generate practice questions and quizzes
- [ ] **Teacher Dashboard**: Classroom management and student oversight
- [ ] **Performance Prediction**: AI-powered outcome forecasting

### **Long-term Innovation** (6+ months)
- [ ] **VR/AR Learning**: Immersive study experiences
- [ ] **Blockchain Credentials**: Verified achievement system
- [ ] **Marketplace**: User-generated content and study materials
- [ ] **Research Platform**: Learning effectiveness studies

## 🆘 Troubleshooting

### **Common Issues**

#### Backend Not Starting
```bash
# Check Python version
python --version  # Should be 3.11+

# Verify virtual environment
which python  # Should point to .venv

# Check dependencies
pip list | grep flask

# Verify environment variables
python -c "import os; print(os.getenv('GEMINI_API_KEY'))"
```

#### Frontend Build Failures
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install

# Check Node version
node --version  # Should be 18+

# Verify environment variables
cat .env.local
```

#### AI Features Not Working
```bash
# Test Gemini API directly
python test_gemini.py

# Check API key validity
curl -H "Authorization: Bearer $GEMINI_API_KEY" \
     https://generativelanguage.googleapis.com/v1beta/models
```

#### Database Connection Issues
```bash
# Test Supabase connection
python -c "from app.supabase_client import get_supabase_client; print(get_supabase_client())"

# Verify RLS policies in Supabase dashboard
# Check storage bucket exists and is accessible
```

### **Getting Help**
- **GitHub Issues**: Report bugs and request features
- **Documentation**: Check inline code comments
- **Logs**: Enable DEBUG logging for detailed information
- **Community**: Join our Discord for real-time support

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Google AI**: Gemini 2.0 Flash API
- **Supabase**: Backend-as-a-Service platform
- **Next.js Team**: React framework
- **OpenAI & Anthropic**: Fallback AI providers
- **Learning Science Community**: Research and methodologies

---

**Built with ❤️ for learners everywhere**

*Transform your learning journey with AI-powered intelligence and personalized guidance.*
