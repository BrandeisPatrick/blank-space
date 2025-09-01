import React, { useState } from 'react';

interface Framework {
  id: string;
  name: string;
  category: string;
  type: string;
  language: string;
  learningCurve: string;
  description: string;
}

interface FrameworkComparisonModalProps {
  frameworks: Framework[];
  onClose: () => void;
  prompt: string;
}

export const FrameworkComparisonModal: React.FC<FrameworkComparisonModalProps> = ({
  frameworks,
  onClose,
  prompt
}) => {
  const [selectedFrameworks, setSelectedFrameworks] = useState<string[]>([]);
  const [comparison, setComparison] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFrameworkToggle = (frameworkId: string) => {
    setSelectedFrameworks(prev => {
      if (prev.includes(frameworkId)) {
        return prev.filter(id => id !== frameworkId);
      } else if (prev.length < 4) { // Limit to 4 frameworks
        return [...prev, frameworkId];
      }
      return prev;
    });
  };

  const handleCompare = async () => {
    if (selectedFrameworks.length < 2) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/framework-advisor/compare', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          frameworkIds: selectedFrameworks,
          requirements: {
            description: prompt,
          }
        }),
      });

      const data = await response.json();

      if (data.success) {
        setComparison(data.comparison);
      } else {
        setError(data.error || 'Failed to compare frameworks');
      }
    } catch (err) {
      setError('Network error occurred');
    } finally {
      setLoading(false);
    }
  };

  const resetComparison = () => {
    setComparison(null);
    setSelectedFrameworks([]);
    setError(null);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>🔍 Compare Frameworks</h2>
          <button onClick={onClose} className="close-button">×</button>
        </div>

        {!comparison ? (
          <div className="framework-selection">
            <p className="selection-instruction">
              Select 2-4 frameworks to compare for your project:
            </p>
            <div className="framework-grid">
              {frameworks.map((framework) => (
                <div
                  key={framework.id}
                  className={`framework-option ${
                    selectedFrameworks.includes(framework.id) ? 'selected' : ''
                  } ${
                    selectedFrameworks.length >= 4 && !selectedFrameworks.includes(framework.id)
                      ? 'disabled' 
                      : ''
                  }`}
                  onClick={() => handleFrameworkToggle(framework.id)}
                >
                  <div className="framework-name">{framework.name}</div>
                  <div className="framework-info">
                    {framework.type} • {framework.category}
                  </div>
                  <div className="framework-description">{framework.description}</div>
                </div>
              ))}
            </div>

            {error && (
              <div className="error-message">
                ⚠️ {error}
              </div>
            )}

            <div className="selection-actions">
              <div className="selection-count">
                {selectedFrameworks.length} framework{selectedFrameworks.length !== 1 ? 's' : ''} selected
              </div>
              <button
                onClick={handleCompare}
                disabled={selectedFrameworks.length < 2 || loading}
                className="compare-action-button"
              >
                {loading ? '🔄 Comparing...' : `🎯 Compare ${selectedFrameworks.length} Frameworks`}
              </button>
            </div>
          </div>
        ) : (
          <div className="comparison-results">
            <div className="comparison-summary">
              <h3>📊 Comparison Results</h3>
              <p>{comparison.summary}</p>
            </div>

            <div className="comparison-table">
              <div className="table-header">
                <div className="framework-column header">Framework</div>
                <div className="score-column header">Score</div>
                <div className="pros-column header">Key Strengths</div>
                <div className="learning-column header">Learning Curve</div>
                <div className="performance-column header">Performance</div>
              </div>

              <div className="framework-row primary">
                <div className="framework-column">
                  <div className="framework-name">
                    🏆 {comparison.primary.framework.name}
                  </div>
                  <div className="framework-type">
                    {comparison.primary.framework.type}
                  </div>
                </div>
                <div className="score-column">
                  <div className="score-badge primary">
                    {comparison.primary.score}/100
                  </div>
                </div>
                <div className="pros-column">
                  {comparison.primary.pros.slice(0, 2).map((pro, index) => (
                    <div key={index} className="pro-item">✓ {pro}</div>
                  ))}
                </div>
                <div className="learning-column">
                  <span className={`learning-badge ${comparison.primary.framework.learningCurve}`}>
                    {comparison.primary.framework.learningCurve}
                  </span>
                </div>
                <div className="performance-column">
                  <div className="performance-item">
                    Runtime: {comparison.primary.framework.performance.runtime}
                  </div>
                  <div className="performance-item">
                    Bundle: {comparison.primary.framework.performance.bundleSize}
                  </div>
                </div>
              </div>

              {comparison.alternatives.map((alt, index) => (
                <div key={alt.framework.id} className="framework-row">
                  <div className="framework-column">
                    <div className="framework-name">{alt.framework.name}</div>
                    <div className="framework-type">{alt.framework.type}</div>
                  </div>
                  <div className="score-column">
                    <div className="score-badge">
                      {alt.score}/100
                    </div>
                  </div>
                  <div className="pros-column">
                    {alt.pros.slice(0, 2).map((pro, index) => (
                      <div key={index} className="pro-item">✓ {pro}</div>
                    ))}
                  </div>
                  <div className="learning-column">
                    <span className={`learning-badge ${alt.framework.learningCurve}`}>
                      {alt.framework.learningCurve}
                    </span>
                  </div>
                  <div className="performance-column">
                    <div className="performance-item">
                      Runtime: {alt.framework.performance.runtime}
                    </div>
                    <div className="performance-item">
                      Bundle: {alt.framework.performance.bundleSize}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="comparison-actions">
              <button onClick={resetComparison} className="back-button">
                ← Select Different Frameworks
              </button>
              <button onClick={onClose} className="done-button">
                ✓ Done
              </button>
            </div>
          </div>
        )}

        <style jsx>{`
          .modal-overlay {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.5);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 1000;
            padding: 20px;
          }

          .modal-content {
            background: white;
            border-radius: 16px;
            width: 100%;
            max-width: 1000px;
            max-height: 90vh;
            overflow-y: auto;
          }

          .modal-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 24px 24px 0 24px;
            border-bottom: 1px solid var(--color-border);
            margin-bottom: 24px;
          }

          .modal-header h2 {
            margin: 0;
            font-size: 24px;
            font-weight: 700;
          }

          .close-button {
            background: none;
            border: none;
            font-size: 24px;
            cursor: pointer;
            color: var(--color-text-secondary);
            padding: 4px 8px;
            line-height: 1;
          }

          .close-button:hover {
            color: var(--color-text);
          }

          .framework-selection {
            padding: 0 24px 24px;
          }

          .selection-instruction {
            margin: 0 0 20px 0;
            color: var(--color-text-secondary);
            text-align: center;
          }

          .framework-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
            gap: 12px;
            margin-bottom: 24px;
          }

          .framework-option {
            padding: 16px;
            border: 2px solid var(--color-border);
            border-radius: 8px;
            cursor: pointer;
            transition: all 0.2s;
          }

          .framework-option:hover:not(.disabled) {
            border-color: var(--color-primary);
          }

          .framework-option.selected {
            border-color: var(--color-primary);
            background: rgba(102, 126, 234, 0.05);
          }

          .framework-option.disabled {
            opacity: 0.5;
            cursor: not-allowed;
          }

          .framework-option .framework-name {
            font-weight: 600;
            margin-bottom: 4px;
          }

          .framework-option .framework-info {
            font-size: 12px;
            color: var(--color-text-secondary);
            margin-bottom: 8px;
            text-transform: capitalize;
          }

          .framework-option .framework-description {
            font-size: 13px;
            color: var(--color-text-secondary);
            line-height: 1.3;
          }

          .selection-actions {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding-top: 16px;
            border-top: 1px solid var(--color-border);
          }

          .selection-count {
            font-size: 14px;
            color: var(--color-text-secondary);
          }

          .compare-action-button {
            padding: 12px 24px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            border: none;
            border-radius: 8px;
            font-weight: 600;
            cursor: pointer;
            transition: transform 0.2s;
          }

          .compare-action-button:hover:not(:disabled) {
            transform: translateY(-1px);
          }

          .compare-action-button:disabled {
            opacity: 0.6;
            cursor: not-allowed;
            transform: none;
          }

          .error-message {
            padding: 12px;
            background: #fee2e2;
            border: 1px solid #fecaca;
            color: #dc2626;
            border-radius: 8px;
            margin-top: 16px;
            text-align: center;
          }

          .comparison-results {
            padding: 0 24px 24px;
          }

          .comparison-summary {
            margin-bottom: 24px;
            padding: 16px;
            background: var(--color-surface-secondary);
            border-radius: 8px;
          }

          .comparison-summary h3 {
            margin: 0 0 8px 0;
            font-size: 18px;
          }

          .comparison-table {
            border: 1px solid var(--color-border);
            border-radius: 8px;
            overflow: hidden;
            margin-bottom: 24px;
          }

          .table-header,
          .framework-row {
            display: grid;
            grid-template-columns: 1fr 80px 2fr 100px 120px;
            gap: 12px;
          }

          .table-header {
            background: var(--color-surface-secondary);
            padding: 12px;
            font-weight: 600;
            font-size: 12px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }

          .framework-row {
            padding: 16px 12px;
            border-top: 1px solid var(--color-border);
            align-items: center;
          }

          .framework-row.primary {
            background: rgba(16, 185, 129, 0.05);
          }

          .framework-column .framework-name {
            font-weight: 600;
            margin-bottom: 2px;
          }

          .framework-column .framework-type {
            font-size: 12px;
            color: var(--color-text-secondary);
            text-transform: capitalize;
          }

          .score-badge {
            padding: 6px 8px;
            border-radius: 12px;
            font-size: 12px;
            font-weight: 600;
            text-align: center;
            background: #e5e7eb;
            color: #374151;
          }

          .score-badge.primary {
            background: #10b981;
            color: white;
          }

          .pros-column .pro-item {
            font-size: 12px;
            margin-bottom: 2px;
            color: var(--color-text-secondary);
          }

          .learning-badge {
            font-size: 10px;
            padding: 4px 6px;
            border-radius: 8px;
            font-weight: 500;
            text-transform: uppercase;
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

          .performance-column .performance-item {
            font-size: 11px;
            color: var(--color-text-secondary);
            margin-bottom: 2px;
          }

          .comparison-actions {
            display: flex;
            justify-content: space-between;
            gap: 12px;
          }

          .back-button,
          .done-button {
            padding: 12px 20px;
            border: 2px solid var(--color-border);
            background: white;
            border-radius: 8px;
            cursor: pointer;
            font-weight: 500;
            transition: all 0.2s;
          }

          .done-button {
            background: var(--color-primary);
            color: white;
            border-color: var(--color-primary);
          }

          .back-button:hover,
          .done-button:hover {
            transform: translateY(-1px);
          }

          @media (max-width: 768px) {
            .modal-content {
              margin: 10px;
              max-height: calc(100vh - 20px);
            }

            .framework-grid {
              grid-template-columns: 1fr;
            }

            .table-header,
            .framework-row {
              grid-template-columns: 1fr;
              gap: 8px;
            }

            .framework-row > div {
              padding: 4px 0;
            }

            .comparison-actions {
              flex-direction: column;
            }
          }
        `}</style>
      </div>
    </div>
  );
};