#!/usr/bin/env node

/**
 * Sync Environment Variables from Vercel
 * Securely pulls and stores API keys from Vercel remote
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';
import readline from 'readline';
import { promisify } from 'util';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

// Configuration
const ENV_LOCAL_PATH = path.join(ROOT_DIR, '.env.local');
const ENV_VAULT_PATH = path.join(ROOT_DIR, '.env.vault');
const ENV_PRODUCTION_PATH = path.join(ROOT_DIR, '.env.production.local');

// Utility functions
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const question = promisify(rl.question).bind(rl);

class EnvSync {
  constructor() {
    this.algorithm = 'aes-256-gcm';
    this.saltLength = 64;
    this.tagLength = 16;
    this.iterations = 100000;
  }

  /**
   * Derive encryption key from password
   */
  deriveKey(password, salt) {
    return crypto.pbkdf2Sync(password, salt, this.iterations, 32, 'sha256');
  }

  /**
   * Encrypt environment variables
   */
  encrypt(text, password) {
    const salt = crypto.randomBytes(this.saltLength);
    const key = this.deriveKey(password, salt);
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(this.algorithm, key, iv);
    
    let encrypted = cipher.update(text, 'utf8');
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    const tag = cipher.getAuthTag();
    
    return Buffer.concat([salt, iv, tag, encrypted]).toString('base64');
  }

  /**
   * Decrypt environment variables
   */
  decrypt(encryptedData, password) {
    const data = Buffer.from(encryptedData, 'base64');
    
    const salt = data.slice(0, this.saltLength);
    const iv = data.slice(this.saltLength, this.saltLength + 16);
    const tag = data.slice(this.saltLength + 16, this.saltLength + 16 + this.tagLength);
    const encrypted = data.slice(this.saltLength + 16 + this.tagLength);
    
    const key = this.deriveKey(password, salt);
    const decipher = crypto.createDecipheriv(this.algorithm, key, iv);
    decipher.setAuthTag(tag);
    
    let decrypted = decipher.update(encrypted);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    
    return decrypted.toString('utf8');
  }

  /**
   * Pull environment variables from Vercel
   */
  async pullFromVercel(environment = 'development') {
    console.log(`\n📥 Pulling environment variables from Vercel (${environment})...`);
    
    try {
      // List all environment variables
      const listOutput = execSync('vercel env ls', { 
        encoding: 'utf8',
        cwd: ROOT_DIR 
      });
      
      // Parse environment variable names
      const lines = listOutput.split('\n');
      const envVars = {};
      let startParsing = false;
      
      for (const line of lines) {
        if (line.includes('name') && line.includes('value')) {
          startParsing = true;
          continue;
        }
        
        if (startParsing && line.trim()) {
          const parts = line.trim().split(/\s+/);
          if (parts[0] && !parts[0].includes('─')) {
            const varName = parts[0];
            
            // Check if this variable is available for the specified environment
            const envList = line.toLowerCase();
            const envMap = {
              'development': 'development',
              'preview': 'preview',
              'production': 'production'
            };
            
            if (envList.includes(envMap[environment])) {
              try {
                // Pull individual environment variable
                console.log(`  • Fetching ${varName}...`);
                const value = execSync(`vercel env pull --environment=${environment} --yes 2>/dev/null | grep "^${varName}=" | cut -d'=' -f2-`, {
                  encoding: 'utf8',
                  cwd: ROOT_DIR,
                  shell: true
                }).trim();
                
                if (value) {
                  envVars[varName] = value;
                }
              } catch (err) {
                // Try alternative method
                try {
                  const tempFile = path.join(ROOT_DIR, '.env.temp');
                  execSync(`vercel env pull ${tempFile} --environment=${environment} --yes`, {
                    cwd: ROOT_DIR,
                    stdio: 'pipe'
                  });
                  
                  if (fs.existsSync(tempFile)) {
                    const content = fs.readFileSync(tempFile, 'utf8');
                    const match = content.match(new RegExp(`^${varName}=(.*)$`, 'm'));
                    if (match) {
                      envVars[varName] = match[1];
                    }
                    fs.unlinkSync(tempFile);
                  }
                } catch (e) {
                  console.log(`  ⚠️  Could not fetch ${varName}`);
                }
              }
            }
          }
        }
      }
      
      return envVars;
    } catch (error) {
      console.error('❌ Error pulling from Vercel:', error.message);
      throw error;
    }
  }

  /**
   * Save environment variables locally
   */
  async saveLocal(envVars, password = null) {
    // Save unencrypted version to .env.local
    const envContent = Object.entries(envVars)
      .map(([key, value]) => `${key}=${value}`)
      .join('\n');
    
    fs.writeFileSync(ENV_LOCAL_PATH, envContent + '\n');
    console.log(`✅ Saved ${Object.keys(envVars).length} variables to .env.local`);
    
    // Save encrypted version if password provided
    if (password) {
      const encrypted = this.encrypt(envContent, password);
      fs.writeFileSync(ENV_VAULT_PATH, encrypted);
      console.log(`🔒 Encrypted vault saved to .env.vault`);
    }
    
    // Create production local file
    const prodVars = {
      ...envVars,
      NODE_ENV: 'production',
      VITE_ENABLE_DEVELOPER_MODE: 'false'
    };
    
    const prodContent = Object.entries(prodVars)
      .map(([key, value]) => `${key}=${value}`)
      .join('\n');
    
    fs.writeFileSync(ENV_PRODUCTION_PATH, prodContent + '\n');
    console.log(`✅ Saved production config to .env.production.local`);
  }

  /**
   * Load from encrypted vault
   */
  async loadFromVault(password) {
    if (!fs.existsSync(ENV_VAULT_PATH)) {
      throw new Error('No encrypted vault found. Run sync first.');
    }
    
    const encrypted = fs.readFileSync(ENV_VAULT_PATH, 'utf8');
    const decrypted = this.decrypt(encrypted, password);
    
    // Parse and return as object
    const envVars = {};
    decrypted.split('\n').forEach(line => {
      const [key, ...valueParts] = line.split('=');
      if (key) {
        envVars[key] = valueParts.join('=');
      }
    });
    
    return envVars;
  }

  /**
   * Main sync process
   */
  async sync(options = {}) {
    const { environment = 'development', encrypt = true } = options;
    
    console.log('\n🔄 Vercel Environment Sync');
    console.log('=' .repeat(40));
    
    try {
      // Check Vercel CLI authentication
      try {
        execSync('vercel whoami', { stdio: 'pipe' });
      } catch (error) {
        console.error('❌ Not authenticated with Vercel. Please run: vercel login');
        process.exit(1);
      }
      
      // Pull from Vercel
      const envVars = await this.pullFromVercel(environment);
      
      if (Object.keys(envVars).length === 0) {
        console.log('⚠️  No environment variables found');
        return;
      }
      
      // Ask for encryption password if needed
      let password = null;
      if (encrypt) {
        console.log('\n🔐 Encryption Setup');
        password = await question('Enter password to encrypt API keys (or press Enter to skip): ');
        if (!password) {
          console.log('⚠️  Skipping encryption - keys will be stored in plain text');
        }
      }
      
      // Save locally
      await this.saveLocal(envVars, password);
      
      // Update .gitignore
      this.updateGitignore();
      
      console.log('\n✨ Sync completed successfully!');
      console.log('\nNext steps:');
      console.log('  • Run "npm run deploy:local" to deploy locally');
      console.log('  • Run "npm run build:local" to build for local deployment');
      console.log('  • Environment variables are now available in .env.local');
      
    } catch (error) {
      console.error('\n❌ Sync failed:', error.message);
      process.exit(1);
    } finally {
      rl.close();
    }
  }

  /**
   * Update .gitignore to exclude sensitive files
   */
  updateGitignore() {
    const gitignorePath = path.join(ROOT_DIR, '.gitignore');
    const content = fs.readFileSync(gitignorePath, 'utf8');
    
    const toAdd = [
      '.env.local',
      '.env.vault',
      '.env.production.local',
      '.env.*.local'
    ];
    
    let updated = content;
    toAdd.forEach(item => {
      if (!content.includes(item)) {
        updated += `\n${item}`;
      }
    });
    
    if (updated !== content) {
      fs.writeFileSync(gitignorePath, updated);
      console.log('📝 Updated .gitignore');
    }
  }
}

// CLI Interface
async function main() {
  const args = process.argv.slice(2);
  const sync = new EnvSync();
  
  const options = {
    environment: 'development',
    encrypt: true
  };
  
  // Parse arguments
  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--env':
      case '-e':
        options.environment = args[++i] || 'development';
        break;
      case '--no-encrypt':
        options.encrypt = false;
        break;
      case '--help':
      case '-h':
        console.log(`
Vercel Environment Sync Tool

Usage: node sync-env.js [options]

Options:
  -e, --env <environment>  Environment to sync (development, preview, production)
  --no-encrypt            Skip encryption (store in plain text)
  -h, --help             Show this help message

Examples:
  node sync-env.js                    # Sync development environment
  node sync-env.js --env production   # Sync production environment
  node sync-env.js --no-encrypt       # Sync without encryption
        `);
        process.exit(0);
        break;
    }
  }
  
  await sync.sync(options);
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export default EnvSync;