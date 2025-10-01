export interface VirtualFile {
  path: string
  content: string
  type: 'component' | 'style' | 'config' | 'asset'
  createdAt: Date
  modifiedAt: Date
  metadata?: Record<string, any>
}

export interface ValidationResult {
  isValid: boolean
  errors: string[]
  warnings: string[]
}

export interface ComponentDefinition {
  name: string
  props: PropDefinition[]
  state: StateDefinition[]
  methods: MethodDefinition[]
  hooks: HookDefinition[]
  jsx: JSXStructure
  imports: ImportDefinition[]
}

export interface PropDefinition {
  name: string
  type: 'string' | 'number' | 'boolean' | 'object' | 'array' | 'function'
  required: boolean
  defaultValue?: any
}

export interface StateDefinition {
  name: string
  type: 'useState' | 'useReducer' | 'useRef'
  initialValue: any
  actions?: string[]
}

export interface MethodDefinition {
  name: string
  parameters: string[]
  body: string
  isAsync: boolean
}

export interface HookDefinition {
  type: 'useEffect' | 'useMemo' | 'useCallback' | 'custom'
  dependencies: string[]
  body: string
}

export interface JSXStructure {
  element: string
  attributes: Record<string, string>
  children: (JSXStructure | string)[]
  events?: Record<string, string>
}

export interface ImportDefinition {
  from: string
  imports: string[]
  isDefault?: boolean
}

export class VirtualFileSystem {
  private files: Map<string, VirtualFile> = new Map()
  private components: Map<string, ComponentDefinition> = new Map()

  // File operations
  createFile(path: string, content: string, type: VirtualFile['type'] = 'component'): void {
    const file: VirtualFile = {
      path,
      content,
      type,
      createdAt: new Date(),
      modifiedAt: new Date()
    }
    this.files.set(path, file)
  }

  readFile(path: string): string | null {
    const file = this.files.get(path)
    return file ? file.content : null
  }

  writeFile(path: string, content: string): void {
    const file = this.files.get(path)
    if (file) {
      file.content = content
      file.modifiedAt = new Date()
    } else {
      this.createFile(path, content)
    }
  }

  deleteFile(path: string): boolean {
    return this.files.delete(path)
  }

  listFiles(): VirtualFile[] {
    return Array.from(this.files.values())
  }

  getFilesByType(type: VirtualFile['type']): VirtualFile[] {
    return this.listFiles().filter(file => file.type === type)
  }

  // Component operations
  createComponent(name: string): ComponentDefinition {
    const component: ComponentDefinition = {
      name,
      props: [],
      state: [],
      methods: [],
      hooks: [],
      jsx: {
        element: 'div',
        attributes: {},
        children: [`${name} component`]
      },
      imports: []
    }
    this.components.set(name, component)
    return component
  }

  getComponent(name: string): ComponentDefinition | null {
    return this.components.get(name) || null
  }

  addComponentState(componentName: string, stateDefinition: StateDefinition): void {
    const component = this.components.get(componentName)
    if (component) {
      component.state.push(stateDefinition)
    }
  }

  addComponentMethod(componentName: string, method: MethodDefinition): void {
    const component = this.components.get(componentName)
    if (component) {
      component.methods.push(method)
    }
  }

  addComponentProp(componentName: string, prop: PropDefinition): void {
    const component = this.components.get(componentName)
    if (component) {
      component.props.push(prop)
    }
  }

  setComponentJSX(componentName: string, jsx: JSXStructure): void {
    const component = this.components.get(componentName)
    if (component) {
      component.jsx = jsx
    }
  }

