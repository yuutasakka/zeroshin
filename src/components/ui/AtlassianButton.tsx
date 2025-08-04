import React, { forwardRef } from 'react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** Button visual appearance */
  appearance?: 'primary' | 'default' | 'subtle' | 'link' | 'warning' | 'danger';
  /** Button size */
  spacing?: 'compact' | 'default';
  /** Whether the button should be disabled */
  isDisabled?: boolean;
  /** Whether the button is in a loading state */
  isLoading?: boolean;
  /** Icon to display before the button text */
  iconBefore?: React.ReactNode;
  /** Icon to display after the button text */
  iconAfter?: React.ReactNode;
  /** Whether the button should take full width */
  shouldFitContainer?: boolean;
  /** Button content */
  children?: React.ReactNode;
}

const AtlassianButton = forwardRef<HTMLButtonElement, ButtonProps>(({
  appearance = 'default',
  spacing = 'default',
  isDisabled = false,
  isLoading = false,
  iconBefore,
  iconAfter,
  shouldFitContainer = false,
  children,
  className,
  style,
  onClick,
  ...props
}, ref) => {
  const getAppearanceStyles = () => {
    const baseStyles = {
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 'var(--ds-space-100)',
      fontFamily: 'var(--ds-font-family-sans)',
      fontWeight: 'var(--ds-font-weight-medium)',
      fontSize: 'var(--ds-font-size-100)',
      lineHeight: 'var(--ds-font-lineheight-200)',
      borderRadius: 'var(--ds-border-radius-100)',
      border: '2px solid transparent',
      cursor: isDisabled || isLoading ? 'not-allowed' : 'pointer',
      transition: `all var(--ds-motion-duration-quick) var(--ds-motion-easing-standard)`,
      textDecoration: 'none',
      userSelect: 'none' as const,
      opacity: isDisabled || isLoading ? 0.6 : 1,
      width: shouldFitContainer ? '100%' : 'auto',
      minHeight: spacing === 'compact' ? '32px' : '40px',
      padding: spacing === 'compact' 
        ? '0 var(--ds-space-150)' 
        : '0 var(--ds-space-200)',
    };

    switch (appearance) {
      case 'primary':
        return {
          ...baseStyles,
          backgroundColor: 'var(--ds-background-brand-bold)',
          color: 'var(--ds-text-inverse)',
          ...(!(isDisabled || isLoading) && {
            ':hover': {
              backgroundColor: 'var(--ds-background-brand-bolder)',
              transform: 'translateY(-1px)',
              boxShadow: 'var(--ds-shadow-raised)',
            },
            ':active': {
              backgroundColor: 'var(--ds-background-brand-boldest)',
              transform: 'translateY(0)',
            },
            ':focus-visible': {
              borderColor: 'var(--ds-border-focused)',
              outline: 'none',
            }
          })
        };
      
      case 'warning':
        return {
          ...baseStyles,
          backgroundColor: 'var(--zs-color-spender-alert)',
          color: 'var(--ds-text-inverse)',
          ...(!(isDisabled || isLoading) && {
            ':hover': {
              backgroundColor: 'var(--ds-background-accent-yellow-bold)',
              transform: 'translateY(-1px)',
              boxShadow: 'var(--ds-shadow-raised)',
            }
          })
        };
      
      case 'danger':
        return {
          ...baseStyles,
          backgroundColor: 'var(--zs-color-waste-danger)',
          color: 'var(--ds-text-inverse)',
          ...(!(isDisabled || isLoading) && {
            ':hover': {
              backgroundColor: '#BF2600',
              transform: 'translateY(-1px)',
              boxShadow: 'var(--ds-shadow-raised)',
            }
          })
        };
      
      case 'subtle':
        return {
          ...baseStyles,
          backgroundColor: 'transparent',
          color: 'var(--ds-text-high)',
          ...(!(isDisabled || isLoading) && {
            ':hover': {
              backgroundColor: 'var(--ds-background-neutral-hovered)',
            },
            ':active': {
              backgroundColor: 'var(--ds-background-neutral-pressed)',
            }
          })
        };
      
      case 'link':
        return {
          ...baseStyles,
          backgroundColor: 'transparent',
          color: 'var(--ds-text-brand)',
          textDecoration: 'underline',
          minHeight: 'auto',
          padding: '0',
          ...(!(isDisabled || isLoading) && {
            ':hover': {
              color: 'var(--ds-background-brand-bolder)',
            }
          })
        };
      
      default:
        return {
          ...baseStyles,
          backgroundColor: 'var(--ds-background-input)',
          color: 'var(--ds-text-high)',
          border: '2px solid var(--ds-border-input)',
          ...(!(isDisabled || isLoading) && {
            ':hover': {
              backgroundColor: 'var(--ds-background-input-hovered)',
              borderColor: 'var(--ds-border)',
              transform: 'translateY(-1px)',
              boxShadow: 'var(--ds-shadow-raised)',
            },
            ':active': {
              backgroundColor: 'var(--ds-background-input-pressed)',
              transform: 'translateY(0)',
            },
            ':focus-visible': {
              borderColor: 'var(--ds-border-focused)',
              outline: 'none',
            }
          })
        };
    }
  };

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    if (isDisabled || isLoading) {
      event.preventDefault();
      return;
    }
    onClick?.(event);
  };

  const buttonStyles = getAppearanceStyles();
  
  return (
    <button
      ref={ref}
      style={{
        ...buttonStyles,
        ...style
      }}
      className={className}
      disabled={isDisabled || isLoading}
      onClick={handleClick}
      {...props}
    >
      {isLoading ? (
        <>
          <LoadingSpinner size={spacing === 'compact' ? 16 : 20} />
          {children && <span style={{ opacity: 0.7 }}>{children}</span>}
        </>
      ) : (
        <>
          {iconBefore && <span style={{ display: 'flex', alignItems: 'center' }}>{iconBefore}</span>}
          {children && <span>{children}</span>}
          {iconAfter && <span style={{ display: 'flex', alignItems: 'center' }}>{iconAfter}</span>}
        </>
      )}
    </button>
  );
});

AtlassianButton.displayName = 'AtlassianButton';

// Loading Spinner Component
const LoadingSpinner: React.FC<{ size: number }> = ({ size }) => (
  <div
    style={{
      width: size,
      height: size,
      border: '2px solid transparent',
      borderTop: '2px solid currentColor',
      borderRadius: '50%',
      animation: 'atlassian-spin 1s linear infinite'
    }}
  />
);

// Add keyframes for spinner animation
const spinnerStyle = document.createElement('style');
spinnerStyle.textContent = `
  @keyframes atlassian-spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;
if (typeof document !== 'undefined') {
  document.head.appendChild(spinnerStyle);
}

export default AtlassianButton;