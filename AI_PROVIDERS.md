# AI Provider System Documentation

## Overview

This application now supports multiple AI providers for testing and comparison. You can easily switch between different AI services to find the best fit for your needs.

## Supported Providers

1. **Groq** (Default)
   - Models: Llama 3.3 70B, Llama 3.1 70B/8B, Mixtral 8x7B, Gemma2 9B
   - Fast inference with LPU technology
   - Free tier available

2. **OpenAI**
   - Models: GPT-4 Turbo, GPT-4, GPT-3.5 Turbo
   - Industry standard with wide model selection
   
3. **Anthropic**
   - Models: Claude 3 Opus/Sonnet/Haiku, Claude 2.1/2.0
   - Advanced reasoning capabilities
   
4. **Google Gemini**
   - Models: Gemini Pro, Gemini Pro Vision, Gemini 1.5 Pro/Flash
   - Multimodal capabilities
   
5. **Cohere**
   - Models: Command, Command Light
   - Optimized for enterprise use cases
   
6. **Together AI**
   - Models: Llama 3, Mixtral, Mistral, Nous Hermes, CodeLlama
   - Access to various open-source models

## Configuration

### 1. Set up API Keys

Copy `.env.example` to `.env` and add your API keys:

```bash
cp .env.example .env
```

Edit `.env` and add your API keys:

```env
# Default provider
AI_PROVIDER=groq

# Add your API keys here
GROQ_API_KEY=your_groq_api_key
OPENAI_API_KEY=your_openai_api_key  
ANTHROPIC_API_KEY=your_anthropic_api_key
GEMINI_API_KEY=your_gemini_api_key
COHERE_API_KEY=your_cohere_api_key
TOGETHER_API_KEY=your_together_api_key
```

### 2. Select Default Provider

Set the `AI_PROVIDER` environment variable to your preferred default:

```env
AI_PROVIDER=openai  # or groq, anthropic, gemini, cohere, together
```

### 3. Model Selection (Optional)

You can also specify which model to use for each provider:

```env
GROQ_MODEL=llama-3.3-70b-versatile
OPENAI_MODEL=gpt-4-turbo-preview
ANTHROPIC_MODEL=claude-3-opus-20240229
GEMINI_MODEL=gemini-1.5-pro-latest
COHERE_MODEL=command
TOGETHER_MODEL=meta-llama/Llama-3-70b-chat-hf
```

## API Usage

### Using Default Provider

All existing endpoints work as before, using your configured default provider:

```bash
# Generate website
curl -X POST http://localhost:3001/api/generate \
  -H "Content-Type: application/json" \
  -d '{"prompt": "Create a landing page"}'

# Chat
curl -X POST http://localhost:3001/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Hello!"}'
```

### Specifying a Provider

You can override the default provider per request:

```bash
# Use OpenAI for this specific request
curl -X POST http://localhost:3001/api/generate \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Create a landing page",
    "provider": "openai",
    "model": "gpt-4"
  }'

# Use Anthropic for chat
curl -X POST http://localhost:3001/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Hello!",
    "provider": "anthropic",
    "model": "claude-3-opus-20240229"
  }'
```

### Testing Providers

#### Check Available Providers

```bash
curl http://localhost:3001/api/providers
```

Returns:
```json
{
  "success": true,
  "defaultProvider": "groq",
  "providers": [
    {
      "name": "groq",
      "configured": true,
      "models": ["llama-3.3-70b-versatile", ...],
      "isDefault": true
    },
    ...
  ]
}
```

#### Test a Specific Provider

```bash
curl -X POST http://localhost:3001/api/test-provider \
  -H "Content-Type: application/json" \
  -d '{
    "provider": "openai",
    "model": "gpt-3.5-turbo",
    "testPrompt": "Hello! Please introduce yourself."
  }'
```

## Performance Comparison

Use the test endpoint to compare response times across providers:

```bash
# Test each provider
for provider in groq openai anthropic gemini cohere together; do
  echo "Testing $provider..."
  curl -X POST http://localhost:3001/api/test-provider \
    -H "Content-Type: application/json" \
    -d "{\"provider\": \"$provider\"}"
done
```

## Troubleshooting

### Provider Not Configured Error

If you see "Provider X is not configured", ensure:
1. The API key is set in your `.env` file
2. The server has been restarted after adding the key
3. The API key is valid and active

### Invalid Model Error

Each provider has specific model names. Check the `/api/providers` endpoint for available models.

### Rate Limiting

Different providers have different rate limits. Consider implementing retry logic or fallback providers for production use.

## Adding New Providers

To add a new AI provider:

1. Install the provider's SDK
2. Create a new provider class in `apps/server/src/providers/`
3. Implement the `AIProvider` interface
4. Add the provider to the factory in `apps/server/src/providers/factory.ts`
5. Update `.env.example` with the new configuration options

## Security Notes

- Never commit `.env` files with real API keys
- Use environment variables or secret management services in production
- Consider implementing API key rotation
- Add rate limiting and usage monitoring for cost control