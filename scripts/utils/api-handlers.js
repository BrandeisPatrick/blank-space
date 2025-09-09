/**
 * API Route Handlers for Local Deployment
 * Implements Next.js API routes for Express server
 */

import { streamText } from 'ai';
import { xai } from '@ai-sdk/xai';
import { openai } from '@ai-sdk/openai';

/**
 * Create structured React project files from generated code
 */
function createReactProjectStructure(generatedCode, prompt) {
  const componentName = extractComponentName(prompt) || 'GeneratedComponent';
  
  return {
    'package.json': JSON.stringify({
      name: componentName.toLowerCase().replace(/\s+/g, '-'),
      version: '0.1.0',
      private: true,
      dependencies: {
        react: '^18.2.0',
        'react-dom': '^18.2.0',
        'react-scripts': '5.0.1'
      },
      scripts: {
        start: 'react-scripts start',
        build: 'react-scripts build',
        test: 'react-scripts test',
        eject: 'react-scripts eject'
      }
    }, null, 2),
    
    'public/index.html': `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <link rel="icon" href="%PUBLIC_URL%/favicon.ico" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="theme-color" content="#000000" />
    <meta name="description" content="Generated React App" />
    <title>${componentName}</title>
  </head>
  <body>
    <noscript>You need to enable JavaScript to run this app.</noscript>
    <div id="root"></div>
  </body>
</html>`,

    'public/favicon.ico': '# Favicon placeholder',
    
    'src/index.js': `import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);`,

    [`src/components/${componentName}/${componentName}.jsx`]: generatedCode.html || `import React from 'react';
import './${componentName}.css';

const ${componentName} = () => {
  return (
    <div className="${componentName.toLowerCase()}">
      <h1>${componentName}</h1>
      <p>Generated component based on: "${prompt}"</p>
    </div>
  );
};

export default ${componentName};`,

    [`src/components/${componentName}/${componentName}.css`]: generatedCode.css || `.${componentName.toLowerCase()} {
  text-align: center;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  margin: 20px;
}

.${componentName.toLowerCase()} h1 {
  color: #333;
  margin-bottom: 20px;
  font-size: 2rem;
}

.${componentName.toLowerCase()} p {
  color: #666;
  line-height: 1.6;
}`,

    'src/App.js': `import React from 'react';
import './App.css';
import ${componentName} from './components/${componentName}/${componentName}';

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <${componentName} />
      </header>
    </div>
  );
}

export default App;`,

    'src/App.css': `.App {
  text-align: center;
}

.App-header {
  background-color: #f5f5f5;
  padding: 20px;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  font-size: calc(10px + 2vmin);
}`,

    'src/index.css': `body {
  margin: 0;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
    'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue',
    sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

code {
  font-family: source-code-pro, Menlo, Monaco, Consolas, 'Courier New',
    monospace;
}

* {
  box-sizing: border-box;
}`,

    'README.md': `# ${componentName}

Generated React component based on: "${prompt}"

## Available Scripts

In the project directory, you can run:

### \`npm start\`

Runs the app in development mode.
Open [http://localhost:3000](http://localhost:3000) to view it in your browser.

### \`npm run build\`

Builds the app for production to the \`build\` folder.`,

    '.gitignore': `# Dependencies
/node_modules
/.pnp
.pnp.js

# Testing
/coverage

# Production
/build

# Misc
.DS_Store
.env.local
.env.development.local
.env.test.local
.env.production.local

npm-debug.log*
yarn-debug.log*
yarn-error.log*`,

    // Additional utility files if specified in generatedCode.js
    ...(generatedCode.js && {
      'src/utils/helpers.js': generatedCode.js
    })
  };
}

/**
 * Extract component name from prompt
 */
