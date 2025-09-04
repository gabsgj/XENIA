#!/bin/bash

# Deploy script for XENIA on Render
# This script helps automate the deployment process

set -e  # Exit on any error

echo "🚀 XENIA Deployment Script for Render"
echo "======================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if we're in the right directory
if [ ! -f "render.yaml" ]; then
    print_error "render.yaml not found. Please run this script from the XENIA project root."
    exit 1
fi

print_status "Checking prerequisites..."

# Check if git is available
if ! command -v git &> /dev/null; then
    print_error "Git is not installed. Please install Git first."
    exit 1
fi

# Check if we're in a git repository
if [ ! -d ".git" ]; then
    print_error "Not a git repository. Please initialize git first."
    exit 1
fi

print_success "Prerequisites check passed!"

# Check for environment variables
print_status "Checking required environment variables..."

REQUIRED_VARS=(
    "GEMINI_API_KEY"
    "SUPABASE_URL"
    "SUPABASE_ANON_KEY"
    "SUPABASE_SERVICE_ROLE_KEY"
)

MISSING_VARS=()

for var in "${REQUIRED_VARS[@]}"; do
    if [ -z "${!var}" ]; then
        MISSING_VARS+=("$var")
    fi
done

if [ ${#MISSING_VARS[@]} -ne 0 ]; then
    print_warning "The following environment variables are not set:"
    for var in "${MISSING_VARS[@]}"; do
        echo "  - $var"
    done
    print_warning "You'll need to set these in your Render service settings."
fi

# Pre-deployment checks
print_status "Running pre-deployment checks..."

# Check if requirements.txt exists in backend
if [ ! -f "backend/requirements.txt" ]; then
    print_error "backend/requirements.txt not found!"
    exit 1
fi

# Check if package.json exists in frontend
if [ ! -f "frontend/package.json" ]; then
    print_error "frontend/package.json not found!"
    exit 1
fi

# Check if Next.js config has standalone output
if grep -q "output.*standalone" frontend/next.config.ts; then
    print_success "Next.js configured for standalone output ✓"
else
    print_warning "Next.js not configured for standalone output. This may cause deployment issues."
fi

print_success "Pre-deployment checks passed!"

# Git operations
print_status "Preparing code for deployment..."

# Check for uncommitted changes
if [ -n "$(git status --porcelain)" ]; then
    print_warning "You have uncommitted changes. Committing them now..."
    
    # Ask user if they want to commit
    read -p "Do you want to commit all changes? (y/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        git add .
        read -p "Enter commit message: " commit_message
        if [ -z "$commit_message" ]; then
            commit_message="Deploy to Render - $(date '+%Y-%m-%d %H:%M:%S')"
        fi
        git commit -m "$commit_message"
        print_success "Changes committed!"
    else
        print_warning "Proceeding with uncommitted changes..."
    fi
fi

# Push to remote
print_status "Pushing to remote repository..."
CURRENT_BRANCH=$(git branch --show-current)
git push origin "$CURRENT_BRANCH"
print_success "Code pushed to $CURRENT_BRANCH branch!"

# Deployment instructions
print_status "Next steps for Render deployment:"
echo
echo "1. Go to https://render.com and sign in"
echo "2. Click 'New +' and select 'Web Service'"
echo "3. Connect your GitHub repository"
echo "4. Render will detect the render.yaml file and create services automatically"
echo
echo "OR manually create services:"
echo
echo "📦 Backend Service:"
echo "  - Name: xenia-backend"
echo "  - Environment: Python 3.11"
echo "  - Build Command: cd backend && pip install -r requirements.txt"
echo "  - Start Command: cd backend && gunicorn --bind 0.0.0.0:\$PORT --workers 2 --timeout 120 run:app"
echo "  - Health Check Path: /health"
echo
echo "🌐 Frontend Service:"
echo "  - Name: xenia-frontend"
echo "  - Environment: Node 18"
echo "  - Build Command: cd frontend && npm ci && npm run build"
echo "  - Start Command: cd frontend && npm start"
echo "  - Health Check Path: /"
echo
echo "🔐 Environment Variables to set in Render:"
echo
echo "Backend:"
for var in "${REQUIRED_VARS[@]}"; do
    echo "  - $var"
done
echo "  - FLASK_ENV=production"
echo "  - LOG_LEVEL=INFO"
echo "  - EMBEDDING_PROVIDER=gemini"
echo "  - EMBEDDING_MODEL=text-embedding-004"
echo "  - ARTIFACTS_BUCKET=artifacts"
echo
echo "Frontend:"
echo "  - NEXT_PUBLIC_SUPABASE_URL=<your_supabase_url>"
echo "  - NEXT_PUBLIC_SUPABASE_ANON_KEY=<your_supabase_anon_key>"
echo "  - NEXT_PUBLIC_API_URL=<your_backend_service_url>"
echo "  - NODE_ENV=production"
echo "  - NEXT_TELEMETRY_DISABLED=1"
echo
print_success "Deployment preparation complete!"
print_status "Your XENIA app is ready for Render deployment! 🎉"

# Optional: Open Render dashboard
read -p "Do you want to open Render dashboard? (y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    if command -v xdg-open &> /dev/null; then
        xdg-open "https://dashboard.render.com"
    elif command -v open &> /dev/null; then
        open "https://dashboard.render.com"
    else
        print_status "Please open https://dashboard.render.com in your browser"
    fi
fi

echo
print_success "🚀 Happy deploying!"
