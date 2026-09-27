/**
 * ErrorAlert.test.tsx — rendering and interaction tests for the error alert component.
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ErrorAlert } from '@/components/ErrorAlert/ErrorAlert';

describe('ErrorAlert', () => {
  it('renders the error message', () => {
    render(<ErrorAlert message="Something went wrong" />);
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
  });

  it('has role=alert for screen readers', () => {
    render(<ErrorAlert message="Error" />);
    expect(screen.getByRole('alert')).toBeInTheDocument();
  });

  it('does not render a dismiss button when onDismiss is not provided', () => {
    render(<ErrorAlert message="Error" />);
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('renders a dismiss button when onDismiss is provided', () => {
    render(<ErrorAlert message="Error" onDismiss={() => {}} />);
    expect(screen.getByRole('button', { name: /dismiss/i })).toBeInTheDocument();
  });

  it('calls onDismiss when the dismiss button is clicked', async () => {
    const user = userEvent.setup();
    const onDismiss = vi.fn();
    render(<ErrorAlert message="Error" onDismiss={onDismiss} />);
    await user.click(screen.getByRole('button', { name: /dismiss/i }));
    expect(onDismiss).toHaveBeenCalledOnce();
  });

  it('renders different error messages correctly', () => {
    const { rerender } = render(<ErrorAlert message="First error" />);
    expect(screen.getByText('First error')).toBeInTheDocument();
    rerender(<ErrorAlert message="Second error" />);
    expect(screen.getByText('Second error')).toBeInTheDocument();
    expect(screen.queryByText('First error')).not.toBeInTheDocument();
  });
});
