#!/usr/bin/env tsx

/**
 * Local test script for AI Agents System
 * 
 * This demonstrates the multi-agent system with mock AI provider
 * Run with: npm run test:local
 */

import { 
  createAgentSystem, 
  createECommerceWorkflow,
  createCodeQualityWorkflow,
  ExampleWorkflowManager 
} from '../src';

// Mock AI Provider for local testing
class MockAIProvider {
  async generateText(prompt: string, options?: any): Promise<string> {
    console.log(`🤖 AI Provider called with prompt: ${prompt.substring(0, 100)}...`);
    
    // Simple mock responses based on prompt content
    if (prompt.includes('intent classification')) {
      return JSON.stringify({
        intent: 'generation',
        confidence: 0.9,
        reasoning: 'User wants to create something new based on the request',
        shouldExecuteDirectly: true,
        shouldShowOptions: false
      });
    }
    
    if (prompt.includes('framework recommendation')) {
      return JSON.stringify({
        primary: {
          framework: {
            name: 'React',
            id: 'react',
            category: 'frontend',
            type: 'library',
            description: 'A JavaScript library for building user interfaces'
          },
          score: 95,
          reasoning: 'React is excellent for complex e-commerce sites with its component-based architecture',
          pros: ['Large ecosystem', 'Great performance', 'Strong community'],
          cons: ['Steep learning curve', 'Rapid changes'],
          confidence: 'high'
        },
        alternatives: [{
          framework: {
            name: 'Vue.js',
            id: 'vue',
            category: 'frontend',
            type: 'framework',
            description: 'The Progressive JavaScript Framework'
          },
          score: 85,
          reasoning: 'Vue offers a gentler learning curve with excellent documentation',
          pros: ['Easy to learn', 'Great documentation', 'Flexible'],
          cons: ['Smaller ecosystem', 'Less job market'],
          confidence: 'medium'
        }],
        summary: 'React is recommended for your e-commerce project due to its robust ecosystem and performance.',
        nextSteps: [
          'Set up React development environment',
          'Choose a UI library like Material-UI or Ant Design',
          'Plan state management with Redux or Context API'
        ],
        considerations: [
          'Consider the learning curve if team is new to React',
          'Plan for proper testing strategy',
          'Consider server-side rendering with Next.js'
        ],
        aiReasoning: 'Based on the e-commerce requirements, React provides the best balance of performance, ecosystem, and scalability.'
      });
    }
    
    if (prompt.includes('website generation') || prompt.includes('Create')) {
      return JSON.stringify({
        html: `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>E-Commerce Site</title>
    <link rel="stylesheet" href="styles.css">
</head>
<body>
    <header>
        <nav class="navbar">
            <div class="nav-brand">ShopNow</div>
            <ul class="nav-links">
                <li><a href="#home">Home</a></li>
                <li><a href="#products">Products</a></li>
                <li><a href="#cart">Cart</a></li>
                <li><a href="#account">Account</a></li>
            </ul>
        </nav>
    </header>
    
    <main>
        <section class="hero">
            <h1>Welcome to ShopNow</h1>
            <p>Discover amazing products at great prices</p>
            <button class="cta-button">Shop Now</button>
        </section>
        
        <section class="featured-products">
            <h2>Featured Products</h2>
            <div class="product-grid">
                <div class="product-card">
                    <img src="product1.jpg" alt="Product 1">
                    <h3>Amazing Product 1</h3>
                    <p class="price">$99.99</p>
                    <button class="add-to-cart">Add to Cart</button>
                </div>
                <div class="product-card">
                    <img src="product2.jpg" alt="Product 2">
                    <h3>Great Product 2</h3>
                    <p class="price">$149.99</p>
                    <button class="add-to-cart">Add to Cart</button>
                </div>
            </div>
        </section>
    </main>
    
    <script src="app.js"></script>
</body>
</html>`,
        css: `/* Modern E-Commerce Styles */
* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}

body {
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    line-height: 1.6;
    color: #333;
}

.navbar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1rem 5%;
    background: #2c3e50;
    color: white;
}

.nav-brand {
    font-size: 1.5rem;
    font-weight: bold;
}

.nav-links {
    display: flex;
    list-style: none;
    gap: 2rem;
}

.nav-links a {
    color: white;
    text-decoration: none;
    transition: color 0.3s;
}

.nav-links a:hover {
    color: #3498db;
}

.hero {
    text-align: center;
    padding: 4rem 5%;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
}

.hero h1 {
    font-size: 3rem;
    margin-bottom: 1rem;
}

.cta-button {
    background: #e74c3c;
    color: white;
    border: none;
    padding: 1rem 2rem;
    font-size: 1.1rem;
    border-radius: 5px;
    cursor: pointer;
    transition: transform 0.3s;
}

.cta-button:hover {
    transform: translateY(-2px);
}

.featured-products {
    padding: 4rem 5%;
}

.featured-products h2 {
    text-align: center;
    margin-bottom: 2rem;
    font-size: 2.5rem;
}

.product-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 2rem;
    max-width: 1200px;
    margin: 0 auto;
}

.product-card {
    border: 1px solid #ddd;
    border-radius: 8px;
    padding: 1.5rem;
    text-align: center;
    transition: transform 0.3s;
}

.product-card:hover {
    transform: translateY(-5px);
    box-shadow: 0 5px 15px rgba(0,0,0,0.1);
}

.product-card img {
    width: 100%;
    height: 200px;
    object-fit: cover;
    border-radius: 5px;
}

.price {
    font-size: 1.3rem;
    font-weight: bold;
    color: #e74c3c;
    margin: 0.5rem 0;
}

.add-to-cart {
    background: #27ae60;
    color: white;
    border: none;
    padding: 0.8rem 1.5rem;
    border-radius: 5px;
    cursor: pointer;
    transition: background 0.3s;
}

.add-to-cart:hover {
    background: #2ecc71;
}

@media (max-width: 768px) {
    .navbar {
        flex-direction: column;
        gap: 1rem;
    }
    
    .hero h1 {
        font-size: 2rem;
    }
    
    .product-grid {
        grid-template-columns: 1fr;
    }
}`,
        js: `// E-Commerce Site JavaScript
document.addEventListener('DOMContentLoaded', function() {
    console.log('E-Commerce site loaded successfully!');
    
    // Shopping cart functionality
    let cart = [];
    
    // Add to cart functionality
    const addToCartButtons = document.querySelectorAll('.add-to-cart');
    addToCartButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            const productCard = e.target.closest('.product-card');
            const productName = productCard.querySelector('h3').textContent;
            const productPrice = productCard.querySelector('.price').textContent;
            
            const product = {
                name: productName,
                price: productPrice,
                id: Date.now()
            };
            
            cart.push(product);
            updateCartDisplay();
            showNotification(\`Added \${productName} to cart!\`);
        });
    });
    
    function updateCartDisplay() {
        console.log('Cart updated:', cart);
        // In a real app, this would update the cart UI
    }
    
    function showNotification(message) {
        // Simple notification
        const notification = document.createElement('div');
        notification.textContent = message;
        notification.style.cssText = \`
            position: fixed;
            top: 20px;
            right: 20px;
            background: #27ae60;
            color: white;
            padding: 1rem;
            border-radius: 5px;
            z-index: 1000;
        \`;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 3000);
    }
    
    // Smooth scrolling for navigation
    const navLinks = document.querySelectorAll('.nav-links a');
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({ behavior: 'smooth' });
            }
        });
    });
});`,
        metadata: {
          framework: 'vanilla',
          dependencies: []
        }
      });
    }
    
    if (prompt.includes('code review') || prompt.includes('Analyze')) {
      return JSON.stringify({
        overallScore: 78,
        summary: 'The code shows good structure and modern practices, with some areas for improvement in performance and accessibility.',
        issues: [
          {
            type: 'warning',
            category: 'performance',
            line: 15,
            message: 'Consider lazy loading images for better initial page load performance',
            suggestion: 'Implement intersection observer for image lazy loading',
            severity: 'medium',
            confidence: 0.8
          },
          {
            type: 'suggestion',
            category: 'accessibility',
            line: 32,
            message: 'Add ARIA labels to navigation elements for better screen reader support',
            suggestion: 'Add aria-label attributes to navigation links',
            severity: 'medium',
            confidence: 0.9
          },
          {
            type: 'info',
            category: 'best-practices',
            line: 45,
            message: 'Consider using CSS Grid more extensively for responsive layouts',
            suggestion: 'Expand CSS Grid usage for better responsive design',
            severity: 'low',
            confidence: 0.7
          }
        ],
        strengths: [
          'Clean, semantic HTML structure',
          'Responsive design with mobile-first approach',
          'Modern CSS with good use of flexbox and grid',
          'Proper event handling in JavaScript'
        ],
        recommendations: [
          'Add comprehensive error handling for API calls',
          'Implement proper form validation',
          'Consider adding a service worker for offline functionality',
          'Add unit tests for JavaScript functions'
        ],
        metrics: {
          linesOfCode: 156,
          complexity: 'medium',
          maintainabilityScore: 82,
          securityScore: 75,
          performanceScore: 70
        }
      });
    }
    
    if (prompt.includes('documentation') || prompt.includes('README')) {
      return JSON.stringify({
        title: 'E-Commerce Website - README',
        content: `# ShopNow E-Commerce Website

A modern, responsive e-commerce website built with React and modern web technologies.

## 🚀 Features

- **Responsive Design**: Works perfectly on desktop, tablet, and mobile devices
- **Product Catalog**: Browse and search through products
- **Shopping Cart**: Add items to cart with real-time updates
- **User Authentication**: Secure login and registration system
- **Payment Processing**: Integrated payment gateway support
- **Admin Dashboard**: Manage products, orders, and customers

## 🛠 Technology Stack

- **Frontend**: React 18, TypeScript, CSS3
- **Backend**: Node.js, Express
- **Database**: MongoDB
- **Authentication**: JWT
- **Payment**: Stripe API
- **Deployment**: Vercel/Netlify

## 📋 Prerequisites

Before you begin, ensure you have the following installed:
- Node.js (v16 or higher)
- npm or yarn
- Git

## 🔧 Installation

1. **Clone the repository**
   \`\`\`bash
   git clone https://github.com/yourusername/shopnow-ecommerce.git
   cd shopnow-ecommerce
   \`\`\`

2. **Install dependencies**
   \`\`\`bash
   npm install
   \`\`\`

3. **Set up environment variables**
   \`\`\`bash
   cp .env.example .env
   \`\`\`
   
   Edit \`.env\` and add your configuration:
   \`\`\`env
   REACT_APP_API_URL=http://localhost:3001
   STRIPE_PUBLIC_KEY=your_stripe_public_key
   MONGODB_URI=your_mongodb_connection_string
   JWT_SECRET=your_jwt_secret
   \`\`\`

4. **Start the development server**
   \`\`\`bash
   npm start
   \`\`\`

The application will be available at \`http://localhost:3000\`.

## 🏗 Project Structure

\`\`\`
shopnow-ecommerce/
├── src/
│   ├── components/          # React components
│   │   ├── Header/
│   │   ├── ProductCard/
│   │   └── ShoppingCart/
│   ├── pages/              # Page components
│   │   ├── Home/
│   │   ├── Products/
│   │   └── Checkout/
│   ├── hooks/              # Custom React hooks
│   ├── services/           # API services
│   ├── utils/              # Utility functions
│   └── styles/             # Global styles
├── public/                 # Static assets
├── tests/                  # Test files
└── docs/                   # Documentation
\`\`\`

## 🧪 Testing

Run the test suite:
\`\`\`bash
npm test
\`\`\`

Run tests with coverage:
\`\`\`bash
npm run test:coverage
\`\`\`

## 🚀 Deployment

### Production Build
\`\`\`bash
npm run build
\`\`\`

### Deploy to Vercel
\`\`\`bash
npm install -g vercel
vercel --prod
\`\`\`

### Deploy to Netlify
\`\`\`bash
npm run build
# Upload dist/ folder to Netlify
\`\`\`

## 📱 API Documentation

### Products
- \`GET /api/products\` - Get all products
- \`GET /api/products/:id\` - Get product by ID
- \`POST /api/products\` - Create new product (admin)
- \`PUT /api/products/:id\` - Update product (admin)
- \`DELETE /api/products/:id\` - Delete product (admin)

### Users
- \`POST /api/auth/register\` - Register new user
- \`POST /api/auth/login\` - User login
- \`GET /api/users/profile\` - Get user profile
- \`PUT /api/users/profile\` - Update user profile

### Orders
- \`POST /api/orders\` - Create new order
- \`GET /api/orders\` - Get user orders
- \`GET /api/orders/:id\` - Get order by ID

## 🎨 Customization

### Styling
The project uses CSS modules and styled-components. Customize the theme in:
- \`src/styles/theme.js\` - Main theme configuration
- \`src/styles/globals.css\` - Global styles

### Environment Configuration
- Development: \`.env.development\`
- Production: \`.env.production\`
- Testing: \`.env.test\`

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (\`git checkout -b feature/AmazingFeature\`)
3. Commit your changes (\`git commit -m 'Add some AmazingFeature'\`)
4. Push to the branch (\`git push origin feature/AmazingFeature\`)
5. Open a Pull Request

Please read [CONTRIBUTING.md](CONTRIBUTING.md) for details on our code of conduct and the process for submitting pull requests.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE.md](LICENSE.md) file for details.

## 🆘 Support

If you have any questions or need help, please:
1. Check the [FAQ](docs/FAQ.md)
2. Search [existing issues](https://github.com/yourusername/shopnow-ecommerce/issues)
3. Create a [new issue](https://github.com/yourusername/shopnow-ecommerce/issues/new)

## 🙏 Acknowledgments

- React team for the amazing framework
- Stripe for payment processing
- MongoDB for the database solution
- All contributors who helped build this project

---

Built with ❤️ by [Your Name](https://github.com/yourusername)`,
        sections: [
          {
            title: 'Overview',
            content: 'Project introduction and key features',
            subsections: ['Features', 'Technology Stack']
          },
          {
            title: 'Getting Started',
            content: 'Installation and setup instructions',
            subsections: ['Prerequisites', 'Installation', 'Configuration']
          },
          {
            title: 'Development',
            content: 'Development workflow and guidelines',
            subsections: ['Project Structure', 'Testing', 'API Documentation']
          }
        ],
        metadata: {
          wordCount: 892,
          estimatedReadTime: '4 minutes',
          completeness: 95,
          suggestions: [
            'Add screenshots of the application',
            'Include performance benchmarks',
            'Add security best practices section'
          ]
        }
      });
    }
    
    if (prompt.includes('chat') || prompt.includes('friendly')) {
      return `Great! I've successfully analyzed your e-commerce project request. Here's what we accomplished:

🎯 **Project Analysis**: Your request for an e-commerce site was classified as a "generation" intent with high confidence (90%). This means you want to create something new rather than modify existing code.

🏗️ **Technology Recommendation**: Based on your requirements, I recommended React as the primary framework with a score of 95/100. React excels for e-commerce sites because of its:
- Component-based architecture for reusable UI elements
- Strong ecosystem with libraries for payments, routing, and state management  
- Excellent performance for interactive shopping experiences
- Large community support

💻 **Generated Code**: I created a complete e-commerce website foundation including:
- Responsive HTML structure with header navigation and product grid
- Modern CSS with mobile-first design and smooth animations
- Interactive JavaScript for shopping cart functionality and notifications
- Clean, semantic code following best practices

🔍 **Quality Review**: The code analysis shows a solid foundation (78/100 overall score) with:
- ✅ Good structure and responsive design
- ⚠️ Some opportunities for performance optimization (lazy loading images)
- ⚠️ Accessibility improvements needed (ARIA labels)
- 💡 Suggestions for enhanced features (offline functionality, better error handling)

📚 **Documentation**: I generated comprehensive project documentation including setup instructions, API endpoints, deployment guides, and contribution guidelines.

**Next Steps:**
1. Review the generated code and customize it for your specific products
2. Set up your development environment with React and necessary dependencies
3. Implement the suggested improvements from the code review
4. Add your payment gateway integration (Stripe recommended)
5. Test the site thoroughly before deployment

Would you like me to help you with any specific aspect of the implementation, such as setting up the payment system or adding specific product categories?`;
    }
    
    // Default response for workflow orchestration
    return JSON.stringify({
      workflowPlan: {
        steps: [
          {
            id: 'step-1',
            name: 'Analyze User Request',
            description: 'Use intent classification to understand requirements',
            agentId: 'intent-classification',
            input: { message: 'Mock user request' },
            dependencies: [],
            estimatedDuration: '30 seconds',
            criticality: 'high'
          },
          {
            id: 'step-2',
            name: 'Framework Recommendation',
            description: 'Get technology stack recommendations',
            agentId: 'framework-advisor',
            input: { prompt: 'Mock requirements' },
            dependencies: ['step-1'],
            estimatedDuration: '45 seconds',
            criticality: 'high'
          }
        ],
        totalEstimatedTime: '3-5 minutes',
        complexity: 'medium',
        requiredAgents: ['intent-classification', 'framework-advisor', 'website-generation'],
        successCriteria: ['Clear requirements understood', 'Framework selected', 'Code generated'],
        riskAssessment: ['Complex requirements may need clarification']
      },
      recommendations: [
        'Start with a clear project scope',
        'Choose technologies based on team expertise',
        'Plan for testing and deployment early'
      ],
      nextActions: [
        'Execute the planned workflow',
        'Review generated code quality',
        'Set up development environment'
      ]
    });
  }

