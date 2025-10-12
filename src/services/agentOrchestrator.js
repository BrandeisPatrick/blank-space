import { classifyIntent } from './agents/intentClassifier.js';
import { createPlan } from './agents/planner.js';
import { analyzeCodebaseForModification } from './agents/analyzer.js';
import { generateCode } from './agents/generator.js';
import { modifyCode } from './agents/modifier.js';
import { debugAndFix } from './agents/debugger.js';
import { validateCrossFileConsistency } from './utils/crossFileValidation.js';
import {
  reviewCode,
  generateImprovementInstructions,
  hasImproved,
  aggregateReviews
} from './agents/reviewer.js';
import {
  reviewPlan,
  generatePlanImprovementInstructions,
  hasPlanImproved
} from './agents/planReviewer.js';
import {
  createUserMessage,
  ProgressTracker,
  getUserFriendlyError
} from './userMessages.js';
import {
  determineAgentRoute,
  getEstimatedTime,
  shouldSkipAgent,
  logRoutingDecision
} from './agentRouter.js';
import { getConversationMemory } from './ConversationMemory.js';
import { getProjectContext } from './ProjectContext.js';

/**
 * Agent Orchestrator
 * Coordinates the multi-agent pipeline for code generation
 * Enhanced with AutoGen-inspired reflection and collaboration patterns
 */
export class AgentOrchestrator {
  constructor(onUpdate, options = {}) {
    this.onUpdate = onUpdate || (() => {}); // Callback for streaming updates to UI

    // Reflection loop configuration
    this.reflectionEnabled = options.reflectionEnabled !== false; // Default: enabled
    this.maxReflectionIterations = options.maxReflectionIterations || 2;
    this.qualityThreshold = options.qualityThreshold || 75;

    // Consultation configuration (NEW)
    this.consultationsEnabled = options.consultationsEnabled !== false; // Default: enabled

    // Smart routing configuration (NEW)
    this.smartRoutingEnabled = options.smartRoutingEnabled !== false; // Default: enabled

    // Progress tracking
    this.progressTracker = null;
  }

