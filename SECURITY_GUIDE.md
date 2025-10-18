# 🔒 Security Guide - Environment Variables Setup

## Overview
This project has been secured by removing all hardcoded API keys and secrets. All sensitive information now uses environment variables.

## Required Environment Variables

### For Development
Create a `.env` file in the project root with:

```bash
# OpenAI API Key (Required for AI functionality)
OPENAI_API_KEY=your_openai_api_key_here

# Development Configuration
NODE_ENV=development
PORT=3001
```

### For Production (Vercel/Netlify)
Set these environment variables in your deployment platform:

```bash
# OpenAI API Key
OPENAI_API_KEY=your_openai_api_key_here

# Firebase Configuration (if using Firebase)
VITE_FIREBASE_API_KEY=your_firebase_api_key_here
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

### For AWS Deployment
Set these environment variables in your AWS Lambda:

```bash
# OpenAI API Key
OPENAI_API_KEY=your_openai_api_key_here

# AWS Configuration
AWS_ACCESS_KEY_ID=your_aws_access_key
AWS_SECRET_ACCESS_KEY=your_aws_secret_key
AWS_REGION=us-east-1
```

## Setup Instructions

### 1. Local Development
1. Copy `env.example` to `.env`:
   ```bash
   cp env.example .env
   ```

2. Edit `.env` and add your actual API keys:
   ```bash
   nano .env
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

### 2. AWS Deployment
1. Set the environment variable:
   ```bash
   export OPENAI_API_KEY="your_actual_api_key_here"
   ```

2. Deploy using the fixed script:
   ```bash
   ./deploy-lambda.sh
   ```

### 3. Production Deployment (Vercel)
1. Go to your Vercel dashboard
2. Navigate to your project settings
3. Go to "Environment Variables"
4. Add `OPENAI_API_KEY` with your actual key
5. Redeploy your project

## Security Features Implemented

✅ **Removed hardcoded secrets** - No API keys in source code
✅ **Environment variable support** - All secrets use `process.env`
✅ **Git history cleaned** - Sensitive commits removed
✅ **Enhanced .gitignore** - Prevents future secret commits
✅ **Example configuration** - `env.example` shows required variables

## Files Modified for Security

- `deploy-lambda.sh` - Now uses `$OPENAI_API_KEY` environment variable
- `.gitignore` - Enhanced to exclude sensitive files
- `env.example` - Template for required environment variables
- `SECURITY_GUIDE.md` - This security documentation

## Verification

The AI agent has been tested and confirmed working with environment variables:
- ✅ AWS Lambda endpoint responding correctly
- ✅ CORS configured for localhost:5174
- ✅ Card layout function working
- ✅ No hardcoded secrets in codebase

## Next Steps

1. **Set your environment variables** using the instructions above
2. **Test locally** to ensure everything works
3. **Deploy to production** with environment variables set
4. **Monitor for any issues** and verify functionality

Your project is now secure and ready for deployment! 🚀
