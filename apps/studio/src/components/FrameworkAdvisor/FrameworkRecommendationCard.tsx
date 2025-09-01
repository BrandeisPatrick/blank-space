import React from 'react';

interface Framework {
  id: string;
  name: string;
  category: string;
  type: string;
  language: string;
  learningCurve: string;
  performance: {
    bundleSize: string;
    runtime: string;
    buildTime: string;
  };
  features: string[];
  strengths: string[];
  ecosystem: {
    uiLibraries: string[];
    stateManagement: string[];
  };
}

interface AnalysisResult {
  framework: Framework;
  score: number;
  reasoning: string;
  pros: string[];
  cons: string[];
  confidence: 'low' | 'medium' | 'high';
}

interface FrameworkRecommendationCardProps {
  result: AnalysisResult;
  isPrimary: boolean;
  onSelect?: () => void;
}

export const FrameworkRecommendationCard: React.FC<FrameworkRecommendationCardProps> = ({
  result,
  isPrimary,
  onSelect
}) => {
  const { framework, score, reasoning, pros, cons, confidence } = result;

  const getScoreColor = (score: number) => {
    if (score >= 80) return '#10b981'; // green
    if (score >= 60) return '#f59e0b'; // yellow
    return '#ef4444'; // red
  };

  const getConfidenceColor = (confidence: string) => {
    switch (confidence) {
      case 'high': return '#10b981';
      case 'medium': return '#f59e0b';
      case 'low': return '#ef4444';
      default: return '#6b7280';
    }
  };

  return (
    <div className={`recommendation-card ${isPrimary ? 'primary' : 'alternative'}`} onClick={onSelect}>
      <div className="card-header">
        <div className="framework-info">
          <h3 className="framework-name">{framework.name}</h3>
          <p className="framework-meta">
            {framework.type} • {framework.category} • {framework.language}
          </p>
        </div>
        <div className="score-badge" style={{ backgroundColor: getScoreColor(score) }}>
          {score}/100
        </div>
      </div>

      <div className="confidence-indicator">
        <span 
          className="confidence-dot" 
          style={{ backgroundColor: getConfidenceColor(confidence) }}
        ></span>
        <span className="confidence-text">{confidence} confidence</span>
      </div>

      <div className="framework-details">
        <div className="performance-indicators">
          <div className="indicator">
            <span className="label">Runtime</span>
            <span className={`value ${framework.performance.runtime}`}>
              {framework.performance.runtime}
            </span>
          </div>
          <div className="indicator">
            <span className="label">Bundle</span>
            <span className={`value ${framework.performance.bundleSize}`}>
              {framework.performance.bundleSize}
            </span>
          </div>
          <div className="indicator">
            <span className="label">Learning</span>
            <span className={`value ${framework.learningCurve}`}>
              {framework.learningCurve}
            </span>
          </div>
        </div>

        <div className="reasoning">
          <p>{reasoning}</p>
        </div>

        <div className="pros-cons">
          <div className="pros">
            <h4>✅ Pros</h4>
            <ul>
              {pros.slice(0, 3).map((pro, index) => (
                <li key={index}>{pro}</li>
              ))}
            </ul>
          </div>
          <div className="cons">
            <h4>❌ Considerations</h4>
            <ul>
              {cons.slice(0, 3).map((con, index) => (
                <li key={index}>{con}</li>
              ))}
            </ul>
          </div>
        </div>

        <div className="ecosystem">
          <h4>🛠️ Ecosystem</h4>
          <div className="ecosystem-items">
            {framework.ecosystem.uiLibraries.slice(0, 3).map((lib, index) => (
              <span key={index} className="ecosystem-tag">{lib}</span>
            ))}
            {framework.ecosystem.uiLibraries.length > 3 && (
              <span className="ecosystem-tag more">
                +{framework.ecosystem.uiLibraries.length - 3} more
              </span>
            )}
          </div>
        </div>

        {isPrimary && (
          <div className="getting-started">
            <h4>🚀 Quick Start</h4>
            <div className="quick-start-commands">
              <code>npx create-{framework.id}-app my-app</code>
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        .recommendation-card {
          border: 2px solid var(--color-border);
          border-radius: 16px;
          padding: 24px;
          background: white;
          transition: all 0.3s ease;
          cursor: ${onSelect ? 'pointer' : 'default'};
        }

        .recommendation-card.primary {
          border-color: #10b981;
          box-shadow: 0 8px 32px rgba(16, 185, 129, 0.15);
        }

        .recommendation-card.alternative {
          border-color: var(--color-border);
        }

        .recommendation-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 12px 40px rgba(0, 0, 0, 0.15);
        }

        .card-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 16px;
        }

        .framework-info {
          flex: 1;
        }

        .framework-name {
          margin: 0 0 4px 0;
          font-size: 24px;
          font-weight: 700;
          color: var(--color-text);
        }

        .framework-meta {
          margin: 0;
          font-size: 14px;
          color: var(--color-text-secondary);
          text-transform: capitalize;
        }

        .score-badge {
          padding: 8px 12px;
          border-radius: 20px;
          color: white;
          font-weight: 700;
          font-size: 14px;
          min-width: 60px;
          text-align: center;
        }

        .confidence-indicator {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 16px;
        }

        .confidence-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
        }

        .confidence-text {
          font-size: 12px;
          color: var(--color-text-secondary);
          text-transform: capitalize;
        }

        .framework-details {
          space-y: 16px;
        }

        .performance-indicators {
          display: flex;
          gap: 16px;
          margin-bottom: 16px;
        }

        .indicator {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
        }

        .indicator .label {
          font-size: 11px;
          color: var(--color-text-secondary);
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .indicator .value {
          font-size: 12px;
          font-weight: 600;
          padding: 4px 8px;
          border-radius: 12px;
          text-transform: capitalize;
        }

        .value.fast,
        .value.easy,
        .value.small {
          background: #dcfce7;
          color: #16a34a;
        }

        .value.moderate,
        .value.medium {
          background: #fef3c7;
          color: #d97706;
        }

        .value.slow,
        .value.steep,
        .value.large {
          background: #fee2e2;
          color: #dc2626;
        }

        .reasoning {
          margin-bottom: 16px;
          padding: 12px;
          background: var(--color-surface-secondary);
          border-radius: 8px;
        }

        .reasoning p {
          margin: 0;
          font-size: 14px;
          line-height: 1.5;
          color: var(--color-text-secondary);
        }

        .pros-cons {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
          margin-bottom: 16px;
        }

        .pros-cons h4 {
          margin: 0 0 8px 0;
          font-size: 14px;
          font-weight: 600;
        }

        .pros-cons ul {
          margin: 0;
          padding: 0;
          list-style: none;
        }

        .pros-cons li {
          font-size: 13px;
          line-height: 1.4;
          margin-bottom: 4px;
          color: var(--color-text-secondary);
        }

        .ecosystem {
          margin-bottom: 16px;
        }

        .ecosystem h4 {
          margin: 0 0 8px 0;
          font-size: 14px;
          font-weight: 600;
        }

        .ecosystem-items {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
        }

        .ecosystem-tag {
          font-size: 11px;
          padding: 4px 8px;
          background: var(--color-surface-secondary);
          border-radius: 12px;
          color: var(--color-text-secondary);
        }

        .ecosystem-tag.more {
          background: var(--color-primary);
          color: white;
        }

        .getting-started {
          padding-top: 16px;
          border-top: 1px solid var(--color-border);
        }

        .getting-started h4 {
          margin: 0 0 8px 0;
          font-size: 14px;
          font-weight: 600;
        }

        .quick-start-commands {
          background: #1f2937;
          color: #e5e7eb;
          padding: 8px 12px;
          border-radius: 6px;
          font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
        }

        .quick-start-commands code {
          font-size: 12px;
        }

        @media (max-width: 768px) {
          .performance-indicators {
            flex-wrap: wrap;
            justify-content: center;
          }

          .pros-cons {
            grid-template-columns: 1fr;
          }

          .ecosystem-items {
            justify-content: center;
          }
        }
      `}</style>
    </div>
  );
};