  /**
   * Main orchestration method
   * Runs the full agent pipeline
   */
  async processUserMessage(userMessage, currentFiles = {}) {
    // Track rate limit info from API responses
    let latestRateLimit = null;

    try {
      // Get memory and context systems
      const memory = getConversationMemory();
      const projectContext = getProjectContext();

      // Resolve references in user message (e.g., "make it blue" -> "make App.jsx blue")
      const resolvedMessage = memory.resolveReferences(userMessage);

      // Add user message to conversation memory
      memory.addTurn('user', resolvedMessage);

      // Log if message was modified by reference resolution
      if (resolvedMessage !== userMessage) {
        console.log('📝 Resolved references:', userMessage, '->', resolvedMessage);
      }

      // Initialize progress tracker (estimate steps)
      const estimatedSteps = 5; // Intent, Plan, Generation, Review, Complete
      this.progressTracker = new ProgressTracker(estimatedSteps);

      // Step 1: Classify Intent
      this.progressTracker.next();
      this.sendUpdate({
        type: 'thinking',
        content: 'Analyzing your request...'
      }, 'intentClassifier', 'classifyingIntent');

      const intentResult = await classifyIntent(resolvedMessage);

      // Extract rate limit if available
      if (intentResult.rateLimit) {
        latestRateLimit = intentResult.rateLimit;
      }

      this.sendUpdate({
        type: 'intent',
        content: `Intent: ${intentResult.intent} (confidence: ${(intentResult.confidence * 100).toFixed(0)}%)`,
        data: intentResult
      }, 'intentClassifier', 'intentClassified', { value: intentResult.intent });

      // SMART ROUTING: Determine which agents to use (if enabled)
      const route = this.smartRoutingEnabled
        ? determineAgentRoute(userMessage, intentResult, currentFiles)
        : { skipPlanner: false, skipAnalyzer: false, skipReviewer: false, reason: 'Full pipeline (smart routing disabled)' };

      if (this.smartRoutingEnabled) {
        logRoutingDecision(route, userMessage);
      }

      // Notify user of estimated time
      const estimatedTime = getEstimatedTime(route, 1);
      this.sendUpdate({
        type: 'info',
        content: `Estimated time: ${estimatedTime}\nRoute: ${route.reason}`
      });

      // Handle fix_bug intent separately
      if (intentResult.intent === 'fix_bug') {
        return await this.handleBugFix(userMessage, currentFiles);
      }

      // Step 2: Analyze Codebase (for modifications)
      let analysisResult = null;
      const isModificationIntent = ['modify_existing', 'style_change', 'add_feature'].includes(intentResult.intent);

      if (isModificationIntent && Object.keys(currentFiles).length > 0 && !shouldSkipAgent('analyzer', route)) {
        this.progressTracker.next();
        this.sendUpdate({
          type: 'thinking',
          content: 'Analyzing codebase to find what needs to change...'
        }, 'analyzer', 'analyzingCodebase');

        analysisResult = await analyzeCodebaseForModification(userMessage, currentFiles);

        if (analysisResult.needsAnalysis && analysisResult.reasoning) {
          this.sendUpdate({
            type: 'intent',
            content: `Analysis: ${analysisResult.reasoning}`,
            data: analysisResult
          });
        }
      } else if (shouldSkipAgent('analyzer', route)) {
        console.log('⏭️  Skipping analyzer (smart routing optimization)');
      }

      // Step 3: Create Plan (with reflection loop if enabled) - or skip if routing says so
      let plan;
      if (shouldSkipAgent('planner', route)) {
        console.log('⏭️  Skipping planner (smart routing optimization)');
        // Create a minimal plan for direct modification
        plan = {
          filesToModify: Object.keys(currentFiles),
          filesToCreate: [],
          summary: 'Direct modification without planning',
          fileDetails: {}
        };
      } else {
        // Add conversation context to planning
        const contextSummary = memory.getContextSummary();
        const projectContextStr = projectContext.getContextString();

        const enhancedMessage = resolvedMessage + contextSummary + projectContextStr;

        plan = await this.createPlanWithReflection(intentResult.intent, enhancedMessage, currentFiles, analysisResult);

        // Update project context from plan
        projectContext.updateFromPlan(plan);
      }

      // Step 4: Execute Plan
      const fileOperations = [];

      // Handle file creation (with reflection loop) - IN PARALLEL
      if (plan.filesToCreate && plan.filesToCreate.length > 0) {
        const reviews = [];
        this.progressTracker.next();

        // Update progress tracker with file count
        const fileCount = plan.filesToCreate.length;
        if (fileCount > 1) {
          this.sendUpdate({
            type: 'thinking',
            content: `Generating ${fileCount} files in parallel...`
          }, 'generator', 'generatingMultipleFiles', { count: fileCount });
        }

        // PARALLEL GENERATION: Generate all files concurrently
        const generationPromises = plan.filesToCreate.map(async (filename) => {
          // Notify start of this file's generation
          this.sendUpdate({
            type: 'thinking',
            content: `Starting ${filename}...`
          }, 'generator', 'generatingFile', { filename });

          // Use reflection loop for code generation
          const result = await this.generateCodeWithReflection(plan, userMessage, filename);

          // Notify completion
          this.sendUpdate({
            type: 'file_operation',
            content: `Created ${filename}${result.finalScore ? ` (quality: ${result.finalScore}/100)` : ''}`,
            data: {
              filename,
              operation: 'create',
              qualityScore: result.finalScore,
              reflectionHistory: result.reflectionHistory
            }
          }, 'generator', 'codeApproved', { filename, value: result.finalScore });

          return {
            filename,
            result,
            review: result.reflectionHistory.length > 0 ? {
              filename,
              qualityScore: result.finalScore,
              iterations: result.reflectionHistory.length
            } : null
          };
        });

        // Wait for all files to complete
        const generatedFiles = await Promise.all(generationPromises);

        // Add to file operations and collect reviews
        generatedFiles.forEach(({ filename, result, review }) => {
          fileOperations.push({
            type: 'create',
            filename,
            content: result.code,
            reflectionHistory: result.reflectionHistory,
            qualityScore: result.finalScore
          });

          if (review) {
            reviews.push(review);
          }
        });

        // Report overall quality metrics
        if (reviews.length > 0) {
          const avgScore = Math.round(reviews.reduce((sum, r) => sum + r.qualityScore, 0) / reviews.length);
          this.sendUpdate({
            type: 'quality_report',
            content: `📊 Average code quality: ${avgScore}/100`,
            data: { reviews, averageScore: avgScore }
          });
        }
      }

      // Handle file modification
      if (plan.filesToModify && plan.filesToModify.length > 0) {
        this.progressTracker.next();

        for (const filename of plan.filesToModify) {
          if (!currentFiles[filename]) {
            console.warn(`File ${filename} not found for modification`);
            continue;
          }

          this.sendUpdate({
            type: 'thinking',
            content: `Modifying ${filename}...`
          }, 'modifier', 'modifyingFile', { filename });

          // Get analysis targets for this specific file
          const analysisTargets = analysisResult?.changeTargets?.[filename] || null;

          const updatedCode = await modifyCode(
            currentFiles[filename],
            userMessage,
            filename,
            analysisTargets
          );

          fileOperations.push({
            type: 'modify',
            filename,
            content: updatedCode
          });

          this.sendUpdate({
            type: 'file_operation',
            content: `Modified ${filename}`,
            data: { filename, operation: 'modify' }
          });
        }
      }

      // Step 5: Validate cross-file consistency
      if (fileOperations.length > 1) {
        const allFiles = {};
        fileOperations.forEach(op => {
          allFiles[op.filename] = op.content;
        });

        const crossFileValidation = validateCrossFileConsistency(allFiles);

        if (crossFileValidation.warnings.length > 0) {
          console.warn('⚠️  Cross-file validation warnings:');
          crossFileValidation.warnings.forEach(warn => {
            console.warn(`  ${warn.file}: ${warn.message}`);
          });
        }

        if (!crossFileValidation.valid) {
          console.error('❌ Cross-file validation errors:');
          crossFileValidation.errors.forEach(err => {
            console.error(`  ${err.file}: ${err.message}`);
          });
        }
      }

      // Step 6: Return Results
      this.progressTracker.next();

      // Update memory and context systems
      memory.recordFileOperations(fileOperations);
      memory.addTurn('assistant', this.generateSuccessMessage(plan, fileOperations), {
        intent: intentResult.intent,
        fileCount: fileOperations.length
      });
      projectContext.updateFromFileOperations(fileOperations, currentFiles);

      this.sendUpdate({
        type: 'complete',
        content: this.generateSuccessMessage(plan, fileOperations),
        data: { plan, fileOperations }
      });

      // Reset progress tracker
      this.progressTracker = null;

      return {
        success: true,
        intent: intentResult,
        plan,
        fileOperations,
        rateLimit: latestRateLimit
      };

    } catch (error) {
      console.error('Agent orchestration error:', error);

      // Get user-friendly error message
      const friendlyError = getUserFriendlyError(error, 'processing your request');

      this.sendUpdate({
        type: 'error',
        content: `${friendlyError.message}\n\n💡 ${friendlyError.suggestion}`
      });

      // Reset progress tracker
      this.progressTracker = null;

      return {
        success: false,
        error: error.message,
        friendlyError
      };
    }
  }

