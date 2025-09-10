# Vercel Deployment Test Guide

This guide will walk you through testing the AI Coding System deployment on Vercel step by step.

## Pre-Deployment Local Testing

### 1. Test the Web Interface Locally

First, let's make sure everything works locally before deploying:

```bash
# Navigate to the project root
cd /path/to/your/blank-space

# Install all dependencies
npm install --legacy-peer-deps

# Set up environment variables for testing
cd apps/web-interface
cp .env.example .env.local

# Edit .env.local with your API keys
# Add at least one of these:
echo "OPENAI_API_KEY=your_key_here" >> .env.local
# echo "ANTHROPIC_API_KEY=your_key_here" >> .env.local
# echo "GROQ_API_KEY=your_key_here" >> .env.local

# Start the development server
npm run dev
```

### 2. Local Testing Checklist

Visit `http://localhost:3000` and verify:

- [ ] **Page Loads**: Homepage displays without errors
- [ ] **System Status**: Shows green "Ready" status
- [ ] **Provider Detection**: Shows your configured AI providers
- [ ] **Example Prompts**: Example tasks are displayed
- [ ] **Interface Interaction**: Can type in the goal textarea
- [ ] **Basic API**: Try a simple test (see test cases below)

### 3. Test Cases for Local Environment

Try these test prompts:

#### Test 1: Simple Task (Non-Streaming)
```
Goal: "Write a simple Hello World function in JavaScript"
Options: Stream = OFF, Max Steps = 5
Expected: Should complete quickly with code output
```

#### Test 2: Streaming Test
```
Goal: "Explain how to create a React component"
Options: Stream = ON, Max Steps = 8
Expected: Should show reasoning steps appearing in real-time
```

#### Test 3: System Status
- Visit the system status section
- Should show provider health and capabilities
- All configured providers should show as "Ready"

## Vercel Deployment Steps

### Option A: Vercel CLI (Recommended for Testing)

```bash
# Install Vercel CLI if you haven't
npm install -g vercel

# Navigate to project root
cd /path/to/your/blank-space

# Login to Vercel
vercel login

# Deploy
vercel

# Follow the prompts:
# ✔ Set up and deploy "~/blank-space"? [Y/n] y
# ✔ Which scope do you want to deploy to? [your-username]
# ✔ Link to existing project? [y/N] n
# ✔ What's your project's name? ai-coding-system
# ✔ In which directory is your code located? ./
```

### Configure Build Settings

When prompted or in the Vercel dashboard, set:

```json
{
  "installCommand": "npm install --legacy-peer-deps",
  "buildCommand": "cd apps/web-interface && npm run build",
  "outputDirectory": "apps/web-interface/.next",
  "nodeVersion": "18.x"
}
```

### Set Environment Variables

In the Vercel dashboard (or via CLI):

```bash
# Via CLI
vercel env add OPENAI_API_KEY
# Enter your OpenAI API key when prompted

vercel env add ANTHROPIC_API_KEY  
# Enter your Anthropic API key when prompted

vercel env add GROQ_API_KEY
# Enter your Groq API key when prompted
```

### Option B: GitHub Integration

1. **Push to GitHub**:
   ```bash
   git add .
   git commit -m "Add AI Coding System web interface"
   git push origin main
   ```

