# Deploying asrvoices React App on Render

This guide will help you deploy your React.js application (asrvoices) on Render.com.

## Prerequisites

1. **GitHub Repository**: Your code should be in a GitHub repository
2. **Render Account**: Sign up at [render.com](https://render.com)
3. **Node.js**: Ensure your project uses Node.js (your project uses Node 20.14.0)

## Project Overview

Your `asrvoices` project is a React.js application with:
- React 18.3.1
- Material-UI components
- Redux for state management
- Firebase integration
- Stripe payment integration
- API integration with `https://api.phosaico.com`

## Deployment Steps

### Step 1: Prepare Your Repository

1. **Commit all changes** to your GitHub repository:
   ```bash
   git add .
   git commit -m "Prepare for Render deployment"
   git push origin main
   ```

2. **Verify your build works locally**:
   ```bash
   npm install
   npm run build
   ```

### Step 2: Create a New Web Service on Render

1. **Log in to Render** and go to your dashboard
2. **Click "New +"** and select **"Static Site"**
3. **Connect your GitHub repository**:
   - Select your repository containing the asrvoices project
   - Choose the branch (usually `main` or `master`)

### Step 3: Configure Build Settings

Use these settings for your static site:

- **Name**: `asrvoices-frontend` (or your preferred name)
- **Branch**: `main` (or your default branch)
- **Root Directory**: Leave empty (or specify if your React app is in a subdirectory)
- **Build Command**: `npm install && npm run build`
- **Publish Directory**: `build`

### Step 4: Environment Variables

Add these environment variables in Render dashboard:

**Required Variables:**
```
REACT_APP_API_URL = https://api.phosaico.com
NODE_ENV = production
```

**Optional Variables (if you use these services):**
```
REACT_APP_FIREBASE_API_KEY = your_firebase_api_key
REACT_APP_FIREBASE_AUTH_DOMAIN = your_project.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID = your_project_id
REACT_APP_FIREBASE_STORAGE_BUCKET = your_project.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID = your_sender_id
REACT_APP_FIREBASE_APP_ID = your_app_id
REACT_APP_STRIPE_PUBLISHABLE_KEY = your_stripe_publishable_key
```

### Step 5: Advanced Settings

**Headers Configuration:**
Add these custom headers for security:
- `X-Frame-Options: DENY`
- `X-Content-Type-Options: nosniff`
- `Referrer-Policy: strict-origin-when-cross-origin`

**Build Settings:**
- **Node Version**: `20.14.0` (matches your package.json)
- **Auto-Deploy**: Enable for automatic deployments on git push

### Step 6: Deploy

1. **Click "Create Static Site"**
2. **Wait for the build** to complete (usually 2-5 minutes)
3. **Your app will be available** at `https://your-app-name.onrender.com`

## Alternative: Using render.yaml (Recommended)

If you prefer configuration as code, use the `render.yaml` file I created:

1. **Commit the render.yaml file** to your repository
2. **In Render dashboard**, select "Infrastructure as Code"
3. **Connect your repository** and Render will automatically detect the configuration

## Troubleshooting

### Common Issues:

1. **Build Failures**:
   - Check Node.js version compatibility
   - Ensure all dependencies are in package.json
   - Verify build command works locally

2. **Environment Variables**:
   - Make sure all `REACT_APP_` prefixed variables are set
   - Check API URLs are correct and accessible

3. **API Connection Issues**:
   - Verify your backend API is running
   - Check CORS settings on your backend
   - Ensure API URLs use HTTPS in production

4. **Firebase Issues**:
   - Verify Firebase configuration
   - Check Firebase project settings
   - Ensure Firebase rules allow your domain

### Build Optimization:

Your `package.json` already has:
```json
"build": "CI=false react-scripts build"
```

This prevents build failures due to warnings, which is good for production.

## Post-Deployment

1. **Test all functionality** on the deployed site
2. **Update any hardcoded URLs** to use environment variables
3. **Set up custom domain** (optional) in Render settings
4. **Configure SSL** (automatically handled by Render)

## Monitoring

- **Check Render logs** for any runtime errors
- **Monitor API calls** to ensure backend connectivity
- **Test user authentication** and payment flows

## Cost Considerations

- **Free tier**: 750 hours/month, sleeps after 15 minutes of inactivity
- **Paid plans**: Start at $7/month for always-on service
- **Bandwidth**: Free tier includes 100GB/month

## Security Notes

- Never commit `.env` files with real credentials
- Use environment variables for all sensitive data
- Enable HTTPS (automatic with Render)
- Review and update dependencies regularly

---

Your React app should now be successfully deployed on Render! 🚀

