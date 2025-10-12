/**
 * Agent Consultation Protocol
 * Enables agents to consult with each other during execution
 * Inspired by AutoGen's agent-to-agent communication pattern
 */

import { analyzeCodebaseForModification } from './agents/analyzer.js';
import { reviewCode } from './agents/reviewer.js';

/**
 * Consultation message types
 */
export const ConsultationType = {
  // Analysis consultations
  ASK_DEPENDENCIES: 'ask-dependencies',
  ASK_COMPONENT_STRUCTURE: 'ask-component-structure',
  ASK_CODE_LOCATION: 'ask-code-location',

  // Review consultations
  ASK_CODE_QUALITY: 'ask-code-quality',
  ASK_BEST_PRACTICE: 'ask-best-practice',

  // Planning consultations
  ASK_SHOULD_CREATE_NEW: 'ask-should-create-new',
  ASK_FILE_STRUCTURE: 'ask-file-structure',

  // General consultations
  ASK_CLARIFICATION: 'ask-clarification',
  ASK_SUGGESTION: 'ask-suggestion'
};

/**
 * AgentConsultation Class
 * Manages consultation requests between agents
 */
export class AgentConsultation {
  constructor() {
    this.consultationHistory = [];
    this.activeConsultations = new Map(); // consultationId -> consultation object
    this.consultationTimeout = 30000; // 30 seconds
  }

  /**
   * Request consultation from another agent
   * @param {Object} request - Consultation request
   * @returns {Promise<Object>} Consultation response
   */
  async requestConsultation(request) {
    const {
      fromAgent,
      toAgent,
      consultationType,
      question,
      context = {}
    } = request;

    const consultationId = this.generateConsultationId();

    // Log consultation request
    console.log(`💬 ${fromAgent} consulting ${toAgent}:`, question);

    const consultation = {
      id: consultationId,
      fromAgent,
      toAgent,
      consultationType,
      question,
      context,
      startTime: Date.now(),
      status: 'pending'
    };

    this.activeConsultations.set(consultationId, consultation);

    try {
      // Route to appropriate handler
      const response = await this.handleConsultation(consultation);

      consultation.status = 'completed';
      consultation.response = response;
      consultation.endTime = Date.now();
      consultation.duration = consultation.endTime - consultation.startTime;

      this.consultationHistory.push(consultation);
      this.activeConsultations.delete(consultationId);

      console.log(`✅ ${toAgent} responded in ${consultation.duration}ms`);

      return response;
    } catch (error) {
      consultation.status = 'failed';
      consultation.error = error.message;
      consultation.endTime = Date.now();

      this.consultationHistory.push(consultation);
      this.activeConsultations.delete(consultationId);

      console.error(`❌ Consultation failed:`, error);

      return {
        success: false,
        error: error.message,
        fallbackAnswer: this.getFallbackAnswer(consultationType)
      };
    }
  }

  /**
   * Handle consultation based on type and target agent
   * @param {Object} consultation - Consultation object
   * @returns {Promise<Object>} Consultation response
   */
  async handleConsultation(consultation) {
    const { toAgent, consultationType, question, context } = consultation;

    // Route to specific agent handlers
    switch (toAgent) {
      case 'analyzer':
        return await this.consultAnalyzer(consultationType, question, context);

      case 'reviewer':
        return await this.consultReviewer(consultationType, question, context);

      case 'planner':
        return await this.consultPlanner(consultationType, question, context);

      default:
        return {
          success: false,
          error: `Unknown agent: ${toAgent}`
        };
    }
  }

  /**
   * Consult the Analyzer agent
   * @param {string} consultationType - Type of consultation
   * @param {string} question - Question to ask
   * @param {Object} context - Context information
   * @returns {Promise<Object>} Response from analyzer
   */
  async consultAnalyzer(consultationType, question, context) {
    const { userMessage, currentFiles } = context;

    switch (consultationType) {
      case ConsultationType.ASK_DEPENDENCIES: {
        // Analyze what dependencies are needed
        if (!currentFiles || Object.keys(currentFiles).length === 0) {
          return {
            success: true,
            answer: 'No existing code to analyze. Use standard React dependencies.',
            dependencies: ['react', 'react-dom']
          };
        }

        const analysis = await analyzeCodebaseForModification(
          question || 'What dependencies does this code need?',
          currentFiles
        );

        return {
          success: true,
          answer: analysis.reasoning || 'Analysis complete',
          dependencies: this.extractDependencies(currentFiles),
          analysis
        };
      }

      case ConsultationType.ASK_COMPONENT_STRUCTURE: {
        // Analyze component structure
        const components = this.analyzeComponentStructure(currentFiles);
        return {
          success: true,
          answer: `Found ${components.length} components`,
          components,
          suggestion: components.length > 5
            ? 'Consider organizing components into folders'
            : 'Component structure looks good'
        };
      }

      case ConsultationType.ASK_CODE_LOCATION: {
        // Find where code is located
        const locations = this.findCodeLocations(question, currentFiles);
        return {
          success: true,
          answer: locations.length > 0
            ? `Found in ${locations.length} file(s)`
            : 'Not found in existing code',
          locations
        };
      }

      default:
        return {
          success: false,
          error: 'Unknown consultation type for analyzer'
        };
    }
  }

