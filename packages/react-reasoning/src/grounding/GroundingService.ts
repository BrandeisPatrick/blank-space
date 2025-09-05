import { z } from 'zod';

// Grounding query schema
export const GroundingQuerySchema = z.object({
  query: z.string(),
  type: z.enum(['web', 'docs', 'code']),
  maxResults: z.number().default(5),
  language: z.string().optional(),
  domain: z.string().optional(),
});

export type GroundingQuery = z.infer<typeof GroundingQuerySchema>;

// Grounding result schema
export const GroundingResultSchema = z.object({
  id: z.string(),
  title: z.string(),
  content: z.string(),
  url: z.string().optional(),
  relevanceScore: z.number(),
  source: z.string(),
  metadata: z.record(z.any()).optional(),
});

export type GroundingResult = z.infer<typeof GroundingResultSchema>;

// Grounding response
export const GroundingResponseSchema = z.object({
  query: z.string(),
  results: z.array(GroundingResultSchema),
  totalResults: z.number(),
  executionTime: z.number(),
  sources: z.array(z.string()),
});

export type GroundingResponse = z.infer<typeof GroundingResponseSchema>;

export interface GroundingProvider {
  name: string;
  search(query: GroundingQuery): Promise<GroundingResult[]>;
  isConfigured(): boolean;
}

export class MockWebGroundingProvider implements GroundingProvider {
  public readonly name = 'mock-web';

  async search(query: GroundingQuery): Promise<GroundingResult[]> {
    // Mock implementation for demonstration
    // In a real implementation, this would use a web search API
    const mockResults: GroundingResult[] = [
      {
        id: 'mock-1',
        title: `Search result for: ${query.query}`,
        content: `This is a mock search result for the query "${query.query}". In a real implementation, this would contain actual web search results with relevant information.`,
        url: `https://example.com/search?q=${encodeURIComponent(query.query)}`,
        relevanceScore: 0.9,
        source: 'mock-web',
        metadata: {
          domain: query.domain || 'general',
          timestamp: new Date().toISOString(),
        },
      },
    ];

    // Add more results based on maxResults
    for (let i = 2; i <= Math.min(query.maxResults, 3); i++) {
      mockResults.push({
        id: `mock-${i}`,
        title: `Additional result ${i} for: ${query.query}`,
        content: `This is additional mock content ${i} related to "${query.query}". It provides supplementary information.`,
        url: `https://example.com/result${i}?q=${encodeURIComponent(query.query)}`,
        relevanceScore: 0.9 - (i - 1) * 0.1,
        source: 'mock-web',
        metadata: {
          domain: query.domain || 'general',
          timestamp: new Date().toISOString(),
        },
      });
    }

    return mockResults;
  }

  isConfigured(): boolean {
    return true; // Mock is always configured
  }
}

export class DocumentationGroundingProvider implements GroundingProvider {
  public readonly name = 'documentation';
  private docSources = new Map<string, string[]>();

  constructor() {
    // Initialize with some common documentation sources
    this.docSources.set('react', [
      'React is a JavaScript library for building user interfaces',
      'Components are the building blocks of React applications',
      'Hooks allow you to use state and lifecycle features in functional components',
    ]);

    this.docSources.set('typescript', [
      'TypeScript is a typed superset of JavaScript',
      'TypeScript provides compile-time type checking',
      'Interfaces in TypeScript define the shape of objects',
    ]);

    this.docSources.set('nodejs', [
      'Node.js is a JavaScript runtime built on Chrome V8 engine',
      'npm is the package manager for Node.js',
      'Express is a popular web framework for Node.js',
    ]);
  }

  async search(query: GroundingQuery): Promise<GroundingResult[]> {
    const results: GroundingResult[] = [];
    const lowerQuery = query.query.toLowerCase();

    // Search through documentation sources
    for (const [topic, docs] of this.docSources.entries()) {
      if (lowerQuery.includes(topic)) {
        for (let i = 0; i < Math.min(docs.length, query.maxResults); i++) {
          results.push({
            id: `doc-${topic}-${i}`,
            title: `${topic.charAt(0).toUpperCase() + topic.slice(1)} Documentation`,
            content: docs[i],
            url: `https://docs.${topic}.dev/`,
            relevanceScore: 0.8,
            source: 'documentation',
            metadata: {
              topic,
              docType: 'official',
            },
          });
        }
        break; // Only return results for the first matching topic
      }
    }

    return results.slice(0, query.maxResults);
  }

  isConfigured(): boolean {
    return true;
  }

  addDocumentation(topic: string, content: string[]): void {
    this.docSources.set(topic.toLowerCase(), content);
  }
}

export class GroundingService {
  private providers = new Map<string, GroundingProvider>();

  registerProvider(provider: GroundingProvider): void {
    this.providers.set(provider.name, provider);
  }

  getProvider(name: string): GroundingProvider | undefined {
    return this.providers.get(name);
  }

  listProviders(): GroundingProvider[] {
    return Array.from(this.providers.values());
  }

  async search(query: GroundingQuery): Promise<GroundingResponse> {
    const startTime = Date.now();
    let allResults: GroundingResult[] = [];
    const sources: string[] = [];

    // Determine which providers to use based on query type
    const providersToUse = this.selectProviders(query.type);

    // Execute searches in parallel
    const searchPromises = providersToUse.map(async (provider) => {
      try {
        const results = await provider.search(query);
        sources.push(provider.name);
        return results;
      } catch (error) {
        console.warn(`Grounding provider ${provider.name} failed:`, error);
        return [];
      }
    });

    const resultSets = await Promise.all(searchPromises);
    allResults = resultSets.flat();

    // Sort by relevance score and limit results
    allResults.sort((a, b) => b.relevanceScore - a.relevanceScore);
    allResults = allResults.slice(0, query.maxResults);

    return {
      query: query.query,
      results: allResults,
      totalResults: allResults.length,
      executionTime: Date.now() - startTime,
      sources,
    };
  }

  private selectProviders(type: 'web' | 'docs' | 'code'): GroundingProvider[] {
    const allProviders = this.listProviders().filter(p => p.isConfigured());

    switch (type) {
      case 'web':
        return allProviders.filter(p => p.name.includes('web'));
      case 'docs':
        return allProviders.filter(p => p.name.includes('doc'));
      case 'code':
        // For code queries, use both web and docs
        return allProviders;
      default:
        return allProviders;
    }
  }

  async searchMultipleQueries(queries: GroundingQuery[]): Promise<GroundingResponse[]> {
    const searchPromises = queries.map(query => this.search(query));
    return Promise.all(searchPromises);
  }

  // Utility method to create a grounding-enhanced context
  async enhanceContext(
    context: string, 
    maxResults: number = 3
  ): Promise<string> {
    const query: GroundingQuery = {
      query: context,
      type: 'docs',
      maxResults,
    };

    const response = await this.search(query);
    
    if (response.results.length === 0) {
      return context;
    }

    const enhancedContext = `${context}

Additional Context:
${response.results.map((result, i) => 
  `${i + 1}. ${result.title}: ${result.content}`
).join('\\n')}`;

    return enhancedContext;
  }
}