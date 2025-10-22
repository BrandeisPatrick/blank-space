import { callLLMForJSON } from "../utils/llm/llmClient.js";
import { MODELS } from "../config/modelConfig.js";

/**
 * Reviewer Agent
 * Critiques generated code for quality, completeness, and best practices
 * Inspired by AutoGen's Reflection pattern
 */

/**
 * Review generated code and provide feedback
 * @param {string} code - The generated code to review
 * @param {string} filename - Name of the file being reviewed
 * @param {string} userRequest - Original user request
 * @param {Object} planSpec - Plan specifications for this file
 * @returns {Object} Review results with quality score and feedback
 */
export async function reviewCode(code, filename, userRequest, planSpec = {}) {
  const systemPrompt = `You are an expert code reviewer for React applications.
Your job is to critique generated code and identify areas for improvement.

Review Criteria:
1. **Completeness**: Does the code implement ALL required features?
2. **Correctness**: Are there any bugs, errors, or logical issues?
3. **Best Practices**: Does it follow React and JavaScript best practices?
4. **Code Quality**: Is it readable, maintainable, and well-structured?
5. **Modern Standards**: Does it use modern React patterns (hooks, functional components)?
6. **UI/UX Quality**: Is the UI polished, accessible, and user-friendly?
7. **Performance**: Are there any performance concerns?
8. **Security**: Are there any security vulnerabilities?

Specification Requirements:
${planSpec.purpose ? `Purpose: ${planSpec.purpose}` : ""}
${planSpec.keyFeatures ? `Required Features: ${planSpec.keyFeatures}` : ""}
${planSpec.requiredState ? `Required State: ${planSpec.requiredState}` : ""}
${planSpec.requiredFunctions ? `Required Functions: ${planSpec.requiredFunctions}` : ""}

Respond ONLY with a JSON object in this format:
{
  "qualityScore": 85,
  "approved": true,
  "issues": [
    {
      "severity": "critical|high|medium|low",
      "category": "completeness|correctness|best-practices|quality|ui-ux|performance|security",
      "description": "Clear description of the issue",
      "location": "Line numbers or component name",
      "suggestion": "Specific suggestion to fix it"
    }
  ],
  "missingFeatures": ["Feature that was specified but not implemented"],
  "strengths": ["What the code does well"],
  "overallFeedback": "Brief summary of the review",
  "needsRevision": false
}

Quality Score Guidelines:
- 90-100: Excellent, production-ready code
- 75-89: Good code with minor improvements needed
- 60-74: Acceptable but needs significant improvements
- Below 60: Major issues, requires revision

Set approved=true if qualityScore >= 75 and no critical issues.
Set needsRevision=true if qualityScore < 75 or there are critical issues.`;

  const userPrompt = `Review this code for "${filename}".

Original User Request: ${userRequest}

Code to Review:
\`\`\`
${code}
\`\`\`

Provide a thorough review based on the criteria above.`;

  try {
    const review = await callLLMForJSON({
      model: MODELS.REVIEWER,
      systemPrompt,
      userPrompt,
      maxTokens: 10000,  // Increased for GPT-5 reasoning tokens (~3000-5000) + JSON output (~2000-5000)
      temperature: 0.3
    });

    // Ensure required fields exist with safe optional chaining
    return {
      qualityScore: review?.qualityScore || 70,
      approved: review?.approved ?? (review?.qualityScore >= 75),
      needsRevision: review?.needsRevision ?? (review?.qualityScore < 75),
      issues: review?.issues || [],
      missingFeatures: review?.missingFeatures || [],
      strengths: review?.strengths || [],
      overallFeedback: review?.overallFeedback || "Review completed",
      filename
    };
  } catch (error) {
    console.error("Code review error:", error);
    // Re-throw error to allow retry logic to handle it
    // Don't default to approval - let the orchestrator decide how to handle failures
    throw new Error(`Code review failed for ${filename}: ${error.message}`);
  }
}

/**
 * Generate improvement suggestions based on review feedback
 * @param {Object} review - Review results from reviewCode
 * @param {string} code - Current code
 * @returns {string} Improvement instructions for the generator
 */
export function generateImprovementInstructions(review, code) {
  if (review.approved && !review.needsRevision) {
    return null; // No improvements needed
  }

  let instructions = `Please improve the code based on this review feedback:\n\n`;

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

  // Missing features
  if (review.missingFeatures && review.missingFeatures.length > 0) {
    instructions += `📋 Missing Features to Add:\n`;
    review.missingFeatures.forEach(feature => {
      instructions += `- ${feature}\n`;
    });
    instructions += `\n`;
  }

  // Other issues
  const otherIssues = review.issues.filter(i => i.severity !== "critical" && i.severity !== "high");
  if (otherIssues.length > 0) {
    instructions += `⚠️ Other Improvements:\n`;
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
  instructions += `Target: Achieve 75+ score with no critical issues`;

  return instructions;
}

/**
 * Compare two versions of code to see if improvements were made
 * @param {Object} previousReview - Previous review result
 * @param {Object} currentReview - Current review result
 * @returns {boolean} True if code improved significantly
 */
export function hasImproved(previousReview, currentReview) {
  // Check if quality score improved by at least 5 points
  const scoreImproved = currentReview.qualityScore >= previousReview.qualityScore + 5;

  // Check if critical issues were resolved
  const prevCritical = previousReview.issues.filter(i => i.severity === "critical").length;
  const currCritical = currentReview.issues.filter(i => i.severity === "critical").length;
  const criticalResolved = currCritical < prevCritical;

  // Check if missing features were added
  const prevMissing = previousReview.missingFeatures?.length || 0;
  const currMissing = currentReview.missingFeatures?.length || 0;
  const featuresAdded = currMissing < prevMissing;

  return scoreImproved || criticalResolved || featuresAdded;
}

/**
 * Aggregate reviews for multiple files
 * @param {Array<Object>} reviews - Array of review results
 * @returns {Object} Aggregated review summary
 */
export function aggregateReviews(reviews) {
  if (!reviews || reviews.length === 0) {
    return {
      averageScore: 0,
      allApproved: false,
      totalIssues: 0,
      criticalIssues: 0
    };
  }

  const totalScore = reviews.reduce((sum, r) => sum + r.qualityScore, 0);
  const averageScore = Math.round(totalScore / reviews.length);
  const allApproved = reviews.every(r => r.approved);
  const totalIssues = reviews.reduce((sum, r) => sum + r.issues.length, 0);
  const criticalIssues = reviews.reduce((sum, r) =>
    sum + r.issues.filter(i => i.severity === "critical").length, 0
  );

  return {
    averageScore,
    allApproved,
    totalIssues,
    criticalIssues,
    reviews
  };
}
