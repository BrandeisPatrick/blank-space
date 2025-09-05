import { z } from 'zod';

// Prompt template schema
export const PromptTemplateSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  template: z.string(),
  variables: z.array(z.string()),
  category: z.string().optional(),
  version: z.string().default('1.0.0'),
  tags: z.array(z.string()).default([]),
});

export type PromptTemplate = z.infer<typeof PromptTemplateSchema>;

// Prompt context for variable substitution
export const PromptContextSchema = z.object({
  variables: z.record(z.any()),
  metadata: z.record(z.any()).optional(),
});

export type PromptContext = z.infer<typeof PromptContextSchema>;

export class PromptManager {
  private templates = new Map<string, PromptTemplate>();

  register(template: PromptTemplate): void {
    this.templates.set(template.id, template);
  }

  get(id: string): PromptTemplate | undefined {
    return this.templates.get(id);
  }

  list(): PromptTemplate[] {
    return Array.from(this.templates.values());
  }

  listByCategory(category: string): PromptTemplate[] {
    return this.list().filter(template => template.category === category);
  }

  listByTag(tag: string): PromptTemplate[] {
    return this.list().filter(template => template.tags.includes(tag));
  }

  render(templateId: string, context: PromptContext): string {
    const template = this.get(templateId);
    if (!template) {
      throw new Error(`Template '${templateId}' not found`);
    }

    return this.renderTemplate(template.template, context.variables);
  }

  renderTemplate(template: string, variables: Record<string, any>): string {
    let result = template;
    
    // Replace variables using {{variable}} syntax
    for (const [key, value] of Object.entries(variables)) {
      const regex = new RegExp(`\\{\\{\\s*${key}\\s*\\}\\}`, 'g');
      result = result.replace(regex, String(value));
    }

    // Check for unresolved variables
    const unresolvedMatches = result.match(/\{\{\s*\w+\s*\}\}/g);
    if (unresolvedMatches) {
      throw new Error(`Unresolved variables in template: ${unresolvedMatches.join(', ')}`);
    }

    return result;
  }

  validateTemplate(template: PromptTemplate): boolean {
    try {
      // Extract variables from template
      const variableMatches = template.template.match(/\{\{\s*(\w+)\s*\}\}/g);
      const templateVariables = variableMatches 
        ? variableMatches.map(match => match.replace(/\{\{\s*|\s*\}\}/g, ''))
        : [];

      // Check if all declared variables are used
      const unusedVariables = template.variables.filter(v => !templateVariables.includes(v));
      const undeclaredVariables = templateVariables.filter(v => !template.variables.includes(v));

      if (unusedVariables.length > 0) {
        console.warn(`Template '${template.id}' has unused variables: ${unusedVariables.join(', ')}`);
      }

      if (undeclaredVariables.length > 0) {
        console.warn(`Template '${template.id}' has undeclared variables: ${undeclaredVariables.join(', ')}`);
      }

      return true;
    } catch {
      return false;
    }
  }

  remove(id: string): boolean {
    return this.templates.delete(id);
  }

  clear(): void {
    this.templates.clear();
  }

  has(id: string): boolean {
    return this.templates.has(id);
  }

  getVariables(templateId: string): string[] {
    const template = this.get(templateId);
    return template ? template.variables : [];
  }

  clone(sourceId: string, newId: string, overrides?: Partial<PromptTemplate>): PromptTemplate {
    const source = this.get(sourceId);
    if (!source) {
      throw new Error(`Source template '${sourceId}' not found`);
    }

    const cloned: PromptTemplate = {
      ...source,
      id: newId,
      ...overrides,
    };

    this.register(cloned);
    return cloned;
  }

  search(query: string): PromptTemplate[] {
    const lowerQuery = query.toLowerCase();
    return this.list().filter(template => 
      template.name.toLowerCase().includes(lowerQuery) ||
      template.description.toLowerCase().includes(lowerQuery) ||
      template.tags.some(tag => tag.toLowerCase().includes(lowerQuery))
    );
  }
}