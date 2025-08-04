import React, { forwardRef } from 'react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  /** Input visual appearance */
  appearance?: 'default' | 'subtle' | 'none';
  /** Whether the input is in an invalid state */
  isInvalid?: boolean;
  /** Whether the input is in a compact spacing */
  isCompact?: boolean;
  /** Whether the input is in a monospace font */
  isMonospaced?: boolean;
  /** Whether the input is required */
  isRequired?: boolean;
  /** Input width behavior */
  width?: 'xsmall' | 'small' | 'medium' | 'large' | 'xlarge' | number;
  /** Element to render before the input text */
  elemBeforeInput?: React.ReactNode;
  /** Element to render after the input text */
  elemAfterInput?: React.ReactNode;
}

const AtlassianInput = forwardRef<HTMLInputElement, InputProps>(({
  appearance = 'default',
  isInvalid = false,
  isCompact = false,
  isMonospaced = false,
  isRequired = false,
  width = 'medium',
  elemBeforeInput,
  elemAfterInput,
  className,
  style,
  disabled,
  ...props
}, ref) => {
  const getWidthValue = () => {
    if (typeof width === 'number') return `${width}px`;
    
    const widthMap = {
      xsmall: '80px',
      small: '160px',
      medium: '240px',
      large: '320px',
      xlarge: '100%'
    };
    
    return widthMap[width];
  };

  const getInputStyles = () => {
    const baseStyles = {
      width: getWidthValue(),
      minHeight: isCompact ? '32px' : '40px',
      padding: isCompact 
        ? '0 var(--ds-space-100)' 
        : '0 var(--ds-space-150)',
      fontSize: 'var(--ds-font-size-100)',
      fontFamily: isMonospaced 
        ? 'var(--ds-font-family-mono)' 
        : 'var(--ds-font-family-sans)',
      fontWeight: 'var(--ds-font-weight-regular)',
      lineHeight: 'var(--ds-font-lineheight-200)',
      color: disabled 
        ? 'var(--ds-text-disabled)' 
        : 'var(--ds-text-high)',
      borderRadius: 'var(--ds-border-radius-100)',
      transition: `all var(--ds-motion-duration-quick) var(--ds-motion-easing-standard)`,
      outline: 'none',
      ...(elemBeforeInput && { paddingLeft: 'var(--ds-space-400)' }),
      ...(elemAfterInput && { paddingRight: 'var(--ds-space-400)' })
    };

    switch (appearance) {
      case 'subtle':
        return {
          ...baseStyles,
          backgroundColor: 'transparent',
          border: '2px solid transparent',
          borderBottomColor: isInvalid 
            ? 'var(--ds-background-accent-red-bold)' 
            : 'var(--ds-border-input)',
          borderRadius: 0,
          ...(!(disabled) && {
            ':hover': {
              borderBottomColor: isInvalid 
                ? 'var(--ds-background-accent-red-bold)' 
                : 'var(--ds-border)',
            },
            ':focus': {
              borderBottomColor: isInvalid 
                ? 'var(--ds-background-accent-red-bold)' 
                : 'var(--ds-border-focused)',
            }
          })
        };
      
      case 'none':
        return {
          ...baseStyles,
          backgroundColor: 'transparent',
          border: 'none',
          padding: '0'
        };
      
      default:
        return {
          ...baseStyles,
          backgroundColor: disabled 
            ? 'var(--ds-background-neutral-subtlest)' 
            : 'var(--ds-background-input)',
          border: `2px solid ${
            isInvalid 
              ? 'var(--ds-background-accent-red-bold)' 
              : disabled 
                ? 'var(--ds-border-disabled)' 
                : 'var(--ds-border-input)'
          }`,
          ...(!(disabled) && {
            ':hover': {
              backgroundColor: 'var(--ds-background-input-hovered)',
              borderColor: isInvalid 
                ? 'var(--ds-background-accent-red-bold)' 
                : 'var(--ds-border)',
            },
            ':focus': {
              backgroundColor: 'var(--ds-background-input)',
              borderColor: isInvalid 
                ? 'var(--ds-background-accent-red-bold)' 
                : 'var(--ds-border-focused)',
              boxShadow: isInvalid 
                ? '0 0 0 2px rgba(222, 53, 11, 0.2)' 
                : '0 0 0 2px rgba(76, 154, 255, 0.2)',
            }
          })
        };
    }
  };

  const inputStyles = getInputStyles();

  return (
    <div style={{
      position: 'relative',
      display: 'inline-block',
      width: getWidthValue()
    }}>
      {elemBeforeInput && (
        <div style={{
          position: 'absolute',
          left: 'var(--ds-space-150)',
          top: '50%',
          transform: 'translateY(-50%)',
          zIndex: 1,
          display: 'flex',
          alignItems: 'center',
          color: disabled ? 'var(--ds-text-disabled)' : 'var(--ds-text-medium)',
          pointerEvents: 'none'
        }}>
          {elemBeforeInput}
        </div>
      )}
      
      <input
        ref={ref}
        style={{
          ...inputStyles,
          ...style
        }}
        className={className}
        disabled={disabled}
        required={isRequired}
        aria-invalid={isInvalid}
        {...props}
      />
      
      {elemAfterInput && (
        <div style={{
          position: 'absolute',
          right: 'var(--ds-space-150)',
          top: '50%',
          transform: 'translateY(-50%)',
          zIndex: 1,
          display: 'flex',
          alignItems: 'center',
          color: disabled ? 'var(--ds-text-disabled)' : 'var(--ds-text-medium)',
          pointerEvents: 'none'
        }}>
          {elemAfterInput}
        </div>
      )}
    </div>
  );
});

AtlassianInput.displayName = 'AtlassianInput';

export default AtlassianInput;