function extractComponentName(prompt) {
  // Simple extraction logic - look for key words
  const words = prompt.toLowerCase().match(/\b[a-z]+\b/g) || [];
  
  // Look for component-related words, exclude common words
  const componentWords = words.filter(word => 
    !['a', 'an', 'the', 'for', 'with', 'and', 'or', 'but', 'build', 'create', 'make', 'component'].includes(word) &&
    word.length > 2
  );
  
  if (componentWords.length > 0) {
    const baseName = componentWords[0];
    return baseName.charAt(0).toUpperCase() + baseName.slice(1);
  }
  
  return 'GeneratedComponent';
}

/**
 * Chat endpoint handler
 */
export async function handleChat(req, res) {
  try {
    const { message, context } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    // Use OpenAI GPT-4o-mini for quick chat responses
    let model;
    if (process.env.OPENAI_API_KEY) {
      model = openai('gpt-4o-mini');
    } else if (process.env.XAI_API_KEY) {
      model = xai('grok-code-fast-1');
    } else {
      return res.status(500).json({ 
        error: 'No AI provider configured. Please set OPENAI_API_KEY or XAI_API_KEY' 
      });
    }

    // Build context for the AI
    const hasActiveCode = context?.hasActiveCode || false;
    const recentMessages = context?.recentMessages || [];
    const currentArtifacts = context?.currentArtifacts || 0;
    const responseMode = context?.responseMode || 'show-options';

    const systemPrompt = `You are a helpful AI assistant in a code generation interface.

Current context:
- Active code components: ${hasActiveCode ? 'Yes' : 'No'}
- Recent messages: ${recentMessages.length}
- Current artifacts: ${currentArtifacts}
- Response mode: ${responseMode}

Guidelines:
- Be concise and helpful
- If user asks about code generation, acknowledge their request and suggest using the generation features
- If user asks about existing code, provide relevant guidance
- For general questions, provide brief, informative answers
- Always be encouraging and supportive

Respond naturally and conversationally. You can include thinking/reasoning in your response by wrapping it in <thinking> tags.`;

    const result = await streamText({
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        ...recentMessages.map((msg) => ({
          role: msg.role || 'user',
          content: msg.content || msg.message || String(msg)
        })),
        { role: 'user', content: message }
      ],
      temperature: 0.7,
      maxTokens: 1000,
    });

    let fullResponse = '';
    for await (const chunk of result.textStream) {
      fullResponse += chunk;
    }

    // Parse thinking/reasoning sections
    const thinkingMatch = fullResponse.match(/<thinking>([\s\S]*?)<\/thinking>/);
    const thinking = thinkingMatch ? thinkingMatch[1].trim() : null;
    const content = fullResponse.replace(/<thinking>[\s\S]*?<\/thinking>/g, '').trim();

    return res.json({
      success: true,
      response: content,
      thinking: thinking,
      metadata: {
        model: process.env.OPENAI_API_KEY ? 'gpt-4o-mini' : 'grok-code-fast-1',
        provider: process.env.OPENAI_API_KEY ? 'openai' : 'xai',
        hasThinking: !!thinking,
        responseLength: content.length
      }
    });

  } catch (error) {
    console.error('Chat API Error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

/**
 * Intent classification endpoint handler
 */
export async function handleClassifyIntent(req, res) {
  try {
    const { message, hasActiveCode = false, responseMode = 'show-options' } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    // Use OpenAI GPT-4o-mini for intent classification (better at analysis)
    let model;
    if (process.env.OPENAI_API_KEY) {
      model = openai('gpt-4o-mini');
    } else if (process.env.XAI_API_KEY) {
      model = xai('grok-code-fast-1');
    } else {
      return res.status(500).json({
        error: 'No AI provider configured. Please set OPENAI_API_KEY or XAI_API_KEY'
      });
    }

    const result = await streamText({
      model,
      messages: [
        {
          role: 'system',
          content: `Classify user intent for coding requests. Return JSON only.

Available intents:
- "generation": User wants to create/build/generate new code/components
- "modification": User wants to modify/update existing code  
- "explanation": User wants explanation/understanding of code
- "conversation": General chat/questions not code-related

Context:
- hasActiveCode: ${hasActiveCode}
- responseMode: ${responseMode}

Return this exact JSON format:
{
  "intent": "generation|modification|explanation|conversation",
  "confidence": 0.95,
  "reasoning": "Brief explanation of classification",
  "shouldExecuteDirectly": ${responseMode === 'just-build'},
  "shouldShowOptions": ${responseMode === 'show-options'}
}`
        },
        {
          role: 'user',
          content: `Classify this request: "${message}"`
        }
      ],
      temperature: 0.1,
      maxTokens: 300,
    });

    let intentText = '';
    for await (const chunk of result.textStream) {
      intentText += chunk;
    }
    
    let intentResult;
    try {
      intentResult = JSON.parse(intentText);
    } catch (parseError) {
      console.warn('Failed to parse intent classification:', parseError);
      // Fallback classification based on keywords
      const message_lower = message.toLowerCase();
      const isJustBuildMode = responseMode === 'just-build';
      const shouldShowOptions = responseMode === 'show-options';
      
      if (message_lower.includes('build') || message_lower.includes('create') || 
          message_lower.includes('make') || message_lower.includes('generate')) {
        intentResult = { 
          intent: 'generation', 
          confidence: 0.7, 
          reasoning: 'Fallback: contains generation keywords',
          shouldExecuteDirectly: isJustBuildMode,
          shouldShowOptions: shouldShowOptions
        };
      } else if (message_lower.includes('modify') || message_lower.includes('change') || 
                 message_lower.includes('update') || message_lower.includes('fix')) {
        intentResult = { 
          intent: 'modification', 
          confidence: 0.6, 
          reasoning: 'Fallback: contains modification keywords',
          shouldExecuteDirectly: isJustBuildMode,
          shouldShowOptions: shouldShowOptions
        };
      } else {
        intentResult = { 
          intent: 'conversation', 
          confidence: 0.5, 
          reasoning: 'Fallback: default to conversation',
          shouldExecuteDirectly: true,
          shouldShowOptions: false
        };
      }
    }

    return res.json({
      success: true,
      ...intentResult
    });

  } catch (error) {
    console.error('Intent classification error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

/**
 * Code generation endpoint handler
 */
export async function handleGenerate(req, res) {
  try {
    const { prompt, device = 'desktop', framework = 'react' } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    // Use X.AI Grok Code Fast for code generation, GPT-4o-mini as fallback
    let model;
    if (process.env.XAI_API_KEY) {
      model = xai('grok-code-fast-1');
    } else if (process.env.OPENAI_API_KEY) {
      model = openai('gpt-4o-mini');
    } else {
      return res.status(500).json({
        error: 'No AI provider configured. Please set XAI_API_KEY or OPENAI_API_KEY'
      });
    }

    const isReact = framework.toLowerCase().includes('react');
    
    const systemPrompt = isReact
      ? `You are an expert React developer. Generate clean, modern React components with JSX, CSS, and JavaScript logic.

IMPORTANT: Return ONLY valid JSON. Escape all quotes and newlines properly.

Return your response in this exact JSON format:
{
  "html": "React JSX component code here",
  "css": "CSS styles here (use modern CSS)", 
  "js": "Additional JavaScript logic if needed"
}

JSON RULES:
- Use double quotes only, escape internal quotes as \\"
- No template literals or backticks in JSON
- Use single quotes for JSX/CSS attribute values when possible
- Escape newlines as \\n or write compact code
- No unescaped backslashes

React Code Guidelines:
- Create functional components using React hooks
- Use modern JSX syntax and patterns
- Implement responsive design with modern CSS
- Use useState, useEffect, and other hooks appropriately
- Create reusable, accessible components
- Follow React best practices and conventions
- Include proper event handlers and state management
- Use modern CSS (flexbox/grid) for layouts
- Make components production-ready and well-structured`
      : `You are an expert web developer. Generate clean, modern HTML, CSS, and JavaScript code.

Return ONLY valid JSON with the code structure requested.`;

    const result = await streamText({
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        {
          role: 'user',
          content: isReact 
            ? `Create a React component based on this request: ${prompt}

Requirements:
- Use functional components with hooks
- Make it responsive and accessible
- Include proper styling
- Add interactivity where appropriate`
            : `Create a website based on this request: ${prompt}`
        }
      ],
      temperature: 0.7,
      maxTokens: 8000,
    });

    // Set up Server-Sent Events headers
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*'
    });

    let fullResponse = '';
    
    try {
      for await (const chunk of result.textStream) {
        fullResponse += chunk;
        res.write(`data: ${JSON.stringify({ chunk })}\n\n`);
      }

      // Parse the complete response and create artifact
      try {
        const generatedCode = JSON.parse(fullResponse);
        const artifactId = `artifact_${Date.now()}`;
        
        const artifact = {
          id: artifactId,
          projectId: 'default',
          regionId: 'full-page',
          files: isReact ? createReactProjectStructure(generatedCode, prompt) : {
            'index.html': generatedCode.html || '',
            'styles.css': generatedCode.css || '',
            'script.js': generatedCode.js || ''
          },
          entry: 'index.html',
          metadata: {
            device: device,
            region: { start: { x: 0, y: 0 }, end: { x: 23, y: 19 } },
            framework: framework,
            projectType: isReact ? 'react' : 'vanilla',
            isReact: isReact,
            dependencies: isReact ? ['react', 'react-dom', 'react-scripts'] : [],
            template: 'structured-project'
          },
          createdAt: new Date().toISOString(),
          author: 'ai-generator'
        };

        res.write(`data: ${JSON.stringify({ 
          type: 'completed', 
          artifact,
          success: true
        })}\n\n`);
      } catch (parseError) {
        console.error('Failed to parse AI response:', parseError);
        res.write(`data: ${JSON.stringify({ 
          type: 'error',
          error: 'Failed to parse AI response'
        })}\n\n`);
      }

      res.end();
    } catch (error) {
      console.error('Streaming error:', error);
      res.write(`data: ${JSON.stringify({ 
        type: 'error',
        error: error instanceof Error ? error.message : 'Unknown error'
      })}\n\n`);
      res.end();
    }

  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

/**
 * Reasoning endpoint handler (ReAct system)
 */
export async function handleReasoning(req, res) {
  try {
    const { goal, options = {} } = req.body;

    if (!goal) {
      return res.status(400).json({ error: 'Goal is required' });
    }

    // Use OpenAI GPT-4o-mini for complex reasoning and analysis
    let reasoningModel;
    if (process.env.OPENAI_API_KEY) {
      reasoningModel = openai('gpt-4o-mini');
    } else if (process.env.XAI_API_KEY) {
      reasoningModel = xai('grok-code-fast-1');
    } else {
      return res.status(500).json({
        error: 'No AI provider configured. Please set OPENAI_API_KEY or XAI_API_KEY'
      });
    }

    // Set up Server-Sent Events headers
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*'
    });

    const steps = [];
    let stepId = 1;

    try {
      // Send initial connection message
      res.write(`data: ${JSON.stringify({ type: 'connected' })}\\n\\n`);

      // Step 1: Thought - Analyze the goal
      const thoughtStep = {
        id: `step-${stepId++}`,
        type: 'thought',
        content: `I need to analyze this request: "${goal}". Let me determine if this is a React component, a full website, or code generation task.`,
        timestamp: new Date().toISOString(),
        metadata: { analysis: 'intent_classification' },
      };
      steps.push(thoughtStep);
      
      res.write(`data: ${JSON.stringify({ 
        type: 'step', 
        step: thoughtStep 
      })}\n\n`);

      // Simulate thinking delay
      await new Promise(resolve => setTimeout(resolve, 1200));

      // Step 2: Action - Classify intent using AI
      let intentResult;
      try {
        const intentResponse = await streamText({
          model: reasoningModel,
          messages: [
            {
              role: 'system',
              content: `Classify user intent for coding requests. Return JSON only.
              
              Return this exact format:
              {
                "intent": "generation|modification|explanation|conversation",
                "confidence": 0.95,
                "reasoning": "Brief explanation"
              }`
            },
            {
              role: 'user',
              content: `Classify this request: "${goal}"`
            }
          ],
          temperature: 0.1,
          maxTokens: 200,
        });

        let intentText = '';
        for await (const chunk of intentResponse.textStream) {
          intentText += chunk;
        }
        
        try {
          intentResult = JSON.parse(intentText);
        } catch (parseError) {
          console.warn('Failed to parse intent classification:', parseError);
          intentResult = { intent: 'generation', confidence: 0.7, reasoning: 'Fallback classification' };
        }
      } catch (error) {
        console.warn('Intent classification failed:', error);
        intentResult = { intent: 'generation', confidence: 0.7, reasoning: 'Fallback classification' };
      }

      const actionStep = {
        id: `step-${stepId++}`,
        type: 'action',
        content: `Based on my analysis, this appears to be a ${intentResult.intent} request (${(intentResult.confidence * 100).toFixed(1)}% confidence). ${intentResult.reasoning}. Now I'll generate the appropriate React solution.`,
        timestamp: new Date().toISOString(),
        metadata: { intent: intentResult },
      };
      steps.push(actionStep);
      
      res.write(`data: ${JSON.stringify({ 
        type: 'step', 
        step: actionStep 
      })}\n\n`);

      await new Promise(resolve => setTimeout(resolve, 1200));

      // Step 3: Observation - Generate a simple response
      const observationStep = {
        id: `step-${stepId++}`,
        type: 'observation',
        content: `Successfully analyzed the request! I can see this is about: ${goal}. The request has been classified and I understand what needs to be built.`,
        timestamp: new Date().toISOString(),
        metadata: { 
          generated: true,
          hasArtifact: false
        },
      };
      steps.push(observationStep);
      
      res.write(`data: ${JSON.stringify({ 
        type: 'step', 
        step: observationStep 
      })}\n\n`);

      await new Promise(resolve => setTimeout(resolve, 1200));

      // Step 4: Final Answer - Provide the solution
      const finalStep = {
        id: `step-${stepId++}`,
        type: 'final_answer',
        content: `✅ **Analysis Complete!**\\n\\nI've successfully analyzed your request: "${goal}"\\n\\n**Classification:**\\n• Intent: ${intentResult.intent}\\n• Confidence: ${(intentResult.confidence * 100).toFixed(1)}%\\n• Reasoning: ${intentResult.reasoning}\\n\\nTo proceed with implementation, you can use the Generate button to create the actual code based on this analysis.`,
        timestamp: new Date().toISOString(),
        metadata: { 
          artifact: null,
          success: true
        },
      };
      steps.push(finalStep);
      
      res.write(`data: ${JSON.stringify({ 
        type: 'step', 
        step: finalStep 
      })}\n\n`);

      await new Promise(resolve => setTimeout(resolve, 800));

      // Send completion message
      res.write(`data: ${JSON.stringify({ 
        type: 'completed',
        success: true,
        steps,
        finalAnswer: finalStep.content,
        totalSteps: steps.length,
        artifact: null
      })}\n\n`);

      res.end();
    } catch (error) {
      console.error('ReAct reasoning error:', error);
      res.write(`data: ${JSON.stringify({ 
        type: 'error',
        error: error instanceof Error ? error.message : 'Unknown error'
      })}\n\n`);
      res.end();
    }

  } catch (error) {
    console.error('Reasoning API Error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}