#!/usr/bin/env node

/**
 * Local Deployment System
 * Mirrors Vercel's deployment process locally
 */

import { execSync, spawn } from 'child_process';
import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import http from 'http';
import https from 'https';
import { createServer } from 'vite';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

class LocalDeployment {
  constructor() {
    this.config = this.loadConfig();
    this.buildDir = path.join(ROOT_DIR, 'apps/studio/dist');
    this.envFile = path.join(ROOT_DIR, '.env.local');
    this.productionEnvFile = path.join(ROOT_DIR, '.env.production.local');
  }

  /**
   * Load deployment configuration
   */
  loadConfig() {
    const vercelConfigPath = path.join(ROOT_DIR, 'vercel.json');
    const packageJsonPath = path.join(ROOT_DIR, 'package.json');
    
    let config = {
      buildCommand: 'npm run build',
      outputDirectory: 'apps/studio/dist',
      installCommand: 'npm install',
      framework: 'vite',
      nodeVersion: '20.x',
      port: 3000,
      previewPort: 3001
    };
    
    // Load from vercel.json
    if (fs.existsSync(vercelConfigPath)) {
      const vercelConfig = JSON.parse(fs.readFileSync(vercelConfigPath, 'utf8'));
      config = { ...config, ...vercelConfig };
    }
    
    // Load package.json for additional context
    if (fs.existsSync(packageJsonPath)) {
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
      config.name = packageJson.name;
      config.version = packageJson.version;
    }
    
    return config;
  }

  /**
   * Check and sync environment variables
   */
  async checkEnvironment() {
    console.log('\n🔍 Checking environment...');
    
    // Check if .env.local exists
    if (!fs.existsSync(this.envFile)) {
      console.log('⚠️  No .env.local found. Syncing from Vercel...');
      execSync('node scripts/sync-env.js', { 
        stdio: 'inherit',
        cwd: ROOT_DIR 
      });
    }
    
    // Load environment variables
    const envContent = fs.readFileSync(this.envFile, 'utf8');
    const envVars = {};
    envContent.split('\n').forEach(line => {
      const [key, ...valueParts] = line.split('=');
      if (key) {
        envVars[key] = valueParts.join('=');
      }
    });
    
    console.log(`✅ Loaded ${Object.keys(envVars).length} environment variables`);
    
    // Check for critical API keys
    const requiredKeys = ['OPENAI_API_KEY', 'XAI_API_KEY', 'GROQ_API_KEY'];
    const availableKeys = requiredKeys.filter(key => envVars[key]);
    
    if (availableKeys.length === 0) {
      console.warn('⚠️  Warning: No AI API keys found. Some features may not work.');
    } else {
      console.log(`✅ Found ${availableKeys.length} AI provider API keys`);
    }
    
    return envVars;
  }

  /**
   * Install dependencies (mirrors Vercel's install step)
   */
  async installDependencies() {
    console.log('\n📦 Installing dependencies...');
    console.log(`  Command: ${this.config.installCommand}`);
    
    try {
      execSync(this.config.installCommand, {
        stdio: 'inherit',
        cwd: ROOT_DIR
      });
      console.log('✅ Dependencies installed');
    } catch (error) {
      console.error('❌ Failed to install dependencies:', error.message);
      throw error;
    }
  }

  /**
   * Build the application (mirrors Vercel's build step)
   */
  async build(environment = 'production') {
    console.log('\n🔨 Building application...');
    console.log(`  Environment: ${environment}`);
    console.log(`  Command: ${this.config.buildCommand}`);
    
    // Set environment variables for build
    const envFile = environment === 'production' 
      ? this.productionEnvFile 
      : this.envFile;
    
    const env = { ...process.env };
    
    // Load environment variables
    if (fs.existsSync(envFile)) {
      const envContent = fs.readFileSync(envFile, 'utf8');
      envContent.split('\n').forEach(line => {
        const [key, ...valueParts] = line.split('=');
        if (key) {
          env[key] = valueParts.join('=');
        }
      });
    }
    
    // Set build-specific variables
    env.NODE_ENV = environment;
    env.VITE_BUILD_TIME = new Date().toISOString();
    env.VITE_DEPLOYMENT = 'local';
    
    try {
      execSync(this.config.buildCommand, {
        stdio: 'inherit',
        cwd: ROOT_DIR,
        env
      });
      
      // Check build output
      if (fs.existsSync(this.buildDir)) {
        const files = this.countFiles(this.buildDir);
        console.log(`✅ Build completed: ${files} files generated`);
        
        // Calculate build size
        const size = this.getDirectorySize(this.buildDir);
        console.log(`  Build size: ${this.formatBytes(size)}`);
      } else {
        throw new Error('Build directory not found');
      }
    } catch (error) {
      console.error('❌ Build failed:', error.message);
      throw error;
    }
  }

  /**
   * Serve the built application locally
   */
  async serve(options = {}) {
    const { port = 3000, open = true } = options;
    
    console.log('\n🚀 Starting local deployment server...');
    
    // Check if build exists
    if (!fs.existsSync(this.buildDir)) {
      console.error('❌ No build found. Run build first.');
      process.exit(1);
    }
    
    // Use Vite's preview server for better compatibility
    try {
      const previewServer = await createServer({
        root: path.join(ROOT_DIR, 'apps/studio'),
        server: {
          port,
          open,
          host: true
        },
        preview: {
          port,
          open,
          host: true
        }
      });
      
      await previewServer.listen();
      
      console.log(`\n✨ Local deployment server running!`);
      console.log(`  Local:   http://localhost:${port}`);
      console.log(`  Network: http://${this.getLocalIP()}:${port}`);
      console.log('\n  Press Ctrl+C to stop\n');
      
    } catch (error) {
      // Fallback to simple HTTP server
      console.log('Using fallback HTTP server...');
      this.startSimpleServer(port);
    }
  }

