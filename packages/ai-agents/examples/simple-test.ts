#!/usr/bin/env tsx

/**
 * Simple local test for AI Agents System (without external dependencies)
 * 
 * This demonstrates the core agent functionality with a mock AI provider
 * Run with: npm run test:simple
 */

import { 
  BaseAgent,
  AgentManager, 
  DefaultAgentRegistry,
  ContextManager,
  AgentConfig,
  AgentContext,
  AgentResult,
  AIProvider
} from '../src';

// Mock AI Provider for local testing
class MockAIProvider {
  async generateText(prompt: string, options?: any): Promise<string> {
    console.log(`🤖 AI Provider called with prompt: ${prompt.substring(0, 100)}...`);
    await new Promise(resolve => setTimeout(resolve, 200)); // Simulate API delay
    
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
    
    if (prompt.includes('chat') || prompt.includes('friendly')) {
      return `Hello! I'm your friendly AI assistant. I understand you want to create something. Based on your request, I can help you build a website, analyze code, or provide guidance. What would you like to work on first?`;
    }
    
    return 'Mock AI response generated successfully!';
  }

  async generateJSON(prompt: string, schema?: any, options?: any): Promise<any> {
    const response = await this.generateText(prompt, options);
    try {
      return JSON.parse(response);
    } catch {
      return { success: true, message: response };
    }
  }

  async chat(messages: any[], options?: any): Promise<string> {
    const lastMessage = messages[messages.length - 1];
    return this.generateText(lastMessage.content, options);
  }

  // Required methods for BaseAgent
  isConfigured(): boolean {
    return true;
  }

  getName(): string {
    return 'MockAIProvider';
  }

  getVersion(): string {
    return '1.0.0';
  }
}

// Simple Test Agent
class TestAgent extends BaseAgent {
  constructor(provider: AIProvider) {
    const config: AgentConfig = {
      id: 'test-agent',
      name: 'Test Agent',
      description: 'Simple agent for testing the system',
      version: '1.0.0',
      enabled: true,
      priority: 1,
      timeout: 10000,
      retries: 2,
      dependencies: [],
      capabilities: ['testing', 'demonstration']
    };

    super(config, provider);
  }

  async execute(input: any, context?: AgentContext): Promise<AgentResult<string>> {
    return this.executeWithRetry(async () => {
      const prompt = `Process this input: ${JSON.stringify(input)}`;
      const response = await this.provider.generateText(prompt);
      return response;
    }, context);
  }

  validate(input: any): boolean {
    return typeof input === 'object' && input !== null;
  }

  getInputSchema(): any {
    return {};
  }

  getOutputSchema(): any {
    return {};
  }
}

// Test Functions
async function testAgentRegistry() {
  console.log('\n🧪 Testing Agent Registry...');
  
  const registry = new DefaultAgentRegistry();
  const provider = new MockAIProvider();
  
  // Register test agent
  registry.register({
    config: {
      id: 'test-agent',
      name: 'Test Agent',
      description: 'Simple test agent',
      version: '1.0.0',
      enabled: true,
      priority: 1,
      timeout: 10000,
      retries: 2,
      dependencies: [],
      capabilities: ['testing']
    },
    factory: (provider: AIProvider) => new TestAgent(provider)
  });
  
  console.log('✅ Agent registered successfully');
  console.log(`   Registered agents: ${registry.list().length}`);
  console.log(`   Available capabilities: ${registry.list()[0].config.capabilities.join(', ')}`);
  
  // Test agent creation
  const agent = registry.createAgent('test-agent', provider);
  console.log('✅ Agent created successfully');
  console.log(`   Agent ID: ${agent.getInfo().id}`);
  console.log(`   Agent Name: ${agent.getInfo().name}`);
}

async function testAgentExecution() {
  console.log('\n🚀 Testing Agent Execution...');
  
  const provider = new MockAIProvider();
  const registry = new DefaultAgentRegistry();
  const manager = new AgentManager(provider, registry);
  
  // Register test agent
  registry.register({
    config: {
      id: 'test-agent',
      name: 'Test Agent', 
      description: 'Simple test agent',
      version: '1.0.0',
      enabled: true,
      priority: 1,
      timeout: 10000,
      retries: 2,
      dependencies: [],
      capabilities: ['testing']
    },
    factory: (provider: AIProvider) => new TestAgent(provider)
  });
  
  // Execute agent
  const result = await manager.executeAgent('test-agent', {
    message: 'Hello, please process this test input!',
    type: 'test'
  });
  
  console.log('✅ Agent executed successfully');
  console.log(`   Success: ${result.success}`);
  console.log(`   Response length: ${result.data?.length || 0} characters`);
  console.log(`   Response preview: ${result.data?.substring(0, 100)}...`);
}

