import React from 'react';

export type TypographyVariant = 
  | 'h900' | 'h800' | 'h700' | 'h600' | 'h500' | 'h400' | 'h300' | 'h200' | 'h100'
  | 'body' | 'body-small'
  | 'caption'
  | 'overline';

export type TypographyColor = 
  | 'highest' | 'high' | 'medium' | 'low' | 'lowest' 
  | 'inverse' | 'disabled' | 'brand' 
  | 'zero-god' | 'savings-hero' | 'budget-warrior' | 'spender-alert' | 'waste-danger';

export interface TypographyProps {
  /** Typography variant */
  variant?: TypographyVariant;
  /** Text color */
  color?: TypographyColor;
  /** Font weight override */
  weight?: 'regular' | 'medium' | 'semibold' | 'bold';
  /** Text alignment */
  align?: 'left' | 'center' | 'right';
  /** Whether text should wrap */
  noWrap?: boolean;
  /** Maximum number of lines before truncation */
  maxLines?: number;
  /** HTML element to render */
  as?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'p' | 'span' | 'div';
  /** Children content */
  children: React.ReactNode;
  /** Additional CSS classes */
  className?: string;
  /** Custom styles */
  style?: React.CSSProperties;
  /** Test ID */
  testId?: string;
}

const AtlassianTypography: React.FC<TypographyProps> = ({
  variant = 'body',
  color = 'high',
  weight,
  align = 'left',
  noWrap = false,
  maxLines,
  as,
  children,
  className,
  style,
  testId,
  ...props
}) => {
  const getVariantStyles = (): React.CSSProperties => {
    const variants: Record<TypographyVariant, React.CSSProperties> = {
      h900: {
        fontSize: 'var(--ds-font-size-600)',
        lineHeight: 'var(--ds-font-lineheight-600)',
        fontWeight: 'var(--ds-font-weight-medium)',
        letterSpacing: '-0.01em',
      },
      h800: {
        fontSize: 'var(--ds-font-size-500)',
        lineHeight: 'var(--ds-font-lineheight-500)',
        fontWeight: 'var(--ds-font-weight-medium)',
        letterSpacing: '-0.01em',
      },
      h700: {
        fontSize: 'var(--ds-font-size-400)',
        lineHeight: 'var(--ds-font-lineheight-400)',
        fontWeight: 'var(--ds-font-weight-medium)',
        letterSpacing: '-0.01em',
      },
      h600: {
        fontSize: 'var(--ds-font-size-300)',
        lineHeight: 'var(--ds-font-lineheight-300)',
        fontWeight: 'var(--ds-font-weight-medium)',
        letterSpacing: '-0.003em',
      },
      h500: {
        fontSize: 'var(--ds-font-size-200)',
        lineHeight: 'var(--ds-font-lineheight-300)',
        fontWeight: 'var(--ds-font-weight-medium)',
        letterSpacing: '-0.003em',
      },
      h400: {
        fontSize: 'var(--ds-font-size-200)',
        lineHeight: 'var(--ds-font-lineheight-300)',
        fontWeight: 'var(--ds-font-weight-semibold)',
        letterSpacing: '-0.003em',
      },
      h300: {
        fontSize: 'var(--ds-font-size-100)',
        lineHeight: 'var(--ds-font-lineheight-200)',
        fontWeight: 'var(--ds-font-weight-semibold)',
        letterSpacing: '-0.003em',
      },
      h200: {
        fontSize: 'var(--ds-font-size-075)',
        lineHeight: 'var(--ds-font-lineheight-100)',
        fontWeight: 'var(--ds-font-weight-semibold)',
        letterSpacing: '0.06em',
        textTransform: 'uppercase',
      },
      h100: {
        fontSize: 'var(--ds-font-size-050)',
        lineHeight: 'var(--ds-font-lineheight-100)',
        fontWeight: 'var(--ds-font-weight-bold)',
        letterSpacing: '0.06em',
        textTransform: 'uppercase',
      },
      body: {
        fontSize: 'var(--ds-font-size-100)',
        lineHeight: 'var(--ds-font-lineheight-200)',
        fontWeight: 'var(--ds-font-weight-regular)',
      },
      'body-small': {
        fontSize: 'var(--ds-font-size-075)',
        lineHeight: 'var(--ds-font-lineheight-100)',
        fontWeight: 'var(--ds-font-weight-regular)',
      },
      caption: {
        fontSize: 'var(--ds-font-size-050)',
        lineHeight: 'var(--ds-font-lineheight-100)',
        fontWeight: 'var(--ds-font-weight-regular)',
      },
      overline: {
        fontSize: 'var(--ds-font-size-050)',
        lineHeight: 'var(--ds-font-lineheight-100)',
        fontWeight: 'var(--ds-font-weight-bold)',
        letterSpacing: '0.06em',
        textTransform: 'uppercase',
      },
    };

    return variants[variant];
  };

  const getColorStyles = (): React.CSSProperties => {
    const colors: Record<TypographyColor, string> = {
      highest: 'var(--ds-text-highest)',
      high: 'var(--ds-text-high)',
      medium: 'var(--ds-text-medium)',
      low: 'var(--ds-text-low)',
      lowest: 'var(--ds-text-lowest)',
      inverse: 'var(--ds-text-inverse)',
      disabled: 'var(--ds-text-disabled)',
      brand: 'var(--ds-text-brand)',
      'zero-god': 'var(--zs-color-zero-god)',
      'savings-hero': 'var(--zs-color-savings-hero)',
      'budget-warrior': 'var(--zs-color-budget-warrior)',
      'spender-alert': 'var(--zs-color-spender-alert)',
      'waste-danger': 'var(--zs-color-waste-danger)',
    };

    return { color: colors[color] };
  };

  const getWeightStyles = (): React.CSSProperties => {
    if (!weight) return {};
    
    const weights: Record<string, string> = {
      regular: 'var(--ds-font-weight-regular)',
      medium: 'var(--ds-font-weight-medium)',
      semibold: 'var(--ds-font-weight-semibold)',
      bold: 'var(--ds-font-weight-bold)',
    };

    return { fontWeight: weights[weight] };
  };

  const getDefaultElement = (): string => {
    if (as) return as;
    
    if (variant.startsWith('h')) {
      const level = parseInt(variant.replace('h', ''));
      if (level >= 700) return 'h1';
      if (level >= 600) return 'h2';
      if (level >= 500) return 'h3';
      if (level >= 400) return 'h4';
      if (level >= 300) return 'h5';
      return 'h6';
    }
    
    if (variant === 'body' || variant === 'body-small') return 'p';
    return 'span';
  };

  const getTruncationStyles = (): React.CSSProperties => {
    if (noWrap) {
      return {
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
      };
    }
    
    if (maxLines) {
      return {
        display: '-webkit-box',
        WebkitLineClamp: maxLines,
        WebkitBoxOrient: 'vertical',
        overflow: 'hidden',
      };
    }
    
    return {};
  };

  const combinedStyles: React.CSSProperties = {
    fontFamily: 'var(--ds-font-family-sans)',
    margin: 0,
    textAlign: align,
    ...getVariantStyles(),
    ...getColorStyles(),
    ...getWeightStyles(),
    ...getTruncationStyles(),
    ...style,
  };

  const Element = getDefaultElement() as keyof JSX.IntrinsicElements;

  return (
    <Element
      style={combinedStyles}
      className={className}
      data-testid={testId}
      {...props}
    >
      {children}
    </Element>
  );
};

export default AtlassianTypography;