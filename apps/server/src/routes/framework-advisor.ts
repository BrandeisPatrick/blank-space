import { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { FrameworkAdvisor, ProjectRequirementsSchema, AnalysisCriteriaSchema } from '@ui-grid-ai/framework-advisor';

// Request/Response schemas
const RecommendFromPromptSchema = z.object({
  prompt: z.string().min(1).max(2000),
  criteria: AnalysisCriteriaSchema.optional(),
  maxAlternatives: z.number().min(1).max(10).default(3),
});

const RecommendFromRequirementsSchema = z.object({
  requirements: ProjectRequirementsSchema,
  criteria: AnalysisCriteriaSchema.optional(),
  maxAlternatives: z.number().min(1).max(10).default(3),
});

const CompareFrameworksSchema = z.object({
  frameworkIds: z.array(z.string()).min(2).max(5),
  requirements: ProjectRequirementsSchema,
  criteria: AnalysisCriteriaSchema.optional(),
});

const frameworkAdvisorRoutes: FastifyPluginAsync = async (fastify) => {
  
  /**
   * GET /api/framework-advisor/frameworks
   * Get all available frameworks
   */
  fastify.get('/frameworks', async (request, reply) => {
    try {
      const { FRAMEWORKS } = await import('@ui-grid-ai/framework-advisor');
      
      return {
        success: true,
        frameworks: FRAMEWORKS.map(f => ({
          id: f.id,
          name: f.name,
          category: f.category,
          type: f.type,
          language: f.language,
          learningCurve: f.learningCurve,
          description: f.strengths.slice(0, 2).join(', ')
        }))
      };
    } catch (error) {
      fastify.log.error('Error fetching frameworks:', error);
      return reply.status(500).send({
        success: false,
        error: 'Failed to fetch frameworks'
      });
    }
  });

  /**
   * POST /api/framework-advisor/recommend-from-prompt
   * Recommend framework based on natural language prompt
   */
  fastify.post<{
    Body: z.infer<typeof RecommendFromPromptSchema>
  }>('/recommend-from-prompt', {
    schema: {
      body: RecommendFromPromptSchema
    }
  }, async (request, reply) => {
    try {
      const { prompt, criteria, maxAlternatives } = request.body;
      
      const advisor = new FrameworkAdvisor({
        defaultCriteria: criteria,
        maxAlternatives,
        enableAiReasoning: true
      });
      
      const recommendation = await advisor.recommendFromPrompt(prompt);
      
      return {
        success: true,
        recommendation
      };
      
    } catch (error) {
      fastify.log.error('Error in recommend-from-prompt:', error);
      return reply.status(500).send({
        success: false,
        error: 'Failed to generate framework recommendation'
      });
    }
  });

  /**
   * POST /api/framework-advisor/recommend
   * Recommend framework based on structured requirements
   */
  fastify.post<{
    Body: z.infer<typeof RecommendFromRequirementsSchema>
  }>('/recommend', {
    schema: {
      body: RecommendFromRequirementsSchema
    }
  }, async (request, reply) => {
    try {
      const { requirements, criteria, maxAlternatives } = request.body;
      
      const advisor = new FrameworkAdvisor({
        defaultCriteria: criteria,
        maxAlternatives,
        enableAiReasoning: true
      });
      
      const recommendation = await advisor.recommend(requirements);
      
      return {
        success: true,
        recommendation
      };
      
    } catch (error) {
      fastify.log.error('Error in recommend:', error);
      return reply.status(500).send({
        success: false,
        error: 'Failed to generate framework recommendation'
      });
    }
  });

  /**
   * POST /api/framework-advisor/compare
   * Compare specific frameworks for given requirements
   */
  fastify.post<{
    Body: z.infer<typeof CompareFrameworksSchema>
  }>('/compare', {
    schema: {
      body: CompareFrameworksSchema
    }
  }, async (request, reply) => {
    try {
      const { frameworkIds, requirements, criteria } = request.body;
      
      const advisor = new FrameworkAdvisor({
        defaultCriteria: criteria,
        enableAiReasoning: true
      });
      
      const comparison = await advisor.compareFrameworks(frameworkIds, requirements);
      
      return {
        success: true,
        comparison
      };
      
    } catch (error) {
      fastify.log.error('Error in compare:', error);
      return reply.status(500).send({
        success: false,
        error: 'Failed to compare frameworks'
      });
    }
  });

  /**
   * GET /api/framework-advisor/framework/:id
   * Get detailed information about a specific framework
   */
  fastify.get<{
    Params: { id: string }
  }>('/framework/:id', async (request, reply) => {
    try {
      const { getFrameworkById } = await import('@ui-grid-ai/framework-advisor');
      const framework = getFrameworkById(request.params.id);
      
      if (!framework) {
        return reply.status(404).send({
          success: false,
          error: 'Framework not found'
        });
      }
      
      return {
        success: true,
        framework
      };
      
    } catch (error) {
      fastify.log.error('Error fetching framework:', error);
      return reply.status(500).send({
        success: false,
        error: 'Failed to fetch framework details'
      });
    }
  });

  /**
   * GET /api/framework-advisor/search
   * Search frameworks by query
   */
  fastify.get<{
    Querystring: { q: string }
  }>('/search', {
    schema: {
      querystring: z.object({
        q: z.string().min(1)
      })
    }
  }, async (request, reply) => {
    try {
      const { searchFrameworks } = await import('@ui-grid-ai/framework-advisor');
      const frameworks = searchFrameworks(request.query.q);
      
      return {
        success: true,
        frameworks: frameworks.map(f => ({
          id: f.id,
          name: f.name,
          category: f.category,
          type: f.type,
          description: f.strengths.slice(0, 2).join(', ')
        }))
      };
      
    } catch (error) {
      fastify.log.error('Error searching frameworks:', error);
      return reply.status(500).send({
        success: false,
        error: 'Failed to search frameworks'
      });
    }
  });

  /**
   * POST /api/framework-advisor/analyze-prompt
   * Analyze a prompt to extract requirements (utility endpoint)
   */
  fastify.post<{
    Body: { prompt: string }
  }>('/analyze-prompt', {
    schema: {
      body: z.object({
        prompt: z.string().min(1).max(2000)
      })
    }
  }, async (request, reply) => {
    try {
      const { PromptAnalyzer } = await import('@ui-grid-ai/framework-advisor');
      const analyzer = new PromptAnalyzer();
      const analysis = analyzer.analyze(request.body.prompt);
      
      return {
        success: true,
        analysis
      };
      
    } catch (error) {
      fastify.log.error('Error analyzing prompt:', error);
      return reply.status(500).send({
        success: false,
        error: 'Failed to analyze prompt'
      });
    }
  });
  
};

export default frameworkAdvisorRoutes;