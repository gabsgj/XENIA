# 🚀 Docker & Render Deployment Guide for XENIA

## 🐳 Docker Setup

### **Local Development with Docker**

#### **1. Using Docker Compose (Recommended)**
```bash
# Start all services (backend + frontend + postgres)
docker-compose up --build

# Start in detached mode
docker-compose up -d --build

# View logs
docker-compose logs -f

# Stop all services
docker-compose down

# Clean up (remove volumes)
docker-compose down -v
```

#### **2. Building Individual Services**
```bash
# Backend only
cd backend
docker build -t xenia-backend .
docker run -p 8000:8000 --env-file .env xenia-backend

# Frontend only  
cd frontend
docker build -t xenia-frontend .
docker run -p 3000:3000 --env-file .env.local xenia-frontend
```

### **Environment Variables for Docker**
Create these files in your project root:

#### **.env** (for backend)
```bash
# Supabase Configuration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# AI Providers
GEMINI_API_KEY=your_gemini_api_key
OPENAI_API_KEY=your_openai_key
ANTHROPIC_API_KEY=your_anthropic_key
YOUTUBE_API_KEY=your_youtube_key

# Application Settings
FLASK_ENV=development
FLASK_DEBUG=true
LOG_LEVEL=INFO
EMBEDDING_PROVIDER=gemini
EMBEDDING_MODEL=text-embedding-004
ARTIFACTS_BUCKET=artifacts
```

#### **frontend/.env.local** (for frontend)
```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
NEXT_PUBLIC_API_URL=http://localhost:8000
NODE_ENV=development
```

## ☁️ Render Deployment

### **Quick Deploy to Render**

#### **Option 1: Using Render Dashboard**