2. **Connect to Vercel**:
   - Go to [vercel.com/new](https://vercel.com/new)
   - Select your repository
   - Configure project settings
   - Add environment variables
   - Deploy

## Post-Deployment Testing

### 1. Deployment Verification

Once deployed, you'll get a URL like `https://ai-coding-system-xxx.vercel.app`

**Basic Health Check**:
- [ ] Site loads without errors
- [ ] No JavaScript console errors
- [ ] System status shows provider configuration

### 2. API Endpoint Testing

Test the API endpoints directly:

```bash
# Test system status
curl https://your-deployment-url.vercel.app/api/system/status

# Expected response:
{
  "health": {
    "overall": true,
    "agentEngine": {
      "ready": true,
      "configuredProviders": ["openai"]
    }
  }
}
```

### 3. Full Functionality Test

**Test 1: Simple Code Generation**
```
Goal: "Create a function that adds two numbers"
Options: Stream = OFF, Max Steps = 5
Expected: Quick response with JavaScript function
```

**Test 2: Streaming Reasoning**
```
Goal: "Design a simple todo list component structure"
Options: Stream = ON, Max Steps = 10
Expected: Should see reasoning steps appear progressively
```

**Test 3: Complex Task**
```
Goal: "Create a REST API endpoint for user authentication with proper error handling"
Options: Stream = ON, Max Steps = 15, Allow Dangerous = ON
Expected: Detailed step-by-step implementation plan
```

## Troubleshooting Common Issues

### Build Errors

**Error**: `Cannot find module '@ui-grid-ai/ai-coding-system'`
**Solution**: 
```bash
# Build packages in dependency order
npm run build --workspace=packages/agent-engine
npm run build --workspace=packages/react-reasoning  
npm run build --workspace=packages/ai-agents
npm run build --workspace=packages/ai-coding-system
npm run build --workspace=apps/web-interface
```

**Error**: `Module not found: Can't resolve 'fs'`
**Solution**: Already handled in `next.config.js` with webpack fallbacks

### Runtime Errors

**Error**: "No AI provider configured"
**Solution**:
1. Check environment variables in Vercel dashboard
2. Verify API keys are valid and have credits
3. Test API keys independently:
   ```bash
   curl https://api.openai.com/v1/models \
     -H "Authorization: Bearer YOUR_API_KEY"
   ```

**Error**: "System not ready"
**Solution**:
1. Check Vercel function logs in dashboard
2. Verify all environment variables are set
3. Test the status endpoint: `/api/system/status`

**Error**: Function timeout
**Solution**:
1. Reduce max steps (try 5-8 instead of 10+)
2. Use simpler prompts for testing
3. Check if API provider is responding slowly

### Streaming Issues

**Error**: Streaming not working
**Solution**:
1. Check browser dev tools for JavaScript errors
2. Verify Server-Sent Events are supported
3. Test with streaming disabled first
4. Check for ad blockers interfering

### Performance Issues

**Error**: Slow response times
**Solutions**:
1. Use Groq provider for faster inference
2. Reduce temperature for more focused responses
3. Limit max steps for testing
4. Monitor API provider status pages

## Monitoring and Debugging

### Vercel Dashboard Monitoring

1. **Function Logs**: Check real-time logs in Vercel dashboard
2. **Analytics**: Monitor response times and error rates
3. **Usage**: Track function invocations and bandwidth

### Debug Mode

Add debug logging to API routes:

```typescript
// In /api/coding/route.ts
console.log('Request received:', { goal, options });
console.log('Environment check:', {
  hasOpenAI: !!process.env.OPENAI_API_KEY,
  hasAnthropic: !!process.env.ANTHROPIC_API_KEY,
  hasGroq: !!process.env.GROQ_API_KEY
});
```

## Success Criteria

✅ **Deployment Complete** when:
- Site loads without errors
- System status shows "Ready"
- At least one provider is configured
- Can complete simple coding tasks
- Streaming works for reasoning display
- No console errors in browser dev tools

## Next Steps After Successful Deployment

1. **Share the URL**: Test with others for feedback
2. **Monitor Usage**: Track API costs and performance
3. **Iterate**: Add more features based on usage patterns
4. **Scale**: Consider upgrading Vercel plan if needed

## Getting Help

If you encounter issues during deployment:

1. **Check this guide** for common solutions
2. **Vercel Docs**: [vercel.com/docs](https://vercel.com/docs)
3. **Share specific error messages** for targeted help
4. **Test locally first** to isolate deployment vs code issues

The AI Coding System should work beautifully on Vercel once properly configured! 🚀