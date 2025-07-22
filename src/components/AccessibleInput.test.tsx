import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AccessibleInput from './AccessibleInput';

describe('AccessibleInput', () => {
  it('renders with label', () => {
    render(<AccessibleInput label="Email Address" />);
    
    expect(screen.getByLabelText('Email Address')).toBeInTheDocument();
    expect(screen.getByText('Email Address')).toBeInTheDocument();
  });

  it('shows required indicator', () => {
    render(<AccessibleInput label="Name" required />);
    
    const input = screen.getByLabelText(/Name/);
    expect(input).toHaveAttribute('aria-required', 'true');
    expect(screen.getByText('*')).toBeInTheDocument();
    expect(screen.getByText('*')).toHaveAttribute('aria-label', '必須');
  });

  it('shows optional label when not required', () => {
    render(<AccessibleInput label="Nickname" showOptionalLabel />);
    
    expect(screen.getByText('(任意)')).toBeInTheDocument();
  });

  it('displays error message', () => {
    const errorMessage = 'Invalid email format';
    render(<AccessibleInput label="Email" error={errorMessage} />);
    
    const input = screen.getByLabelText('Email');
    const error = screen.getByRole('alert');
    
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(input).toHaveAttribute('aria-describedby');
    expect(error).toHaveTextContent(errorMessage);
    expect(screen.getByText('エラー:')).toHaveClass('sr-only');
  });

  it('displays help text', () => {
    const helpText = 'Enter your full email address';
    render(<AccessibleInput label="Email" helpText={helpText} />);
    
    const input = screen.getByLabelText('Email');
    const help = screen.getByRole('note');
    
    expect(input).toHaveAttribute('aria-describedby');
    expect(help).toHaveTextContent(helpText);
  });

  it('displays both help text and error', () => {
    render(
      <AccessibleInput
        label="Email"
        helpText="Enter email"
        error="Invalid email"
      />
    );
    
    const input = screen.getByLabelText('Email');
    const describedBy = input.getAttribute('aria-describedby');
    
    expect(describedBy).toContain(' '); // Contains both IDs
    expect(screen.getByRole('note')).toHaveTextContent('Enter email');
    expect(screen.getByRole('alert')).toHaveTextContent('Invalid email');
  });

  it('handles input changes', async () => {
    const handleChange = vi.fn();
    const user = userEvent.setup();
    
    render(
      <AccessibleInput
        label="Username"
        onChange={handleChange}
      />
    );
    
    const input = screen.getByLabelText('Username');
    await user.type(input, 'testuser');
    
    expect(handleChange).toHaveBeenCalled();
    expect(input).toHaveValue('testuser');
  });

  it('applies custom className', () => {
    render(
      <AccessibleInput
        label="Custom Input"
        className="custom-input-class"
      />
    );
    
    const input = screen.getByLabelText('Custom Input');
    expect(input).toHaveClass('custom-input-class');
  });

  it('forwards ref correctly', () => {
    const ref = vi.fn();
    render(<AccessibleInput label="Test Input" ref={ref} />);
    expect(ref).toHaveBeenCalled();
  });

  it('handles different input types', () => {
    const { rerender } = render(
      <AccessibleInput label="Email" type="email" />
    );
    expect(screen.getByLabelText('Email')).toHaveAttribute('type', 'email');
    
    rerender(<AccessibleInput label="Password" type="password" />);
    expect(screen.getByLabelText('Password')).toHaveAttribute('type', 'password');
    
    rerender(<AccessibleInput label="Phone" type="tel" />);
    expect(screen.getByLabelText('Phone')).toHaveAttribute('type', 'tel');
  });

  it('handles disabled state', () => {
    render(<AccessibleInput label="Disabled Input" disabled />);
    
    const input = screen.getByLabelText('Disabled Input');
    expect(input).toBeDisabled();
    expect(input).toHaveClass('disabled:bg-gray-100');
  });

  it('handles placeholder', () => {
    render(
      <AccessibleInput
        label="Email"
        placeholder="example@email.com"
      />
    );
    
    const input = screen.getByLabelText('Email');
    expect(input).toHaveAttribute('placeholder', 'example@email.com');
  });

  it('has proper ARIA attributes', () => {
    render(
      <AccessibleInput
        label="Test Input"
        required
        invalid
        helpText="Help text"
        error="Error message"
      />
    );
    
    const input = screen.getByLabelText(/Test Input/);
    
    expect(input).toHaveAttribute('aria-required', 'true');
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(input).toHaveAttribute('aria-describedby');
    expect(input).toHaveAttribute('aria-label');
  });

  it('generates unique IDs for multiple instances', () => {
    render(
      <>
        <AccessibleInput label="Input 1" error="Error 1" />
        <AccessibleInput label="Input 2" error="Error 2" />
      </>
    );
    
    const input1 = screen.getByLabelText('Input 1');
    const input2 = screen.getByLabelText('Input 2');
    
    expect(input1.id).not.toBe(input2.id);
    expect(input1.getAttribute('aria-describedby')).not.toBe(
      input2.getAttribute('aria-describedby')
    );
  });

  it('respects reduced motion preference', () => {
    // Mock useReducedMotion to return true
    vi.mock('../hooks/useAccessibility', async () => {
      const actual = await vi.importActual('../hooks/useAccessibility');
      return {
        ...actual,
        useReducedMotion: () => true,
      };
    });
    
    render(<AccessibleInput label="Motion Test" />);
    const input = screen.getByLabelText('Motion Test');
    
    // Should not have transition class when reduced motion is preferred
    expect(input.className).not.toContain('transition-colors');
  });
});