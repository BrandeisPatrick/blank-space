# Local Deployment System

A comprehensive local deployment system that mirrors Vercel's remote deployment while securely managing API keys.

## Overview

This system provides:
- **100% deployment parity** between local and Vercel environments
- **Secure API key synchronization** from Vercel
- **Production-like local server** with all optimizations
- **Docker containerization** for consistent deployments
- **Multiple deployment modes** (development, preview, production)

## Quick Start

### 1. Initial Setup

```bash
# Sync environment variables from Vercel
npm run sync:env

# Deploy locally (full process)
npm run deploy:local
```

### 2. Basic Commands

| Command | Description |
|---------|-------------|
| `npm run sync:env` | Sync development environment from Vercel |
| `npm run sync:env:production` | Sync production environment from Vercel |
| `npm run deploy:local` | Full local deployment (build + serve) |
| `npm run deploy:preview` | Preview deployment (dev mode) |
| `npm run build:local` | Build only (no server) |
| `npm run serve:local` | Serve existing build |

## Environment Synchronization

### Syncing API Keys from Vercel

The sync tool securely pulls environment variables from your Vercel project:

```bash
# Sync development environment (default)
npm run sync:env

# Sync production environment
npm run sync:env:production

# Sync without encryption
node scripts/sync-env.js --no-encrypt
```

### Security Features

- **Encrypted Storage**: API keys can be encrypted with a password
- **Vault File**: Encrypted keys stored in `.env.vault`
- **Auto-gitignore**: Sensitive files automatically excluded from git
- **Session-based**: Keys loaded into memory only when needed

### Files Created

After syncing, you'll have:
- `.env.local` - Development environment variables
- `.env.production.local` - Production environment variables
- `.env.vault` - Encrypted vault (if password provided)

## Deployment Modes

### Production Deployment

Full production deployment with all optimizations:

```bash
npm run deploy:local
```

This will:
1. Sync environment variables (if needed)
2. Install dependencies
3. Build the application
4. Start production server on port 3000

### Preview Deployment

Development-friendly deployment with hot reload:

```bash
npm run deploy:preview
```

Features:
- Developer mode enabled
- Source maps included
- No minification
- Runs on port 3001

### Build Only

Build without starting the server:

```bash
npm run build:local
```

Then serve later:

```bash
npm run serve:local
```

## Docker Deployment

### Basic Docker Commands

```bash
# Build Docker image
npm run docker:build

# Start containers
npm run docker:up

# Stop containers
npm run docker:down

# Production mode with Nginx
npm run docker:production
```

### Docker Profiles

Different profiles for different needs:

| Profile | Services | Use Case |
|---------|----------|----------|
| default | frontend | Basic deployment |
| full-stack | frontend, backend | Complete application |
| production | frontend, nginx | Production with reverse proxy |
| cache | frontend, redis | With caching layer |

### Using Docker Compose

```bash
# Start specific profile
docker-compose -f docker-compose.local.yml --profile production up

# Build and start in background
docker-compose -f docker-compose.local.yml up -d --build

# View logs
docker-compose -f docker-compose.local.yml logs -f

# Scale services
docker-compose -f docker-compose.local.yml up --scale frontend=3
```

## Configuration

### Deployment Configuration

Edit `config/deployment.config.js` to customize:

```javascript
{
  build: {
    command: 'npm run build',
    outputDirectory: 'apps/studio/dist'
  },
  server: {
    production: { port: 3000 },
    preview: { port: 3001 }
  },
  env: {
    syncFromVercel: ['OPENAI_API_KEY', 'XAI_API_KEY']
  }
}
```

### Environment Variables

Control deployment behavior with environment variables:

| Variable | Description | Default |
|----------|-------------|---------|
| `NODE_ENV` | Environment mode | production |
| `PORT` | Server port | 3000 |
| `AI_PROVIDER` | Default AI provider | groq |
| `VITE_ENABLE_DEVELOPER_MODE` | Enable dev features | false |

## API Endpoints

The local server provides these endpoints:

| Endpoint | Description | Environment |
|----------|-------------|-------------|
| `/api/health` | Health check | All |
| `/api/env` | Environment info | Dev only |
| `/api/chat` | AI-powered chat responses | All |
| `/api/classify-intent` | Intent classification for user requests | All |
| `/api/generate` | Code generation with streaming | All |
| `/api/reasoning` | ReAct reasoning system with streaming | All |

## Advanced Features

### Health Checks

Built-in health monitoring:

```bash
# Check health
curl http://localhost:3000/api/health

# Response
{
  "status": "healthy",
  "environment": "production",
  "timestamp": "2025-01-09T10:00:00Z",
  "uptime": 3600
}
```

### Compare with Remote

Compare local and remote deployments:

```bash
node scripts/deploy-local.js compare
```

Shows:
- Latest Vercel deployment URL
- Build sizes comparison
- File count differences

### Custom Ports

Run on different ports:

```bash
# Serve on port 8080
node scripts/serve-local.js --port 8080

# Deploy preview on port 4000
PORT=4000 npm run deploy:preview
```

## Troubleshooting

### Common Issues

#### 1. Vercel Authentication Failed

```bash
Error: Not authenticated with Vercel
```

**Solution**: Run `vercel login` first

#### 2. Build Directory Not Found

```bash
Error: Build directory not found
```

**Solution**: Run `npm run build:local` first

#### 3. Port Already in Use

```bash
Error: Port 3000 is already in use
```

**Solution**: Use a different port or kill the process:
```bash
lsof -i :3000
kill -9 <PID>
```

#### 4. Environment Variables Not Loading

**Solution**: Check file exists and format:
```bash
cat .env.local
# Should show KEY=value format
```

### Debug Mode

Enable detailed logging:

```bash
DEBUG=* npm run deploy:local
```

## Security Best Practices

1. **Never commit** `.env.local` or `.env.vault` files
2. **Use encryption** when storing API keys locally
3. **Rotate keys** regularly
4. **Limit access** to production environment variables
5. **Use different keys** for development and production

## Performance Optimization

### Build Optimization

The system automatically:
- Minifies code in production
- Enables gzip compression
- Sets proper cache headers
- Optimizes bundle splitting

### Caching Strategy

Static assets cached for 1 year:
- JavaScript files (immutable)
- CSS files (immutable)
- Images and fonts

No cache for:
- HTML files
- API responses

## Migration from Vercel

To fully migrate from Vercel:

1. **Export all environment variables**:
   ```bash
   npm run sync:env:production
   ```

2. **Test locally**:
   ```bash
   npm run deploy:local
   ```

3. **Deploy to your infrastructure**:
   ```bash
   docker-compose -f docker-compose.local.yml --profile production up -d
   ```

4. **Update DNS** to point to your server

## CI/CD Integration

### GitHub Actions Example

```yaml
name: Local Deploy

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
      - run: npm ci
      - run: npm run build:local
      - run: npm run test
      # Deploy to your server
```

## Support

For issues or questions:
1. Check the [troubleshooting section](#troubleshooting)
2. Review `scripts/*.js` source code
3. Check Vercel CLI documentation
4. Open an issue in the repository

## License

This local deployment system is part of the blank-space project.