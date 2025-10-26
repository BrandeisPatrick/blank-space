/**
 * Performance Tracker
 *
 * Aggregates metrics across multiple agent calls in a single operation
 * Tracks tokens, cost, timing for entire workflows (e.g., "Create Todo App")
 */

export class PerformanceTracker {
  constructor(operationName = 'Operation') {
    this.operationName = operationName;
    this.startTime = Date.now();
    this.agentMetrics = {};
    this.totalTokens = 0;
    this.totalCost = 0;
    this.totalCalls = 0;
  }

  /**
   * Record metrics from a ConversationLogger
   */
  recordLogger(logger) {
    const summary = logger.getSummary();
    const agentName = summary.agent;

    if (!this.agentMetrics[agentName]) {
      this.agentMetrics[agentName] = {
        calls: 0,
        tokens: 0,
        cost: 0,
        duration: 0,
        errors: 0
      };
    }

    this.agentMetrics[agentName].calls += summary.totalCalls;
    this.agentMetrics[agentName].tokens += summary.totalTokens;
    this.agentMetrics[agentName].cost += summary.totalCost;
    this.agentMetrics[agentName].duration += summary.totalDuration;
    this.agentMetrics[agentName].errors += summary.errors;

    this.totalTokens += summary.totalTokens;
    this.totalCost += summary.totalCost;
    this.totalCalls += summary.totalCalls;
  }

  /**
   * Record individual metrics (alternative to recordLogger)
   */
  recordMetrics({ agent, tokens, cost, duration, error = false }) {
    if (!this.agentMetrics[agent]) {
      this.agentMetrics[agent] = {
        calls: 0,
        tokens: 0,
        cost: 0,
        duration: 0,
        errors: 0
      };
    }

    this.agentMetrics[agent].calls += 1;
    this.agentMetrics[agent].tokens += tokens || 0;
    this.agentMetrics[agent].cost += cost || 0;
    this.agentMetrics[agent].duration += duration || 0;
    this.agentMetrics[agent].errors += error ? 1 : 0;

    this.totalTokens += tokens || 0;
    this.totalCost += cost || 0;
    this.totalCalls += 1;
  }

  /**
   * Get summary of all metrics
   */
  getSummary() {
    const totalDuration = Date.now() - this.startTime;

    return {
      operationName: this.operationName,
      totalDuration,
      totalCalls: this.totalCalls,
      totalTokens: this.totalTokens,
      totalCost: this.totalCost,
      agentBreakdown: this.agentMetrics,
      avgTokensPerCall: this.totalCalls > 0 ? this.totalTokens / this.totalCalls : 0,
      avgCostPerCall: this.totalCalls > 0 ? this.totalCost / this.totalCalls : 0
    };
  }

  /**
   * Print detailed performance report
   */
  printReport() {
    const summary = this.getSummary();

    console.log('\n' + '='.repeat(60));
    console.log(`📊 Performance Report: ${summary.operationName}`);
    console.log('='.repeat(60));
    console.log(`\nTotal Duration:    ${(summary.totalDuration / 1000).toFixed(2)}s`);
    console.log(`Total Calls:       ${summary.totalCalls}`);
    console.log(`Total Tokens:      ${summary.totalTokens.toLocaleString()}`);
    console.log(`Total Cost:        $${summary.totalCost.toFixed(4)}`);
    console.log(`\nAvg Tokens/Call:   ${Math.round(summary.avgTokensPerCall)}`);
    console.log(`Avg Cost/Call:     $${summary.avgCostPerCall.toFixed(4)}`);

    console.log('\n' + '-'.repeat(60));
    console.log('Agent Breakdown:');
    console.log('-'.repeat(60));

    // Sort agents by cost (descending)
    const sortedAgents = Object.entries(summary.agentBreakdown)
      .sort(([, a], [, b]) => b.cost - a.cost);

    for (const [agent, metrics] of sortedAgents) {
      console.log(`\n${agent}:`);
      console.log(`  Calls:    ${metrics.calls}`);
      console.log(`  Tokens:   ${metrics.tokens.toLocaleString()}`);
      console.log(`  Cost:     $${metrics.cost.toFixed(4)}`);
      console.log(`  Duration: ${(metrics.duration / 1000).toFixed(2)}s`);
      if (metrics.errors > 0) {
        console.log(`  ⚠️  Errors:  ${metrics.errors}`);
      }
    }

    console.log('\n' + '='.repeat(60) + '\n');
  }

  /**
   * Get compact summary for test output
   */
  getCompactSummary() {
    const summary = this.getSummary();
    return {
      duration: `${(summary.totalDuration / 1000).toFixed(1)}s`,
      tokens: summary.totalTokens,
      cost: `$${summary.totalCost.toFixed(4)}`,
      calls: summary.totalCalls
    };
  }

  /**
   * Save report to file (Node.js only)
   */
  async saveReport(filepath) {
    if (typeof window !== 'undefined') return; // Skip in browser

    try {
      const fs = await import('fs');
      const path = await import('path');

      const summary = this.getSummary();
      const reportDir = path.dirname(filepath);

      // Create directory if needed
      if (!fs.existsSync(reportDir)) {
        fs.mkdirSync(reportDir, { recursive: true });
      }

      // Save JSON report
      fs.writeFileSync(filepath, JSON.stringify(summary, null, 2));
      console.log(`\n💾 Performance report saved: ${filepath}`);
    } catch (error) {
      console.error('Failed to save performance report:', error);
    }
  }
}

/**
 * Create a performance tracker
 */
export function createTracker(operationName) {
  return new PerformanceTracker(operationName);
}

export default PerformanceTracker;
