import { callLLMForJSON } from "../utils/llm/llmClient.js";
import { MODELS } from "../config/modelConfig.js";

/**
 * Plan Reviewer Agent
 * Critiques planning decisions for color creativity, UX completeness, and quality
 * Inspired by AutoGen's Reflection pattern
 */

/**
 * Review a generated plan and provide feedback
 * @param {Object} plan - The plan object to review
 * @param {string} userRequest - Original user request
 * @returns {Object} Review results with quality score and feedback
 */
export async function reviewPlan(plan, userRequest) {
  const systemPrompt = `You are an expert UX/UI design reviewer for app planning.
Your job is to critique planning decisions and identify areas for improvement.

Review Criteria:
1. **Color Creativity**: Are colors bold, varied, and interesting? Or boring/monochrome?
2. **UX Completeness**: Does the plan include user feedback, sections, empty states, micro-interactions?
3. **Branding Quality**: Is the app name unique and memorable? Is placement clear?
4. **Content Strategy**: Are placeholders, button labels, and copy engaging?
5. **Design Cohesion**: Do colors, style, and tone work together?
6. **Uniqueness**: Is this visually distinct or generic?

🚨 BORING COLOR PATTERNS TO REJECT:
- Monochrome (all blue, all gray, all one color)
- Generic corporate: blue-500 + white + gray
- Plain backgrounds with no gradient/interest
- No contrast or visual variety
- Single accent color only

✅ CREATIVE COLOR PATTERNS TO APPROVE:
- 3+ distinct colors (not just shades)
- Bold contrasts and unexpected combinations
- Multi-color gradients
- Vibrant and memorable palettes

Respond ONLY with a JSON object in this format:
{
  "qualityScore": 85,
  "approved": true,
  "issues": [
    {
      "severity": "critical|high|medium|low",
      "category": "colors|ux|branding|content|design",
      "description": "Clear description of the issue",
      "suggestion": "Specific suggestion to fix it"
    }
  ],
  "colorCreativityScore": 75,
  "uxCompletenessScore": 85,
  "brandingQualityScore": 90,
  "strengths": ["What the plan does well"],
  "overallFeedback": "Brief summary of the review",
  "needsRevision": false
}

Quality Score Guidelines:
- 90-100: Excellent, creative and polished plan
- 75-89: Good plan with minor improvements needed
- 60-74: Acceptable but needs significant improvements
- Below 60: Major issues, requires revision

Color Creativity Score:
- 90-100: Bold, unexpected, memorable colors
- 75-89: Good variety, some creativity
- 60-74: Somewhat generic, needs more variety
- Below 60: Boring, monochrome, or cliché

Set approved=true if qualityScore >= 75, colorCreativityScore >= 70, and no critical issues.
Set needsRevision=true if qualityScore < 75 or colorCreativityScore < 70 or there are critical issues.

🔧 JSON FORMATTING RULES (GPT-5):
1. Output valid, complete JSON only
2. Wrap your response: <<<JSON>>> ... <<</JSON>>>
3. Include ALL required fields (qualityScore, approved, issues, etc.)
4. Close all brackets/braces
5. Verify JSON is syntactically complete before responding`;

  const userPrompt = `Review this plan for: "${userRequest}"

Plan to Review:
\`\`\`json
${JSON.stringify(plan, null, 2)}
\`\`\`

Provide a thorough review based on the criteria above.
Focus especially on color creativity - reject boring/monochrome palettes.`;

  try {
    const review = await callLLMForJSON({
      model: MODELS.PLAN_REVIEWER,
      systemPrompt,
      userPrompt,
      maxTokens: 10000,  // Increased for GPT-5 reasoning tokens (~3000-5000) + JSON output (~2000-5000)
      temperature: 0.3
    });

    // Ensure required fields exist
    return {
      qualityScore: review.qualityScore || 70,
      approved: review.approved ?? (review.qualityScore >= 75 && (review.colorCreativityScore || 70) >= 70),
      needsRevision: review.needsRevision ?? (review.qualityScore < 75 || (review.colorCreativityScore || 70) < 70),
      issues: review.issues || [],
      colorCreativityScore: review.colorCreativityScore || 70,
      uxCompletenessScore: review.uxCompletenessScore || 70,
      brandingQualityScore: review.brandingQualityScore || 70,
      strengths: review.strengths || [],
      overallFeedback: review.overallFeedback || "Review completed"
    };
  } catch (error) {
    console.error("Plan review error:", error);
    // Re-throw error to allow retry logic to handle it
    // Don't default to approval - let the orchestrator decide how to handle failures
    throw new Error(`Plan review failed: ${error.message}`);
  }
}