  async generateJSON(prompt: string, schema?: any, options?: any): Promise<any> {
    const response = await this.generateText(prompt, options);
    try {
      return JSON.parse(response);
    } catch {
      return { error: 'Failed to parse JSON response' };
    }
  }

  async chat(messages: any[], options?: any): Promise<string> {
    const lastMessage = messages[messages.length - 1];
    return this.generateText(lastMessage.content, options);
  }
}

// Test Functions
async function testSingleAgent() {
  console.log('\n🧪 Testing Single Agent Execution...\n');
  
  const { manager } = createAgentSystem(new MockAIProvider());
  
  // Test Intent Classification
  console.log('1️⃣ Testing Intent Classification Agent:');
  const intentResult = await manager.executeAgent('intent-classification', {
    message: 'I want to build an e-commerce website with shopping cart and payment processing',
    responseMode: 'explain-first'
  });
  
  console.log('✅ Intent Classification Result:', {
    success: intentResult.success,
    intent: intentResult.data?.intent,
    confidence: intentResult.data?.confidence,
    reasoning: intentResult.data?.reasoning?.substring(0, 100) + '...'
  });
  
  // Test Framework Advisor
  console.log('\n2️⃣ Testing Framework Advisor Agent:');
  const frameworkResult = await manager.executeAgent('framework-advisor', {
    prompt: 'I need a fast e-commerce site with SEO support and user authentication',
    maxAlternatives: 2
  });
  
  console.log('✅ Framework Advisor Result:', {
    success: frameworkResult.success,
    primaryFramework: frameworkResult.data?.primary?.framework?.name,
    score: frameworkResult.data?.primary?.score,
    alternatives: frameworkResult.data?.alternatives?.length
  });
  
  // Test Website Generation
  console.log('\n3️⃣ Testing Website Generation Agent:');
  const websiteResult = await manager.executeAgent('website-generation', {
    prompt: 'Create a modern e-commerce landing page with product showcase',
    framework: 'react',
    device: 'desktop'
  });
  
  console.log('✅ Website Generation Result:', {
    success: websiteResult.success,
    htmlLength: websiteResult.data?.html?.length,
    cssLength: websiteResult.data?.css?.length,
    jsLength: websiteResult.data?.js?.length
  });
}