1. **Sign up at [render.com](https://render.com)**
2. **Connect your GitHub repository**
3. **Create two services:**

##### **Backend Service:**
- **Service Type**: Web Service
- **Environment**: Python 3.11
- **Build Command**: 
  ```bash
  cd backend && pip install -r requirements.txt
  ```
- **Start Command**: 
  ```bash
  cd backend && gunicorn --bind 0.0.0.0:$PORT --workers 2 --timeout 120 run:app
  ```
- **Health Check Path**: `/health`

##### **Frontend Service:**
- **Service Type**: Web Service  
- **Environment**: Node 18
- **Build Command**:
  ```bash
  cd frontend && npm ci && npm run build
  ```
- **Start Command**:
  ```bash
  cd frontend && npm start
  ```
- **Health Check Path**: `/`

#### **Option 2: Using render.yaml (Infrastructure as Code)**

1. **Add render.yaml to your repository root** (already created)
2. **Connect repository to Render**
3. **Deploy automatically using the render.yaml configuration**

### **Environment Variables on Render**

#### **Backend Service Environment Variables**
Set these in your Render backend service settings:

```bash
# Required
GEMINI_API_KEY=your_gemini_api_key_here
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Optional (for fallback AI providers)
OPENAI_API_KEY=your_openai_key
ANTHROPIC_API_KEY=your_anthropic_key
YOUTUBE_API_KEY=your_youtube_key

# Application Configuration
FLASK_ENV=production
LOG_LEVEL=INFO
EMBEDDING_PROVIDER=gemini
EMBEDDING_MODEL=text-embedding-004
ARTIFACTS_BUCKET=artifacts
```

#### **Frontend Service Environment Variables**
Set these in your Render frontend service settings:

```bash
# Required
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_PUBLIC_API_URL=https://your-backend-service-name.onrender.com

# Application Configuration
NODE_ENV=production
NEXT_TELEMETRY_DISABLED=1
```

### **Deployment Steps**

#### **1. Prepare Your Repository**
```bash
# Ensure all files are committed
git add .
git commit -m "Add Docker and Render deployment configuration"
git push origin main
```

#### **2. Quick Deploy Script**
We've included automated deployment scripts:

**For Linux/Mac:**
```bash
chmod +x deploy.sh
./deploy.sh
```

**For Windows:**
```bash
deploy.bat
```

#### **3. Manual Deploy - Backend Service**
1. Go to [render.com](https://render.com) dashboard
2. Click "New +" → "Web Service"
3. Connect your GitHub repository
4. Configure:
   - **Name**: `xenia-backend`
   - **Environment**: `Python 3.11`
   - **Region**: Choose closest to your users
   - **Branch**: `main`
   - **Root Directory**: Leave empty (will use backend/ in commands)
   - **Build Command**: `cd backend && pip install -r requirements.txt`
   - **Start Command**: `cd backend && gunicorn --bind 0.0.0.0:$PORT --workers 2 --timeout 120 run:app`
   - **Health Check Path**: `/health`
5. Add all environment variables listed above
6. Click "Create Web Service"

#### **4. Manual Deploy - Frontend Service**
1. Click "New +" → "Web Service"
2. Connect your GitHub repository (same repo)
3. Configure:
   - **Name**: `xenia-frontend`
   - **Environment**: `Node 18`
   - **Region**: Same as backend
   - **Branch**: `main`
   - **Root Directory**: Leave empty
   - **Build Command**: `cd frontend && npm ci && npm run build`
   - **Start Command**: `cd frontend && npm start`
4. Add environment variables (use backend service URL for `NEXT_PUBLIC_API_URL`)
5. Click "Create Web Service"

#### **5. Alternative: Infrastructure as Code**
Use the included `render.yaml` file for automatic service creation:
1. Push the repository with `render.yaml` to GitHub
2. In Render dashboard, click "New +" → "Blueprint"
3. Connect repository and Render will automatically create both services

### **Post-Deployment Configuration**

#### **1. Supabase Configuration**
Update your Supabase project settings:

```sql
-- Add your Render domains to allowed origins
-- In Supabase Dashboard → Authentication → URL Configuration:
-- Site URL: https://your-frontend-service.onrender.com
-- Additional Redirect URLs: https://your-frontend-service.onrender.com/auth/callback
```

#### **2. CORS Configuration**
Your backend already includes CORS configuration, but verify these domains are allowed:
- Your frontend Render URL
- localhost:3000 (for development)

#### **3. Health Checks**
Verify your services are healthy:
- Backend: `https://your-backend-service.onrender.com/health`
- Frontend: `https://your-frontend-service.onrender.com/`

### **Monitoring & Logs**

#### **View Logs**
```bash
# In Render dashboard, go to your service → Logs tab
# Real-time logs will show deployment and runtime information
```

#### **Service Metrics**
- Monitor CPU, Memory, and Request metrics in Render dashboard
- Set up alerts for service downtime
- Monitor response times and error rates

### **Scaling on Render**

#### **Upgrade Plans**
- **Starter**: $7/month - 512MB RAM, 0.1 CPU
- **Standard**: $25/month - 2GB RAM, 1 CPU
- **Pro**: $85/month - 8GB RAM, 2 CPU

#### **Auto-Scaling**
```yaml
# In render.yaml, add scaling configuration
plan: standard
scaling:
  minInstances: 1
  maxInstances: 3
  targetCPUPercent: 70
  targetMemoryPercent: 80
```

### **Custom Domain Setup**

#### **1. Add Custom Domain**
1. Go to service settings in Render
2. Click "Custom Domains"
3. Add your domain (e.g., `app.yourdomain.com`)
4. Follow DNS configuration instructions

#### **2. SSL Certificate**
Render automatically provides SSL certificates for custom domains.

### **Database Considerations**

#### **Option 1: Continue with Supabase (Recommended)**
- Your current setup with Supabase works perfectly
- No changes needed for Render deployment
- Managed database with built-in features

#### **Option 2: Render PostgreSQL**
If you want to use Render's database:
```yaml
# Add to render.yaml
databases:
  - name: xenia-postgres
    plan: starter
    region: oregon
```

### **Backup & Recovery**

#### **Database Backups**
- Supabase includes automatic backups
- Download backups from Supabase dashboard
- Implement custom backup scripts if needed

#### **Code Backups**
- GitHub repository serves as primary backup
- Tag releases for version control
- Use GitHub releases for deployment history

### **Cost Estimation**

#### **Render Costs (Monthly)**
- **Backend Service (Starter)**: $7/month
- **Frontend Service (Starter)**: $7/month
- **Total**: $14/month for basic setup

#### **Additional Costs**
- **Supabase Pro**: $25/month (if needed for higher limits)
- **Custom Domain**: Free with Render
- **SSL Certificate**: Free with Render

### **Troubleshooting Common Issues**

#### **Build Failures**
```bash
# Check build logs in Render dashboard
# Common issues:
# 1. Missing environment variables
# 2. Dependency installation failures
# 3. Build timeout (increase in service settings)
```

#### **Runtime Errors**
```bash
# Check service logs for runtime errors
# Common issues:
# 1. Database connection errors
# 2. Missing API keys
# 3. CORS configuration issues
```

#### **Performance Issues**
```bash
# Monitor service metrics
# Solutions:
# 1. Upgrade to higher tier plan
# 2. Optimize code for better performance
# 3. Implement caching strategies
```

### **CI/CD with GitHub Actions**

Create `.github/workflows/deploy.yml`:
```yaml
name: Deploy to Render
on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Trigger Render Deploy
        run: |
          curl -X POST "https://api.render.com/deploy/srv-xxxxx?key=${{ secrets.RENDER_API_KEY }}"
```

### **Security Best Practices**

#### **Environment Variables**
- Never commit secrets to repository
- Use Render's environment variable encryption
- Rotate API keys regularly

#### **Network Security**
- Enable HTTPS only (automatic with Render)
- Configure proper CORS origins
- Use Supabase RLS for database security

#### **Access Control**
- Use strong authentication
- Implement proper authorization
- Monitor access logs

---

**Your XENIA AI Study Planner is now ready for production deployment! 🚀**

The combination of Docker for local development and Render for cloud deployment provides a robust, scalable foundation for your AI-powered learning platform.
