# Vercel Deployment Guide

## Environment Variables for Vercel

Add these environment variables in your Vercel dashboard:

### Required Environment Variables

```bash
# Production Environment
NODE_ENV=production

# AI Provider Configuration
AI_PROVIDER=groq
GROQ_API_KEY=your_groq_api_key_here

# Server Configuration  
SERVER_PORT=3001

# SECURITY: Developer Mode (MUST be disabled in production)
VITE_ENABLE_DEVELOPER_MODE=false
# DO NOT SET VITE_DEVELOPER_PASSWORD in production
```

### Optional Environment Variables (if you have other providers)

```bash
# OpenAI (optional)
OPENAI_API_KEY=your_openai_api_key_here
OPENAI_MODEL=gpt-3.5-turbo

# Anthropic (optional)
ANTHROPIC_API_KEY=your_anthropic_api_key_here
ANTHROPIC_MODEL=claude-3-sonnet-20240229

# Google Gemini (optional)
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL=gemini-pro
```

## Deployment Steps

1. **Push to GitHub**: Ensure your code is committed and pushed
2. **Import to Vercel**: Import your GitHub repository to Vercel
3. **Set Environment Variables**: Add the variables above in Vercel dashboard
4. **Deploy**: Vercel will automatically build and deploy

## Security Verification

After deployment, verify security:

1. **Developer Tab Hidden**: The 🔧 Dev button should NOT appear in production
2. **API Routes Protected**: Test that `/api/dev/*` routes return 404:
   ```bash
   curl https://your-app.vercel.app/api/dev/config
   # Should return 404
   ```
3. **Regular APIs Work**: Test that regular APIs work:
   ```bash
   curl https://your-app.vercel.app/api/health
   # Should return 200
   ```

## Build Configuration

The `vercel.json` file is already configured for:
- ✅ Monorepo structure
- ✅ Frontend build from `apps/studio`
- ✅ Serverless functions from `apps/server`
- ✅ Proper routing
- ✅ Production environment

## Important Security Notes

🚨 **NEVER set these in production:**
- `VITE_ENABLE_DEVELOPER_MODE=true`
- `VITE_DEVELOPER_PASSWORD` (any value)

✅ **Always verify in production:**
- Developer tab is completely hidden
- `/api/dev/*` routes return 404
- No developer features are accessible

## Local Testing Commands

Before deploying, test locally:

```bash
# Test production build
npm run build --workspace=apps/studio
npm run preview --workspace=apps/studio

# Test with production environment
NODE_ENV=production npx tsx apps/server/src/index.ts
```