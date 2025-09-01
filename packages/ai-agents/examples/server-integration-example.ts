#!/usr/bin/env tsx

/**
 * Example: Server Integration with AI Agents System
 * 
 * This shows how to integrate the AI agent system with your existing Express server
 * and replace direct AI provider calls with orchestrated agent workflows.
 */

import { 
  AgentManager,
  ContextManager,
  DefaultAgentRegistry,
  registerDefaultAgents
} from '../src';
import { ExampleWorkflowManager } from '../src/workflows/exampleWorkflows';

// Mock Express-like request/response for demonstration
interface MockRequest {
  body: any;
  user?: { id: string };
}

interface MockResponse {
  json(data: any): void;
  status(code: number): MockResponse;
}

// Mock AI Provider (in production, this would be your real AI provider)
class MockAIProvider {
  async generateText(prompt: string, options?: any): Promise<string> {
    // Simulate different responses for different agent types
    if (prompt.includes('intent classification')) {
      return JSON.stringify({
        intent: 'generation',
        confidence: 0.95,
        reasoning: 'User wants to create a website based on their description',
        shouldExecuteDirectly: true,
        shouldShowOptions: false
      });
    }
    
    if (prompt.includes('framework')) {
      return JSON.stringify({
        primary: {
          framework: { name: 'React', id: 'react', category: 'frontend', type: 'library', description: 'Component-based UI library' },
          score: 92,
          reasoning: 'React is excellent for interactive e-commerce sites',
          pros: ['Large ecosystem', 'Great performance', 'Strong community support'],
          cons: ['Learning curve', 'Frequent updates'],
          confidence: 'high'
        },
        alternatives: [{
          framework: { name: 'Vue.js', id: 'vue', category: 'frontend', type: 'framework', description: 'Progressive framework' },
          score: 88,
          reasoning: 'Vue offers simpler learning curve',
          pros: ['Easy to learn', 'Great docs'], 
          cons: ['Smaller ecosystem'],
          confidence: 'medium'
        }],
        summary: 'React is recommended for your e-commerce project',
        nextSteps: ['Set up React environment', 'Choose UI library', 'Plan state management'],
        considerations: ['Consider team experience', 'Plan for testing']
      });
    }
    
    if (prompt.includes('website generation') || prompt.includes('Create')) {
      return JSON.stringify({
        html: '<!DOCTYPE html><html><head><title>E-Commerce Store</title></head><body><h1>Welcome to Our Store</h1><div class="products">Product showcase here</div></body></html>',
        css: 'body { font-family: Arial, sans-serif; } .products { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem; }',
        js: 'console.log("E-commerce site loaded");',
        metadata: { framework: 'vanilla', dependencies: [] }
      });
    }
    
    return `AI response for: ${prompt.substring(0, 50)}...`;
  }

  async generateJSON(prompt: string, schema?: any): Promise<any> {
    const response = await this.generateText(prompt);
    try {
      return JSON.parse(response);
    } catch {
      return { message: response };
    }
  }

  async chat(messages: any[]): Promise<string> {
    return this.generateText(messages[messages.length - 1].content);
  }

  isConfigured(): boolean { return true; }
  getName(): string { return 'MockAIProvider'; }
  getVersion(): string { return '1.0.0'; }
}

// API Route Handlers using AI Agents System
class AIAgentAPIRoutes {
  private agentManager: AgentManager;
  private contextManager: ContextManager;
  private workflowManager: ExampleWorkflowManager;

  constructor() {
    const provider = new MockAIProvider();
    const registry = new DefaultAgentRegistry();
    registerDefaultAgents(registry);
    
    this.agentManager = new AgentManager(provider, registry);
    this.contextManager = new ContextManager();
    this.workflowManager = new ExampleWorkflowManager(this.agentManager, this.contextManager);
  }

