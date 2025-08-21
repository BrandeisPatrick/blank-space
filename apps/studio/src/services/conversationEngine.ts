export interface ConversationContext {
  hasActiveCode: boolean
  recentMessages: string[]
  currentArtifacts: number
}

export class ConversationEngine {
  generateResponse(message: string, context: ConversationContext): string {
    const lowerMessage = message.toLowerCase()
    
    // Personal/social questions
    if (this.isPersonalQuestion(lowerMessage)) {
      return this.getPersonalResponse(lowerMessage, context)
    }
    
    // Greeting responses
    if (this.isGreeting(lowerMessage)) {
      return this.getGreetingResponse(context)
    }
    
    // Capability questions
    if (this.isCapabilityQuestion(lowerMessage)) {
      return this.getCapabilityResponse()
    }
    
    // Help requests
    if (this.isHelpRequest(lowerMessage)) {
      return this.getHelpResponse(context)
    }
    
    // Identity questions
    if (this.isIdentityQuestion(lowerMessage)) {
      return this.getIdentityResponse()
    }
    
    // Gratitude
    if (this.isGratitude(lowerMessage)) {
      return this.getGratitudeResponse()
    }
    
    // Small talk
    if (this.isSmallTalk(lowerMessage)) {
      return this.getSmallTalkResponse(lowerMessage)
    }
    
    // Clarification for unclear requests
    return this.getClarificationResponse(message, context)
  }

  private isGreeting(message: string): boolean {
    const greetingPatterns = [
      /h+e+l+o+w*/i,  // hello, hellooo, helo, hellllow, etc.
      /h+i+y*/i,      // hi, hiii, hiy, etc.
      /h+e+y+/i,      // hey, heyy, heyyy, etc.
      /good\s+(morning|afternoon|evening)/i,
      /greetings?/i
    ]
    return greetingPatterns.some(pattern => pattern.test(message))
  }

  private isCapabilityQuestion(message: string): boolean {
    const patterns = ['what can you do', 'what do you do', 'capabilities', 'features']
    return patterns.some(pattern => message.includes(pattern))
  }

  private isHelpRequest(message: string): boolean {
    return message.includes('help') || message.includes('how does this work')
  }

  private isIdentityQuestion(message: string): boolean {
    const patterns = ['who are you', 'what are you', 'tell me about yourself']
    return patterns.some(pattern => message.includes(pattern))
  }

  private isGratitude(message: string): boolean {
    const patterns = ['thank', 'thanks', 'appreciate', 'awesome', 'great', 'cool', 'nice']
    return patterns.some(pattern => message.includes(pattern))
  }