async function testWorkflowExecution() {
  console.log('\n🔄 Testing Multi-Agent Workflow...\n');
  
  const { workflowManager } = createAgentSystem(new MockAIProvider());
  
  // Test E-Commerce Workflow
  console.log('🛒 Executing E-Commerce Creation Workflow:');
  
  const progressCallback = (step: string, progress: number) => {
    console.log(`   📊 Progress: ${step} - ${progress}%`);
  };
  
  const workflowResult = await workflowManager.executeECommerceWorkflow(
    'Build a modern e-commerce site with product catalog, shopping cart, user authentication, and payment processing',
    'test-user-123',
    progressCallback
  );
  
  console.log('\n✅ E-Commerce Workflow Result:', {
    success: workflowResult.success,
    completedSteps: workflowResult.data ? Object.keys(workflowResult.data).length : 0,
    hasError: !!workflowResult.error
  });
  
  if (workflowResult.success && workflowResult.data) {
    console.log('   📋 Workflow Steps Completed:');
    Object.keys(workflowResult.data).forEach((step, index) => {
      console.log(`   ${index + 1}. ${step} ✅`);
    });
  }
}

async function testCodeReview() {
  console.log('\n🔍 Testing Code Review Agent...\n');
  
  const { manager } = createAgentSystem(new MockAIProvider());
  
  const sampleCode = `
function calculateTotal(items) {
  let total = 0;
  for (let i = 0; i < items.length; i++) {
    total += items[i].price * items[i].quantity;
  }
  return total;
}

const ShoppingCart = ({ items, onUpdateQuantity }) => {
  const [loading, setLoading] = useState(false);
  
  const handleCheckout = async () => {
    setLoading(true);
    try {
      const total = calculateTotal(items);
      const response = await fetch('/api/checkout', {
        method: 'POST',
        body: JSON.stringify({ items, total })
      });
      const result = await response.json();
      alert('Checkout successful!');
    } catch (error) {
      alert('Checkout failed!');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="shopping-cart">
      {items.map(item => (
        <div key={item.id} className="cart-item">
          <span>{item.name}</span>
          <span>{item.price}</span>
        </div>
      ))}
      <button onClick={handleCheckout} disabled={loading}>
        {loading ? 'Processing...' : 'Checkout'}
      </button>
    </div>
  );
};`;
  
  const reviewResult = await manager.executeAgent('code-review', {
    code: sampleCode,
    language: 'javascript',
    reviewType: 'thorough',
    context: {
      framework: 'react',
      purpose: 'E-commerce shopping cart component'
    }
  });
  
  console.log('✅ Code Review Result:', {
    success: reviewResult.success,
    overallScore: reviewResult.data?.overallScore,
    issuesFound: reviewResult.data?.issues?.length,
    strengths: reviewResult.data?.strengths?.length,
    recommendations: reviewResult.data?.recommendations?.length
  });
  
  if (reviewResult.data?.issues) {
    console.log('\n   🚨 Issues Found:');
    reviewResult.data.issues.forEach((issue: any, index: number) => {
      console.log(`   ${index + 1}. [${issue.severity.toUpperCase()}] ${issue.message}`);
    });
  }
}