  // Replace: OLD direct AI provider call for website generation
  // NEW: Orchestrated multi-agent workflow
  async generateWebsite(req: MockRequest, res: MockResponse) {
    try {
      const { description, complexity, userExperience } = req.body;
      const userId = req.user?.id;

      console.log(`🌐 Website generation request: ${description}`);

      // Create context for this user session
      const context = await this.contextManager.createContext(undefined, {
        userId,
        requestType: 'website-generation',
        startTime: new Date()
      });

      // Execute complete e-commerce workflow
      const result = await this.workflowManager.executeECommerceWorkflow(
        description,
        userId,
        (step, progress) => {
          console.log(`   📊 ${step}: ${progress}%`);
        }
      );

      if (result.success) {
        res.json({
          success: true,
          website: result.data,
          sessionId: context.sessionId,
          message: 'Website generated successfully with quality review and documentation'
        });
      } else {
        res.status(500).json({
          success: false,
          error: result.error,
          message: 'Website generation workflow failed'
        });
      }

    } catch (error) {
      console.error('Website generation error:', error);
      res.status(500).json({
        success: false, 
        error: 'Internal server error'
      });
    }
  }

  // NEW: Smart intent-based routing
  async smartAssistant(req: MockRequest, res: MockResponse) {
    try {
      const { message, sessionId } = req.body;
      
      console.log(`🤖 Smart assistant request: ${message}`);

      // First, classify the user's intent
      const intentResult = await this.agentManager.executeAgent('intent-classification', {
        message,
        responseMode: 'show-options'
      });

      if (!intentResult.success) {
        throw new Error('Intent classification failed');
      }

      console.log(`   🎯 Detected intent: ${intentResult.data.intent} (${Math.round(intentResult.data.confidence * 100)}% confidence)`);

      let response;

      // Route to appropriate agent based on intent
      switch (intentResult.data.intent) {
        case 'generation':
          if (intentResult.data.shouldExecuteDirectly) {
            // Directly generate website
            response = await this.agentManager.executeAgent('website-generation', {
              prompt: message,
              framework: 'react',
              device: 'desktop'
            });
          } else {
            // Show framework options first
            response = await this.agentManager.executeAgent('framework-advisor', {
              prompt: message,
              maxAlternatives: 3
            });
          }
          break;

        case 'explanation':
        case 'conversation':
          response = await this.agentManager.executeAgent('chat-assistant', {
            message,
            context: { responseMode: 'explain-first' }
          });
          break;

        default:
          response = await this.agentManager.executeAgent('chat-assistant', {
            message,
            context: { responseMode: 'show-options' }
          });
      }

      res.json({
        success: true,
        intent: intentResult.data,
        response: response.data,
        suggestions: intentResult.data.shouldShowOptions ? [
          'Generate website code',
          'Get framework recommendations', 
          'Explain the approach',
          'See examples'
        ] : []
      });

    } catch (error) {
      console.error('Smart assistant error:', error);
      res.status(500).json({
        success: false,
        error: 'Assistant request failed'
      });
    }
  }

  // NEW: Code quality improvement endpoint
  async improveCode(req: MockRequest, res: MockResponse) {
    try {
      const { code, language, projectName } = req.body;
      
      console.log(`🔍 Code improvement request for ${projectName} (${language})`);

      // Execute code quality workflow
      const result = await this.workflowManager.executeCodeQualityWorkflow(
        code,
        language,
        projectName
      );

      if (result.success) {
        res.json({
          success: true,
          improvements: result.data,
          message: 'Code analysis and improvements completed'
        });
      } else {
        res.status(500).json({
          success: false,
          error: result.error
        });
      }

    } catch (error) {
      console.error('Code improvement error:', error);
      res.status(500).json({
        success: false,
        error: 'Code improvement failed'
      });
    }
  }

