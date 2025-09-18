# 🚀 Railway Deployment Guide

## Quick Start

### Option 1: Use the Deploy Script (Recommended)
```bash
./deploy.sh
```

### Option 2: Manual Deployment

1. **Login to Railway:**
   ```bash
   npx @railway/cli login
   ```

2. **Initialize Project:**
   ```bash
   npx @railway/cli init
   ```

3. **Deploy:**
   ```bash
   npx @railway/cli up
   ```

## Fixed Issues

✅ **Removed problematic dependencies** - Removed `canvas` and `jimp` that caused build failures
✅ **Updated package-lock.json** - Synced with package.json
✅ **Simplified Railway config** - Removed complex build commands
✅ **Added deployment script** - Easy one-command deployment

## Environment Variables

Set these in your Railway dashboard under "Variables":

### Required:
- `PORT=3001`
- `NODE_ENV=production`

### Optional (for live data):
- `MKM_APP_TOKEN` - Your Cardmarket app token
- `MKM_APP_SECRET` - Your Cardmarket app secret
- `MKM_ACCESS_TOKEN` - Your Cardmarket access token
- `MKM_ACCESS_SECRET` - Your Cardmarket access secret
- `TCGCSV_URL` - URL for automatic price updates

### Frontend Configuration:
- `VITE_API_URL` - Set to your Railway app URL (e.g., `https://your-app.railway.app`)

## Features Deployed:

✅ **Complete One Piece TCG Database** - 1,474+ cards from all expansions
✅ **Dual Recognition System** - OCR + Card Number Recognition
✅ **Card Search & Management** - Full search functionality
✅ **Image Upload & Processing** - Upload and identify cards
✅ **Inventory Management** - Save and export your collection
✅ **Admin Panel** - Data management and statistics

## API Endpoints:

- `GET /api/health` - Health check
- `GET /api/stats` - Database statistics
- `GET /api/search` - Search cards
- `POST /api/identify` - Identify card from image
- `POST /api/recognize-card-number` - Card number recognition
- `POST /api/refresh-onepiece` - Refresh card data
- `POST /api/import-onepiece` - Import card data

## Troubleshooting:

1. **Build Issues**: Make sure all dependencies are in `package.json`
2. **Memory Issues**: Railway provides 512MB by default, upgrade if needed
3. **File Upload**: Multer is configured for memory storage
4. **CORS**: Configured for Railway domain

## Monitoring:

- Check logs: `railway logs`
- View metrics in Railway dashboard
- Health check endpoint: `/api/health`

## Custom Domain:

1. Go to Railway dashboard
2. Select your project
3. Go to "Settings" > "Domains"
4. Add your custom domain
5. Update `VITE_API_URL` environment variable
