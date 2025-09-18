#!/bin/bash

# One Piece TCG App - Railway Deployment Script
echo "🚀 Deploying One Piece TCG App to Railway..."

# Check if Railway CLI is available
if ! command -v npx &> /dev/null; then
    echo "❌ npx not found. Please install Node.js first."
    exit 1
fi

# Check if we're logged in to Railway
if ! npx @railway/cli whoami &> /dev/null; then
    echo "🔐 Please login to Railway first:"
    echo "   npx @railway/cli login"
    exit 1
fi

# Build the project
echo "📦 Building project..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Build failed. Please fix the errors and try again."
    exit 1
fi

# Deploy to Railway
echo "🚀 Deploying to Railway..."
npx @railway/cli up

if [ $? -eq 0 ]; then
    echo "✅ Deployment successful!"
    echo "🌐 Your app should be available at the URL shown above."
    echo ""
    echo "📋 Next steps:"
    echo "1. Set environment variables in Railway dashboard:"
    echo "   - PORT=3001"
    echo "   - NODE_ENV=production"
    echo "   - VITE_API_URL=https://your-app.railway.app"
    echo ""
    echo "2. Optional (for live data):"
    echo "   - MKM_APP_TOKEN"
    echo "   - MKM_APP_SECRET"
    echo "   - MKM_ACCESS_TOKEN"
    echo "   - MKM_ACCESS_SECRET"
else
    echo "❌ Deployment failed. Check the logs above for errors."
    exit 1
fi
