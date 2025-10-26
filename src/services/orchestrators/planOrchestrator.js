import { createPlan } from '../agents/planner.js';
import { analyze, AnalysisMode } from '../agents/analyzer.js';
import { designUX } from '../agents/designer.js';
import { scoreQuality } from './qualityScorer.js';

/**
 * Plan Orchestrator
 * Smart planning with auto-detection of greenfield vs contextual scenarios
 */
export class PlanOrchestrator {
  constructor(config = {}) {
    this.config = {
      maxIterations: 3,
      qualityThreshold: 0.85,
      enableRefinement: true,
      ...config
    };
  }

  /**
   * Main entry point - creates a plan with automatic scenario detection
   */
  async run(userMessage, currentFiles = {}, onUpdate = () => {}) {
    this.onUpdate = onUpdate;

    // Step 1: Detect scenario
    const scenario = this.detectScenario(userMessage, currentFiles);
    this.sendUpdate('scenario', `Planning mode: ${scenario}`);

    // Step 2: Execute appropriate planning strategy
    let planResult;

    if (scenario === 'greenfield') {
      planResult = await this.planFromScratch(userMessage);
    } else if (scenario === 'contextual') {
      planResult = await this.planWithContext(userMessage, currentFiles);
    } else {
      // Skip planning for simple changes
      return {
        skipPlanning: true,
        reason: 'Simple modification does not require planning'
      };
    }

    // Step 3: Return plan
    return {
      plan: planResult.plan,
      quality: planResult.quality,
      uxDesign: planResult.uxDesign,
      skipPlanning: false
    };
  }

  /**
   * Detect planning scenario
   */
  detectScenario(userMessage, currentFiles) {
    const hasFiles = Object.keys(currentFiles).length > 0;
    const msg = userMessage.toLowerCase();

    // No files = greenfield
    if (!hasFiles) {
      return 'greenfield';
    }

    // Simple modifications don't need planning
    const isSimpleModification = (
      (msg.includes('add') || msg.includes('change') || msg.includes('update')) &&
      !msg.includes('refactor') &&
      !msg.includes('redesign') &&
      !msg.includes('reorganize')
    );

    if (isSimpleModification) {
      return 'skip';
    }

    // Everything else is contextual
    return 'contextual';
  }

  /**
   * Plan from scratch (greenfield mode)
   * For CREATE_NEW scenarios with no existing code
   */
  async planFromScratch(userMessage) {
    this.sendUpdate('planning', 'Creating greenfield plan...');

    // Step 1: Create initial plan
    const plan = await createPlan('CREATE_NEW', userMessage, {}, null);

    // Step 2: Create UX design
    this.sendUpdate('design', 'Creating design system...');
    const uxDesign = await designUX({
      appIdentity: plan.appIdentity,
      userRequest: userMessage,
      mode: 'create_new'
    });

    // Step 3: Score quality
    const quality = scoreQuality(plan, 'plan');

    // Step 4: Refine if needed
    if (this.config.enableRefinement && quality.score < this.config.qualityThreshold) {
      this.sendUpdate('refinement', `Plan quality: ${Math.round(quality.score * 100)}% - refining...`);

      // Create improvement instructions from quality feedback
      const improvementInstructions = quality.suggestions.join('\n');
      const refinedPlan = await createPlan(
        'CREATE_NEW',
        `${userMessage}\n\nImprovement suggestions:\n${improvementInstructions}`,
        {},
        null
      );

      return {
        plan: refinedPlan,
        quality: scoreQuality(refinedPlan, 'plan'),
        uxDesign
      };
    }

    return { plan, quality, uxDesign };
  }

  /**
   * Plan with context (contextual mode)
   * For MODIFY/REFACTOR scenarios with existing code
   */
  async planWithContext(userMessage, currentFiles) {
    this.sendUpdate('planning', 'Creating contextual plan...');

    // Step 1: Analyze existing codebase
    this.sendUpdate('analysis', 'Analyzing existing code...');
    const analysisResult = await analyze({
      userMessage,
      currentFiles,
      mode: AnalysisMode.MODIFICATION
    });

    // Step 2: Create plan with analysis context
    const intent = userMessage.toLowerCase().includes('refactor') ? 'REFACTOR' : 'MODIFY';
    const plan = await createPlan(intent, userMessage, currentFiles, analysisResult);

    // Step 3: Score quality
    const quality = scoreQuality(plan, 'plan');

    // Step 4: Refine if needed
    if (this.config.enableRefinement && quality.score < this.config.qualityThreshold) {
      this.sendUpdate('refinement', `Plan quality: ${Math.round(quality.score * 100)}% - refining...`);

      const improvementInstructions = quality.suggestions.join('\n');
      const refinedPlan = await createPlan(
        intent,
        `${userMessage}\n\nImprovement suggestions:\n${improvementInstructions}`,
        currentFiles,
        analysisResult
      );

      return {
        plan: refinedPlan,
        quality: scoreQuality(refinedPlan, 'plan'),
        uxDesign: null
      };
    }

    return {
      plan,
      quality,
      uxDesign: null
    };
  }

  /**
   * Send update to UI
   */
  sendUpdate(type, message) {
    if (this.onUpdate) {
      this.onUpdate({
        orchestrator: 'PlanOrchestrator',
        type,
        message,
        timestamp: Date.now()
      });
    }
  }
}

export default PlanOrchestrator;
