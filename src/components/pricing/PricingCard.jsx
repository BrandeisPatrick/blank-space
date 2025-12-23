/**
 * Pricing Card Component
 *
 * Displays a single pricing tier with features and action button.
 */

import { useTheme, getTheme, createGlassEffect } from '../../styles/theme';

export const PricingCard = ({
  tier,
  name,
  description,
  price,
  features,
  isCurrentPlan,
  highlighted = false,
  onSelect,
  loading = false,
}) => {
  const { mode } = useTheme();
  const theme = getTheme(mode);

  const cardStyle = {
    ...createGlassEffect(theme),
    padding: theme.spacing['2xl'],
    borderRadius: theme.radius['2xl'],
    border: highlighted ? '2px solid #C97D63' : `1px solid ${theme.colors.border}`,
    position: 'relative',
    display: 'flex',
    flexDirection: 'column',
    minHeight: '400px',
    transition: 'transform 0.2s ease, box-shadow 0.2s ease',
  };

  const badgeStyle = {
    position: 'absolute',
    top: '-12px',
    left: '50%',
    transform: 'translateX(-50%)',
    background: '#C97D63',
    color: 'white',
    padding: '4px 16px',
    borderRadius: theme.radius.full,
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.semibold,
  };

  const priceStyle = {
    fontSize: '48px',
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.foreground,
    marginBottom: theme.spacing.sm,
  };

  const priceSubStyle = {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.mutedForeground,
  };

  const featureListStyle = {
    listStyle: 'none',
    padding: 0,
    margin: `${theme.spacing.xl} 0`,
    flex: 1,
  };

  const featureItemStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.md,
    color: theme.colors.foreground,
    fontSize: theme.typography.fontSize.sm,
  };

  const checkmarkStyle = {
    color: '#C97D63',
    fontWeight: 'bold',
  };

  const buttonStyle = {
    width: '100%',
    padding: `${theme.spacing.md} ${theme.spacing.xl}`,
    borderRadius: theme.radius.lg,
    border: 'none',
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.semibold,
    cursor: isCurrentPlan || loading ? 'default' : 'pointer',
    transition: 'background 0.2s ease',
    background: isCurrentPlan
      ? theme.colors.muted
      : highlighted
        ? '#C97D63'
        : theme.colors.foreground,
    color: isCurrentPlan
      ? theme.colors.mutedForeground
      : highlighted
        ? 'white'
        : theme.colors.background,
    opacity: loading ? 0.7 : 1,
  };

  return (
    <div style={cardStyle}>
      {highlighted && <div style={badgeStyle}>Most Popular</div>}

      <div>
        <h3 style={{
          fontSize: theme.typography.fontSize['2xl'],
          fontWeight: theme.typography.fontWeight.bold,
          color: theme.colors.foreground,
          marginBottom: theme.spacing.xs,
        }}>
          {name}
        </h3>
        <p style={{
          color: theme.colors.mutedForeground,
          fontSize: theme.typography.fontSize.sm,
          marginBottom: theme.spacing.lg,
        }}>
          {description}
        </p>
      </div>

      <div>
        <span style={priceStyle}>
          {price === 0 ? 'Free' : `$${price}`}
        </span>
        {price > 0 && <span style={priceSubStyle}>/month</span>}
      </div>

      <ul style={featureListStyle}>
        {features.map((feature, i) => (
          <li key={i} style={featureItemStyle}>
            <span style={checkmarkStyle}>✓</span>
            {feature}
          </li>
        ))}
      </ul>

      <button
        style={buttonStyle}
        onClick={() => !isCurrentPlan && !loading && onSelect(tier)}
        disabled={isCurrentPlan || loading}
      >
        {loading ? 'Loading...' : isCurrentPlan ? 'Current Plan' : 'Select Plan'}
      </button>
    </div>
  );
};

export default PricingCard;
