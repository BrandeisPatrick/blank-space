export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { prompt } = req.body || {}

    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' })
    }

    // For now, return a mock response since AI SDK might have issues
    const mockArtifact = {
      id: `artifact_${Date.now()}`,
      projectId: 'default',
      regionId: 'full-page',
      files: {
        'App.jsx': `function App() {
  return (
    <div style={{
      padding: '20px',
      fontFamily: 'Arial, sans-serif',
      textAlign: 'center'
    }}>
      <h1>Generated Content</h1>
      <p>Request: ${prompt}</p>
      <p>This is a mock response while we debug the AI integration.</p>
    </div>
  )
}`,
        'App.module.css': `
.container {
  padding: 20px;
  font-family: Arial, sans-serif;
  text-align: center;
}
`,
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
        function App() {
          return (
            <div style={{
              padding: '20px',
              fontFamily: 'Arial, sans-serif',
              textAlign: 'center'
            }}>
              <h1>Generated Content</h1>
              <p>Request: ${prompt}</p>
              <p>This is a mock response while we debug the AI integration.</p>
            </div>
          )
        }
        ReactDOM.render(<App />, document.getElementById('root'));
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
        dependencies: ['react', 'react-dom']
      },
      createdAt: new Date().toISOString(),
      author: 'ai-generator'
    }

    return res.status(200).json({ 
      success: true, 
      artifact: mockArtifact 
    })

  } catch (error) {
    console.error('API Error:', error)
    return res.status(500).json({ 
      error: 'Internal server error',
      details: error.message
    })
  }
}