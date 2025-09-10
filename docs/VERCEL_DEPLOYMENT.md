# Vercel Deployment Guide for AI Coding System

This guide walks you through deploying the AI Coding System web interface to Vercel.

## Prerequisites

1. **Vercel Account**: Create a free account at [vercel.com](https://vercel.com)
2. **AI Provider API Keys**: At least one of:
   - OpenAI API Key
   - Anthropic API Key  
   - Groq API Key
3. **Git Repository**: Your code should be in a Git repository (GitHub, GitLab, etc.)

## Deployment Steps

### 1. Install Dependencies Locally (Optional)

```bash
# Install all dependencies
npm install --legacy-peer-deps

# Build the web interface
npm run build --workspace=apps/web-interface
```

### 2. Configure Environment Variables

In your Vercel dashboard:

1. Go to your project settings
2. Navigate to "Environment Variables"
3. Add the following variables:

```bash
# Required: At least one AI provider
OPENAI_API_KEY=your_openai_key_here
ANTHROPIC_API_KEY=your_anthropic_key_here  
GROQ_API_KEY=your_groq_key_here

# Optional: Custom endpoints
OPENAI_BASE_URL=https://api.openai.com/v1
ANTHROPIC_BASE_URL=https://api.anthropic.com
GROQ_BASE_URL=https://api.groq.com/openai/v1

# Optional: Model preferences
OPENAI_DEFAULT_MODEL=gpt-4o
ANTHROPIC_DEFAULT_MODEL=claude-3-5-sonnet-20241022
GROQ_DEFAULT_MODEL=llama-3.1-70b-versatile
```

### 3. Deploy to Vercel

#### Option A: Vercel CLI
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Follow the prompts:
# - Link to existing project or create new
# - Choose the monorepo root directory
# - Vercel will auto-detect the Next.js app
```

#### Option B: GitHub Integration
1. Connect your GitHub repository to Vercel
2. Vercel will automatically detect the Next.js app in `apps/web-interface`
3. Set the build settings:
   - **Build Command**: `cd apps/web-interface && npm run build`
   - **Install Command**: `npm install --legacy-peer-deps`
   - **Output Directory**: `apps/web-interface/.next`

#### Option C: Manual Import
1. Go to [vercel.com/new](https://vercel.com/new)
2. Import your Git repository
3. Configure the project:
   - **Project Name**: `ai-coding-system`
   - **Framework Preset**: Next.js
   - **Root Directory**: `apps/web-interface`

### 4. Configure Build Settings

If not automatically detected, set these build settings in Vercel:

```json
{
  "installCommand": "npm install --legacy-peer-deps",
  "buildCommand": "npm run build",
  "outputDirectory": ".next",
  "nodeVersion": "18.x"
}
```

### 5. Environment Variables Setup

Add these environment variables in the Vercel dashboard:

| Variable | Value | Required |
|----------|-------|----------|
| `OPENAI_API_KEY` | Your OpenAI API key | Optional* |
| `ANTHROPIC_API_KEY` | Your Anthropic API key | Optional* |
| `GROQ_API_KEY` | Your Groq API key | Optional* |
| `NODE_ENV` | `production` | Auto-set |

*At least one AI provider API key is required.

## Testing the Deployment

1. **Access the Web Interface**: Visit your Vercel deployment URL
2. **Check System Status**: The homepage should show system status
3. **Test Functionality**: Try an example coding task
4. **Monitor Logs**: Check Vercel function logs for any errors

## Features Available on Vercel

✅ **Multi-Model AI Support**: OpenAI, Anthropic, Groq  
✅ **Step-by-Step Reasoning**: ReAct pattern visualization  
✅ **Real-time Streaming**: Server-sent events for live updates  
✅ **System Health Monitoring**: Provider status and capabilities  
✅ **Example Tasks**: Pre-built coding scenarios  
✅ **Responsive Design**: Works on desktop and mobile  

## Limitations on Vercel

⚠️ **File System**: Limited file operations (read-only)  
⚠️ **Command Execution**: Restricted shell commands  
⚠️ **Function Timeout**: 30-second limit for API routes  
⚠️ **Git Operations**: Not available in serverless environment  

## Troubleshooting

### Build Errors

```bash
# If you get dependency conflicts
npm install --legacy-peer-deps

# If TypeScript errors
npm run type-check --workspace=apps/web-interface
```

### Runtime Errors

1. **"No AI provider configured"**
   - Verify environment variables are set correctly
   - Check API keys are valid
   - Ensure at least one provider is configured

2. **"System not ready"**
   - Check Vercel function logs
   - Verify API keys have sufficient credits/quota
   - Test API keys independently

3. **"Streaming not working"**
   - Ensure browser supports Server-Sent Events
   - Check for ad blockers or network restrictions

### Environment Variable Issues

```bash
# Verify environment variables in Vercel function
console.log('Environment check:', {
  hasOpenAI: !!process.env.OPENAI_API_KEY,
  hasAnthropic: !!process.env.ANTHROPIC_API_KEY,
  hasGroq: !!process.env.GROQ_API_KEY
})
```

## Production Optimizations

### 1. Provider Configuration
```bash
# Use environment-specific models
OPENAI_DEFAULT_MODEL=gpt-4o  # Best quality
GROQ_DEFAULT_MODEL=llama-3.1-70b-versatile  # Fast inference
ANTHROPIC_DEFAULT_MODEL=claude-3-5-sonnet-20241022  # Code tasks
```

### 2. Function Settings
```json
{
  "functions": {
    "apps/web-interface/src/app/api/**/*.ts": {
      "runtime": "nodejs18.x",
      "maxDuration": 30
    }
  }
}
```

### 3. Monitoring
- Set up Vercel Analytics
- Monitor function invocation metrics
- Track API usage and costs

## Cost Considerations

- **Vercel**: Free tier supports hobby projects
- **AI APIs**: Usage-based pricing
  - OpenAI: ~$0.002-0.06 per 1K tokens
  - Anthropic: ~$0.003-0.015 per 1K tokens  
  - Groq: ~$0.0001-0.001 per 1K tokens

## Security Best Practices

1. **API Keys**: Never commit to version control
2. **Environment Variables**: Use Vercel's encrypted storage
3. **Rate Limiting**: Monitor API usage
4. **Input Validation**: Sanitize user inputs
5. **CORS**: Configure appropriate origins

## Support

For issues or questions:
1. Check Vercel deployment logs
2. Review environment variable configuration
3. Test API keys independently
4. Monitor AI provider status pages

The AI Coding System should now be live on Vercel with full reasoning capabilities!