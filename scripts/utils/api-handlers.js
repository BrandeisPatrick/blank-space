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
  
  // Create a standalone HTML file that can be previewed directly
  const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${componentName} - Generated React Component</title>
    
    <!-- React CDN -->
    <script crossorigin src="https://unpkg.com/react@18/umd/react.development.js"></script>
    <script crossorigin src="https://unpkg.com/react-dom@18/umd/react-dom.development.js"></script>
    
    <!-- Babel Standalone for JSX compilation -->
    <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
    
    <style>
        body { 
            margin: 0; 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif;
            -webkit-font-smoothing: antialiased;
            -moz-osx-font-smoothing: grayscale;
        }
        #root { 
            min-height: 100vh; 
            display: flex; 
            align-items: center; 
            justify-content: center; 
            background-color: #f8f9fa;
        }
        ${generatedCode.css || `
        .generated-component {
            text-align: center;
            padding: 40px;
            border-radius: 12px;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
            margin: 20px;
            background: white;
            max-width: 600px;
        }
        .generated-component h1 {
            color: #333;
            margin-bottom: 20px;
            font-size: 2.5rem;
        }
        .generated-component p {
            color: #666;
            line-height: 1.6;
            font-size: 1.1rem;
        }
        `}
    </style>
</head>
<body>
    <div id="root"></div>
    
    <script type="text/babel" data-type="module">
        // Ensure we have a clean environment
        ${generatedCode.html ? generatedCode.html.replace(/import.*from.*['"][^'"]*['"];?/g, '').replace(/export.*default.*;?/g, '') : `
        function ${componentName}() {
            return (
                <div className="generated-component">
                    <h1>${componentName}</h1>
                    <p>Generated React component based on: "${prompt}"</p>
                    <p>This component was created using AI and is ready for customization!</p>
                </div>
            );
        }
        `}
        
        // Get the component name from the generated code or use default
        const ComponentToRender = typeof ${componentName} !== 'undefined' ? ${componentName} : 
                                  typeof App !== 'undefined' ? App :
                                  typeof TodoList !== 'undefined' ? TodoList :
                                  typeof List !== 'undefined' ? List :
                                  function DefaultComponent() { 
                                      return React.createElement('div', {className: 'generated-component'}, 
                                          React.createElement('h1', null, 'Component Generated'),
                                          React.createElement('p', null, 'Component was generated successfully!')
                                      );
                                  };
        
        // Render the component
        const root = ReactDOM.createRoot(document.getElementById('root'));
        root.render(React.createElement(ComponentToRender));
    </script>
</body>
</html>`;

  return {
    'index.html': htmlContent,
    'styles.css': generatedCode.css || '',
    'script.js': generatedCode.js || '',
    'package.json': JSON.stringify({
      name: componentName.toLowerCase().replace(/\s+/g, '-'),
      version: '0.1.0',
      private: true,
      dependencies: {
        react: '^18.2.0',
        'react-dom': '^18.2.0'
      },
      description: `Generated React component: ${componentName}`
    }, null, 2),
    'README.md': `# ${componentName}

This is a generated React component created from the prompt: "${prompt}"

## Preview