  // Validation
  validateComponent(componentName: string): ValidationResult {
    const component = this.components.get(componentName)
    if (!component) {
      return {
        isValid: false,
        errors: [`Component ${componentName} not found`],
        warnings: []
      }
    }

    const errors: string[] = []
    const warnings: string[] = []

    // Validate component name
    if (!/^[A-Z][a-zA-Z0-9]*$/.test(component.name)) {
      errors.push('Component name must start with uppercase letter and contain only alphanumeric characters')
    }

    // Validate state
    for (const state of component.state) {
      if (!/^[a-z][a-zA-Z0-9]*$/.test(state.name)) {
        errors.push(`Invalid state name: ${state.name}. Must start with lowercase letter.`)
      }
    }

    // Validate methods
    for (const method of component.methods) {
      if (!/^[a-z][a-zA-Z0-9]*$/.test(method.name)) {
        errors.push(`Invalid method name: ${method.name}. Must start with lowercase letter.`)
      }
    }

    // Validate JSX structure
    if (!component.jsx) {
      errors.push('Component must have JSX structure')
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    }
  }

  // Code generation
  generateComponentCode(componentName: string): string {
    const component = this.components.get(componentName)
    if (!component) {
      throw new Error(`Component ${componentName} not found`)
    }

    const validation = this.validateComponent(componentName)
    if (!validation.isValid) {
      throw new Error(`Component validation failed: ${validation.errors.join(', ')}`)
    }

    return this.buildComponentString(component)
  }

  private buildComponentString(component: ComponentDefinition): string {
    const lines: string[] = []

    // Add imports
    for (const imp of component.imports) {
      if (imp.isDefault) {
        lines.push(`import ${imp.imports[0]} from '${imp.from}'`)
      } else {
        lines.push(`import { ${imp.imports.join(', ')} } from '${imp.from}'`)
      }
    }

    if (component.imports.length > 0) {
      lines.push('')
    }

    // Function declaration
    lines.push(`function ${component.name}(props) {`)

    // Add state
    for (const state of component.state) {
      switch (state.type) {
        case 'useState':
          lines.push(`  var [${state.name}, set${this.capitalize(state.name)}] = React.useState(${JSON.stringify(state.initialValue)})`)
          break
        case 'useRef':
          lines.push(`  var ${state.name} = React.useRef(${JSON.stringify(state.initialValue)})`)
          break
      }
    }

    // Add methods
    for (const method of component.methods) {
      const params = method.parameters.join(', ')
      lines.push(`  var ${method.name} = function(${params}) {`)
      lines.push(`    ${method.body}`)
      lines.push(`  }`)
    }

    // Add hooks
    for (const hook of component.hooks) {
      switch (hook.type) {
        case 'useEffect':
          lines.push(`  React.useEffect(function() {`)
          lines.push(`    ${hook.body}`)
          lines.push(`  }, [${hook.dependencies.join(', ')}])`)
          break
      }
    }

    // Add return statement
    lines.push(`  return (`)
    lines.push(`    ${this.buildJSXString(component.jsx)}`)
    lines.push(`  )`)
    lines.push(`}`)

    return lines.join('\n')
  }

  private buildJSXString(jsx: JSXStructure): string {
    let result = `<${jsx.element}`

    // Add attributes
    for (const [key, value] of Object.entries(jsx.attributes)) {
      if (key === 'style' && typeof value === 'object') {
        result += ` style={${JSON.stringify(value)}}`
      } else if (key.startsWith('on') && jsx.events?.[key]) {
        result += ` ${key}={${jsx.events[key]}}`
      } else {
        result += ` ${key}="${value}"`
      }
    }

    if (jsx.children.length === 0) {
      result += ` />`
    } else {
      result += `>`

      for (const child of jsx.children) {
        if (typeof child === 'string') {
          result += child
        } else {
          result += this.buildJSXString(child)
        }
      }

      result += `</${jsx.element}>`
    }

    return result
  }

  private capitalize(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1)
  }

  // Export to existing format
  toArtifactFiles(): Record<string, string> {
    const result: Record<string, string> = {}

    // Add generated component files
    for (const [name, _component] of this.components) {
      try {
        result[`${name}.jsx`] = this.generateComponentCode(name)
      } catch (error) {
        console.error(`Failed to generate ${name}:`, error)
        result[`${name}.jsx`] = `// Error generating component: ${error}`
      }
    }

    // Add other files
    for (const file of this.files.values()) {
      if (file.type !== 'component') {
        result[file.path] = file.content
      }
    }

    return result
  }
}