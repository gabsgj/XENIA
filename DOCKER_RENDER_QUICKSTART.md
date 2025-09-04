# 🚀 Docker & Render Deployment - Quick Reference

## ⚡ Quick Commands

### **Local Development**
```bash
# Start everything with Docker Compose
docker-compose up --build

# Development mode with hot reloading
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up --build

# Production mode
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up --build

# Stop everything
docker-compose down
```

### **Render Deployment**
```bash
# Automated deployment (Linux/Mac)
chmod +x deploy.sh && ./deploy.sh

# Automated deployment (Windows)
deploy.bat

# Manual push
git add . && git commit -m "Deploy to Render" && git push
```

## 📦 What's Included

### **Docker Files**
- ✅ `backend/Dockerfile` - Optimized Python 3.11 container
- ✅ `frontend/Dockerfile` - Multi-stage Next.js build
- ✅ `docker-compose.yml` - Main orchestration file
- ✅ `docker-compose.dev.yml` - Development overrides
- ✅ `docker-compose.prod.yml` - Production configuration
- ✅ `nginx.conf` - Production reverse proxy
- ✅ `.dockerignore` - Optimized build context

### **Render Configuration**
- ✅ `render.yaml` - Infrastructure as Code
- ✅ `render-backend.yaml` - Backend service config
- ✅ `render-frontend.yaml` - Frontend service config
- ✅ `deploy.sh` / `deploy.bat` - Automated deployment scripts

### **Security & Performance**
- ✅ Non-root containers for security
- ✅ Health checks for reliability
- ✅ Multi-stage builds for smaller images
- ✅ Production nginx with SSL termination
- ✅ Environment variable isolation

## 🔧 Environment Variables

### **Required for Backend**
```bash
GEMINI_API_KEY=your_api_key_here
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_key
```

### **Required for Frontend**
```bash
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
NEXT_PUBLIC_API_URL=https://your-backend.onrender.com
```

## 🎯 Deployment Checklist

### **Pre-Deployment**
- [ ] All environment variables configured
- [ ] Code committed and pushed to GitHub
- [ ] Supabase project configured with RLS
- [ ] API keys obtained (Gemini, OpenAI, etc.)

### **Render Setup**
- [ ] Render account created and GitHub connected
- [ ] Backend service deployed and healthy
- [ ] Frontend service deployed and healthy
- [ ] Environment variables set in Render dashboard
- [ ] Custom domain configured (optional)

### **Post-Deployment**
- [ ] Health checks passing
- [ ] CORS configured for new domains
- [ ] SSL certificate active
- [ ] Monitoring and alerting configured

## 💰 Cost Estimation

### **Render (Monthly)**
- Backend (Starter): $7
- Frontend (Starter): $7
- **Total**: $14/month

### **External Services**
- Supabase (Free/Pro): $0-25/month
- Gemini API: $20-200/month (usage-based)
- Domain (optional): $10-15/year

## 📊 Performance

### **Optimizations Included**
- Multi-stage Docker builds (smaller images)
- Nginx reverse proxy (faster static serving)
- CDN-friendly headers (better caching)
- Health checks (automatic recovery)
- Resource limits (predictable performance)

### **Expected Performance**
- Cold start time: ~30 seconds
- Response time: <200ms (p95)
- Uptime: 99.9%
- Build time: ~3-5 minutes

## 🆘 Troubleshooting

### **Common Issues**

#### **Build Failures**
```bash
# Check logs in Render dashboard
# Common causes:
# - Missing dependencies in requirements.txt
# - Node.js version mismatch
# - Build timeout (increase in settings)
```

#### **Runtime Errors**
```bash
# Check service logs
# Common causes:
# - Missing environment variables
# - Database connection issues
# - API rate limits exceeded
```

#### **Performance Issues**
```bash
# Monitor service metrics
# Solutions:
# - Upgrade to higher plan
# - Optimize database queries
# - Implement caching
```

## 🔄 CI/CD Integration

### **GitHub Actions** (Optional)
```yaml
# .github/workflows/deploy.yml
name: Deploy to Render
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Trigger Deploy
        run: curl -X POST $RENDER_WEBHOOK_URL
```

## 📱 Mobile App Deployment

### **Future Considerations**
When you develop the mobile app:
- Use Expo EAS Build for React Native
- Deploy to App Store / Google Play
- Configure deep linking to web app
- Implement push notifications

---

**Your XENIA AI Study Planner is now production-ready! 🎉**

*Docker for development, Render for production - the perfect deployment pipeline.*