async function testDocumentationGeneration() {
  console.log('\n📚 Testing Documentation Agent...\n');
  
  const { manager } = createAgentSystem(new MockAIProvider());
  
  const docResult = await manager.executeAgent('documentation', {
    projectInfo: {
      name: 'ShopNow E-Commerce',
      description: 'Modern e-commerce website with React and Node.js',
      version: '1.0.0',
      author: 'Test Developer'
    },
    codebase: {
      technologies: ['React', 'Node.js', 'MongoDB', 'Express'],
      framework: 'React'
    },
    documentationType: 'readme',
    audience: 'developers'
  });
  
  console.log('✅ Documentation Generation Result:', {
    success: docResult.success,
    title: docResult.data?.title,
    wordCount: docResult.data?.metadata?.wordCount,
    readTime: docResult.data?.metadata?.estimatedReadTime,
    completeness: docResult.data?.metadata?.completeness + '%',
    sections: docResult.data?.sections?.length
  });
}

// Main test runner
async function runAllTests() {
  console.log('🚀 Starting AI Agents System Local Tests...\n');
  console.log('=' .repeat(60));
  
  try {
    await testSingleAgent();
    await testWorkflowExecution();
    await testCodeReview();
    await testDocumentationGeneration();
    
    console.log('\n' + '=' .repeat(60));
    console.log('🎉 All tests completed successfully!');
    console.log('\n💡 The AI Agents System is working correctly with mock data.');
    console.log('   To use with real AI providers, replace MockAIProvider with your actual provider.');
    
  } catch (error) {
    console.error('\n❌ Test failed:', error);
    process.exit(1);
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  runAllTests();
}

export { runAllTests, testSingleAgent, testWorkflowExecution };