import { VercelRequest, VercelResponse } from '@vercel/node'
import { streamText } from 'ai'
import { xai } from '@ai-sdk/xai'
import { openai } from '@ai-sdk/openai'

interface ReasoningStep {
  id: string
  type: 'thought' | 'action' | 'observation' | 'final_answer'
  content: string
  timestamp: string
  metadata: any
}

interface PlanningComponent {
  name: string
  purpose?: string
  details?: string[]
}

interface PlanningResult {
  analysis?: string
  intent?: 'generation' | 'modification' | 'explanation' | 'conversation'
  confidence?: number
  reasoning?: string
  componentPlan?: PlanningComponent[]
  keyComponents?: PlanningComponent[]
  sections?: PlanningComponent[]
  dataPoints?: string[]
  data?: string[]
  dataRequirements?: string[]
  styleGuide?: string[]
  styling?: string[]
  style?: string[]
  dependencies?: string[]
}

const FALLBACK_REACT_COMPONENT = `function App() {
  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#0f172a',
        color: '#f8fafc',
        fontFamily: 'system-ui, sans-serif',
      }}
    >
      <div
        style={{
          textAlign: 'center',
          maxWidth: '420px',
          padding: '32px',
          borderRadius: '20px',
          backgroundColor: '#111c3a',
          boxShadow: '0 24px 60px rgba(15, 23, 42, 0.4)',
        }}
      >
        <h1 style={{ fontSize: '28px', marginBottom: '12px' }}>AI preview coming soon</h1>
        <p style={{ fontSize: '16px', lineHeight: 1.6, opacity: 0.8 }}>
          I wasn't able to generate the requested component. Try refining your prompt and run the assistant again.
        </p>
      </div>
    </div>
  );
}
`

const FALLBACK_REACT_CSS = `:root {
  color-scheme: dark;
}

body {
  margin: 0;
  background: radial-gradient(circle at top, #1e1b4b, #020617);
}
`

const FALLBACK_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Generated Preview</title>
  <link rel="stylesheet" href="styles.css">
</head>
<body>
  <main class="empty-state">
    <h1>AI preview unavailable</h1>
    <p>Try asking again with a bit more detail so I can build it for you.</p>
  </main>
  <script src="script.js"></script>
</body>
</html>`

const FALLBACK_HTML_CSS = `:root {
  color-scheme: dark;
}

body {
  margin: 0;
  font-family: 'Inter', system-ui, -apple-system, sans-serif;
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: radial-gradient(circle at 20% 20%, rgba(59, 130, 246, 0.3), transparent 55%),
              radial-gradient(circle at 80% 0%, rgba(147, 51, 234, 0.25), transparent 55%),
              #020617;
  color: #f1f5f9;
}

.empty-state {
  text-align: center;
  padding: 48px;
  border-radius: 28px;
  background: rgba(15, 23, 42, 0.75);
  backdrop-filter: blur(24px);
  box-shadow: 0 40px 100px rgba(15, 23, 42, 0.45);
  max-width: 420px;
}

.empty-state h1 {
  margin: 0 0 12px;
  font-size: 32px;
  letter-spacing: -0.03em;
}

