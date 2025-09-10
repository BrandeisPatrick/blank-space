#!/usr/bin/env node

/**
 * Local Production Server
 * Serves the built application with production-like settings
 */

import express from 'express';
import compression from 'compression';
import helmet from 'helmet';
import path from 'path';
import fs from 'fs';
import os from 'os';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import cors from 'cors';
import { 
  handleChat, 
  handleClassifyIntent, 
  handleGenerate, 
  handleReasoning 
} from './utils/api-handlers.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

class ProductionServer {
  constructor() {
    this.app = express();
    this.buildDir = path.join(ROOT_DIR, 'apps/studio/dist');
    this.loadEnvironment();
    this.setupMiddleware();
    this.setupRoutes();
  }

  /**
   * Load environment variables
   */
  loadEnvironment() {
    const envFile = process.env.NODE_ENV === 'production'
      ? '.env.production.local'
      : '.env.local';
    
    const envPath = path.join(ROOT_DIR, envFile);
    
    if (fs.existsSync(envPath)) {
      dotenv.config({ path: envPath });
      console.log(`✅ Loaded environment from ${envFile}`);
    }
  }

  /**
   * Setup Express middleware
   */
  setupMiddleware() {
    // JSON body parsing (must be before routes)
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));
    
    // CORS (must be early in middleware stack)
    this.app.use(cors({
      origin: process.env.CORS_ORIGIN || '*',
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'Accept']
    }));
    
    // Security headers
    this.app.use(helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", "https://unpkg.com", "https://cdn.jsdelivr.net"],
          styleSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net"],
          imgSrc: ["'self'", "data:", "https:"],
          connectSrc: ["'self'", "https://api.openai.com", "https://api.anthropic.com", "https://api.x.ai", "ws:", "wss:"],
          fontSrc: ["'self'", "data:", "https://cdn.jsdelivr.net"],
          objectSrc: ["'none'"],
          mediaSrc: ["'self'"],
          frameSrc: ["'self'", "blob:", "data:"],
          workerSrc: ["'self'", "blob:", "https://cdn.jsdelivr.net"]
        }
      }
    }));
    
    // Compression
    this.app.use(compression());
    
    // Request logging
    this.app.use((req, res, next) => {
      const timestamp = new Date().toISOString();
      console.log(`[${timestamp}] ${req.method} ${req.url}`);
      next();
    });
  }

  /**
   * Setup routes
   */
  setupRoutes() {
    // Health check endpoint
    this.app.get('/api/health', (req, res) => {
      res.json({
        status: 'healthy',
        environment: process.env.NODE_ENV || 'development',
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
      });
    });
    
    // Environment info endpoint (development only)
    if (process.env.NODE_ENV !== 'production') {
      this.app.get('/api/env', (req, res) => {
        const safeEnv = {};
        for (const [key, value] of Object.entries(process.env)) {
          if (key.includes('API_KEY') || key.includes('SECRET')) {
            safeEnv[key] = '***HIDDEN***';
          } else {
            safeEnv[key] = value;
          }
        }
        res.json(safeEnv);
      });
    }
    
    // AI-powered API endpoints
    this.app.post('/api/chat', handleChat);
    this.app.post('/api/classify-intent', handleClassifyIntent);
    this.app.post('/api/generate', handleGenerate);
    this.app.post('/api/reasoning', handleReasoning);
    
    // API proxy for AI providers (optional)
    // Note: Disabled due to Express 5 compatibility issues
    // this.setupAIProxy();
    
    // Static file serving with caching
    this.app.use(express.static(this.buildDir, {
      maxAge: process.env.NODE_ENV === 'production' ? '1y' : 0,
      etag: true,
      lastModified: true,
      setHeaders: (res, path) => {
        if (path.endsWith('.html')) {
          res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        } else if (path.match(/\.(js|css)$/)) {
          res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
        }
      }
    }));
    
    // SPA fallback - must be last
    this.app.get('*', (req, res) => {
      res.sendFile(path.join(this.buildDir, 'index.html'));
    });
  }

  /**
   * Setup AI provider proxy
   */
  setupAIProxy() {
    // Proxy for OpenAI
    if (process.env.OPENAI_API_KEY) {
      this.app.post('/api/openai/:endpoint(*)', express.json(), async (req, res) => {
        try {
          const endpoint = req.params.endpoint;
          const response = await fetch(`https://api.openai.com/v1/${endpoint}`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
            },
            body: JSON.stringify(req.body)
          });
          
          const data = await response.json();
          res.json(data);
        } catch (error) {
          res.status(500).json({ error: error.message });
        }
      });
    }
    
    // Proxy for Anthropic
    if (process.env.ANTHROPIC_API_KEY) {
      this.app.post('/api/anthropic/:endpoint(*)', express.json(), async (req, res) => {
        try {
          const endpoint = req.params.endpoint;
          const response = await fetch(`https://api.anthropic.com/${endpoint}`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-api-key': process.env.ANTHROPIC_API_KEY,
              'anthropic-version': '2023-06-01'
            },
            body: JSON.stringify(req.body)
          });
          
          const data = await response.json();
          res.json(data);
        } catch (error) {
          res.status(500).json({ error: error.message });
        }
      });
    }
  }

  /**
   * Start the server
   */
  async start(options = {}) {
    const { 
      port = process.env.PORT || 3000,
      host = '0.0.0.0'
    } = options;
    
    // Check if build exists
    if (!fs.existsSync(this.buildDir)) {
      console.error('❌ Build directory not found:', this.buildDir);
      console.log('Please run "npm run build:local" first');
      process.exit(1);
    }
    
    // Check build contents
    const indexPath = path.join(this.buildDir, 'index.html');
    if (!fs.existsSync(indexPath)) {
      console.error('❌ index.html not found in build directory');
      process.exit(1);
    }
    
    // Start server
    this.server = this.app.listen(port, host, () => {
      console.log('\n🚀 Production Server Started');
      console.log('=' .repeat(50));
      console.log(`  Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`  Port: ${port}`);
      console.log(`  Host: ${host}`);
      console.log(`  Build Dir: ${this.buildDir}`);
      console.log('=' .repeat(50));
      console.log('\nEndpoints:');
      console.log(`  Local:    http://localhost:${port}`);
      console.log(`  Network:  http://${this.getLocalIP()}:${port}`);
      console.log(`  Health:   http://localhost:${port}/api/health`);
      
      if (process.env.NODE_ENV !== 'production') {
        console.log(`  Env Info: http://localhost:${port}/api/env`);
      }
      
      console.log('\n  Press Ctrl+C to stop\n');
    });
    
    // Graceful shutdown
    process.on('SIGTERM', () => this.shutdown());
    process.on('SIGINT', () => this.shutdown());
  }

  /**
   * Graceful shutdown
   */
  shutdown() {
    console.log('\n📦 Shutting down server...');
    
    if (this.server) {
      this.server.close(() => {
        console.log('✅ Server closed');
        process.exit(0);
      });
      
      // Force close after 10 seconds
      setTimeout(() => {
        console.error('❌ Forced shutdown');
        process.exit(1);
      }, 10000);
    }
  }

  /**
   * Get local IP address
   */
  getLocalIP() {
    const interfaces = os.networkInterfaces();
    
    for (const name of Object.keys(interfaces)) {
      for (const iface of interfaces[name]) {
        if (iface.family === 'IPv4' && !iface.internal) {
          return iface.address;
        }
      }
    }
    
    return 'localhost';
  }
}

// CLI Interface
async function main() {
  const args = process.argv.slice(2);
  const server = new ProductionServer();
  
  const options = {
    port: 3000,
    host: '0.0.0.0'
  };
  
  // Parse arguments
  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--port':
      case '-p':
        options.port = parseInt(args[++i]) || 3000;
        break;
      case '--host':
      case '-h':
        options.host = args[++i] || '0.0.0.0';
        break;
      case '--help':
        console.log(`
Local Production Server

Usage: node serve-local.js [options]

Options:
  -p, --port <port>  Server port (default: 3000)
  -h, --host <host>  Server host (default: 0.0.0.0)
  --help            Show this help message

Examples:
  node serve-local.js                  # Start on port 3000
  node serve-local.js --port 8080      # Start on port 8080
  node serve-local.js --host localhost # Bind to localhost only
        `);
        process.exit(0);
        break;
    }
  }
  
  await server.start(options);
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export default ProductionServer;