  /**
   * Consult the Reviewer agent
   * @param {string} consultationType - Type of consultation
   * @param {string} question - Question to ask
   * @param {Object} context - Context information
   * @returns {Promise<Object>} Response from reviewer
   */
  async consultReviewer(consultationType, question, context) {
    const { code, filename, userMessage } = context;

    switch (consultationType) {
      case ConsultationType.ASK_CODE_QUALITY: {
        // Quick quality check
        if (!code) {
          return {
            success: false,
            error: 'No code provided for review'
          };
        }

        const review = await reviewCode(code, filename || 'temp.jsx', userMessage || question);

        return {
          success: true,
          answer: review.overallFeedback,
          qualityScore: review.qualityScore,
          approved: review.approved,
          issues: review.issues.slice(0, 3), // Top 3 issues
          suggestions: review.issues
            .filter(i => i.severity === 'critical' || i.severity === 'high')
            .map(i => i.suggestion)
        };
      }

      case ConsultationType.ASK_BEST_PRACTICE: {
        // Ask about best practices
        return {
          success: true,
          answer: this.getBestPracticeAdvice(question, context),
          references: [
            'Use functional components with hooks',
            'Keep components under 100 lines',
            'Use meaningful variable names',
            'Add error boundaries for reliability'
          ]
        };
      }

      default:
        return {
          success: false,
          error: 'Unknown consultation type for reviewer'
        };
    }
  }

  /**
   * Consult the Planner agent
   * @param {string} consultationType - Type of consultation
   * @param {string} question - Question to ask
   * @param {Object} context - Context information
   * @returns {Promise<Object>} Response from planner
   */
  async consultPlanner(consultationType, question, context) {
    const { currentFiles, userMessage } = context;

    switch (consultationType) {
      case ConsultationType.ASK_SHOULD_CREATE_NEW: {
        // Decide if should create new file or modify existing
        const fileCount = currentFiles ? Object.keys(currentFiles).length : 0;

        return {
          success: true,
          answer: fileCount === 0
            ? 'Create new files - no existing code'
            : 'Modify existing files when possible',
          recommendation: fileCount === 0 ? 'create-new' : 'modify-existing',
          reasoning: fileCount === 0
            ? 'Starting from scratch'
            : 'Build on existing codebase'
        };
      }

      case ConsultationType.ASK_FILE_STRUCTURE: {
        // Suggest file structure
        const structure = this.suggestFileStructure(context);
        return {
          success: true,
          answer: 'Recommended file structure',
          structure,
          reasoning: 'Based on project size and complexity'
        };
      }

      default:
        return {
          success: false,
          error: 'Unknown consultation type for planner'
        };
    }
  }