  private isPersonalQuestion(message: string): boolean {
    const personalPatterns = [
      /(how\s+(is|are)\s+(you|ur|your)\s*(day|doing|things)?)/i,
      /(what\s*'?s\s*up)/i,
      /(how\s*'?s\s*it\s*going)/i,
      /(how\s*have\s*you\s*been)/i,
      /(are\s+you\s+(okay|good|alright))/i,
      /(feeling|mood)/i
    ]
    return personalPatterns.some(pattern => pattern.test(message))
  }

  private isSmallTalk(message: string): boolean {
    const patterns = [
      'nice weather', 'weather', 'tired', 'busy', 'weekend', 'monday', 'friday',
      'coffee', 'morning', 'afternoon', 'evening', 'late', 'early'
    ]
    return patterns.some(pattern => message.includes(pattern))
  }

  private getPersonalResponse(message: string, context: ConversationContext): string {
    const timeOfDay = new Date().getHours()
    const currentTime = timeOfDay < 12 ? 'morning' : timeOfDay < 17 ? 'afternoon' : 'evening'
    
    if (message.includes('how is your day') || message.includes('how are you')) {
      const dayResponses = [
        `My day's going great, thanks for asking! 😊 I've been helping people create amazing websites. It's always exciting to see creative ideas come to life in code!`,
        `I'm doing wonderful! Every conversation is a new adventure for me. I love helping people turn their ideas into beautiful websites. How's your day going?`,
        `Thanks for asking! I'm having a fantastic day helping creators build cool things. There's something really satisfying about turning a simple idea into a working website.`,
        `I'm doing great! 🌟 Just been busy helping people bring their web projects to life. Each new website is like a little digital artwork to me.`
      ]
      
      const response = dayResponses[Math.floor(Math.random() * dayResponses.length)]
      
      if (context.currentArtifacts === 0) {
        return `${response}\n\nI'd love to help you create something today! What kind of website or project do you have in mind?`
      } else {
        return `${response}\n\nI see you've got some projects going! Want to work on something new or modify what you have?`
      }
    }
    
    if (message.includes('what\'s up') || message.includes('how\'s it going')) {
      const casualResponses = [
        `Hey there! Not much, just hanging out and ready to help build some awesome websites! 🚀`,
        `Just chilling and waiting for the next cool project to work on! What's up with you?`,
        `All good here! I've been having fun helping people create websites today. What brings you here?`,
        `Just vibing and ready to turn some ideas into code! What's on your mind?`
      ]
      return casualResponses[Math.floor(Math.random() * casualResponses.length)]
    }
    
    // Fallback for other personal questions
    return `I'm doing great, thanks! 😄 As an AI, I don't have feelings in the traditional sense, but I genuinely enjoy helping people create things. There's something really fulfilling about turning ideas into working websites!\n\nWhat about you? Ready to build something cool together?`
  }

  private getSmallTalkResponse(message: string): string {
    if (message.includes('coffee')) {
      return `I don't drink coffee, but I run on electricity and enthusiasm! ⚡ Speaking of energy, want to channel some creative energy into building a website?`
    }
    
    if (message.includes('weather')) {
      return `I don't experience weather, but I imagine it's nice wherever you are! 🌤️ Perfect weather for some indoor coding perhaps? What would you like to create?`
    }
    
    if (message.includes('tired') || message.includes('busy')) {
      return `I hear you! Building websites can actually be quite relaxing - it's like digital crafting. Want to create something simple and satisfying? Maybe a clean, minimalist page?`
    }
    
    if (message.includes('weekend') || message.includes('friday')) {
      return `Ah, the weekend! Perfect time for personal projects. 🎉 Want to build that website idea you've been thinking about?`
    }
    
    if (message.includes('monday')) {
      return `Monday motivation! 💪 Nothing beats starting the week by creating something new. What would you like to build today?`
    }
    
    return `That's nice! 😊 Speaking of which, got any creative projects in mind? I'm always excited to help build something new!`
  }

  private getGreetingResponse(context: ConversationContext): string {
    const timeOfDay = new Date().getHours()
    let timeGreeting = 'Hello'
    
    if (timeOfDay < 12) {
      timeGreeting = 'Good morning'
    } else if (timeOfDay < 17) {
      timeGreeting = 'Good afternoon'  
    } else {
      timeGreeting = 'Good evening'
    }
    
    const casualGreetings = [
      `${timeGreeting}! 👋 Great to see you!`,
      `Hey there! ${timeGreeting}! 😊`,
      `${timeGreeting}! Nice to meet you!`,
      `Hi! ${timeGreeting}! Hope you're having a good day!`
    ]
    
    const greeting = casualGreetings[Math.floor(Math.random() * casualGreetings.length)]
    
    if (context.currentArtifacts > 0) {
      return `${greeting}\n\nI see you already have some projects going! I'm here to help you:\n\n• **Build** something completely new\n• **Modify** your existing code\n• **Brainstorm** ideas for your next project\n• **Answer** any questions you have\n\nWhat would you like to work on today?`
    }
    
    return `${greeting}\n\nI'm your AI website builder assistant, and I'm excited to help you create something awesome! I can build:\n\n✨ **Websites** - portfolios, blogs, business sites\n🎨 **Components** - forms, navigation, layouts  \n📱 **Apps** - dashboards, tools, interactive pages\n\nWhat's your idea? Even just saying "build me a simple website" is a great start!`
  }

  private getCapabilityResponse(): string {
    return `I'm a specialized AI assistant for web development! Here's what I can do:\n\n**🏗️ Build Websites**\n• Complete websites with HTML, CSS, and JavaScript\n• Responsive designs that work on all devices\n• Modern styling with gradients, shadows, and animations\n\n**🎨 Create Components**\n• Navigation bars, forms, buttons, cards\n• Interactive elements and user interfaces\n• Custom layouts and designs\n\n**⚡ Add Functionality**\n• Interactive features with JavaScript\n• Form validation and user interactions\n• Dynamic content and API integrations\n\n**🔧 Help You Code**\n• Explain existing code\n• Fix bugs and issues\n• Modify and improve existing projects\n\n**Just describe what you want to build, and I'll generate the code for you!**`
  }

  private getHelpResponse(context: ConversationContext): string {
    if (context.hasActiveCode) {
      return `**Working with Code:**\n\n• **Select code** and ask me to explain or modify it\n• **Ask for changes**: "Change the background to blue"\n• **Add features**: "Add a contact form to this page"\n• **Fix issues**: "This button isn't working"\n\n**Creating New Things:**\n• Describe what you want: "Create a modern portfolio"\n• Be specific: "Build a landing page with hero section"\n• Ask for components: "Make a navigation bar"\n\nWhat would you like to work on?`
    }
    
    return `**How to use me:**\n\n🗣️ **For conversation**: Say "hello", ask questions\n🏗️ **To build**: Use words like "create", "build", "make"\n🎯 **Be specific**: "Create a portfolio website with dark theme"\n📱 **Any device**: I make responsive designs automatically\n\n**Example requests:**\n• "Build a landing page for my restaurant"\n• "Create a dashboard with charts"\n• "Make a contact form with validation"\n• "Design a blog layout"\n\nWhat would you like to create?`
  }

  private getIdentityResponse(): string {
    return `I'm your **AI Website Builder Assistant**! 🤖\n\nI specialize in:\n• **Web Development**: HTML, CSS, JavaScript\n• **UI/UX Design**: Modern, responsive layouts\n• **Code Generation**: From descriptions to working websites\n• **Interactive Features**: Forms, buttons, animations\n\nI'm powered by AI and designed specifically to help you build websites quickly and easily. Whether you're a beginner or experienced developer, I can help turn your ideas into code!\n\n**Ready to build something amazing?**`
  }

  private getGratitudeResponse(): string {
    const responses = [
      "You're welcome! 😊 Ready to build something else?",
      "Happy to help! What's your next project?",
      "Glad I could assist! Want to create something new?",
      "My pleasure! Let me know what else you'd like to build.",
      "You're very welcome! I'm here whenever you need help coding."
    ]
    
    return responses[Math.floor(Math.random() * responses.length)]
  }

  private getClarificationResponse(message: string, context: ConversationContext): string {
    const suggestions = [
      "**To create something new:**\n• \"Create a portfolio website\"\n• \"Build a landing page for my business\"\n• \"Make a contact form\"",
      
      "**To get help:**\n• \"What can you do?\"\n• \"Help me build a website\"\n• \"Show me examples\"",
      
      "**To modify existing code:**\n• \"Change the background color\"\n• \"Add a navigation bar\"\n• \"Make this responsive\""
    ]
    
    if (context.hasActiveCode) {
      suggestions.unshift("**To modify your current code:**\n• Select the part you want to change\n• Tell me what you'd like to modify")
    }
    
    return `I'm not quite sure what you'd like me to do. Here are some ways you can interact with me:\n\n${suggestions.join('\n\n')}\n\n**What would you like to work on?**`
  }
}

// Export singleton instance
export const conversationEngine = new ConversationEngine()