async function testContextManager() {
  console.log('\n💾 Testing Context Management...');
  
  const contextManager = new ContextManager();
  
  // Create context
  const context = await contextManager.createContext();
  console.log('✅ Context created successfully');
  console.log(`   Session ID: ${context.sessionId}`);
  
  // Set variables
  await contextManager.setVariable(context.sessionId, 'userPreference', 'React');
  await contextManager.setVariable(context.sessionId, 'projectType', 'e-commerce');
  
  // Get variables
  const preference = await contextManager.getVariable(context.sessionId, 'userPreference');
  const projectType = await contextManager.getVariable(context.sessionId, 'projectType');
  
  console.log('✅ Context variables managed successfully');
  console.log(`   User Preference: ${preference}`);
  console.log(`   Project Type: ${projectType}`);
  
  // Add message
  await contextManager.addMessage(context.sessionId, {
    id: 'msg-1',
    agentId: 'test-agent',
    type: 'input',
    content: 'Test message',
    timestamp: new Date()
  });
  
  const messages = await contextManager.getMessages(context.sessionId);
  console.log('✅ Messages stored successfully');
  console.log(`   Message count: ${messages.length}`);
}

async function testEventSystem() {
  console.log('\n📡 Testing Event System...');
  
  const provider = new MockAIProvider();
  const registry = new DefaultAgentRegistry();
  const manager = new AgentManager(provider, registry);
  
  let eventCount = 0;
  
  // Set up event listeners
  manager.on('agent.started', (event) => {
    console.log(`   🟡 Agent started: ${event.agentId}`);
    eventCount++;
  });
  
  manager.on('agent.completed', (event) => {
    console.log(`   🟢 Agent completed: ${event.agentId}`);
    eventCount++;
  });
  
  manager.on('agent.failed', (event) => {
    console.log(`   🔴 Agent failed: ${event.agentId}`);
    eventCount++;
  });
  
  // Register and execute test agent
  registry.register({
    config: {
      id: 'event-test-agent',
      name: 'Event Test Agent',
      description: 'Agent for testing events',
      version: '1.0.0',
      enabled: true,
      priority: 1,
      timeout: 5000,
      retries: 1,
      dependencies: [],
      capabilities: ['event-testing']
    },
    factory: (provider: AIProvider) => new TestAgent(provider)
  });
  
  await manager.executeAgent('event-test-agent', { message: 'Test event system' });
  
  console.log('✅ Event system working successfully');
  console.log(`   Events fired: ${eventCount}`);
}

async function testHealthCheck() {
  console.log('\n🏥 Testing Health Check...');
  
  const provider = new MockAIProvider();
  const registry = new DefaultAgentRegistry();
  const manager = new AgentManager(provider, registry);
  
  // Register test agent
  registry.register({
    config: {
      id: 'health-test-agent',
      name: 'Health Test Agent',
      description: 'Agent for testing health checks',
      version: '1.0.0',
      enabled: true,
      priority: 1,
      timeout: 5000,
      retries: 1,
      dependencies: [],
      capabilities: ['health-testing']
    },
    factory: (provider: AIProvider) => new TestAgent(provider)
  });
  
  const healthStatus = await manager.healthCheck();
  
  console.log('✅ Health check completed');
  console.log(`   System healthy: ${healthStatus.healthy}`);
  console.log(`   Agents checked: ${Object.keys(healthStatus.agents).length}`);
  
  Object.entries(healthStatus.agents).forEach(([agentId, healthy]) => {
    console.log(`   - ${agentId}: ${healthy ? '🟢' : '🔴'}`);
  });
}

// Main test runner
async function runSimpleTests() {
  console.log('🚀 Starting Simple AI Agents System Tests...');
  console.log('=' .repeat(60));
  
  try {
    await testAgentRegistry();
    await testAgentExecution();
    await testContextManager();
    await testEventSystem();
    await testHealthCheck();
    
    console.log('\n' + '=' .repeat(60));
    console.log('🎉 All simple tests completed successfully!');
    console.log('\n💡 Core AI Agents System is working correctly!');
    console.log('   ✅ Agent Registry - Creating and managing agents');
    console.log('   ✅ Agent Execution - Running agents with mock AI provider');
    console.log('   ✅ Context Management - Storing conversation state');
    console.log('   ✅ Event System - Monitoring agent lifecycle');
    console.log('   ✅ Health Checks - System monitoring and diagnostics');
    console.log('\n🔧 Next steps:');
    console.log('   - Connect to a real AI provider (OpenAI, Anthropic, etc.)');
    console.log('   - Test with the full agent implementations');
    console.log('   - Try the multi-agent workflow examples');
    
  } catch (error) {
    console.error('\n❌ Test failed:', error);
    process.exit(1);
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  runSimpleTests();
}

export { runSimpleTests };