  /**
   * Helper: Extract dependencies from code
   */
  extractDependencies(currentFiles) {
    const deps = new Set(['react', 'react-dom']);

    Object.values(currentFiles).forEach(content => {
      // Find import statements
      const imports = content.match(/import .* from ['"](.*)['"];?/g) || [];
      imports.forEach(imp => {
        const match = imp.match(/from ['"]([^'"]+)['"]/);
        if (match && !match[1].startsWith('.')) {
          deps.add(match[1].split('/')[0]); // Get package name
        }
      });
    });

    return Array.from(deps);
  }

  /**
   * Helper: Analyze component structure
   */
  analyzeComponentStructure(currentFiles) {
    const components = [];

    Object.entries(currentFiles || {}).forEach(([filename, content]) => {
      if (filename.endsWith('.jsx') || filename.endsWith('.tsx')) {
        // Extract component names
        const matches = content.match(/(?:function|const|class)\s+(\w+)/g) || [];
        matches.forEach(match => {
          const name = match.split(/\s+/)[1];
          if (name && name[0] === name[0].toUpperCase()) {
            components.push({
              name,
              file: filename,
              type: match.startsWith('class') ? 'class' : 'functional'
            });
          }
        });
      }
    });

    return components;
  }

  /**
   * Helper: Find code locations
   */
  findCodeLocations(query, currentFiles) {
    const locations = [];
    const searchTerm = query.toLowerCase();

    Object.entries(currentFiles || {}).forEach(([filename, content]) => {
      if (content.toLowerCase().includes(searchTerm)) {
        const lines = content.split('\n');
        const matchingLines = lines
          .map((line, i) => ({ line: i + 1, content: line }))
          .filter(({ content }) => content.toLowerCase().includes(searchTerm))
          .slice(0, 3); // Max 3 matches per file

        locations.push({
          file: filename,
          matches: matchingLines
        });
      }
    });

    return locations;
  }

  /**
   * Helper: Get best practice advice
   */
  getBestPracticeAdvice(question, context) {
    const advice = {
      'state': 'Use useState for simple state, useReducer for complex state',
      'effect': 'Use useEffect for side effects, clean up in return function',
      'props': 'Destructure props, use PropTypes or TypeScript for validation',
      'performance': 'Use React.memo, useMemo, and useCallback to optimize',
      'styling': 'Use Tailwind CSS for consistent styling',
      'error': 'Add error boundaries and proper error handling'
    };

    const questionLower = question.toLowerCase();
    for (const [key, value] of Object.entries(advice)) {
      if (questionLower.includes(key)) {
        return value;
      }
    }

    return 'Follow React best practices: functional components, hooks, and clear prop interfaces';
  }

  /**
   * Helper: Suggest file structure
   */
  suggestFileStructure(context) {
    const { currentFiles } = context;
    const fileCount = currentFiles ? Object.keys(currentFiles).length : 0;

    if (fileCount === 0) {
      return {
        recommended: 'flat',
        folders: [],
        reasoning: 'Start with flat structure, organize later as needed'
      };
    }

    if (fileCount < 5) {
      return {
        recommended: 'simple',
        folders: ['components'],
        reasoning: 'Simple structure with components folder'
      };
    }

    return {
      recommended: 'organized',
      folders: ['components', 'hooks', 'utils', 'styles'],
      reasoning: 'Organized structure for larger projects'
    };
  }

  /**
   * Helper: Get fallback answer if consultation fails
   */
  getFallbackAnswer(consultationType) {
    const fallbacks = {
      [ConsultationType.ASK_DEPENDENCIES]: 'Use standard React dependencies',
      [ConsultationType.ASK_CODE_QUALITY]: 'Code looks reasonable, proceed with caution',
      [ConsultationType.ASK_SHOULD_CREATE_NEW]: 'Create new file if in doubt',
      [ConsultationType.ASK_BEST_PRACTICE]: 'Follow React best practices'
    };

    return fallbacks[consultationType] || 'Proceed with best judgment';
  }

  /**
   * Generate unique consultation ID
   */
  generateConsultationId() {
    return `consult_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }

  /**
   * Get consultation history
   */
  getHistory(filters = {}) {
    let history = [...this.consultationHistory];

    if (filters.fromAgent) {
      history = history.filter(c => c.fromAgent === filters.fromAgent);
    }

    if (filters.toAgent) {
      history = history.filter(c => c.toAgent === filters.toAgent);
    }

    if (filters.limit) {
      history = history.slice(-filters.limit);
    }

    return history;
  }

  /**
   * Get consultation statistics
   */
  getStats() {
    const completed = this.consultationHistory.filter(c => c.status === 'completed');
    const failed = this.consultationHistory.filter(c => c.status === 'failed');

    const avgDuration = completed.length > 0
      ? Math.round(completed.reduce((sum, c) => sum + c.duration, 0) / completed.length)
      : 0;

    return {
      total: this.consultationHistory.length,
      completed: completed.length,
      failed: failed.length,
      active: this.activeConsultations.size,
      averageDuration: avgDuration,
      successRate: this.consultationHistory.length > 0
        ? Math.round((completed.length / this.consultationHistory.length) * 100)
        : 100
    };
  }

  /**
   * Clear consultation history
   */
  clear() {
    this.consultationHistory = [];
    this.activeConsultations.clear();
  }
}

/**
 * Global consultation instance (singleton)
 */
let globalConsultation = null;

/**
 * Get or create global consultation instance
 * @returns {AgentConsultation} Global consultation instance
 */
export function getConsultation() {
  if (!globalConsultation) {
    globalConsultation = new AgentConsultation();
  }
  return globalConsultation;
}

/**
 * Helper: Quick consultation function for agents
 * @param {string} fromAgent - Requesting agent
 * @param {string} toAgent - Target agent
 * @param {string} consultationType - Type of consultation
 * @param {string} question - Question to ask
 * @param {Object} context - Context information
 * @returns {Promise<Object>} Response
 */
export async function consultAgent(fromAgent, toAgent, consultationType, question, context = {}) {
  const consultation = getConsultation();
  return await consultation.requestConsultation({
    fromAgent,
    toAgent,
    consultationType,
    question,
    context
  });
}

export default {
  AgentConsultation,
  ConsultationType,
  getConsultation,
  consultAgent
};