.empty-state p {
  margin: 0;
  font-size: 16px;
  line-height: 1.7;
  opacity: 0.75;
}
`

const FALLBACK_HTML_JS = `console.log('Waiting for a new preview...');`

function sanitizeReactModule(code: string): string {
  return code
    .replace(/import\s+.*?from\s+['"].*?['"];?\s*/g, '')
    .replace(/export\s+(default\s+)?/g, '')
    .replace(/module\.exports\s*=\s*.*?;?\s*/g, '')
    .replace(/export\s*\{[^}]+\}\s*;?\s*/g, '')
    .trim()
}

function normalizeFilename(filename: string): string {
  return filename.replace(/^\.\/?/, '').replace(/^\/+/, '')
}

function parseJsonResponse(raw: string): any | null {
  try {
    return JSON.parse(raw)
  } catch (error) {
    const firstBrace = raw.indexOf('{')
    const lastBrace = raw.lastIndexOf('}')

    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      const possibleJson = raw.slice(firstBrace, lastBrace + 1)
      try {
        return JSON.parse(possibleJson)
      } catch (nestedError) {
        console.warn('Failed to parse JSON from streamed text:', nestedError)
      }
    }
  }

  return null
}

function extractPlanComponents(plan: PlanningResult | null): PlanningComponent[] {
  if (!plan) return []
  return (
    plan.componentPlan ||
    plan.keyComponents ||
    plan.sections ||
    []
  )
}

function extractPlanDataPoints(plan: PlanningResult | null): string[] {
  if (!plan) return []
  return (
    plan.dataPoints ||
    plan.data ||
    plan.dataRequirements ||
    []
  )
}

function extractPlanStyleNotes(plan: PlanningResult | null): string[] {
  if (!plan) return []
  return (
    plan.styleGuide ||
    plan.styling ||
    plan.style ||
    []
  )
}

function summarizePlan(plan: PlanningResult | null): string {
  if (!plan) {
    return 'Planning outcome unavailable. Proceeding with a safe default layout and component structure.'
  }

  const lines: string[] = []
  const components = extractPlanComponents(plan)

  if (components.length > 0) {
    lines.push('Component outline:')
    components.slice(0, 4).forEach(component => {
      const detail = component.details && component.details.length > 0
        ? ` — ${component.details.slice(0, 2).join('; ')}`
        : ''
      lines.push(`• ${component.name}${component.purpose ? `: ${component.purpose}` : ''}${detail}`)
    })
  }

  const dataPoints = extractPlanDataPoints(plan)
  if (dataPoints.length > 0) {
    lines.push('Key state & data: ' + dataPoints.slice(0, 4).join(', '))
  }

  const styleNotes = extractPlanStyleNotes(plan)
  if (styleNotes.length > 0) {
    lines.push('Styling focus: ' + styleNotes.slice(0, 4).join(', '))
  }

  if (lines.length === 0) {
    lines.push('Applying a balanced layout with accessible styling and responsive spacing.')
  }

  return lines.join('\n')
}

function ensureReactDefaults(files: Record<string, string>): string {
  const hasRootApp = Boolean(files['App.jsx']?.trim() || files['App.tsx']?.trim())
  const hasSrcApp = Boolean(files['src/App.jsx']?.trim() || files['src/App.tsx']?.trim())

  if (!hasRootApp && !hasSrcApp) {
    files['App.jsx'] = FALLBACK_REACT_COMPONENT
    return 'App.jsx'
  }

  if (!files['App.module.css'] || files['App.module.css'].trim().length === 0) {
    files['App.module.css'] = FALLBACK_REACT_CSS
  }

  if (files['App.jsx']?.trim()) return 'App.jsx'
  if (files['App.tsx']?.trim()) return 'App.tsx'
  if (files['src/App.tsx']?.trim()) return 'src/App.tsx'
  if (files['src/App.jsx']?.trim()) return 'src/App.jsx'
  if (files['index.jsx']?.trim()) return 'index.jsx'
  if (files['index.tsx']?.trim()) return 'index.tsx'

  return 'App.jsx'
}

function ensureVanillaDefaults(files: Record<string, string>): string {
  if (!files['index.html'] || files['index.html'].trim().length === 0) {
    files['index.html'] = FALLBACK_HTML
  }

  if (!files['styles.css'] || files['styles.css'].trim().length === 0) {
    files['styles.css'] = FALLBACK_HTML_CSS
  }

  if (!files['script.js'] || files['script.js'].trim().length === 0) {
    files['script.js'] = FALLBACK_HTML_JS
  }

  return 'index.html'
}

function buildFilesFromGeneration(
  generatedCode: any,
  isReact: boolean
): { files: Record<string, string>; entry: string; dependencies: string[] } {
  const files: Record<string, string> = {}
  const dependencySet = new Set<string>()
  let entry = isReact ? 'App.jsx' : 'index.html'

  if (generatedCode) {
    const dependencyField = generatedCode.dependencies
    if (Array.isArray(dependencyField)) {
      dependencyField.forEach(dep => {
        if (typeof dep === 'string' && dep.trim().length > 0) {
          dependencySet.add(dep.trim())
        }
      })
    } else if (typeof dependencyField === 'string') {
      dependencyField
        .split(/[,\n]/)
        .map(dep => dep.trim())
        .filter(dep => dep.length > 0)
        .forEach(dep => dependencySet.add(dep))
    }

    if (generatedCode.files && typeof generatedCode.files === 'object') {
      for (const [rawName, rawContent] of Object.entries(generatedCode.files)) {
        if (!rawName) continue
        const normalizedName = normalizeFilename(rawName)
        if (!normalizedName) continue

        const content = typeof rawContent === 'string'
          ? rawContent
          : JSON.stringify(rawContent, null, 2)

        const sanitized =
          isReact && /\.(t|j)sx?$/.test(normalizedName)
            ? sanitizeReactModule(content)
            : content.trim()

        files[normalizedName] = sanitized
      }
    } else if (isReact) {
      const componentCode = generatedCode.html || generatedCode.jsx || generatedCode.code
      if (componentCode) {
        files['App.jsx'] = sanitizeReactModule(String(componentCode))
      }

      const cssCode = generatedCode.css || generatedCode.styles
      if (cssCode) {
        files['App.module.css'] = String(cssCode).trim()
      }

      const jsHelpers = generatedCode.js || generatedCode.script || generatedCode.utility
      if (jsHelpers) {
        files['helpers.js'] = String(jsHelpers).trim()
      }
    } else {
      const html = generatedCode.html || generatedCode.markup
      if (html) {
        files['index.html'] = String(html).trim()
      }

      const css = generatedCode.css || generatedCode.styles
      if (css) {
        files['styles.css'] = String(css).trim()
      }

      const js = generatedCode.js || generatedCode.script
      if (js) {
        files['script.js'] = String(js).trim()
      }
    }
  }

  entry = isReact ? ensureReactDefaults(files) : ensureVanillaDefaults(files)

  return {
    files,
    entry,
    dependencies: Array.from(dependencySet)
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const {
      prompt,
      device = 'desktop',
      framework = 'react',
      withReasoning = false
    } = req.body

    if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
      return res.status(400).json({ error: 'Prompt is required' })
    }

    res.setHeader('Content-Type', 'text/event-stream')
    res.setHeader('Cache-Control', 'no-cache')
    res.setHeader('Connection', 'keep-alive')
    res.setHeader('Access-Control-Allow-Origin', '*')

    const isReact = framework.toLowerCase().includes('react')

    let codeModel
    if (process.env.XAI_API_KEY) {
      codeModel = xai('grok-code-fast-1')
    } else if (process.env.OPENAI_API_KEY) {
      codeModel = openai('gpt-5-nano')
    } else {
      res.write(`data: ${JSON.stringify({
        type: 'error',
        error: 'No AI provider configured. Please set XAI_API_KEY or OPENAI_API_KEY'
      })}\n\n`)
      res.end()
      return
    }

    let reasoningModel
    if (process.env.OPENAI_API_KEY) {
      reasoningModel = openai('gpt-5-mini')
    } else if (process.env.XAI_API_KEY) {
      reasoningModel = xai('grok-code-fast-1')
    } else {
      reasoningModel = codeModel
    }

    const reasoningSteps: ReasoningStep[] = []
    let stepId = 1
    let planningResult: PlanningResult | null = null

    if (withReasoning) {
      res.write(`data: ${JSON.stringify({ type: 'connected' })}\n\n`)

      try {
        const planningResponse = await streamText({
          model: reasoningModel,
          messages: [
            {
              role: 'system',
              content: `You are a senior front-end engineer who must plan before coding.