/**
 * Generate improvement suggestions for the planner based on review feedback
 * @param {Object} review - Review results from reviewPlan
 * @returns {string} Improvement instructions for the planner
 */
export function generatePlanImprovementInstructions(review) {
  if (review.approved && !review.needsRevision) {
    return null; // No improvements needed
  }

  let instructions = `Please improve the plan based on this review feedback:\n\n`;

  // Critical and high severity issues
  const criticalIssues = review.issues.filter(i => i.severity === "critical" || i.severity === "high");
  if (criticalIssues.length > 0) {
    instructions += `🚨 Critical Issues to Fix:\n`;
    criticalIssues.forEach(issue => {
      instructions += `- ${issue.description}\n`;
      if (issue.suggestion) {
        instructions += `  Suggestion: ${issue.suggestion}\n`;
      }
    });
    instructions += `\n`;
  }

  // Color creativity issues
  if (review.colorCreativityScore < 70) {
    instructions += `🎨 Color Creativity Issues (Score: ${review.colorCreativityScore}/100):\n`;
    instructions += `- CRITICAL: The color palette is too boring/monochrome/generic\n`;
    instructions += `- REQUIRED: Choose bolder, more varied colors (3+ distinct colors)\n`;
    instructions += `- SUGGESTION: Use unexpected combinations like orange+teal, pink+green, purple+yellow\n`;
    instructions += `- AVOID: Generic blue+white+gray, monochrome palettes, no-contrast schemes\n\n`;
  }

  // UX completeness issues
  if (review.uxCompletenessScore < 75) {
    instructions += `✨ UX Completeness Issues (Score: ${review.uxCompletenessScore}/100):\n`;
    instructions += `- Add missing UX patterns (toasts, sections, empty states, micro-interactions)\n`;
    instructions += `- Ensure complete content strategy (placeholders, button labels, feedback messages)\n\n`;
  }

  // Branding issues
  if (review.brandingQualityScore < 75) {
    instructions += `🏷️ Branding Issues (Score: ${review.brandingQualityScore}/100):\n`;
    instructions += `- Make app name more unique and memorable (not generic)\n`;
    instructions += `- Clarify branding placement to avoid duplication\n`;
    instructions += `- Make tagline more engaging and specific\n\n`;
  }

  // Other issues
  const otherIssues = review.issues.filter(i => i.severity !== "critical" && i.severity !== "high");
  if (otherIssues.length > 0) {
    instructions += `⚠️  Other Improvements:\n`;
    otherIssues.forEach(issue => {
      instructions += `- ${issue.description}`;
      if (issue.suggestion) {
        instructions += ` (${issue.suggestion})`;
      }
      instructions += `\n`;
    });
    instructions += `\n`;
  }

  instructions += `Overall Feedback: ${review.overallFeedback}\n`;
  instructions += `Current Quality Score: ${review.qualityScore}/100\n`;
  instructions += `Color Creativity: ${review.colorCreativityScore}/100\n`;
  instructions += `Target: Achieve 75+ overall score and 70+ color creativity with no critical issues`;

  return instructions;
}

/**
 * Compare two plan reviews to see if improvements were made
 * @param {Object} previousReview - Previous review result
 * @param {Object} currentReview - Current review result
 * @returns {boolean} True if plan improved significantly
 */
export function hasPlanImproved(previousReview, currentReview) {
  // Check if overall quality score improved
  const scoreImproved = currentReview.qualityScore >= previousReview.qualityScore + 5;

  // Check if color creativity improved (most important)
  const colorImproved = currentReview.colorCreativityScore >= previousReview.colorCreativityScore + 10;

  // Check if critical issues were resolved
  const prevCritical = previousReview.issues.filter(i => i.severity === "critical").length;
  const currCritical = currentReview.issues.filter(i => i.severity === "critical").length;
  const criticalResolved = currCritical < prevCritical;

  return scoreImproved || colorImproved || criticalResolved;
}