  /**
   * Create plan with reflection loop (AutoGen-inspired pattern)
   * Iteratively improves plan quality through Planner-Reviewer collaboration
   * @param {string} intent - Classified intent
   * @param {string} userMessage - User's original request
   * @param {Object} currentFiles - Current project files
   * @param {Object} analysisResult - Analysis result (if any)
   * @returns {Object} Final plan and review history
   */
  async createPlanWithReflection(intent, userMessage, currentFiles, analysisResult) {
    let currentPlan = null;
    let previousReview = null;
    const reflectionHistory = [];
    const maxPlanningIterations = 2; // Fewer iterations for planning

    for (let iteration = 0; iteration < maxPlanningIterations; iteration++) {
      // Generate or refine plan
      if (iteration === 0) {
        // Initial planning
        this.progressTracker.next();
        this.sendUpdate({
          type: 'thinking',
          content: 'Creating a plan...'
        }, 'planner', 'creatingPlan');

        currentPlan = await createPlan(intent, userMessage, currentFiles, analysisResult);
      } else {
        // Refinement iteration
        this.sendUpdate({
          type: 'thinking',
          content: `Refining plan (iteration ${iteration + 1}/${maxPlanningIterations})...`
        }, 'planner', 'refiningPlan', { iteration: iteration + 1 });

        const improvementInstructions = generatePlanImprovementInstructions(previousReview);

        // Create improved plan with feedback
        const refinementContext = `\n\nREFINEMENT INSTRUCTIONS FROM REVIEW:\n${improvementInstructions}\n\nPlease create an improved plan addressing the issues above.`;
        currentPlan = await createPlan(intent, userMessage + refinementContext, currentFiles, analysisResult);
      }

      // Review the generated plan
      if (!this.reflectionEnabled) {
        // Skip review if reflection is disabled
        this.sendUpdate({
          type: 'plan',
          content: currentPlan.summary,
          data: currentPlan
        });
        break;
      }

      this.sendUpdate({
        type: 'thinking',
        content: 'Reviewing plan quality...'
      }, 'planReviewer', 'reviewingPlan');

      let review;
      try {
        review = await reviewPlan(currentPlan, userMessage);
      } catch (error) {
        console.warn(`Plan review failed: ${error.message}. Skipping reflection.`);
        // If review fails, accept the plan as-is
        this.sendUpdate({
          type: 'plan',
          content: currentPlan.summary,
          data: currentPlan
        });
        break;
      }

      reflectionHistory.push({
        iteration: iteration + 1,
        qualityScore: review.qualityScore,
        colorCreativityScore: review.colorCreativityScore,
        approved: review.approved
      });

      this.sendUpdate({
        type: 'review',
        content: `Plan Review: Quality ${review.qualityScore}/100, Colors ${review.colorCreativityScore}/100 (${review.approved ? '✅ Approved' : '⚠️ Needs improvement'})`,
        data: review
      });

      // Check if plan meets quality threshold
      if (review.approved && review.qualityScore >= this.qualityThreshold && review.colorCreativityScore >= 70) {
        this.sendUpdate({
          type: 'plan',
          content: currentPlan.summary,
          data: currentPlan
        });
        this.sendUpdate({
          type: 'thinking',
          content: `✅ Plan approved (quality: ${review.qualityScore}/100, colors: ${review.colorCreativityScore}/100)`
        });
        break;
      }

      // Check if this is the last iteration
      if (iteration === maxPlanningIterations - 1) {
        this.sendUpdate({
          type: 'plan',
          content: currentPlan.summary,
          data: currentPlan
        });
        this.sendUpdate({
          type: 'thinking',
          content: `⚠️ Plan completed after ${iteration + 1} iterations (quality: ${review.qualityScore}/100, colors: ${review.colorCreativityScore}/100)`
        });
        break;
      }

      // Check if plan improved significantly
      if (previousReview && !hasPlanImproved(previousReview, review)) {
        this.sendUpdate({
          type: 'plan',
          content: currentPlan.summary,
          data: currentPlan
        });
        this.sendUpdate({
          type: 'thinking',
          content: 'No significant improvement detected, using current plan'
        });
        break;
      }

      previousReview = review;
    }

    return currentPlan;
  }

