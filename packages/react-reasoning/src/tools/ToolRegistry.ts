import { Tool, ToolRegistry } from './types';

export class DefaultToolRegistry implements ToolRegistry {
  private tools = new Map<string, Tool>();

  register(tool: Tool): void {
    this.tools.set(tool.definition.name, tool);
  }

  get(name: string): Tool | undefined {
    return this.tools.get(name);
  }

  list(): Tool[] {
    return Array.from(this.tools.values());
  }

  listByCategory(category: string): Tool[] {
    return this.list().filter(tool => tool.definition.category === category);
  }

  remove(name: string): boolean {
    return this.tools.delete(name);
  }

  has(name: string): boolean {
    return this.tools.has(name);
  }

  validate(name: string, args: Record<string, any>): boolean {
    const tool = this.get(name);
    return tool ? tool.validate(args) : false;
  }

  clear(): void {
    this.tools.clear();
  }

  getNames(): string[] {
    return Array.from(this.tools.keys());
  }

  getCategories(): string[] {
    const categories = new Set<string>();
    for (const tool of this.tools.values()) {
      if (tool.definition.category) {
        categories.add(tool.definition.category);
      }
    }
    return Array.from(categories);
  }

  searchByDescription(query: string): Tool[] {
    const lowerQuery = query.toLowerCase();
    return this.list().filter(tool =>
      tool.definition.description.toLowerCase().includes(lowerQuery) ||
      tool.definition.name.toLowerCase().includes(lowerQuery)
    );
  }

  getDangerous(): Tool[] {
    return this.list().filter(tool => tool.definition.dangerous);
  }

  getRequiringConfirmation(): Tool[] {
    return this.list().filter(tool => tool.definition.requiresConfirmation);
  }
}