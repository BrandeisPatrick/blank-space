import fs from 'fs';
import path from 'path';

/**
 * Conversation Replayer
 *
 * Loads and replays logged conversations for debugging
 * Allows step-through analysis of agent decision-making
 */

/**
 * Load conversation log from file
 */
export function loadConversation(filepath) {
  try {
    const data = fs.readFileSync(filepath, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    throw new Error(`Failed to load conversation: ${error.message}`);
  }
}

/**
 * Replay conversation step-by-step
 */
export function replayConversation(conversationData, options = {}) {
  const { verbose = true, maxContentLength = 500 } = options;

  console.log('\n' + '='.repeat(70));
  console.log('🔄 Conversation Replay');
  console.log('='.repeat(70));

  // Print summary
  if (conversationData.summary) {
    const s = conversationData.summary;
    console.log('\n📊 Summary:');
    console.log(`  Session:  ${s.sessionId}`);
    console.log(`  Agent:    ${s.agent}`);
    console.log(`  Calls:    ${s.totalCalls}`);
    console.log(`  Tokens:   ${s.totalTokens.toLocaleString()}`);
    console.log(`  Cost:     $${s.totalCost.toFixed(4)}`);
    console.log(`  Duration: ${(s.totalDuration / 1000).toFixed(2)}s`);
    if (s.errors > 0) {
      console.log(`  ⚠️  Errors:  ${s.errors}`);
    }
  }

  console.log('\n' + '-'.repeat(70));
  console.log('Conversation Steps:');
  console.log('-'.repeat(70));

  // Replay each step
  const conversations = conversationData.conversations || [];
  conversations.forEach((conv, index) => {
    console.log(`\n[Step ${index + 1}/${conversations.length}] ${conv.timestamp}`);
    console.log(`Model: ${conv.model}`);

    // Show request
    if (conv.request) {
      console.log('\n📤 Request:');
      if (conv.request.systemPrompt) {
        console.log(`  System Prompt: ${truncate(conv.request.systemPrompt, maxContentLength)}`);
      }
      console.log(`  User Prompt: ${truncate(conv.request.userPrompt, maxContentLength)}`);
      if (verbose) {
        console.log(`  Max Tokens: ${conv.request.maxTokens}`);
        console.log(`  Temperature: ${conv.request.temperature}`);
      }
    }

    // Show response or error
    if (conv.error) {
      console.log('\n❌ Error:');
      console.log(`  Message: ${conv.error.message}`);
      if (conv.error.status) {
        console.log(`  Status: ${conv.error.status}`);
      }
      console.log(`  Duration: ${conv.error.duration}ms`);
    } else if (conv.response) {
      console.log('\n📥 Response:');
      console.log(`  Content: ${truncate(conv.response.content, maxContentLength)}`);
      if (verbose) {
        console.log(`  Finish Reason: ${conv.response.finishReason}`);
        console.log(`  Tokens: ${conv.response.usage.totalTokens} (${conv.response.usage.promptTokens} + ${conv.response.usage.completionTokens})`);
        console.log(`  Cost: $${conv.response.cost.toFixed(4)}`);
        console.log(`  Duration: ${conv.response.duration}ms`);
      }
    }

    console.log('-'.repeat(70));
  });

  console.log('\n✅ Replay complete\n');
}

/**
 * Compare two conversations (e.g., old vs new run)
 */
export function compareConversations(conv1Data, conv2Data) {
  console.log('\n' + '='.repeat(70));
  console.log('🔍 Conversation Comparison');
  console.log('='.repeat(70));

  const s1 = conv1Data.summary;
  const s2 = conv2Data.summary;

  console.log('\n📊 Summary Comparison:');
  console.log(`\n  Metric              Old              New              Diff`);
  console.log('-'.repeat(70));
  console.log(`  Calls:              ${pad(s1.totalCalls)}  ${pad(s2.totalCalls)}  ${diff(s1.totalCalls, s2.totalCalls)}`);
  console.log(`  Tokens:             ${pad(s1.totalTokens)}  ${pad(s2.totalTokens)}  ${diff(s1.totalTokens, s2.totalTokens)}`);
  console.log(`  Cost:               ${pad('$' + s1.totalCost.toFixed(4))}  ${pad('$' + s2.totalCost.toFixed(4))}  ${diffPercent(s1.totalCost, s2.totalCost)}`);
  console.log(`  Duration:           ${pad(s1.totalDuration + 'ms')}  ${pad(s2.totalDuration + 'ms')}  ${diffPercent(s1.totalDuration, s2.totalDuration)}`);

  // Compare step-by-step
  const convs1 = conv1Data.conversations || [];
  const convs2 = conv2Data.conversations || [];

  console.log('\n' + '-'.repeat(70));
  console.log('Step-by-Step Comparison:');
  console.log('-'.repeat(70));

  const maxSteps = Math.max(convs1.length, convs2.length);
  for (let i = 0; i < maxSteps; i++) {
    const c1 = convs1[i];
    const c2 = convs2[i];

    console.log(`\n[Step ${i + 1}]`);

    if (!c1) {
      console.log('  Old: (missing)');
      console.log(`  New: ${c2.model}, ${c2.response?.usage?.totalTokens || 0} tokens`);
    } else if (!c2) {
      console.log(`  Old: ${c1.model}, ${c1.response?.usage?.totalTokens || 0} tokens`);
      console.log('  New: (missing)');
    } else {
      const t1 = c1.response?.usage?.totalTokens || 0;
      const t2 = c2.response?.usage?.totalTokens || 0;
      console.log(`  Tokens: ${t1} → ${t2} (${diff(t1, t2)})`);

      // Check if responses differ
      const content1 = c1.response?.content || '';
      const content2 = c2.response?.content || '';
      if (content1 !== content2) {
        console.log('  ⚠️  Response content differs');
      }
    }
  }

  console.log('\n' + '='.repeat(70) + '\n');
}

/**
 * Find conversations by date
 */
export function findConversationsByDate(date = null) {
  const logDir = path.join(process.cwd(), '.logs', 'conversations');

  if (!fs.existsSync(logDir)) {
    return [];
  }

  // If no date specified, use today
  const targetDate = date || new Date().toISOString().split('T')[0];
  const dateDir = path.join(logDir, targetDate);

  if (!fs.existsSync(dateDir)) {
    return [];
  }

  const files = fs.readdirSync(dateDir)
    .filter(f => f.endsWith('.json'))
    .map(f => path.join(dateDir, f));

  return files;
}

/**
 * Helper: Truncate long strings
 */
function truncate(str, maxLength) {
  if (!str) return '(empty)';
  if (str.length <= maxLength) return str;
  return str.substring(0, maxLength) + '... [truncated]';
}

/**
 * Helper: Pad strings for alignment
 */
function pad(str, length = 15) {
  const s = String(str);
  return s + ' '.repeat(Math.max(0, length - s.length));
}

/**
 * Helper: Calculate difference
 */
function diff(oldVal, newVal) {
  const d = newVal - oldVal;
  if (d === 0) return '(same)';
  if (d > 0) return `+${d}`;
  return String(d);
}

/**
 * Helper: Calculate percentage difference
 */
function diffPercent(oldVal, newVal) {
  if (oldVal === 0) return 'N/A';
  const percent = ((newVal - oldVal) / oldVal * 100).toFixed(1);
  if (percent > 0) return `+${percent}%`;
  return `${percent}%`;
}

/**
 * CLI interface for replaying conversations
 */
export async function replayFromCLI(filepath) {
  console.log(`\nLoading conversation from: ${filepath}\n`);

  try {
    const data = loadConversation(filepath);
    replayConversation(data, { verbose: true });
  } catch (error) {
    console.error(`\n❌ Error: ${error.message}\n`);
    process.exit(1);
  }
}

export default {
  loadConversation,
  replayConversation,
  compareConversations,
  findConversationsByDate,
  replayFromCLI
};