  /**
   * Generate code with reflection loop (AutoGen-inspired pattern)
   * Iteratively improves code quality through Generator-Reviewer collaboration
   * @param {Object} plan - The generation plan
   * @param {string} userMessage - User's original request
   * @param {string} filename - File to generate
   * @returns {Object} Final code and review history
   */
  async generateCodeWithReflection(plan, userMessage, filename) {
    const fileSpec = plan.fileDetails?.[filename];
    let currentCode = null;
    let previousReview = null;
    const reflectionHistory = [];

    for (let iteration = 0; iteration < this.maxReflectionIterations; iteration++) {
      // Generate or refine code
      if (iteration === 0) {
        // Initial generation
        this.sendUpdate({
          type: 'thinking',
          content: `Generating ${filename}...`
        }, 'generator', 'generatingFile', { filename });

        currentCode = await generateCode(plan, userMessage, filename);
      } else {
        // Refinement iteration
        this.sendUpdate({
          type: 'thinking',
          content: `Refining ${filename} (iteration ${iteration + 1}/${this.maxReflectionIterations})...`
        }, 'generator', 'refiningCode', { filename, iteration: iteration + 1 });

        const improvementInstructions = generateImprovementInstructions(previousReview, currentCode);

        // Generate improved version
        const improvedPlan = {
          ...plan,
          summary: `${plan.summary}\n\nIMPROVEMENTS NEEDED:\n${improvementInstructions}`
        };

        currentCode = await generateCode(improvedPlan, userMessage, filename);
      }

      // Review the generated code
      if (!this.reflectionEnabled) {
        // Skip review if reflection is disabled
        break;
      }

      this.sendUpdate({
        type: 'thinking',
        content: `Reviewing ${filename}...`
      }, 'reviewer', 'reviewingCode', { filename });

      let review;
      try {
        review = await reviewCode(currentCode, filename, userMessage, fileSpec);
      } catch (error) {
        console.warn(`Code review failed for ${filename}: ${error.message}. Skipping reflection.`);
        // If review fails, accept the code as-is
        break;
      }

      reflectionHistory.push({
        iteration: iteration + 1,
        qualityScore: review.qualityScore,
        approved: review.approved,
        issueCount: review.issues.length
      });

      this.sendUpdate({
        type: 'review',
        content: `Review: Quality score ${review.qualityScore}/100 (${review.approved ? '✅ Approved' : '⚠️ Needs improvement'})`,
        data: review
      });

      // Check if code meets quality threshold
      if (review.approved && review.qualityScore >= this.qualityThreshold) {
        this.sendUpdate({
          type: 'thinking',
          content: `✅ ${filename} approved (score: ${review.qualityScore}/100)`
        });
        break;
      }

      // Check if this is the last iteration
      if (iteration === this.maxReflectionIterations - 1) {
        this.sendUpdate({
          type: 'thinking',
          content: `⚠️ ${filename} completed after ${iteration + 1} iterations (score: ${review.qualityScore}/100)`
        });
        break;
      }

      // Check if code improved significantly
      if (previousReview && !hasImproved(previousReview, review)) {
        this.sendUpdate({
          type: 'thinking',
          content: `No significant improvement detected, stopping refinement for ${filename}`
        });
        break;
      }

      previousReview = review;
    }

    return {
      code: currentCode,
      reflectionHistory,
      finalScore: reflectionHistory[reflectionHistory.length - 1]?.qualityScore || 0
    };
  }

