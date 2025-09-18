# 🚀 Free Deployment Guide for Card Market App

This guide will help you deploy your One Piece Card Market app for free using Vercel (frontend) and Railway (backend).

## 📋 Prerequisites

- GitHub account
- Vercel account (free)
- Railway account (free)

## 🎯 Deployment Steps

### Step 1: Prepare Your Repository

1. **Push your code to GitHub** (if not already done):
   ```bash
   git add .
   git commit -m "Add deployment configuration"
   git push origin main
   ```

### Step 2: Deploy Backend to Railway

1. **Go to [Railway.app](https://railway.app)** and sign up with GitHub
2. **Create a new project**:
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Choose your `cardmarketapp` repository
3. **Configure the service**:
   - Railway will auto-detect it's a Node.js app
   - Set the **Root Directory** to: `.` (root)
   - Set the **Build Command** to: `npm install`
   - Set the **Start Command** to: `npm start`
4. **Add Environment Variables** (in Railway dashboard):
   ```
   PORT=3001
   NODE_ENV=production
   ```
5. **Deploy**: Railway will automatically build and deploy your backend
6. **Get your backend URL**: Copy the generated URL (e.g., `https://your-app.railway.app`)

### Step 3: Deploy Frontend to Vercel

1. **Go to [Vercel.com](https://vercel.com)** and sign up with GitHub
2. **Import your project**:
   - Click "New Project"
   - Import your `cardmarketapp` repository
   - Set **Framework Preset** to: `Vite`
   - Set **Root Directory** to: `.` (root)
3. **Configure Environment Variables**:
   - Add `VITE_API_URL` with your Railway backend URL (e.g., `https://your-app.railway.app`)
4. **Deploy**: Vercel will build and deploy your frontend
5. **Get your frontend URL**: Copy the generated URL (e.g., `https://your-app.vercel.app`)

### Step 4: Update CORS Settings (if needed)

If you encounter CORS issues, update your server's CORS configuration in `server/index.cjs`:

```javascript
app.use(cors({
  origin: ['https://your-app.vercel.app', 'http://localhost:5173'],
  credentials: true
}));
```

## 🔧 Environment Variables

### Backend (Railway)
- `PORT`: 3001 (auto-set by Railway)
- `NODE_ENV`: production
- `MKM_APP_TOKEN`: (optional) Cardmarket API token
- `MKM_APP_SECRET`: (optional) Cardmarket API secret
- `MKM_ACCESS_TOKEN`: (optional) Cardmarket access token
- `MKM_ACCESS_SECRET`: (optional) Cardmarket access secret

### Frontend (Vercel)
- `VITE_API_URL`: Your Railway backend URL

## 🎉 You're Done!

Your app should now be live at:
- **Frontend**: `https://your-app.vercel.app`
- **Backend API**: `https://your-app.railway.app`

## 🔄 Updating Your App

1. **Make changes** to your code
2. **Push to GitHub**: `git push origin main`
3. **Automatic deployment**: Both Vercel and Railway will automatically redeploy

## 🆓 Free Tier Limits

### Vercel (Frontend)
- ✅ Unlimited static deployments
- ✅ 100GB bandwidth/month
- ✅ Automatic HTTPS
- ✅ Custom domains

### Railway (Backend)
- ✅ $5 credit/month (usually enough for small apps)
- ✅ Automatic HTTPS
- ✅ Custom domains
- ✅ Database included

## 🐛 Troubleshooting

### Common Issues:

1. **CORS Errors**: Make sure your frontend URL is in the CORS origin list
2. **API Not Found**: Check that `VITE_API_URL` is set correctly in Vercel
3. **Build Failures**: Check the build logs in Vercel/Railway dashboards
4. **Environment Variables**: Ensure all required env vars are set

### Getting Help:
- Check the deployment logs in Vercel/Railway dashboards
- Verify environment variables are set correctly
- Test your API endpoints directly using the Railway URL

## 🎯 Next Steps

1. **Custom Domain**: Add your own domain in Vercel/Railway settings
2. **Analytics**: Add Vercel Analytics for usage insights
3. **Monitoring**: Set up Railway monitoring for backend health
4. **Database**: Add PostgreSQL if you need persistent storage

---

**Happy Deploying! 🚀**