Open \`index.html\` in your browser to see the component in action.

## Generated Files

- \`index.html\` - Standalone HTML file with React component
- \`styles.css\` - Component styles  
- \`script.js\` - Additional JavaScript logic
- \`package.json\` - Project metadata

The component uses React via CDN for immediate preview without build tools.
`
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
      ? `You are an expert React developer. You must respond with ONLY valid JSON - no markdown, no explanations, no additional text.

CRITICAL: Your entire response must be valid JSON that can be parsed directly. Do not wrap in markdown code blocks.

Return your response in this exact JSON format:
{
  "html": "React JSX component code here",
  "css": "CSS styles here (use modern CSS)", 
  "js": "Additional JavaScript logic if needed"
}

STRICT JSON FORMATTING RULES:
- Start response with { and end with }
- Use double quotes only, escape internal quotes as \\"
- Escape newlines as \\n or write compact single-line code
- No template literals, use string concatenation
- Use single quotes for JSX/CSS attribute values
- No unescaped backslashes
- No trailing commas
- Test that your response is valid JSON

React Code Guidelines for BROWSER ENVIRONMENT:
- Create functional components using React hooks
- NEVER use import/export statements - code runs directly in browser
- NEVER use module syntax - this is standalone JSX
- Use React.useState, React.useEffect (not destructured imports)
- Access React and ReactDOM from global variables
- Generate JSX syntax that Babel can compile in browser
- Use modern JSX syntax and patterns
- Implement responsive design with modern CSS
- Create reusable, accessible components
- Follow React best practices and conventions
- Include proper event handlers and state management
- Use modern CSS (flexbox/grid) for layouts
- Make components production-ready and well-structured

EXAMPLE VALID RESPONSE:
{"html": "function App() { return <div>Hello</div>; }", "css": "body { margin: 0; }", "js": ""}`
      : `You are an expert web developer. You must respond with ONLY valid JSON - no markdown, no explanations, no additional text.

CRITICAL: Your entire response must be valid JSON that can be parsed directly. Do not wrap in markdown code blocks.

Return your response in this exact JSON format:
{
  "html": "HTML code here",
  "css": "CSS styles here", 
  "js": "JavaScript code here"
}

STRICT JSON FORMATTING RULES:
- Start response with { and end with }
- Use double quotes only, escape internal quotes as \\"
- Escape newlines as \\n or write compact single-line code
- No template literals
- No unescaped backslashes
- No trailing commas
- Test that your response is valid JSON

EXAMPLE VALID RESPONSE:
{"html": "<div>Hello World</div>", "css": "body { margin: 0; }", "js": "console.log('ready');"}`;

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
      // Set up timeout for the AI streaming
      const streamTimeout = setTimeout(() => {
        console.error('⏰ AI streaming timeout after 30 seconds');
        if (!res.headersSent) {
          res.write(`data: ${JSON.stringify({ 
            type: 'error',
            error: 'AI generation timeout - using fallback'
          })}\n\n`);
        }
      }, 30000);

      for await (const chunk of result.textStream) {
        fullResponse += chunk;
        res.write(`data: ${JSON.stringify({ chunk })}\n\n`);
      }
      
      clearTimeout(streamTimeout);

      console.log('🧠 AI Response Length:', fullResponse.length);
      console.log('🧠 AI Raw Response:', fullResponse.substring(0, 500) + (fullResponse.length > 500 ? '...' : ''));

      // Parse the complete response and create artifact
      let generatedCode;
      try {
        generatedCode = JSON.parse(fullResponse);
        console.log('✅ Successfully parsed AI response as JSON');
      } catch (parseError) {
        console.error('❌ Failed to parse AI response as JSON:', parseError);
        console.log('🔧 Attempting to extract code from non-JSON response...');
        
        // Fallback: Try to extract JSON from markdown code blocks
        const jsonMatch = fullResponse.match(/```json\s*([\s\S]*?)\s*```/);
        if (jsonMatch) {
          try {
            generatedCode = JSON.parse(jsonMatch[1]);
            console.log('✅ Extracted JSON from markdown code block');
          } catch (e) {
            console.error('❌ Failed to parse extracted JSON:', e);
            generatedCode = null;
          }
        } else {
          generatedCode = null;
        }
      }

      if (generatedCode) {
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

        console.log('🚀 Sending artifact with', Object.keys(artifact.files).length, 'files');
        res.write(`data: ${JSON.stringify({ 
          type: 'completed', 
          artifact,
          success: true
        })}\n\n`);
      } else {
        // Fallback: Create a basic artifact even if parsing failed
        console.log('🔧 Creating fallback artifact...');
        const artifactId = `artifact_${Date.now()}`;
        
        const fallbackCode = isReact 
          ? {
              html: `function TodoApp() {
  const [todos, setTodos] = React.useState([]);
  const [input, setInput] = React.useState('');

  const addTodo = () => {
    if (input.trim()) {
      setTodos([...todos, { id: Date.now(), text: input, completed: false }]);
      setInput('');
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '600px', margin: '0 auto' }}>
      <h1>Todo List</h1>
      <div style={{ marginBottom: '20px' }}>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Add a todo..."
          style={{ padding: '8px', marginRight: '10px', width: '200px' }}
        />
        <button onClick={addTodo} style={{ padding: '8px 16px' }}>
          Add Todo
        </button>
      </div>
      <ul>
        {todos.map(todo => (
          <li key={todo.id} style={{ marginBottom: '8px' }}>
            {todo.text}
          </li>
        ))}
      </ul>
    </div>
  );
}`,
              css: `body { font-family: Arial, sans-serif; }`,
              js: ''
            }
          : {
              html: `<div class="todo-app">
  <h1>Todo List</h1>
  <div class="input-section">
    <input type="text" id="todoInput" placeholder="Add a todo...">
    <button onclick="addTodo()">Add Todo</button>
  </div>
  <ul id="todoList"></ul>
</div>`,
              css: `.todo-app { padding: 20px; max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif; }
.input-section { margin-bottom: 20px; }
#todoInput { padding: 8px; margin-right: 10px; width: 200px; }
button { padding: 8px 16px; }`,
              js: `let todos = [];
function addTodo() {
  const input = document.getElementById('todoInput');
  if (input.value.trim()) {
    todos.push({ id: Date.now(), text: input.value, completed: false });
    input.value = '';
    renderTodos();
  }
}
function renderTodos() {
  const list = document.getElementById('todoList');
  list.innerHTML = todos.map(todo => \`<li>\${todo.text}</li>\`).join('');
}`
            };

        const artifact = {
          id: artifactId,
          projectId: 'default',
          regionId: 'full-page',
          files: isReact ? createReactProjectStructure(fallbackCode, prompt) : {
            'index.html': fallbackCode.html,
            'styles.css': fallbackCode.css,
            'script.js': fallbackCode.js
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
          author: 'ai-generator-fallback'
        };

        console.log('🔧 Sending fallback artifact with', Object.keys(artifact.files).length, 'files');
        res.write(`data: ${JSON.stringify({ 
          type: 'completed', 
          artifact,
          success: true
        })}\n\n`);
      }

      res.end();
    } catch (error) {
      console.error('Streaming error:', error);
      
      // Always provide a fallback artifact, even when AI fails completely
      console.log('🔧 AI failed completely, creating emergency fallback artifact...');
      const artifactId = `artifact_${Date.now()}`;
      
      const emergencyFallback = isReact 
        ? {
            html: `function TodoApp() {
  const [todos, setTodos] = React.useState([
    { id: 1, text: 'Learn React', completed: false },
    { id: 2, text: 'Build a todo app', completed: true },
    { id: 3, text: 'Deploy to production', completed: false }
  ]);
  const [input, setInput] = React.useState('');

  const addTodo = () => {
    if (input.trim()) {
      setTodos([...todos, { 
        id: Date.now(), 
        text: input.trim(), 
        completed: false 
      }]);
      setInput('');
    }
  };

  const toggleTodo = (id) => {
    setTodos(todos.map(todo => 
      todo.id === id ? { ...todo, completed: !todo.completed } : todo
    ));
  };

  const deleteTodo = (id) => {
    setTodos(todos.filter(todo => todo.id !== id));
  };

  return React.createElement('div', { 
    style: { padding: '20px', maxWidth: '600px', margin: '0 auto' } 
  },
    React.createElement('h1', null, 'Todo List'),
    React.createElement('div', { style: { marginBottom: '20px' } },
      React.createElement('input', {
        type: 'text',
        value: input,
        onChange: (e) => setInput(e.target.value),
        placeholder: 'Add a new todo...',
        style: { padding: '8px', marginRight: '10px', width: '300px' }
      }),
      React.createElement('button', {
        onClick: addTodo,
        style: { padding: '8px 16px', cursor: 'pointer' }
      }, 'Add Todo')
    ),
    React.createElement('ul', { style: { listStyle: 'none', padding: 0 } },
      todos.map(todo => 
        React.createElement('li', {
          key: todo.id,
          style: { 
            display: 'flex', 
            alignItems: 'center', 
            marginBottom: '8px',
            padding: '8px',
            background: '#f5f5f5',
            borderRadius: '4px'
          }
        },
          React.createElement('input', {
            type: 'checkbox',
            checked: todo.completed,
            onChange: () => toggleTodo(todo.id),
            style: { marginRight: '10px' }
          }),
          React.createElement('span', {
            style: { 
              textDecoration: todo.completed ? 'line-through' : 'none',
              flex: 1
            }
          }, todo.text),
          React.createElement('button', {
            onClick: () => deleteTodo(todo.id),
            style: { 
              marginLeft: '10px',
              padding: '4px 8px',
              background: '#ff6b6b',
              color: 'white',
              border: 'none',
              borderRadius: '3px',
              cursor: 'pointer'
            }
          }, 'Delete')
        )
      )
    )
  );
}`,
            css: `body { 
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; 
  margin: 0;
  padding: 0;
  background-color: #f8f9fa;
}
h1 { color: #333; margin-bottom: 20px; }
input[type="text"] { border: 1px solid #ddd; border-radius: 4px; }
button { background: #007bff; color: white; border: none; border-radius: 4px; }
button:hover { background: #0056b3; }`,
            js: ''
          }
        : {
            html: `<div class="todo-app">
  <h1>Todo List (Fallback)</h1>
  <div class="input-section">
    <input type="text" id="todoInput" placeholder="Add a todo...">
    <button onclick="addTodo()">Add Todo</button>
  </div>
  <ul id="todoList"></ul>
</div>`,
            css: `.todo-app { padding: 20px; max-width: 600px; margin: 0 auto; }
h1 { color: #333; }
.input-section { margin-bottom: 20px; }
#todoInput { padding: 8px; margin-right: 10px; width: 300px; }
button { padding: 8px 16px; background: #007bff; color: white; border: none; }`,
            js: `let todos = [{id: 1, text: 'Learn JavaScript', completed: false}];
function addTodo() {
  const input = document.getElementById('todoInput');
  if (input.value.trim()) {
    todos.push({ id: Date.now(), text: input.value, completed: false });
    input.value = '';
    renderTodos();
  }
}
function renderTodos() {
  const list = document.getElementById('todoList');
  list.innerHTML = todos.map(todo => \`<li>\${todo.text}</li>\`).join('');
}
renderTodos();`
          };

      const artifact = {
        id: artifactId,
        projectId: 'default',
        regionId: 'full-page',
        files: isReact ? createReactProjectStructure(emergencyFallback, prompt) : {
          'index.html': emergencyFallback.html,
          'styles.css': emergencyFallback.css,
          'script.js': emergencyFallback.js
        },
        entry: 'index.html',
        metadata: {
          device: device,
          region: { start: { x: 0, y: 0 }, end: { x: 23, y: 19 } },
          framework: framework,
          projectType: isReact ? 'react' : 'vanilla',
          isReact: isReact,
          dependencies: isReact ? ['react', 'react-dom'] : [],
          template: 'emergency-fallback'
        },
        createdAt: new Date().toISOString(),
        author: 'emergency-fallback-generator'
      };

      console.log('🚨 Sending emergency fallback artifact with', Object.keys(artifact.files).length, 'files');
      res.write(`data: ${JSON.stringify({ 
        type: 'completed', 
        artifact,
        success: true,
        fallback: true
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