# 🚀 Render Deployment Guide for XENIA

This guide covers deploying XENIA AI Study Planner to Render cloud platform.

## 🌐 Render Deployment (Recommended)

Render provides the simplest deployment solution for XENIA with automatic scaling, SSL certificates, and GitHub integration.

### **Prerequisites**
1. Render account (free tier available)
2. GitHub repository with XENIA code
3. Supabase project for database

### **Backend Deployment**

#### **1. Create Backend Service**
1. Log into [Render Dashboard](https://dashboard.render.com)
2. Click **"New +"** → **"Web Service"**
3. Connect your GitHub repository
4. Configure settings:
   - **Name**: `xenia-backend`
   - **Runtime**: `Python 3`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `python run.py`
   - **Root Directory**: `backend`

#### **2. Environment Variables**
Set these in Render dashboard:
```bash
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
GOOGLE_AI_API_KEY=your_gemini_api_key
ENVIRONMENT=production
FLASK_ENV=production
```

### **Frontend Deployment**

#### **1. Create Frontend Service**
1. In Render Dashboard: **"New +"** → **"Static Site"**
2. Connect same GitHub repository
3. Configure settings:
   - **Name**: `xenia-frontend`
   - **Root Directory**: `frontend`
   - **Build Command**: `npm ci && npm run build`
   - **Publish Directory**: `out`

#### **2. Environment Variables**
```bash
NEXT_PUBLIC_API_URL=https://your-backend.onrender.com
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NODE_ENV=production
```

### **Database Setup (Supabase)**

#### **1. Create Supabase Project**
1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Create new project
3. Wait for database to initialize

#### **2. Run Database Schema**
```sql
-- Copy content from supabase_schema.sql and run in Supabase SQL Editor
```

#### **3. Configure RLS Policies**
Enable Row Level Security and configure appropriate policies for your tables.

### **Custom Domain (Optional)**

#### **For Frontend**
1. In Render: Go to your static site settings
2. Click **"Custom Domains"**
3. Add your domain
4. Configure DNS records as shown

#### **For Backend API**
1. In Render: Go to your web service settings
2. Add custom domain for API subdomain
3. Update frontend environment variable

## 🔧 Configuration Files

### **render.yaml (Optional)**
For infrastructure as code deployment:
```yaml
services:
  - type: web
    name: xenia-backend
    runtime: python3
    buildCommand: pip install -r requirements.txt
    startCommand: python run.py
    rootDir: backend
    envVars:
      - key: ENVIRONMENT
        value: production
      
  - type: web
    name: xenia-frontend
    runtime: static
    buildCommand: npm ci && npm run build
    staticPublishPath: out
    rootDir: frontend
    envVars:
      - key: NODE_ENV
        value: production
```

## 🚀 Deployment Workflow

### **Automatic Deployments**
1. Connect GitHub repository to Render
2. Enable auto-deploy on main branch
3. Push changes trigger automatic deployment

### **Manual Deployment**
1. In Render Dashboard
2. Go to service settings
3. Click **"Manual Deploy"** → **"Deploy latest commit"**

### **Environment Management**
- **Development**: Local development with `.env` files
- **Staging**: Optional staging branch deployment
- **Production**: Main branch auto-deployment

## 🔍 Monitoring & Logs

### **Application Logs**
- Access via Render Dashboard
- Real-time log streaming
- Download log archives

### **Performance Monitoring**
- Built-in metrics in Render Dashboard
- Response times and error rates
- Resource usage tracking

### **Health Checks**
Backend health check endpoint: `/health`
```python
@app.route('/health')
def health_check():
    return {'status': 'healthy', 'timestamp': datetime.utcnow().isoformat()}
```

## 🛠️ Troubleshooting

### **Common Issues**

#### **Build Failures**
- Check build logs in Render Dashboard
- Verify `requirements.txt` or `package.json`
- Ensure all dependencies are specified

#### **Environment Variable Issues**
- Verify all required variables are set
- Check for typos in variable names
- Ensure sensitive values are properly configured

#### **Database Connection Issues**
- Verify Supabase URL and keys
- Check firewall/security settings
- Test connection from local environment

#### **Frontend/Backend Communication**
- Verify API URL in frontend environment
- Check CORS configuration
- Ensure both services are deployed

### **Support Resources**
- [Render Documentation](https://render.com/docs)
- [Supabase Documentation](https://supabase.com/docs)
- XENIA GitHub Issues

## 📈 Scaling & Performance

### **Automatic Scaling**
Render automatically scales based on traffic:
- **Starter Plan**: Basic scaling
- **Pro Plan**: Advanced autoscaling
- **Team Plan**: Custom scaling rules

### **Performance Optimization**
- Enable Render CDN for static assets
- Configure appropriate health check intervals
- Use Render Redis for caching (if needed)

### **Cost Optimization**
- Use free tier for development
- Scale down non-production services
- Monitor usage in Render Dashboard

---

## 🎯 Quick Start Checklist

- [ ] Create Render account
- [ ] Set up Supabase project
- [ ] Configure backend service on Render
- [ ] Set backend environment variables
- [ ] Configure frontend static site
- [ ] Set frontend environment variables
- [ ] Test deployment
- [ ] Configure custom domain (optional)
- [ ] Set up monitoring and alerts

The Render deployment provides a robust, scalable foundation for your AI-powered learning platform with minimal configuration and automatic scaling capabilities.
