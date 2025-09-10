# Vercel Deployment Guide

## 🚀 Quick Deployment Steps

### 1. Vercel Project Settings
When deploying to Vercel, use these exact settings:

**Build & Output Settings:**
- ✅ **Root Directory**: Leave EMPTY or use `.`  
- ✅ **Framework Preset**: Next.js
- ✅ **Build Command**: `npm run build`
- ✅ **Output Directory**: Leave empty
- ✅ **Install Command**: `npm install`

### 2. Environment Variables
Add these environment variables in Vercel dashboard:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 3. Repository Configuration
- **Repository**: XandarSword3/Port-Antonio-Staff
- **Branch**: main
- **Framework**: Next.js

## 🔧 Troubleshooting

### Error: "Root Directory does not exist"
**Solution**: In Vercel project settings:
1. Go to Settings → General
2. Build & Output Settings
3. **Root Directory**: Leave completely EMPTY
4. Save and redeploy

### Error: "Build failed"
**Solution**: Check these:
1. Environment variables are set correctly
2. Supabase URL and keys are valid
3. Next.js version compatibility

## ✅ Verification Checklist

Before deployment, ensure:
- [ ] Repository is on `main` branch
- [ ] `package.json` has correct build scripts  
- [ ] `vercel.json` is present (optional but helpful)
- [ ] Environment variables are ready
- [ ] Supabase project is configured

## 🏃‍♂️ Local Testing Before Deploy

```bash
# Test build locally
npm run build
npm run start

# Should run on port 3002
# Access: http://localhost:3002
```

## 📱 Post-Deployment Steps

1. **Test Authentication**: Try logging in with default accounts
2. **Check Database**: Verify Supabase connection
3. **Test Features**: Menu management, orders, etc.
4. **Custom Domain**: Add your domain if needed

---

**Status**: Ready for Vercel deployment! 🚀