Respond only with valid JSON that matches this schema:
{
  "analysis": "Concise summary of the request",
  "intent": "generation|modification|explanation|conversation",
  "confidence": 0.95,
  "reasoning": "Why this classification makes sense",
  "componentPlan": [
    { "name": "Component or section", "purpose": "Role in the UI", "details": ["Key behaviour or elements"] }
  ],
  "dataPoints": ["Important pieces of state or data"],
  "styleGuide": ["Essential styling or layout considerations"],
  "dependencies": ["Libraries or assets required"]
}`
            },
            {
              role: 'user',
              content: `Create a plan for this request: "${prompt}"`
            }
          ],
          temperature: 0.2
        })

        let planningText = ''
        for await (const chunk of planningResponse.textStream) {
          planningText += chunk
        }

        planningResult = parseJsonResponse(planningText)
      } catch (error) {
        console.warn('Planning stage failed:', error)
      }

      const now = new Date().toISOString()
      const planAnalysis = planningResult?.analysis
        ? planningResult.analysis
        : `Analyzing request: "${prompt}" to determine the right implementation approach.`

      const analysisStep: ReasoningStep = {
        id: `step-${stepId++}`,
        type: 'thought',
        content: planAnalysis,
        timestamp: now,
        metadata: { plan: planningResult }
      }
      reasoningSteps.push(analysisStep)
      res.write(`data: ${JSON.stringify({ type: 'reasoning_step', step: analysisStep })}\n\n`)

      const planSummary = summarizePlan(planningResult)
      const planningStep: ReasoningStep = {
        id: `step-${stepId++}`,
        type: 'action',
        content: planSummary,
        timestamp: new Date().toISOString(),
        metadata: { plan: planningResult }
      }
      reasoningSteps.push(planningStep)
      res.write(`data: ${JSON.stringify({ type: 'reasoning_step', step: planningStep })}\n\n`)

      const dependencyNotes = planningResult?.dependencies && planningResult.dependencies.length > 0
        ? `Planning to include dependencies: ${planningResult.dependencies.join(', ')}.`
        : 'No external dependencies required beyond React runtime.'

      const observationStep: ReasoningStep = {
        id: `step-${stepId++}`,
        type: 'observation',
        content: `${planningResult?.intent ? `Classified as a ${planningResult.intent} task.` : 'Treating this as a generation task.'} ${dependencyNotes} Preparing to hand off implementation to Grok for code generation.`,
        timestamp: new Date().toISOString(),
        metadata: {
          intent: planningResult?.intent || 'generation',
          confidence: planningResult?.confidence,
          dependencies: planningResult?.dependencies || []
        }
      }
      reasoningSteps.push(observationStep)
      res.write(`data: ${JSON.stringify({ type: 'reasoning_step', step: observationStep })}\n\n`)

      res.write(`data: ${JSON.stringify({ type: 'reasoning_complete', steps: reasoningSteps })}\n\n`)
    }

    res.write(`data: ${JSON.stringify({ type: 'generation_start' })}\n\n`)

    const systemPrompt = isReact
      ? `You are an expert React developer. Generate clean, modern React components with JSX, CSS, and JavaScript logic.