  // NEW: Project documentation generator  
  async generateDocs(req: MockRequest, res: MockResponse) {
    try {
      const { projectInfo, codebase, docType } = req.body;
      
      console.log(`📚 Documentation request: ${docType} for ${projectInfo.name}`);

      const result = await this.agentManager.executeAgent('documentation', {
        projectInfo,
        codebase, 
        documentationType: docType || 'readme',
        audience: 'developers',
        includeCodeExamples: true
      });

      if (result.success) {
        res.json({
          success: true,
          documentation: result.data,
          message: 'Documentation generated successfully'
        });
      } else {
        res.status(500).json({
          success: false,
          error: result.error
        });
      }

    } catch (error) {
      console.error('Documentation generation error:', error);
      res.status(500).json({
        success: false,
        error: 'Documentation generation failed'
      });
    }
  }

  // System health and monitoring
  async getSystemHealth(req: MockRequest, res: MockResponse) {
    try {
      const health = await this.agentManager.healthCheck();
      const stats = await this.contextManager.getSessionStats();

      res.json({
        success: true,
        system: {
          healthy: health.healthy,
          agents: health.agents,
          sessions: stats,
          uptime: process.uptime(),
          timestamp: new Date()
        }
      });

    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Health check failed'
      });
    }
  }
}

// Demo: Test the API Routes
async function demonstrateServerIntegration() {
  console.log('🚀 Demonstrating Server Integration with AI Agents...\n');
  console.log('=' .repeat(70));
  
  const apiRoutes = new AIAgentAPIRoutes();
  
  // Mock request/response helpers
  const createMockResponse = (): MockResponse => {
    return {
      json: (data: any) => console.log('📤 Response:', JSON.stringify(data, null, 2)),
      status: (code: number) => {
        console.log(`📤 Status: ${code}`);
        return createMockResponse();
      }
    };
  };

  try {
    // 1. Test smart assistant with different intents
    console.log('\n1️⃣ Testing Smart Assistant (Intent-based routing):');
    await apiRoutes.smartAssistant(
      { body: { message: 'I want to build an e-commerce website with React' } },
      createMockResponse()
    );

    // 2. Test website generation workflow
    console.log('\n2️⃣ Testing Website Generation Workflow:');
    await apiRoutes.generateWebsite(
      { 
        body: { 
          description: 'Modern e-commerce store with shopping cart and payments',
          complexity: 'medium',
          userExperience: 'intermediate' 
        },
        user: { id: 'demo-user-123' }
      },
      createMockResponse()
    );

    // 3. Test documentation generation
    console.log('\n3️⃣ Testing Documentation Generation:');
    await apiRoutes.generateDocs(
      {
        body: {
          projectInfo: {
            name: 'ShopNow',
            description: 'E-commerce platform',
            version: '1.0.0'
          },
          codebase: {
            technologies: ['React', 'Node.js', 'MongoDB'],
            framework: 'React'
          },
          docType: 'readme'
        }
      },
      createMockResponse()
    );

    // 4. Test system health
    console.log('\n4️⃣ Testing System Health:');
    await apiRoutes.getSystemHealth(
      { body: {} },
      createMockResponse()
    );

    console.log('\n' + '=' .repeat(70));
    console.log('🎉 Server Integration Demo Completed Successfully!');
    console.log('\n💡 Benefits of Agent-based Architecture:');
    console.log('   ✅ Intelligent request routing based on user intent');
    console.log('   ✅ Multi-step workflows orchestrated automatically'); 
    console.log('   ✅ Consistent behavior across all AI interactions');
    console.log('   ✅ Built-in error handling and retry logic');
    console.log('   ✅ Real-time progress tracking for complex operations');
    console.log('   ✅ Context management for stateful conversations');
    console.log('   ✅ Health monitoring and system diagnostics');
    
  } catch (error) {
    console.error('❌ Demo failed:', error);
  }
}

// Run demo if this file is executed directly
if (require.main === module) {
  demonstrateServerIntegration();
}

export { AIAgentAPIRoutes, demonstrateServerIntegration };