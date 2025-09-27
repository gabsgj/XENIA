# XENIA Platform Troubleshooting Guide

## Current Issues & Solutions

### 1. Tasks Not Loading Issue

**Problem**: "Unable to load your tasks right now" error on the Tasks page.

**Diagnosis Steps**:
1. Open http://localhost:3000/test-api.html in your browser
2. Run the diagnostic tests to identify the issue
3. Check browser console for errors (F12 → Console tab)

**Common Solutions**:

#### Solution A: Clear Browser Cache & LocalStorage
1. Open browser DevTools (F12)
2. Go to Application tab → Storage → Local Storage
3. Clear all items for localhost:3000
4. Refresh the page

#### Solution B: Ensure Backend is Running
1. Check if backend is running:
   ```powershell
   cd D:\GECT\XENIA\backend
   python app.py
   ```
2. Backend should be accessible at http://localhost:8000
3. Test health endpoint: http://localhost:8000/health

#### Solution C: Check User ID Configuration
- The app uses localStorage to store a user ID
- If corrupted, clear localStorage and let it regenerate
- User ID is stored as 'supabase_user_id' in localStorage

### 2. AI Tutor Service Degraded

**Problem**: "AI tutor Service is currently degraded" message appears.

**Current Status**: 
- Service is operational with fallback enabled
- Gemini API key is configured and active
- OpenAI and Anthropic keys are not set (optional)

**Solutions**:

#### Solution A: Verify API Keys
1. Check backend/.env file for API keys:
   - GEMINI_API_KEY (currently set) ✓
   - OPENAI_API_KEY (optional, not set)
   - ANTHROPIC_API_KEY (optional, not set)

2. The service works with just one provider, so Gemini alone is sufficient

#### Solution B: Check API Rate Limits
- Current rate limit: 20 requests per minute
- If hitting limits, wait a minute and try again
- Can adjust in backend/.env: `AI_RATE_LIMIT_PER_MINUTE=20`

#### Solution C: Test AI Service
1. Go to the Tutor page
2. Ask a simple question like "What is 2+2?"
3. If it responds, the service is working (even with fallback)

### 3. Quick Diagnostic Commands

#### Test Backend Status
```powershell
# Check if backend is running
netstat -an | findstr :8000

# Test health endpoint
Invoke-RestMethod -Uri http://localhost:8000/health -Method GET

# Test AI tutor status
Invoke-RestMethod -Uri http://localhost:8000/api/tutor/status -Method GET
```

#### Test Frontend
1. Open http://localhost:3000
2. Check browser console for errors
3. Use the diagnostic tool: http://localhost:3000/test-api.html

### 4. Database Connection

**Supabase Configuration**:
- URL: https://nfxafwgoadtvaxlggien.supabase.co
- Connection is properly configured
- Tables: tasks, sessions, users, plans, etc.

**If database issues occur**:
1. Check Supabase dashboard online
2. Verify .env credentials match
3. Test with a simple query using the health endpoint

### 5. Complete Reset Procedure

If all else fails, perform a complete reset:

```powershell
# 1. Stop all services (Ctrl+C in terminal windows)

# 2. Clear frontend cache
cd D:\GECT\XENIA\frontend
Remove-Item -Recurse -Force .next
npm run build

# 3. Restart backend
cd D:\GECT\XENIA\backend
python app.py

# 4. Restart frontend
cd D:\GECT\XENIA\frontend
npm run dev
```

### 6. Floating Modal Implementation

The task creation modal has been updated to a floating modal design:
- Click "+ New Task" button to open
- Click backdrop or X to close
- Form validation is active
- All functionality preserved

## Important Notes

1. **Both services must be running**:
   - Backend: http://localhost:8000
   - Frontend: http://localhost:3000

2. **API Communication**:
   - Frontend sends X-User-Id header with requests
   - Backend validates user_id for all protected endpoints
   - CORS is enabled for cross-origin requests

3. **AI Service Fallback**:
   - When AI providers are unavailable, fallback provides generic responses
   - This is working as designed to ensure service continuity
   - Full AI features require valid API keys

## Getting Help

If issues persist after trying these solutions:
1. Check the browser console for specific error messages
2. Review backend logs in the terminal where `python app.py` is running
3. Use the diagnostic tool at http://localhost:3000/test-api.html
4. Verify all environment variables are correctly set in both .env files