  /**
   * Simple HTTP server fallback
   */
  startSimpleServer(port) {
    // Use the global express import from the top of the file
    const app = express();
    
    // Serve static files
    app.use(express.static(this.buildDir));
    
    // SPA fallback
    app.get('*', (req, res) => {
      res.sendFile(path.join(this.buildDir, 'index.html'));
    });
    
    app.listen(port, () => {
      console.log(`\n✨ Local deployment server running!`);
      console.log(`  URL: http://localhost:${port}`);
      console.log('\n  Press Ctrl+C to stop\n');
    });
  }

  /**
   * Deploy with preview (development mode)
   */
  async deployPreview() {
    console.log('\n🔄 Starting preview deployment...');
    
    // Check environment
    await this.checkEnvironment();
    
    // Build in development mode
    await this.build('development');
    
    // Serve on preview port
    await this.serve({ 
      port: this.config.previewPort || 3001,
      open: true 
    });
  }

  /**
   * Full deployment process
   */
  async deploy(options = {}) {
    const {
      skipInstall = false,
      skipBuild = false,
      environment = 'production',
      serve = true
    } = options;
    
    console.log('\n🚀 Local Deployment System');
    console.log('=' .repeat(50));
    console.log(`  Project: ${this.config.name || 'blank-space'}`);
    console.log(`  Version: ${this.config.version || '1.0.0'}`);
    console.log(`  Environment: ${environment}`);
    console.log('=' .repeat(50));
    
    try {
      // Step 1: Check environment
      await this.checkEnvironment();
      
      // Step 2: Install dependencies
      if (!skipInstall) {
        await this.installDependencies();
      }
      
      // Step 3: Build
      if (!skipBuild) {
        await this.build(environment);
      }
      
      // Step 4: Serve
      if (serve) {
        await this.serve({ port: this.config.port });
      }
      
    } catch (error) {
      console.error('\n❌ Deployment failed:', error.message);
      process.exit(1);
    }
  }

  /**
   * Compare with remote deployment
   */
  async compareWithRemote() {
    console.log('\n🔍 Comparing with Vercel deployment...');
    
    try {
      // Get latest Vercel deployment
      const deployments = execSync('vercel ls --json', {
        encoding: 'utf8',
        cwd: ROOT_DIR
      });
      
      const deploys = JSON.parse(deployments);
      if (deploys.length > 0) {
        const latest = deploys[0];
        console.log('\nLatest Vercel deployment:');
        console.log(`  URL: ${latest.url}`);
        console.log(`  State: ${latest.state}`);
        console.log(`  Created: ${new Date(latest.created).toLocaleString()}`);
      }
      
      // Compare build sizes
      if (fs.existsSync(this.buildDir)) {
        const localSize = this.getDirectorySize(this.buildDir);
        console.log('\nLocal build:');
        console.log(`  Size: ${this.formatBytes(localSize)}`);
        console.log(`  Files: ${this.countFiles(this.buildDir)}`);
      }
      
    } catch (error) {
      console.log('⚠️  Could not compare with remote');
    }
  }

  // Utility functions
  getLocalIP() {
    const interfaces = require('os').networkInterfaces();
    for (const name of Object.keys(interfaces)) {
      for (const iface of interfaces[name]) {
        if (iface.family === 'IPv4' && !iface.internal) {
          return iface.address;
        }
      }
    }
    return 'localhost';
  }

  getDirectorySize(dir) {
    let size = 0;
    const files = fs.readdirSync(dir);
    
    for (const file of files) {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);
      
      if (stat.isDirectory()) {
        size += this.getDirectorySize(filePath);
      } else {
        size += stat.size;
      }
    }
    
    return size;
  }

  countFiles(dir) {
    let count = 0;
    const files = fs.readdirSync(dir);
    
    for (const file of files) {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);
      
      if (stat.isDirectory()) {
        count += this.countFiles(filePath);
      } else {
        count++;
      }
    }
    
    return count;
  }

  formatBytes(bytes) {
    const sizes = ['B', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 B';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  }
}

// CLI Interface
async function main() {
  const args = process.argv.slice(2);
  const deployment = new LocalDeployment();
  
  const command = args[0] || 'deploy';
  
  switch (command) {
    case 'deploy':
      await deployment.deploy();
      break;
      
    case 'build':
      await deployment.checkEnvironment();
      await deployment.build();
      console.log('\n✅ Build completed. Run "npm run serve:local" to serve.');
      break;
      
    case 'serve':
      await deployment.serve();
      break;
      
    case 'preview':
      await deployment.deployPreview();
      break;
      
    case 'compare':
      await deployment.compareWithRemote();
      break;
      
    case 'help':
    default:
      console.log(`
Local Deployment System

Usage: node deploy-local.js [command] [options]

Commands:
  deploy    Full deployment process (default)
  build     Build only
  serve     Serve existing build
  preview   Deploy in preview/development mode
  compare   Compare with Vercel deployment
  help      Show this help message

Options:
  --skip-install   Skip dependency installation
  --skip-build     Skip build step
  --port <port>    Server port (default: 3000)
  --env <env>      Environment (production/development)

Examples:
  node deploy-local.js                 # Full deployment
  node deploy-local.js build           # Build only
  node deploy-local.js serve           # Serve existing build
  node deploy-local.js preview         # Preview deployment
      `);
      break;
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export default LocalDeployment;