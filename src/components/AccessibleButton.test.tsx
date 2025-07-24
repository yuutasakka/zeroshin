import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AccessibleButton from './AccessibleButton';

describe('AccessibleButton', () => {
  it('renders with default props', () => {
    render(<AccessibleButton>Click me</AccessibleButton>);
    const button = screen.getByRole('button', { name: 'Click me' });
    expect(button).toBeInTheDocument();
    expect(button).toHaveClass('bg-blue-600');
  });

  it('renders with different variants', () => {
    const { rerender } = render(<AccessibleButton variant="primary">Primary</AccessibleButton>);
    expect(screen.getByRole('button')).toHaveClass('bg-blue-600');

    rerender(<AccessibleButton variant="secondary">Secondary</AccessibleButton>);
    expect(screen.getByRole('button')).toHaveClass('bg-gray-200');

    rerender(<AccessibleButton variant="danger">Danger</AccessibleButton>);
    expect(screen.getByRole('button')).toHaveClass('bg-red-600');

    rerender(<AccessibleButton variant="ghost">Ghost</AccessibleButton>);
    expect(screen.getByRole('button')).toHaveClass('bg-transparent');
  });

  it('renders with different sizes', () => {
    const { rerender } = render(<AccessibleButton size="small">Small</AccessibleButton>);
    expect(screen.getByRole('button')).toHaveClass('px-3 py-1.5');

    rerender(<AccessibleButton size="medium">Medium</AccessibleButton>);
    expect(screen.getByRole('button')).toHaveClass('px-4 py-2');

    rerender(<AccessibleButton size="large">Large</AccessibleButton>);
    expect(screen.getByRole('button')).toHaveClass('px-6 py-3');
  });

  it('handles click events', async () => {
    const handleClick = vi.fn();
    const user = userEvent.setup();
    
    render(<AccessibleButton onClick={handleClick}>Click me</AccessibleButton>);
    const button = screen.getByRole('button');
    
    await user.click(button);
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('disables button when disabled prop is true', () => {
    render(<AccessibleButton disabled>Disabled</AccessibleButton>);
    const button = screen.getByRole('button');
    
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute('aria-disabled', 'true');
  });

  it('shows loading state', () => {
    render(
      <AccessibleButton loading loadingText="Loading...">
        Submit
      </AccessibleButton>
    );
    
    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute('aria-disabled', 'true');
    expect(button).toHaveAttribute('aria-describedby', 'loading-status');
    expect(screen.getAllByText('Loading...')).toHaveLength(2); // One visible, one for screen reader
  });

  it('renders with icon on the left', () => {
    const icon = <span data-testid="test-icon">Icon</span>;
    render(
      <AccessibleButton icon={icon} iconPosition="left">
        With Icon
      </AccessibleButton>
    );
    
    const iconElement = screen.getByTestId('test-icon');
    const buttonText = screen.getByText('With Icon');
    
    expect(iconElement).toBeInTheDocument();
    // Icon should come before text when on the left
    const position = iconElement.compareDocumentPosition(buttonText);
    expect(position & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it('renders with icon on the right', () => {
    const icon = <span data-testid="test-icon">Icon</span>;
    render(
      <AccessibleButton icon={icon} iconPosition="right">
        With Icon
      </AccessibleButton>
    );
    
    const iconElement = screen.getByTestId('test-icon');
    const buttonText = screen.getByText('With Icon');
    
    expect(iconElement).toBeInTheDocument();
    // Icon should come after text when on the right
    const position = iconElement.compareDocumentPosition(buttonText);
    expect(position & Node.DOCUMENT_POSITION_PRECEDING).toBeTruthy();
  });

  it('renders full width button', () => {
    render(<AccessibleButton fullWidth>Full Width</AccessibleButton>);
    expect(screen.getByRole('button')).toHaveClass('w-full');
  });

  it('applies custom className', () => {
    render(<AccessibleButton className="custom-class">Custom</AccessibleButton>);
    expect(screen.getByRole('button')).toHaveClass('custom-class');
  });

  it('forwards ref correctly', () => {
    const ref = vi.fn();
    render(<AccessibleButton ref={ref}>Button</AccessibleButton>);
    expect(ref).toHaveBeenCalled();
  });

  it('handles keyboard navigation', async () => {
    const handleClick = vi.fn();
    const user = userEvent.setup();
    
    render(<AccessibleButton onClick={handleClick}>Keyboard Test</AccessibleButton>);
    const button = screen.getByRole('button');
    
    // Tab to button
    await user.tab();
    expect(button).toHaveFocus();
    
    // Press Enter
    await user.keyboard('{Enter}');
    expect(handleClick).toHaveBeenCalledTimes(1);
    
    // Press Space
    await user.keyboard(' ');
    expect(handleClick).toHaveBeenCalledTimes(2);
  });

  it('does not trigger click when disabled', async () => {
    const handleClick = vi.fn();
    const user = userEvent.setup();
    
    render(
      <AccessibleButton disabled onClick={handleClick}>
        Disabled Button
      </AccessibleButton>
    );
    
    const button = screen.getByRole('button');
    await user.click(button);
    
    expect(handleClick).not.toHaveBeenCalled();
  });
});