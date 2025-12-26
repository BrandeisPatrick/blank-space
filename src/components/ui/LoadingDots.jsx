/**
 * Animated loading dots component
 * Used for loading states in chat panels
 */
export const LoadingDots = () => {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'baseline', gap: '4px' }}>
      <span style={{ opacity: 0.7 }}>Thinking</span>
      <span style={{ display: 'inline-flex', gap: '3px', alignItems: 'baseline' }}>
        <span className="loading-dot" style={{ animationDelay: '0ms' }}>•</span>
        <span className="loading-dot" style={{ animationDelay: '200ms' }}>•</span>
        <span className="loading-dot" style={{ animationDelay: '400ms' }}>•</span>
      </span>
      <style>{`
        @keyframes loadingDot {
          0%, 20% { opacity: 0.3; }
          50% { opacity: 1; }
          80%, 100% { opacity: 0.3; }
        }
        .loading-dot {
          animation: loadingDot 1.4s ease-in-out infinite;
          font-size: 2.5em;
        }
      `}</style>
    </span>
  )
}
