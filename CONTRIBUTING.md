# Contributing to UI Grid AI

Thank you for your interest in contributing to UI Grid AI! This document provides guidelines and information for contributors.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Process](#development-process)
- [Coding Standards](#coding-standards)
- [Testing Guidelines](#testing-guidelines)
- [Commit Guidelines](#commit-guidelines)
- [Pull Request Process](#pull-request-process)
- [Project Structure](#project-structure)
- [Development Tools](#development-tools)

## Code of Conduct

By participating in this project, you agree to maintain a respectful and inclusive environment. Please:

- Be respectful of differing opinions and experiences
- Focus on what is best for the community
- Show empathy towards other community members
- Use welcoming and inclusive language

## Getting Started

### Prerequisites

- Node.js >= 18.0.0
- npm >= 9.0.0
- Git
- PostgreSQL (for server development)

### Initial Setup

1. **Fork and Clone**
   ```bash
   git clone https://github.com/your-username/ui-grid-ai.git
   cd ui-grid-ai
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Environment Configuration**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Start Development Servers**
   ```bash
   # Start development server (frontend + API routes)
   npm run dev
   ```

5. **Verify Setup**
   - Application: http://localhost:3000

## Development Process

### Workflow Overview

1. **Create Feature Branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make Changes**
   - Write code following our coding standards
   - Add tests for new functionality
   - Update documentation as needed

3. **Test Your Changes**
   ```bash
   npm run typecheck
   npm run lint
   npm run test
   npm run build
   ```

4. **Commit Changes**
   ```bash
   git add .
   git commit -m "type: description"
   ```

5. **Push and Create PR**
   ```bash
   git push origin feature/your-feature-name
   # Create PR via GitHub UI or gh CLI
   ```

### Branch Naming

Use descriptive branch names with prefixes:

- `feature/` - New features
- `fix/` - Bug fixes
- `docs/` - Documentation updates
- `refactor/` - Code refactoring
- `test/` - Test additions/updates
- `chore/` - Maintenance tasks

Examples:
- `feature/ai-provider-selection`
- `fix/grid-layout-responsive-issue`
- `docs/api-endpoint-documentation`

## Coding Standards

### TypeScript

- Use TypeScript for all new code
- Define interfaces for all data structures
- Avoid `any` type - use specific types or `unknown`
- Use strict TypeScript configuration

```typescript
// Good
interface ButtonProps {
  variant: 'primary' | 'secondary';
  onClick: () => void;
  children: React.ReactNode;
}

// Bad
interface ButtonProps {
  variant: any;
  onClick: any;
  children: any;
}
```

### React Components

- Use functional components with hooks
- Use TypeScript interfaces for props
- Follow component naming conventions
- Prefer composition over inheritance

```typescript
// Good
interface UserCardProps {
  user: User;
  onEdit: (user: User) => void;
}

export const UserCard: React.FC<UserCardProps> = ({ user, onEdit }) => {
  return (
    <div className="user-card">
      <h3>{user.name}</h3>
      <button onClick={() => onEdit(user)}>Edit</button>
    </div>
  );
};

// Export at bottom of file
export default UserCard;
```

### CSS and Styling

- Use CSS custom properties for theming
- Follow BEM naming convention for CSS classes
- Prefer CSS Grid and Flexbox for layouts
- Use responsive design principles

```css
/* Good */
.user-card {
  --card-padding: 16px;
  --card-border-radius: 8px;
  
  padding: var(--card-padding);
  border-radius: var(--card-border-radius);
  background: var(--color-surface);
}

.user-card__title {
  font-size: var(--font-size-lg);
  margin-bottom: var(--spacing-sm);
}
```

### API Development

- Use Zod for request/response validation
- Follow RESTful conventions
- Include proper error handling
- Add comprehensive JSDoc comments

```typescript
// Good
import { z } from 'zod';

const CreateUserSchema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email(),
  role: z.enum(['user', 'admin']),
});

/**
 * Creates a new user
 * @param request - Fastify request object
 * @param reply - Fastify reply object
 */
export async function createUser(
  request: FastifyRequest<{ Body: z.infer<typeof CreateUserSchema> }>,
  reply: FastifyReply
) {
  const userData = CreateUserSchema.parse(request.body);
  // Implementation...
}
```

### File Organization

```
src/
├── components/          # Reusable UI components
│   ├── Button/
│   │   ├── Button.tsx
│   │   ├── Button.test.tsx
│   │   └── index.ts
├── pages/              # Page components
├── hooks/              # Custom React hooks
├── utils/              # Utility functions
├── types/              # TypeScript type definitions
├── constants/          # App constants
└── styles/            # Global styles and themes
```

## Testing Guidelines

### Test Types

1. **Unit Tests** - Test individual functions/components
2. **Integration Tests** - Test component interactions
3. **E2E Tests** - Test complete user flows

### Testing Best Practices

- Write tests for all new functionality
- Test error conditions and edge cases
- Use descriptive test names
- Keep tests focused and isolated

```typescript
// Good test structure
describe('Button Component', () => {
  it('should render with correct text', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });

  it('should call onClick handler when clicked', () => {
    const handleClick = jest.fn();
    render(<Button onClick={handleClick}>Click me</Button>);
    
    fireEvent.click(screen.getByText('Click me'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('should apply correct variant styling', () => {
    render(<Button variant="primary">Click me</Button>);
    expect(screen.getByText('Click me')).toHaveClass('btn-primary');
  });
});
```

### Running Tests

```bash
# Run all tests
npm run test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run specific test file
npm run test Button.test.tsx
```

## Commit Guidelines

### Commit Message Format

Follow conventional commit format:

```
type(scope): description

[optional body]

[optional footer]
```

### Commit Types

- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation changes
- `style:` - Code style changes (formatting, etc.)
- `refactor:` - Code refactoring
- `test:` - Test additions/updates
- `chore:` - Maintenance tasks
- `ci:` - CI/CD changes

### Examples

```bash
# Good commit messages
feat(grid-engine): add drag and drop functionality
fix(server): resolve AI provider timeout issue
docs(api): update endpoint documentation
refactor(components): simplify button component logic
test(utils): add unit tests for validation helpers

# Bad commit messages
fix bug
update code
changes
```

### Commit Best Practices

- Keep commits focused and atomic
- Write clear, descriptive commit messages
- Include context in commit body if needed
- Reference issues when applicable

## Pull Request Process

### Before Submitting

1. **Ensure Code Quality**
   ```bash
   npm run typecheck
   npm run lint
   npm run test
   npm run build
   ```

2. **Update Documentation**
   - Update README files if needed
   - Add JSDoc comments for new functions
   - Update API documentation

3. **Test Thoroughly**
   - Test on different screen sizes
   - Test with different AI providers
   - Test error scenarios

### PR Template

When creating a PR, include:

1. **Description** - What does this PR do?
2. **Changes** - List of key changes made
3. **Testing** - How was this tested?
4. **Screenshots** - For UI changes
5. **Breaking Changes** - Any breaking changes?

### Review Process

1. **Automated Checks** - CI/CD pipeline runs
2. **Code Review** - Team member reviews
3. **Testing** - Manual testing if needed
4. **Approval** - Required before merge

### Merge Strategy

- Use "Squash and Merge" for feature branches
- Keep commit history clean
- Delete branch after merge

## Project Structure

### Monorepo Layout

```
ui-grid-ai/
├── apps/
│   ├── studio/         # Frontend React app
│   └── server/         # Backend Fastify API
├── packages/
│   ├── grid-engine/    # Grid system
│   ├── compiler/       # Code generation
│   ├── codegen-prompts/# AI prompt management
│   └── preview-sandbox/# Component preview
├── config/             # Shared configuration
└── docs/              # Documentation
```

### Adding New Packages

1. Create package directory in `packages/`
2. Initialize with `npm init`
3. Add to workspace in root `package.json`
4. Follow package naming convention: `@ui-grid-ai/package-name`

## Development Tools

### Required VS Code Extensions

- TypeScript and JavaScript Language Features
- ESLint
- Prettier
- Auto Rename Tag
- Bracket Pair Colorizer

### Recommended Settings

```json
{
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "typescript.preferences.importModuleSpecifier": "relative"
}
```

### Debugging

- Use VS Code debugger for Node.js backend
- Use React Developer Tools for frontend
- Use browser developer tools for network debugging

## Performance Guidelines

### Frontend Performance

- Lazy load components where possible
- Use React.memo for expensive components
- Optimize bundle size with code splitting
- Use proper loading states

### Backend Performance

- Use database connection pooling
- Implement proper caching strategies
- Monitor AI provider response times
- Use compression middleware

## Security Considerations

### Frontend Security

- Sanitize user inputs
- Use CSP headers
- Avoid storing sensitive data in localStorage
- Validate all user inputs

### Backend Security

- Validate all API inputs with Zod
- Use CORS properly
- Never log sensitive information
- Implement rate limiting

## Documentation

### Code Documentation

- Add JSDoc comments for all public functions
- Include examples in documentation
- Document complex algorithms
- Keep documentation up to date

### API Documentation

- Document all endpoints
- Include request/response examples
- Document error codes
- Provide usage examples

## Getting Help

### Resources

- Project README files
- API documentation
- CLAUDE.md for Claude CLI context
- Individual package documentation

### Communication

- Create GitHub issues for bugs
- Use discussions for questions
- Tag maintainers for urgent issues
- Follow up on your contributions

## Release Process

### Version Management

- Follow semantic versioning (semver)
- Update CHANGELOG.md for releases
- Tag releases appropriately
- Document breaking changes

Thank you for contributing to UI Grid AI! Your contributions help make this project better for everyone.