  /**
   * Handle bug fixing workflow
   */
  async handleBugFix(userMessage, currentFiles) {
    try {
      this.progressTracker = new ProgressTracker(3); // Debug, Fix, Complete
      this.progressTracker.next();

      this.sendUpdate({
        type: 'thinking',
        content: 'Analyzing code to identify the bug...'
      }, 'debugger', 'debuggingCode');

      const debugResult = await debugAndFix(userMessage, currentFiles);

      if (!debugResult.success) {
        this.sendUpdate({
          type: 'error',
          content: debugResult.message || 'Could not identify or fix the bug'
        });

        return {
          success: false,
          error: debugResult.message || 'Bug fix failed'
        };
      }

      this.progressTracker.next();
      this.sendUpdate({
        type: 'intent',
        content: `Bug identified: ${debugResult.diagnosis}\nType: ${debugResult.bugType}\nSeverity: ${debugResult.severity}`,
        data: debugResult
      }, 'debugger', 'bugFound', { value: debugResult.bugType });

      this.sendUpdate({
        type: 'thinking',
        content: 'Fixing the bug...'
      }, 'debugger', 'fixingBug');

      this.progressTracker.next();

      // Create file operations from fixed files
      const fileOperations = debugResult.fixedFiles.map(file => ({
        type: 'modify',
        filename: file.filename,
        content: file.fixedCode
      }));

      // Send updates for each fixed file
      fileOperations.forEach(op => {
        this.sendUpdate({
          type: 'file_operation',
          content: `Fixed ${op.filename}`,
          data: { filename: op.filename, operation: 'fix' }
        });
      });

      this.sendUpdate({
        type: 'complete',
        content: `✅ Bug fixed!\n\n🐛 Issue: ${debugResult.diagnosis}\n\n📝 Fixed ${fileOperations.length} file(s):\n${fileOperations.map(op => `   • ${op.filename}`).join('\n')}\n\nYour code is ready in the editor!`,
        data: { debugResult, fileOperations }
      });

      return {
        success: true,
        intent: { intent: 'fix_bug' },
        debugResult,
        fileOperations
      };

    } catch (error) {
      console.error('Bug fix error:', error);

      this.sendUpdate({
        type: 'error',
        content: `Error fixing bug: ${error.message || 'Something went wrong'}`
      });

      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Send update to UI with enhanced user-friendly messaging
   * @param {Object} update - Update object
   * @param {string} agent - Agent name (optional, for auto-formatting)
   * @param {string} operation - Operation key (optional, for auto-formatting)
   * @param {Object} context - Additional context (optional)
   */
  sendUpdate(update, agent = null, operation = null, context = {}) {
    // If agent and operation provided, create user-friendly message
    if (agent && operation) {
      const userMsg = createUserMessage(agent, operation, context, 'active');
      const enhancedUpdate = {
        ...update,
        agent: userMsg.agent,
        emoji: userMsg.emoji,
        friendlyMessage: userMsg.message,
        detail: userMsg.detail,
        estimatedTime: userMsg.estimatedTime,
        color: userMsg.color
      };

      // Add progress if tracker is active
      if (this.progressTracker) {
        const progress = this.progressTracker.getProgress();
        enhancedUpdate.progress = progress.text;
        enhancedUpdate.percentage = progress.percentage;
      }

      this.onUpdate(enhancedUpdate);
    } else {
      this.onUpdate(update);
    }
  }

  /**
   * Generate success message based on operations performed
   */
  generateSuccessMessage(plan, fileOperations) {
    const createdFiles = fileOperations.filter(op => op.type === 'create');
    const modifiedFiles = fileOperations.filter(op => op.type === 'modify');

    let message = '✅ ' + plan.summary + '\n\n';

    if (createdFiles.length > 0) {
      message += `📝 Created ${createdFiles.length} file(s):\n`;
      createdFiles.forEach(op => {
        message += `   • ${op.filename}\n`;
      });
    }

    if (modifiedFiles.length > 0) {
      if (createdFiles.length > 0) message += '\n';
      message += `✏️  Modified ${modifiedFiles.length} file(s):\n`;
      modifiedFiles.forEach(op => {
        message += `   • ${op.filename}\n`;
      });
    }

    message += '\nYour code is ready in the editor!';

    return message;
  }
}

/**
 * Convenience function to process a message
 */
export async function processMessage(userMessage, currentFiles, onUpdate) {
  const orchestrator = new AgentOrchestrator(onUpdate);
  return await orchestrator.processUserMessage(userMessage, currentFiles);
}
