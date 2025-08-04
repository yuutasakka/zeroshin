import React from 'react';

export interface CardProps {
  /** Card elevation level */
  elevation?: 'surface' | 'raised' | 'overlay';
  /** Whether the card should be clickable */
  isClickable?: boolean;
  /** Whether the card is in a selected state */
  isSelected?: boolean;
  /** Custom background color */
  backgroundColor?: string;
  /** Card content */
  children?: React.ReactNode;
  /** Additional CSS classes */
  className?: string;
  /** Custom styles */
  style?: React.CSSProperties;
  /** Click handler */
  onClick?: () => void;
  /** Test ID for testing */
  testId?: string;
}

const AtlassianCard: React.FC<CardProps> = ({
  elevation = 'surface',
  isClickable = false,
  isSelected = false,
  backgroundColor,
  children,
  className,
  style,
  onClick,
  testId,
  ...props
}) => {
  const getCardStyles = () => {
    const baseStyles: React.CSSProperties = {
      borderRadius: 'var(--ds-border-radius-200)',
      border: '1px solid var(--ds-border)',
      transition: `all var(--ds-motion-duration-quick) var(--ds-motion-easing-standard)`,
      position: 'relative',
      cursor: isClickable ? 'pointer' : 'default',
      userSelect: isClickable ? 'none' : 'auto',
    };

    // Elevation styles
    const elevationStyles: Record<string, React.CSSProperties> = {
      surface: {
        backgroundColor: backgroundColor || 'var(--ds-surface)',
        boxShadow: 'none',
      },
      raised: {
        backgroundColor: backgroundColor || 'var(--ds-surface-raised)',
        boxShadow: 'var(--ds-shadow-raised)',
      },
      overlay: {
        backgroundColor: backgroundColor || 'var(--ds-surface-overlay)',
        boxShadow: 'var(--ds-shadow-overlay)',
      }
    };

    // Interactive states
    const interactiveStyles: React.CSSProperties = {};
    if (isClickable) {
      Object.assign(interactiveStyles, {
        ':hover': {
          backgroundColor: backgroundColor || 'var(--ds-background-neutral-hovered)',
          borderColor: 'var(--ds-border)',
          transform: 'translateY(-1px)',
          boxShadow: elevation === 'surface' 
            ? 'var(--ds-shadow-raised)' 
            : 'var(--ds-shadow-overlay)',
        },
        ':active': {
          transform: 'translateY(0)',
        }
      });
    }

    // Selected state
    const selectedStyles: React.CSSProperties = isSelected ? {
      borderColor: 'var(--ds-border-brand)',
      backgroundColor: backgroundColor || 'var(--ds-background-brand-subtlest)',
    } : {};

    return {
      ...baseStyles,
      ...elevationStyles[elevation],
      ...interactiveStyles,
      ...selectedStyles,
    };
  };

  const cardStyles = getCardStyles();

  return (
    <div
      style={{
        ...cardStyles,
        ...style
      }}
      className={className}
      onClick={isClickable ? onClick : undefined}
      data-testid={testId}
      role={isClickable ? 'button' : undefined}
      tabIndex={isClickable ? 0 : undefined}
      onKeyPress={isClickable ? (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick?.();
        }
      } : undefined}
      {...props}
    >
      {children}
    </div>
  );
};

// Card sub-components for better composition
export const CardHeader: React.FC<{
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}> = ({ children, className, style }) => (
  <div
    style={{
      padding: 'var(--ds-space-300) var(--ds-space-300) var(--ds-space-200)',
      borderBottom: '1px solid var(--ds-border)',
      ...style
    }}
    className={className}
  >
    {children}
  </div>
);

export const CardBody: React.FC<{
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}> = ({ children, className, style }) => (
  <div
    style={{
      padding: 'var(--ds-space-300)',
      ...style
    }}
    className={className}
  >
    {children}
  </div>
);

export const CardFooter: React.FC<{
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}> = ({ children, className, style }) => (
  <div
    style={{
      padding: 'var(--ds-space-200) var(--ds-space-300) var(--ds-space-300)',
      borderTop: '1px solid var(--ds-border)',
      ...style
    }}
    className={className}
  >
    {children}
  </div>
);

export default AtlassianCard;