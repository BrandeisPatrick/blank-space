import { Framework } from '../types';

export const FRAMEWORKS: Framework[] = [
  {
    id: 'react',
    name: 'React',
    category: 'frontend',
    type: 'library',
    language: 'JavaScript/TypeScript',
    learningCurve: 'moderate',
    communitySize: 'large',
    maturity: 'mature',
    performance: {
      bundleSize: 'medium',
      runtime: 'fast',
      buildTime: 'moderate'
    },
    features: [
      'Component-based',
      'Virtual DOM',
      'Hooks',
      'JSX',
      'Unidirectional data flow',
      'Server-side rendering'
    ],
    strengths: [
      'Huge ecosystem',
      'Strong community',
      'Flexible architecture',
      'Excellent tooling',
      'Great for complex UIs',
      'Industry standard'
    ],
    weaknesses: [
      'Steep learning curve',
      'Requires additional libraries',
      'Frequent updates',
      'Complex build setup'
    ],
    bestFor: [
      'Complex web applications',
      'Single-page applications',
      'Component libraries',
      'Team projects',
      'Enterprise applications'
    ],
    notRecommendedFor: [
      'Simple static sites',
      'Quick prototypes',
      'Beginners without JS experience'
    ],
    ecosystem: {
      uiLibraries: ['Material-UI', 'Ant Design', 'Chakra UI', 'React Bootstrap'],
      stateManagement: ['Redux', 'Zustand', 'Context API', 'Recoil'],
      routing: ['React Router', 'Reach Router', 'Next.js Router'],
      testing: ['Jest', 'React Testing Library', 'Enzyme']
    },
    documentation: 'excellent',
    enterpriseSupport: true
  },
  {
    id: 'vue',
    name: 'Vue.js',
    category: 'frontend',
    type: 'framework',
    language: 'JavaScript/TypeScript',
    learningCurve: 'easy',
    communitySize: 'large',
    maturity: 'mature',
    performance: {
      bundleSize: 'small',
      runtime: 'fast',
      buildTime: 'fast'
    },
    features: [
      'Template-based',
      'Reactive data binding',
      'Component-based',
      'Progressive framework',
      'Built-in state management',
      'Single file components'
    ],
    strengths: [
      'Easy to learn',
      'Great documentation',
      'Flexible and progressive',
      'Excellent performance',
      'Built-in features',
      'Great developer experience'
    ],
    weaknesses: [
      'Smaller ecosystem than React',
      'Less job market demand',
      'Mostly maintained by one person',
      'Limited enterprise adoption'
    ],
    bestFor: [
      'Rapid prototyping',
      'Small to medium projects',
      'Beginner-friendly projects',
      'Progressive enhancement',
      'Solo developers'
    ],
    notRecommendedFor: [
      'Very large enterprise projects',
      'Projects requiring extensive third-party libraries',
      'Mobile app development'
    ],
    ecosystem: {
      uiLibraries: ['Vuetify', 'Quasar', 'Element UI', 'Buefy'],
      stateManagement: ['Vuex', 'Pinia', 'Composition API'],
      routing: ['Vue Router'],
      testing: ['Vue Test Utils', 'Jest', '@vue/test-utils']
    },
    documentation: 'excellent',
    enterpriseSupport: false
  },
  {
    id: 'svelte',
    name: 'Svelte',
    category: 'frontend',
    type: 'framework',
    language: 'JavaScript/TypeScript',
    learningCurve: 'easy',
    communitySize: 'medium',
    maturity: 'stable',
    performance: {
      bundleSize: 'small',
      runtime: 'fast',
      buildTime: 'fast'
    },
    features: [
      'Compile-time optimization',
      'No virtual DOM',
      'Built-in state management',
      'Reactive programming',
      'Small bundle size',
      'No runtime overhead'
    ],
    strengths: [
      'Excellent performance',
      'Small bundle sizes',
      'Easy to learn',
      'No runtime overhead',
      'Great developer experience',
      'Built-in animations'
    ],
    weaknesses: [
      'Smaller ecosystem',
      'Limited tooling',
      'Less mature',
      'Fewer learning resources',
      'Limited job market'
    ],
    bestFor: [
      'Performance-critical applications',
      'Small to medium projects',
      'Lightweight applications',
      'Interactive websites',
      'Embedded widgets'
    ],
    notRecommendedFor: [
      'Large enterprise projects',
      'Projects requiring extensive third-party libraries',
      'Teams new to modern frameworks'
    ],
    ecosystem: {
      uiLibraries: ['Svelte Material UI', 'Carbon Components Svelte'],
      stateManagement: ['Svelte stores', 'Context API'],
      routing: ['Svelte Router', 'Page.js', 'Navaid'],
      testing: ['Jest', '@testing-library/svelte']
    },
    documentation: 'good',
    enterpriseSupport: false
  },
  {
    id: 'angular',
    name: 'Angular',
    category: 'frontend',
    type: 'framework',
    language: 'TypeScript',
    learningCurve: 'steep',
    communitySize: 'large',
    maturity: 'mature',
    performance: {
      bundleSize: 'large',
      runtime: 'moderate',
      buildTime: 'moderate'
    },
    features: [
      'Full framework',
      'TypeScript by default',
      'Dependency injection',
      'Two-way data binding',
      'Built-in CLI',
      'Enterprise features'
    ],
    strengths: [
      'Full-featured framework',
      'Strong typing',
      'Great for large applications',
      'Excellent tooling',
      'Google backing',
      'Enterprise support'
    ],
    weaknesses: [
      'Steep learning curve',
      'Complex architecture',
      'Large bundle size',
      'Over-engineered for simple projects'
    ],
    bestFor: [
      'Large enterprise applications',
      'Complex business applications',
      'Team projects',
      'Long-term maintenance',
      'TypeScript projects'
    ],
    notRecommendedFor: [
      'Simple websites',
      'Quick prototypes',
      'Small projects',
      'Beginner developers'
    ],
    ecosystem: {
      uiLibraries: ['Angular Material', 'PrimeNG', 'Ng-Bootstrap'],
      stateManagement: ['NgRx', 'Akita', 'Services'],
      routing: ['Angular Router'],
      testing: ['Jasmine', 'Karma', 'Protractor', 'Jest']
    },
    documentation: 'excellent',
    enterpriseSupport: true
  },
  {
    id: 'nextjs',
    name: 'Next.js',
    category: 'fullstack',
    type: 'meta-framework',
    language: 'JavaScript/TypeScript',
    learningCurve: 'moderate',
    communitySize: 'large',
    maturity: 'mature',
    performance: {
      bundleSize: 'medium',
      runtime: 'fast',
      buildTime: 'moderate'
    },
    features: [
      'Server-side rendering',
      'Static site generation',
      'API routes',
      'Built-in optimization',
      'File-based routing',
      'Automatic code splitting'
    ],
    strengths: [
      'Great performance',
      'SEO friendly',
      'Full-stack capabilities',
      'Excellent developer experience',
      'Strong ecosystem',
      'Vercel integration'
    ],
    weaknesses: [
      'Opinionated structure',
      'Vendor lock-in risk',
      'Complex configuration',
      'Learning curve for SSR concepts'
    ],
    bestFor: [
      'SEO-critical applications',
      'E-commerce sites',
      'Marketing websites',
      'Full-stack applications',
      'Static sites with dynamic features'
    ],
    notRecommendedFor: [
      'Simple client-side apps',
      'Real-time applications',
      'Non-React projects'
    ],
    ecosystem: {
      uiLibraries: ['All React libraries'],
      stateManagement: ['Redux', 'Zustand', 'SWR', 'React Query'],
      routing: ['Built-in file-based routing'],
      testing: ['Jest', 'React Testing Library', 'Playwright']
    },
    documentation: 'excellent',
    enterpriseSupport: true
  },
  {
    id: 'nuxtjs',
    name: 'Nuxt.js',
    category: 'fullstack',
    type: 'meta-framework',
    language: 'JavaScript/TypeScript',
    learningCurve: 'moderate',
    communitySize: 'medium',
    maturity: 'mature',
    performance: {
      bundleSize: 'medium',
      runtime: 'fast',
      buildTime: 'moderate'
    },
    features: [
      'Server-side rendering',
      'Static site generation',
      'Auto-routing',
      'Module system',
      'Built-in optimization',
      'Vue.js based'
    ],
    strengths: [
      'Great Vue.js integration',
      'SEO friendly',
      'Excellent developer experience',
      'Strong conventions',
      'Good performance',
      'Active community'
    ],
    weaknesses: [
      'Vue.js specific',
      'Smaller ecosystem than Next.js',
      'Less job market demand',
      'Configuration complexity'
    ],
    bestFor: [
      'Vue.js projects needing SSR',
      'Static sites',
      'SEO-critical Vue applications',
      'JAMstack projects'
    ],
    notRecommendedFor: [
      'React projects',
      'Simple client-side apps',
      'Real-time applications'
    ],
    ecosystem: {
      uiLibraries: ['All Vue.js libraries'],
      stateManagement: ['Vuex', 'Pinia'],
      routing: ['Built-in file-based routing'],
      testing: ['Jest', '@vue/test-utils']
    },
    documentation: 'excellent',
    enterpriseSupport: false
  },
  {
    id: 'remix',
    name: 'Remix',
    category: 'fullstack',
    type: 'meta-framework',
    language: 'JavaScript/TypeScript',
    learningCurve: 'moderate',
    communitySize: 'medium',
    maturity: 'stable',
    performance: {
      bundleSize: 'medium',
      runtime: 'fast',
      buildTime: 'fast'
    },
    features: [
      'Nested routing',
      'Server-side rendering',
      'Progressive enhancement',
      'Built-in error handling',
      'Optimistic UI',
      'Form handling'
    ],
    strengths: [
      'Excellent user experience',
      'Progressive enhancement',
      'Great performance',
      'Modern architecture',
      'Built-in error boundaries',
      'Strong conventions'
    ],
    weaknesses: [
      'Newer framework',
      'Smaller ecosystem',
      'Learning curve',
      'Limited hosting options'
    ],
    bestFor: [
      'Form-heavy applications',
      'Progressive web apps',
      'Server-side rendered React apps',
      'Modern web standards'
    ],
    notRecommendedFor: [
      'Static sites',
      'Simple client-side apps',
      'Non-React projects'
    ],
    ecosystem: {
      uiLibraries: ['All React libraries'],
      stateManagement: ['Built-in', 'Zustand', 'Redux'],
      routing: ['Built-in nested routing'],
      testing: ['Jest', 'React Testing Library']
    },
    documentation: 'good',
    enterpriseSupport: false
  },
  {
    id: 'vanilla',
    name: 'Vanilla JavaScript',
    category: 'frontend',
    type: 'library',
    language: 'JavaScript',
    learningCurve: 'easy',
    communitySize: 'large',
    maturity: 'mature',
    performance: {
      bundleSize: 'small',
      runtime: 'fast',
      buildTime: 'fast'
    },
    features: [
      'No dependencies',
      'Direct DOM manipulation',
      'Full browser API access',
      'Lightweight',
      'Maximum flexibility'
    ],
    strengths: [
      'No build step required',
      'Maximum performance',
      'Complete control',
      'No framework lock-in',
      'Minimal bundle size',
      'Easy to debug'
    ],
    weaknesses: [
      'More boilerplate code',
      'No built-in state management',
      'Manual DOM updates',
      'Harder to maintain',
      'No component reusability'
    ],
    bestFor: [
      'Simple websites',
      'Landing pages',
      'Learning projects',
      'Performance-critical applications',
      'Small interactive features'
    ],
    notRecommendedFor: [
      'Complex applications',
      'Team projects',
      'Rapid development',
      'Component-based architecture'
    ],
    ecosystem: {
      uiLibraries: ['Custom solutions'],
      stateManagement: ['Custom implementations'],
      routing: ['History API', 'Custom routing'],
      testing: ['Jest', 'Mocha', 'Jasmine']
    },
    documentation: 'excellent',
    enterpriseSupport: false
  }
];

export const getFrameworkById = (id: string): Framework | undefined => {
  return FRAMEWORKS.find(framework => framework.id === id);
};

export const getFrameworksByCategory = (category: Framework['category']): Framework[] => {
  return FRAMEWORKS.filter(framework => framework.category === category);
};

export const searchFrameworks = (query: string): Framework[] => {
  const lowercaseQuery = query.toLowerCase();
  return FRAMEWORKS.filter(framework =>
    framework.name.toLowerCase().includes(lowercaseQuery) ||
    framework.features.some(feature => feature.toLowerCase().includes(lowercaseQuery)) ||
    framework.strengths.some(strength => strength.toLowerCase().includes(lowercaseQuery)) ||
    framework.bestFor.some(use => use.toLowerCase().includes(lowercaseQuery))
  );
};