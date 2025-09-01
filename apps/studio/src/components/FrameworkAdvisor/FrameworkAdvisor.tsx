import React, { useState, useCallback } from 'react';
import { FrameworkRecommendationCard } from './FrameworkRecommendationCard';
import { FrameworkComparisonModal } from './FrameworkComparisonModal';

interface Framework {
  id: string;
  name: string;
  category: string;
  type: string;
  language: string;
  learningCurve: string;
  description: string;
}

interface AnalysisResult {
  framework: any;
  score: number;
  reasoning: string;
  pros: string[];
  cons: string[];
  confidence: 'low' | 'medium' | 'high';
}

interface Recommendation {
  primary: AnalysisResult;
  alternatives: AnalysisResult[];
  summary: string;
  nextSteps: string[];
  considerations: string[];
  aiReasoning?: string;
}

export const FrameworkAdvisor: React.FC = () => {
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [recommendation, setRecommendation] = useState<Recommendation | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [frameworks, setFrameworks] = useState<Framework[]>([]);
  const [showComparison, setShowComparison] = useState(false);

  // Fetch available frameworks
  React.useEffect(() => {
    fetchFrameworks();
  }, []);

  const fetchFrameworks = async () => {
    try {
      const response = await fetch('/api/framework-advisor/frameworks');
      const data = await response.json();
      if (data.success) {
        setFrameworks(data.frameworks);
      }
    } catch (err) {
      console.error('Failed to fetch frameworks:', err);
    }
  };

  const handleRecommendFromPrompt = useCallback(async () => {
    if (!prompt.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/framework-advisor/recommend-from-prompt', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: prompt.trim(),
          maxAlternatives: 3
        }),
      });

      const data = await response.json();

      if (data.success) {
        setRecommendation(data.recommendation);
      } else {
        setError(data.error || 'Failed to get recommendation');
      }
    } catch (err) {
      setError('Network error occurred');
    } finally {
      setLoading(false);
    }
  }, [prompt]);

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleRecommendFromPrompt();
    }
  };

  const handleCompareFrameworks = (frameworkIds: string[]) => {
    // This would open the comparison modal with selected frameworks
    setShowComparison(true);
  };

  return (
    <div className="framework-advisor">
      <div className="framework-advisor-header">
        <h2 className="framework-advisor-title">
          🚀 Framework Advisor
        </h2>
        <p className="framework-advisor-subtitle">
          Get AI-powered framework recommendations based on your project requirements
        </p>
      </div>

      <div className="framework-advisor-input">
        <div className="input-group">
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Describe your project... (e.g., 'I need to build a fast e-commerce site with SEO support')"
            className="prompt-input"
            rows={3}
            disabled={loading}
          />
          <button
            onClick={handleRecommendFromPrompt}
            disabled={loading || !prompt.trim()}
            className="recommend-button"
          >
            {loading ? '🤔 Analyzing...' : '✨ Get Recommendation'}
          </button>
        </div>
        
        {error && (
          <div className="error-message">
            ⚠️ {error}
          </div>
        )}
      </div>

      {recommendation && (
        <div className="recommendation-results">
          <div className="recommendation-summary">
            <h3>📋 Summary</h3>
            <p>{recommendation.summary}</p>
          </div>

          <div className="primary-recommendation">
            <h3>🏆 Primary Recommendation</h3>
            <FrameworkRecommendationCard
              result={recommendation.primary}
              isPrimary={true}
            />
          </div>

          {recommendation.alternatives.length > 0 && (
            <div className="alternative-recommendations">
              <h3>🔄 Alternatives</h3>
              <div className="alternatives-grid">
                {recommendation.alternatives.map((alt, index) => (
                  <FrameworkRecommendationCard
                    key={alt.framework.id}
                    result={alt}
                    isPrimary={false}
                  />
                ))}
              </div>
            </div>
          )}

          <div className="recommendation-details">
            <div className="next-steps">
              <h4>📝 Next Steps</h4>
              <ul>
                {recommendation.nextSteps.map((step, index) => (
                  <li key={index}>{step}</li>
                ))}
              </ul>
            </div>

            <div className="considerations">
              <h4>💡 Considerations</h4>
              <ul>
                {recommendation.considerations.map((consideration, index) => (
                  <li key={index}>{consideration}</li>
                ))}
              </ul>
            </div>

            {recommendation.aiReasoning && (
              <div className="ai-reasoning">
                <h4>🤖 AI Analysis</h4>
                <p>{recommendation.aiReasoning}</p>
              </div>
            )}
          </div>

          <div className="recommendation-actions">
            <button
              onClick={() => setShowComparison(true)}
              className="compare-button"
            >
              🔍 Compare Frameworks
            </button>
            <button
              onClick={() => {
                const text = `Framework Recommendation:\n\n${recommendation.summary}\n\nPrimary: ${recommendation.primary.framework.name} (${recommendation.primary.score}/100)`;
                navigator.clipboard.writeText(text);
              }}
              className="copy-button"
            >
              📋 Copy Results
            </button>
          </div>
        </div>
      )}

      {!recommendation && !loading && (
        <div className="framework-showcase">
          <h3>🛠️ Available Frameworks</h3>
          <div className="frameworks-grid">
            {frameworks.slice(0, 6).map((framework) => (
              <div key={framework.id} className="framework-card">
                <h4>{framework.name}</h4>
                <p className="framework-type">{framework.type} • {framework.category}</p>
                <p className="framework-description">{framework.description}</p>
                <span className={`learning-badge ${framework.learningCurve}`}>
                  {framework.learningCurve} learning curve
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {showComparison && (
        <FrameworkComparisonModal
          frameworks={frameworks}
          onClose={() => setShowComparison(false)}
          prompt={prompt}
        />
      )}

      <style jsx>{`
        .framework-advisor {
          padding: 24px;
          max-width: 1200px;
          margin: 0 auto;
          background: var(--color-surface);
          border-radius: 16px;
          box-shadow: 0 4px 24px rgba(0, 0, 0, 0.1);
        }

        .framework-advisor-header {
          text-align: center;
          margin-bottom: 32px;
        }

        .framework-advisor-title {
          font-size: 32px;
          font-weight: 700;
          margin-bottom: 8px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .framework-advisor-subtitle {
          font-size: 16px;
          color: var(--color-text-secondary);
          margin: 0;
        }

        .framework-advisor-input {
          margin-bottom: 32px;
        }

        .input-group {
          display: flex;
          gap: 12px;
          align-items: flex-end;
        }

        .prompt-input {
          flex: 1;
          padding: 16px;
          border: 2px solid var(--color-border);
          border-radius: 12px;
          font-size: 16px;
          font-family: inherit;
          resize: vertical;
          min-height: 80px;
          transition: border-color 0.2s;
        }

        .prompt-input:focus {
          outline: none;
          border-color: var(--color-primary);
        }

        .prompt-input:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .recommend-button {
          padding: 16px 24px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border: none;
          border-radius: 12px;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          transition: transform 0.2s;
          white-space: nowrap;
        }

        .recommend-button:hover:not(:disabled) {
          transform: translateY(-2px);
        }

        .recommend-button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          transform: none;
        }

        .error-message {
          margin-top: 12px;
          padding: 12px;
          background: #fee2e2;
          border: 1px solid #fecaca;
          color: #dc2626;
          border-radius: 8px;
        }

        .recommendation-results {
          space-y: 24px;
        }

        .recommendation-summary {
          padding: 20px;
          background: var(--color-surface-secondary);
          border-radius: 12px;
          margin-bottom: 24px;
        }

        .recommendation-summary h3 {
          margin: 0 0 12px 0;
          font-size: 18px;
          font-weight: 600;
        }

        .primary-recommendation {
          margin-bottom: 24px;
        }

        .primary-recommendation h3 {
          margin: 0 0 16px 0;
          font-size: 20px;
          font-weight: 600;
        }

        .alternative-recommendations {
          margin-bottom: 24px;
        }

        .alternative-recommendations h3 {
          margin: 0 0 16px 0;
          font-size: 18px;
          font-weight: 600;
        }

        .alternatives-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 16px;
        }

        .recommendation-details {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 24px;
          margin-bottom: 24px;
        }

        .recommendation-details h4 {
          margin: 0 0 12px 0;
          font-size: 16px;
          font-weight: 600;
        }

        .recommendation-details ul {
          margin: 0;
          padding-left: 20px;
        }

        .recommendation-details li {
          margin-bottom: 8px;
        }

        .ai-reasoning {
          grid-column: 1 / -1;
          padding: 16px;
          background: var(--color-surface-secondary);
          border-radius: 8px;
        }

        .recommendation-actions {
          display: flex;
          gap: 12px;
          justify-content: center;
          flex-wrap: wrap;
        }

        .compare-button,
        .copy-button {
          padding: 12px 20px;
          border: 2px solid var(--color-border);
          background: white;
          color: var(--color-text);
          border-radius: 8px;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
        }

        .compare-button:hover,
        .copy-button:hover {
          border-color: var(--color-primary);
          transform: translateY(-1px);
        }

        .framework-showcase {
          text-align: center;
        }

        .framework-showcase h3 {
          margin: 0 0 24px 0;
          font-size: 20px;
          font-weight: 600;
        }

        .frameworks-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 16px;
        }

        .framework-card {
          padding: 16px;
          border: 1px solid var(--color-border);
          border-radius: 8px;
          text-align: left;
          transition: transform 0.2s;
        }

        .framework-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }

        .framework-card h4 {
          margin: 0 0 8px 0;
          font-size: 16px;
          font-weight: 600;
        }

        .framework-type {
          font-size: 12px;
          color: var(--color-text-secondary);
          margin: 0 0 8px 0;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .framework-description {
          font-size: 14px;
          color: var(--color-text-secondary);
          margin: 0 0 12px 0;
          line-height: 1.4;
        }

        .learning-badge {
          font-size: 11px;
          padding: 4px 8px;
          border-radius: 12px;
          font-weight: 500;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .learning-badge.easy {
          background: #dcfce7;
          color: #16a34a;
        }

        .learning-badge.moderate {
          background: #fef3c7;
          color: #d97706;
        }

        .learning-badge.steep {
          background: #fee2e2;
          color: #dc2626;
        }
      `}</style>
    </div>
  );
};