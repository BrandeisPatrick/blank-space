/**
 * Unified Deployment Configuration
 * Shared settings for local and remote deployments
 */

export default {
  // Build Configuration
  build: {
    command: 'cd apps/studio && npm run build',
    outputDirectory: 'apps/studio/dist',
    installCommand: 'npm install',
    framework: 'vite',
    nodeVersion: '20.x'
  },
  
  // Server Configuration
  server: {
    production: {
      port: 3000,
      host: '0.0.0.0',
      https: false
    },
    preview: {
      port: 3001,
      host: '0.0.0.0',
      https: false
    },
    development: {
      port: 5173,
      host: 'localhost',
      https: false
    }
  },
  
  // Environment Variables
  env: {
    // Variables that should be synced from Vercel
    syncFromVercel: [
      'OPENAI_API_KEY',
      'XAI_API_KEY',
      'GROQ_API_KEY',
      'ANTHROPIC_API_KEY',
      'GOOGLE_GENERATIVE_AI_API_KEY',
      'GOOGLE_AI_API_KEY',
      'COHERE_API_KEY',
      'TOGETHER_API_KEY'
    ],
    
    // Environment-specific defaults
    defaults: {
      production: {
        NODE_ENV: 'production',
        AI_PROVIDER: 'groq',
        VITE_ENABLE_DEVELOPER_MODE: 'false'
      },
      preview: {
        NODE_ENV: 'development',
        AI_PROVIDER: 'openai',
        VITE_ENABLE_DEVELOPER_MODE: 'true',
        VITE_DEVELOPER_PASSWORD: 'dev123'
      },
      development: {
        NODE_ENV: 'development',
        AI_PROVIDER: 'openai',
        VITE_ENABLE_DEVELOPER_MODE: 'true',
        VITE_DEVELOPER_PASSWORD: 'dev123'
      }
    }
  },
  
  // Deployment Features
  features: {
    // Enable/disable features per environment
    production: {
      developerMode: false,
      debugging: false,
      sourceMaps: false,
      minification: true,
      caching: true
    },
    preview: {
      developerMode: true,
      debugging: true,
      sourceMaps: true,
      minification: false,
      caching: false
    },
    development: {
      developerMode: true,
      debugging: true,
      sourceMaps: true,
      minification: false,
      caching: false
    }
  },
  
  // Docker Configuration
  docker: {
    image: 'node:20-alpine',
    buildArgs: {
      NODE_VERSION: '20',
      NPM_VERSION: '10'
    },
    volumes: [
      './apps/studio/dist:/app/dist',
      './.env.local:/app/.env'
    ],
    ports: {
      production: '3000:3000',
      preview: '3001:3001'
    }
  },
  
  // Health Checks
  healthChecks: {
    endpoints: [
      '/api/health',
      '/api/providers'
    ],
    timeout: 5000,
    retries: 3
  },
  
  // Deployment Validation
  validation: {
    requiredFiles: [
      'apps/studio/dist/index.html',
      'apps/studio/dist/assets'
    ],
    minBuildSize: 1024 * 100, // 100KB minimum
    maxBuildSize: 1024 * 1024 * 50 // 50MB maximum
  },
  
  // Caching Strategy
  cache: {
    static: {
      maxAge: 31536000, // 1 year for static assets
      immutable: true
    },
    html: {
      maxAge: 0,
      mustRevalidate: true
    },
    api: {
      maxAge: 0,
      noStore: true
    }
  },
  
  // Security Headers
  security: {
    headers: {
      'X-Frame-Options': 'DENY',
      'X-Content-Type-Options': 'nosniff',
      'X-XSS-Protection': '1; mode=block',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline';"
    }
  },
  
  // Monitoring
  monitoring: {
    enabled: true,
    metrics: ['buildTime', 'deployTime', 'bundleSize'],
    logLevel: {
      production: 'error',
      preview: 'info',
      development: 'debug'
    }
  },
  
  // Rollback Configuration
  rollback: {
    enabled: true,
    maxVersions: 5,
    autoRollbackOnFailure: true
  }
};