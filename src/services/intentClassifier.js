/**
 * Intent Classifier
 * Determines if a user message is for creating an app or chatting
 */

// Keywords that strongly indicate app creation intent
const CREATE_KEYWORDS = [
  // Action verbs
  'create', 'build', 'make', 'generate', 'develop', 'design', 'code',
  'write', 'implement', 'add', 'setup', 'set up',
  // App types
  'app', 'application', 'website', 'webpage', 'page', 'site',
  'component', 'ui', 'interface', 'dashboard', 'form', 'widget',
  'game', 'tool', 'calculator', 'converter', 'tracker', 'timer',
  'todo', 'list', 'gallery', 'slider', 'carousel', 'menu', 'nav',
  'navbar', 'sidebar', 'header', 'footer', 'modal', 'popup',
  'chart', 'graph', 'table', 'grid', 'layout', 'landing',
  'browser', 'player', 'editor', 'viewer',
  // Features
  'with', 'that has', 'featuring', 'including', 'contains',
  'functional', 'interactive', 'responsive', 'animated',
];

// Keywords that indicate chat/question intent
const CHAT_KEYWORDS = [
  // Questions
  'what', 'how', 'why', 'when', 'where', 'who', 'which',
  'can you', 'could you', 'would you', 'will you',
  'do you', 'are you', 'is it', 'is there',
  // Information seeking
  'tell me', 'explain', 'describe', 'show me what',
  'help me understand', 'what is', 'what are',
  // About the assistant
  'your name', 'who are you', 'what can you',
  'show what you can', 'capabilities', 'features',
];

// Patterns that strongly indicate creation intent
const CREATE_PATTERNS = [
  /^(create|build|make|generate|design)\s/i,
  /\ba\s+(new\s+)?(app|website|page|component|game|tool|calculator)/i,
  /\bwith\s+(a\s+)?(functional|working|interactive)/i,
  /\bthat\s+(has|includes|shows|displays)/i,
  /(todo|timer|counter|clock|weather|news|chat|blog)\s*(app|list|tracker)?/i,
  /^[A-Z][a-z]+\s+(app|game|tool|tracker)/i, // "Snake game", "Todo app"
];

// Patterns that strongly indicate chat intent
const CHAT_PATTERNS = [
  /^(what|how|why|when|where|who|which)\s/i,
  /^(can|could|would|will|do|are|is)\s+(you|it|there)/i,
  /^(tell|explain|describe|help)\s+me/i,
  /\?$/,  // Ends with question mark
  /^(hi|hello|hey|thanks|thank you|please)/i,
  /show\s+(me\s+)?what\s+you\s+can/i,
];

/**
 * Classify user message intent
 * @param {string} message - User's message
 * @returns {{intent: 'create' | 'chat', confidence: number, reason: string}}
 */
export function classifyIntent(message) {
  const lowerMessage = message.toLowerCase().trim();

  let createScore = 0;
  let chatScore = 0;
  const reasons = [];

  // Check for chat patterns first (higher priority for questions)
  for (const pattern of CHAT_PATTERNS) {
    if (pattern.test(message)) {
      chatScore += 3;
      reasons.push('matches chat pattern');
      break;
    }
  }

  // Check for create patterns
  for (const pattern of CREATE_PATTERNS) {
    if (pattern.test(message)) {
      createScore += 3;
      reasons.push('matches create pattern');
      break;
    }
  }

  // Count keyword matches
  let createKeywordCount = 0;
  let chatKeywordCount = 0;

  for (const keyword of CREATE_KEYWORDS) {
    if (lowerMessage.includes(keyword.toLowerCase())) {
      createKeywordCount++;
      if (createKeywordCount <= 3) createScore += 1;
    }
  }

  for (const keyword of CHAT_KEYWORDS) {
    if (lowerMessage.includes(keyword.toLowerCase())) {
      chatKeywordCount++;
      if (chatKeywordCount <= 3) chatScore += 1;
    }
  }

  if (createKeywordCount > 0) reasons.push(`${createKeywordCount} create keywords`);
  if (chatKeywordCount > 0) reasons.push(`${chatKeywordCount} chat keywords`);

  // Special cases

  // Very short messages are likely chat
  if (lowerMessage.length < 15 && !CREATE_PATTERNS.some(p => p.test(message))) {
    chatScore += 2;
    reasons.push('short message');
  }

  // Messages describing something to build (adjective + noun patterns)
  if (/^[a-z]+\s+[a-z]+\s+(app|game|tool|tracker|list|website)/i.test(message)) {
    createScore += 2;
    reasons.push('app description pattern');
  }

  // "Choose your own adventure" style descriptions are create intents
  if (/adventure|quiz|story|narrative/i.test(lowerMessage) &&
      /game|interactive|choose/i.test(lowerMessage)) {
    createScore += 3;
    reasons.push('interactive content pattern');
  }

  // Calculate confidence
  const totalScore = createScore + chatScore;
  const maxScore = Math.max(createScore, chatScore);
  const confidence = totalScore > 0 ? (maxScore / totalScore) : 0.5;

  // Determine intent
  let intent;
  if (createScore > chatScore) {
    intent = 'create';
  } else if (chatScore > createScore) {
    intent = 'chat';
  } else {
    // Tie-breaker: default to create for ambiguous cases
    // (most users on this platform want to create things)
    intent = 'create';
  }

  return {
    intent,
    confidence: Math.round(confidence * 100) / 100,
    reason: reasons.join(', ') || 'default',
    scores: { create: createScore, chat: chatScore }
  };
}

/**
 * Quick check if message is likely a creation request
 * @param {string} message
 * @returns {boolean}
 */
export function isCreateIntent(message) {
  const result = classifyIntent(message);
  return result.intent === 'create';
}

/**
 * Quick check if message is likely a chat/question
 * @param {string} message
 * @returns {boolean}
 */
export function isChatIntent(message) {
  const result = classifyIntent(message);
  return result.intent === 'chat';
}

export default { classifyIntent, isCreateIntent, isChatIntent };