Return ONLY valid JSON.

Single-file format:
{
  "html": "React JSX component code",
  "css": "CSS styles",
  "js": "Additional JavaScript if needed"
}

Multi-file format:
{
  "files": {
    "App.jsx": "Main component",
    "components/Header.jsx": "Child component",
    "styles/App.css": "Styles"
  },
  "dependencies": ["package"]
}

Rules:
- Use double quotes in JSON; escape quotes and newlines properly.
- Do not use ES module syntax (no import/export statements).
- App component must be named App.
- Avoid template literals in JSX; use string concatenation instead.
- Prefer functional components and hooks.
- Code must run in a browser environment with React 18 UMD builds.`
      : `You are an expert web developer. Generate modern, responsive HTML, CSS, and JavaScript for the browser.
Return ONLY valid JSON with either {"html", "css", "js"} fields or a {"files": { ... }} structure.`

    const generation = await streamText({
      model: codeModel,
      messages: [
        {
          role: 'system',
          content: systemPrompt
        },
        {
          role: 'user',
          content: isReact
            ? `Build a React component based on this request: ${prompt}`
            : `Build a website based on this request: ${prompt}`
        }
      ],
      temperature: 0.7
    })

    let fullResponse = ''

    try {
      for await (const chunk of generation.textStream) {
        fullResponse += chunk
        res.write(`data: ${JSON.stringify({ type: 'generation_chunk', chunk })}\n\n`)
      }

      const generatedCode = parseJsonResponse(fullResponse)

      if (!generatedCode) {
        res.write(`data: ${JSON.stringify({
          type: 'error',
          error: 'Failed to parse generated code. Please try again.'
        })}\n\n`)
        res.end()
        return
      }

      if (isReact && generatedCode.html) {
        generatedCode.html = sanitizeReactModule(String(generatedCode.html))
      }

      if (isReact && generatedCode.files && typeof generatedCode.files === 'object') {
        Object.keys(generatedCode.files).forEach(filename => {
          if (/\.(t|j)sx?$/.test(filename)) {
            generatedCode.files[filename] = sanitizeReactModule(String(generatedCode.files[filename]))
          }
        })
      }

      const { files, entry, dependencies: generatedDependencies } = buildFilesFromGeneration(generatedCode, isReact)

      const dependencySet = new Set<string>(generatedDependencies)
      if (planningResult?.dependencies) {
        planningResult.dependencies
          .filter(dep => typeof dep === 'string' && dep.trim().length > 0)
          .forEach(dep => dependencySet.add(dep.trim()))
      }

      const timestamp = Date.now()
      const artifactId = `artifact_${timestamp}`
      const artifact = {
        id: artifactId,
        projectId: `project_${timestamp}`,
        regionId: 'full-page',
        files,
        entry,
        metadata: {
          device,
          region: {
            start: { x: 0, y: 0 },
            end: { x: 23, y: 19 }
          },
          framework,
          isReact,
          projectType: isReact ? 'react' : 'vanilla',
          dependencies: Array.from(dependencySet)
        },
        createdAt: new Date(timestamp).toISOString(),
        author: 'ai-generator'
      }

      if (withReasoning) {
        const finalStep: ReasoningStep = {
          id: `step-${stepId++}`,
          type: 'final_answer',
          content: `Successfully generated ${isReact ? 'React component' : 'website'} with ${Object.keys(files).length} file(s). The preview is ready to inspect in the editor and live canvas.`,
          timestamp: new Date().toISOString(),
          metadata: {
            artifactId,
            dependencies: Array.from(dependencySet)
          }
        }
        reasoningSteps.push(finalStep)
        res.write(`data: ${JSON.stringify({ type: 'reasoning_step', step: finalStep })}\n\n`)
      }

      res.write(`data: ${JSON.stringify({
        type: 'generation_complete',
        artifact,
        reasoningSteps: withReasoning ? reasoningSteps : undefined
      })}\n\n`)
    } catch (streamError) {
      console.error('Streaming failed:', streamError)
      res.write(`data: ${JSON.stringify({
        type: 'error',
        error: 'Code generation failed. Please try again.'
      })}\n\n`)
    }

    res.write(`data: ${JSON.stringify({ type: 'done' })}\n\n`)
    res.end()
  } catch (error) {
    console.error('Generation error:', error)
    if (!res.headersSent) {
      res.status(500).json({ error: 'Internal server error' })
    } else {
      res.write(`data: ${JSON.stringify({ type: 'error', error: 'Internal server error' })}\n\n`)
      res.end()
    }
  }
}
