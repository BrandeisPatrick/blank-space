import { google } from '@ai-sdk/google'
import { generateText } from 'ai'
import { setCorsHeaders, handleCorsOptions } from './utils/cors.js';

export default async function handler(req, res) {
  setCorsHeaders(res);
  
  if (handleCorsOptions(req, res)) return;

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { prompt } = req.body || {}

    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' })
    }

    // Generate React component using Google Gemini
    const systemPrompt = `You are an expert React developer. Create a fully functional React component based on the user's request.

CRITICAL: You MUST return ONLY a complete React function component. Start with 'function App()' and end with the closing brace.

EXACT FORMAT REQUIRED:
function App() {
  const [todos, setTodos] = React.useState([]);
  const [newTodo, setNewTodo] = React.useState('');

  const addTodo = () => {
    if (newTodo.trim()) {
      setTodos([...todos, { id: Date.now(), text: newTodo.trim(), completed: false }]);
      setNewTodo('');
    }
  };

  const deleteTodo = (id) => {
    setTodos(todos.filter(todo => todo.id !== id));
  };

  const toggleTodo = (id) => {
    setTodos(todos.map(todo => 
      todo.id === id ? { ...todo, completed: !todo.completed } : todo
    ));
  };

  return (
    <div>
      {/* Your JSX here */}
    </div>
  );
}

REQUIREMENTS:
- Use React.useState() (not just useState)
- Include all state management (todos array, newTodo string)
- Include helper functions (addTodo, deleteTodo, toggleTodo)
- Use inline styles for all styling
- Make it fully functional and interactive
- Include proper form handling
- Add visual feedback for completed items

For todo lists specifically, include:
- Input field for new todos
- Add button
- Todo list with checkboxes
- Delete buttons for each todo
- Visual indication for completed todos (strikethrough)
- "No todos" message when empty`

    const result = await generateText({
      model: google('gemini-1.5-flash'),
      prompt: `${systemPrompt}\n\nUser request: ${prompt}`,
      maxTokens: 2000,
    })

    // Clean and format the generated code
    let componentCode = result.text.trim()
    
    // Remove markdown code blocks if present
    if (componentCode.startsWith('```jsx') || componentCode.startsWith('```javascript') || componentCode.startsWith('```')) {
      componentCode = componentCode.replace(/^```[a-z]*\n?/i, '').replace(/```$/, '').trim()
    }

    // Create the artifact with real generated code
    const artifact = {
      id: `artifact_${Date.now()}`,
      projectId: 'default',
      regionId: 'full-page',
      files: {
        'App.jsx': componentCode,
        'index.html': `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Generated React Component</title>
    <script src="https://unpkg.com/react@18/umd/react.development.js"></script>
    <script src="https://unpkg.com/react-dom@18/umd/react-dom.development.js"></script>
    <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
</head>
<body>
    <div id="root"></div>
    <script type="text/babel">
        ${componentCode}
        const root = ReactDOM.createRoot(document.getElementById('root'));
        root.render(<App />);
    </script>
</body>
</html>`
      },
      entry: 'index.html',
      metadata: {
        device: req.body?.device || 'desktop',
        region: { start: { x: 0, y: 0 }, end: { x: 23, y: 19 } },
        framework: 'react',
        isReact: true,
        dependencies: ['react', 'react-dom'],
        aiProvider: 'google-gemini'
      },
      createdAt: new Date().toISOString(),
      author: 'ai-generator'
    }

    return res.status(200).json({ 
      success: true, 
      artifact 
    })

  } catch (error) {
    console.error('Generation Error:', error)
    return res.status(500).json({ 
      success: false,
      error: 'Failed to generate component',
      details: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    })
  }
}