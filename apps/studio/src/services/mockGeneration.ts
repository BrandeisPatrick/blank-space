import { Artifact } from '../types'

// Mock generation service for development
export const generateWebsite = async (prompt: string): Promise<Artifact> => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 2000))

  const artifactId = `artifact_${Date.now()}`
  
  // Generate mock HTML based on prompt keywords
  let html = ''
  let css = ''
  
  if (prompt.toLowerCase().includes('landing') || prompt.toLowerCase().includes('saas')) {
    html = `
<div class="container">
  <header class="hero">
    <h1>Revolutionary SaaS Platform</h1>
    <p>Transform your workflow with our cutting-edge solution</p>
    <button class="cta-button">Get Started Free</button>
  </header>
  
  <section class="features">
    <h2>Key Features</h2>
    <div class="feature-grid">
      <div class="feature">
        <h3>🚀 Fast</h3>
        <p>Lightning-fast performance</p>
      </div>
      <div class="feature">
        <h3>🔒 Secure</h3>
        <p>Enterprise-grade security</p>
      </div>
      <div class="feature">
        <h3>📊 Analytics</h3>
        <p>Powerful insights & reporting</p>
      </div>
    </div>
  </section>
  
  <section class="pricing">
    <h2>Simple Pricing</h2>
    <div class="pricing-cards">
      <div class="pricing-card">
        <h3>Starter</h3>
        <div class="price">$9/mo</div>
        <ul>
          <li>Up to 1,000 users</li>
          <li>Basic analytics</li>
          <li>Email support</li>
        </ul>
        <button>Choose Plan</button>
      </div>
      <div class="pricing-card featured">
        <h3>Professional</h3>
        <div class="price">$29/mo</div>
        <ul>
          <li>Up to 10,000 users</li>
          <li>Advanced analytics</li>
          <li>Priority support</li>
        </ul>
        <button>Choose Plan</button>
      </div>
    </div>
  </section>
</div>`

    css = `
.container { max-width: 1200px; margin: 0 auto; padding: 0 20px; }
.hero { text-align: center; padding: 80px 0; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; margin: -20px -20px 60px; }
.hero h1 { font-size: 3rem; margin-bottom: 1rem; }
.hero p { font-size: 1.2rem; margin-bottom: 2rem; opacity: 0.9; }
.cta-button { background: white; color: #667eea; padding: 12px 32px; border: none; border-radius: 6px; font-size: 1.1rem; font-weight: 600; cursor: pointer; }
.features { padding: 60px 0; }
.features h2 { text-align: center; font-size: 2.5rem; margin-bottom: 3rem; }
.feature-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 2rem; }
.feature { text-align: center; padding: 2rem; border: 1px solid #e5e7eb; border-radius: 8px; }
.feature h3 { font-size: 1.5rem; margin-bottom: 1rem; }
.pricing { padding: 60px 0; background: #f9fafb; margin: 0 -20px; }
.pricing h2 { text-align: center; font-size: 2.5rem; margin-bottom: 3rem; }
.pricing-cards { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 2rem; max-width: 800px; margin: 0 auto; }
.pricing-card { background: white; padding: 2rem; border-radius: 12px; text-align: center; border: 1px solid #e5e7eb; }
.pricing-card.featured { border-color: #3b82f6; transform: scale(1.05); }
.price { font-size: 2rem; font-weight: bold; color: #3b82f6; margin: 1rem 0; }
.pricing-card ul { list-style: none; padding: 0; margin: 1.5rem 0; }
.pricing-card li { padding: 0.5rem 0; }
.pricing-card button { background: #3b82f6; color: white; padding: 12px 24px; border: none; border-radius: 6px; cursor: pointer; width: 100%; }`
  
  } else if (prompt.toLowerCase().includes('blog') || prompt.toLowerCase().includes('article')) {
    html = `
<div class="blog-container">
  <header class="blog-header">
    <h1>Tech Insights Blog</h1>
    <nav>
      <a href="#home">Home</a>
      <a href="#about">About</a>
      <a href="#contact">Contact</a>
    </nav>
  </header>
  
  <main class="blog-content">
    <article class="post">
      <h2>The Future of Web Development</h2>
      <div class="post-meta">
        <span>Published on March 15, 2024</span>
        <span>By John Doe</span>
      </div>
      <p>Web development is evolving rapidly with new technologies and frameworks emerging every day...</p>
      <a href="#" class="read-more">Read More</a>
    </article>
    
    <article class="post">
      <h2>Building Scalable Applications</h2>
      <div class="post-meta">
        <span>Published on March 10, 2024</span>
        <span>By Jane Smith</span>
      </div>
      <p>Scalability is crucial for modern applications. Here's how to build systems that can grow...</p>
      <a href="#" class="read-more">Read More</a>
    </article>
  </main>
  
  <aside class="sidebar">
    <h3>Recent Posts</h3>
    <ul>
      <li><a href="#">Getting Started with React</a></li>
      <li><a href="#">CSS Grid vs Flexbox</a></li>
      <li><a href="#">JavaScript ES2024 Features</a></li>
    </ul>
  </aside>
</div>`

    css = `
.blog-container { max-width: 1200px; margin: 0 auto; padding: 20px; display: grid; grid-template-columns: 2fr 1fr; gap: 40px; }
.blog-header { grid-column: 1 / -1; display: flex; justify-content: space-between; align-items: center; padding: 20px 0; border-bottom: 1px solid #e5e7eb; }
.blog-header h1 { color: #1f2937; }
.blog-header nav { display: flex; gap: 20px; }
.blog-header a { text-decoration: none; color: #6b7280; font-weight: 500; }
.blog-content { display: flex; flex-direction: column; gap: 30px; }
.post { background: white; padding: 30px; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
.post h2 { color: #1f2937; margin-bottom: 10px; }
.post-meta { color: #6b7280; font-size: 14px; margin-bottom: 15px; }
.post-meta span { margin-right: 15px; }
.read-more { color: #3b82f6; text-decoration: none; font-weight: 500; }
.sidebar { background: #f9fafb; padding: 30px; border-radius: 8px; height: fit-content; }
.sidebar h3 { margin-bottom: 20px; color: #1f2937; }
.sidebar ul { list-style: none; padding: 0; }
.sidebar li { margin-bottom: 10px; }
.sidebar a { color: #6b7280; text-decoration: none; }
.sidebar a:hover { color: #3b82f6; }`

  } else {
    // Default simple website
    html = `
<div class="website">
  <header>
    <h1>Welcome to My Website</h1>
    <nav>
      <a href="#home">Home</a>
      <a href="#about">About</a>
      <a href="#services">Services</a>
      <a href="#contact">Contact</a>
    </nav>
  </header>
  
  <main>
    <section class="hero">
      <h2>Hello, World!</h2>
      <p>This is a generated website based on your prompt: "${prompt.slice(0, 100)}..."</p>
      <button>Learn More</button>
    </section>
    
    <section class="content">
      <div class="card">
        <h3>Feature One</h3>
        <p>Description of your first feature or service.</p>
      </div>
      <div class="card">
        <h3>Feature Two</h3>
        <p>Description of your second feature or service.</p>
      </div>
      <div class="card">
        <h3>Feature Three</h3>
        <p>Description of your third feature or service.</p>
      </div>
    </section>
  </main>
  
  <footer>
    <p>&copy; 2024 My Website. All rights reserved.</p>
  </footer>
</div>`

    css = `
body { margin: 0; font-family: system-ui, -apple-system, sans-serif; line-height: 1.6; color: #333; }
.website { min-height: 100vh; display: flex; flex-direction: column; }
header { background: #2563eb; color: white; padding: 1rem 2rem; display: flex; justify-content: space-between; align-items: center; }
header h1 { margin: 0; }
nav { display: flex; gap: 1rem; }
nav a { color: white; text-decoration: none; padding: 0.5rem 1rem; border-radius: 4px; transition: background 0.2s; }
nav a:hover { background: rgba(255,255,255,0.1); }
main { flex: 1; padding: 2rem; }
.hero { text-align: center; padding: 4rem 0; background: linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%); margin: 0 -2rem 3rem; }
.hero h2 { font-size: 2.5rem; margin-bottom: 1rem; }
.hero button { background: #2563eb; color: white; padding: 0.75rem 2rem; border: none; border-radius: 6px; font-size: 1.1rem; cursor: pointer; }
.content { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 2rem; max-width: 1200px; margin: 0 auto; }
.card { background: white; padding: 2rem; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
.card h3 { color: #2563eb; margin-bottom: 1rem; }
footer { background: #1f2937; color: white; text-align: center; padding: 2rem; }`
  }

  const artifact: Artifact = {
    id: artifactId,
    projectId: 'default',
    regionId: 'full-page',
    files: {
      'index.html': html,
      'styles.css': css,
      'script.js': '// Interactive features will be added here'
    },
    entry: 'index.html',
    metadata: {
      device: 'desktop_1080p',
      region: {
        start: { x: 0, y: 0 },
        end: { x: 23, y: 19 }
      },
      framework: 'vanilla',
      dependencies: []
    },
    createdAt: new Date().toISOString(),
    author: 'ai-generator'
  }

  return artifact
}