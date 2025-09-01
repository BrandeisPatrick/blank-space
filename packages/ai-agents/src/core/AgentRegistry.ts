import { Agent, AgentRegistry, AgentDefinition, AIProvider } from '../types';

export class DefaultAgentRegistry implements AgentRegistry {
  private definitions = new Map<string, AgentDefinition>();

  register(definition: AgentDefinition): void {
    if (this.definitions.has(definition.config.id)) {
      throw new Error(`Agent ${definition.config.id} is already registered`);
    }

    // Validate dependencies
    for (const dep of definition.config.dependencies) {
      if (!this.definitions.has(dep)) {
        throw new Error(`Agent ${definition.config.id} depends on ${dep}, but ${dep} is not registered`);
      }
    }

    this.definitions.set(definition.config.id, definition);
  }

  get(id: string): AgentDefinition | undefined {
    return this.definitions.get(id);
  }

  list(): AgentDefinition[] {
    return Array.from(this.definitions.values())
      .sort((a, b) => b.config.priority - a.config.priority); // Higher priority first
  }

  has(id: string): boolean {
    return this.definitions.has(id);
  }

  remove(id: string): boolean {
    // Check if any other agents depend on this one
    const dependents = this.list().filter(def => 
      def.config.dependencies.includes(id)
    );

    if (dependents.length > 0) {
      throw new Error(
        `Cannot remove agent ${id}: it is depended on by ${dependents.map(d => d.config.id).join(', ')}`
      );
    }

    return this.definitions.delete(id);
  }

  // Additional utility methods
  getByCapability(capability: string): AgentDefinition[] {
    return this.list().filter(def => 
      def.config.capabilities.includes(capability)
    );
  }

  getEnabled(): AgentDefinition[] {
    return this.list().filter(def => def.config.enabled);
  }

  createAgent(id: string, provider: AIProvider): Agent {
    const definition = this.get(id);
    if (!definition) {
      throw new Error(`Agent ${id} not found in registry`);
    }

    if (!definition.config.enabled) {
      throw new Error(`Agent ${id} is disabled`);
    }

    return definition.factory(provider);
  }

  // Dependency resolution
  resolveDependencies(agentIds: string[]): string[] {
    const resolved = new Set<string>();
    const visiting = new Set<string>();

    const visit = (id: string) => {
      if (resolved.has(id)) return;
      if (visiting.has(id)) {
        throw new Error(`Circular dependency detected involving agent ${id}`);
      }

      const definition = this.get(id);
      if (!definition) {
        throw new Error(`Agent ${id} not found`);
      }

      visiting.add(id);
      
      // Visit dependencies first
      for (const depId of definition.config.dependencies) {
        visit(depId);
      }
      
      visiting.delete(id);
      resolved.add(id);
    };

    for (const id of agentIds) {
      visit(id);
    }

    return Array.from(resolved);
  }

  // Validation
  validate(): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    for (const [id, definition] of this.definitions) {
      // Check for missing dependencies
      for (const depId of definition.config.dependencies) {
        if (!this.has(depId)) {
          errors.push(`Agent ${id} depends on missing agent ${depId}`);
        }
      }

      // Check for circular dependencies
      try {
        this.resolveDependencies([id]);
      } catch (error) {
        if (error instanceof Error) {
          errors.push(`Dependency error for ${id}: ${error.message}`);
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  // Registry statistics
  getStats() {
    const definitions = this.list();
    const enabled = definitions.filter(def => def.config.enabled);
    const capabilities = new Set<string>();
    
    definitions.forEach(def => {
      def.config.capabilities.forEach(cap => capabilities.add(cap));
    });

    return {
      total: definitions.length,
      enabled: enabled.length,
      disabled: definitions.length - enabled.length,
      capabilities: Array.from(capabilities),
      averagePriority: definitions.reduce((sum, def) => sum + def.config.priority, 0) / definitions.length
    };
  }
}