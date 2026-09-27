/**
 * CompanySearch.test.tsx
 *
 * Tests for the CompanySearch component introduced by the user-selected company
 * graph feature. Covers input validation, submit wiring, and the clear action.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { CompanySearch } from '@/components/CompanySearch/CompanySearch';

// ─── Store mock ───────────────────────────────────────────────────────────────

const mockSetFocusedSymbol = vi.fn();

vi.mock('@/store/dashboardStore', () => ({
  useDashboardStore: (selector: (s: Record<string, unknown>) => unknown) =>
    selector({
      focusedSymbol: null,
      focusedLoading: false,
      setFocusedSymbol: mockSetFocusedSymbol,
    }),
}));

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('CompanySearch', () => {
  beforeEach(() => {
    mockSetFocusedSymbol.mockReset();
  });

  it('renders the ticker input', () => {
    render(<CompanySearch />);
    expect(screen.getByRole('textbox', { name: /ticker symbol/i })).toBeInTheDocument();
  });

  it('renders the Go button', () => {
    render(<CompanySearch />);
    expect(screen.getByRole('button', { name: /search/i })).toBeInTheDocument();
  });

  it('shows a validation error when submitting an empty field', () => {
    render(<CompanySearch />);
    fireEvent.click(screen.getByRole('button', { name: /search/i }));
    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(mockSetFocusedSymbol).not.toHaveBeenCalled();
  });

  it('shows a validation error for non-alpha input', () => {
    render(<CompanySearch />);
    fireEvent.change(screen.getByRole('textbox'), { target: { value: '123' } });
    fireEvent.click(screen.getByRole('button', { name: /search/i }));
    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(mockSetFocusedSymbol).not.toHaveBeenCalled();
  });

  it('calls setFocusedSymbol with uppercased symbol on valid submit', () => {
    render(<CompanySearch />);
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'aapl' } });
    fireEvent.click(screen.getByRole('button', { name: /search/i }));
    expect(mockSetFocusedSymbol).toHaveBeenCalledWith('AAPL');
  });

  it('calls setFocusedSymbol on Enter key press', () => {
    render(<CompanySearch />);
    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: 'MSFT' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(mockSetFocusedSymbol).toHaveBeenCalledWith('MSFT');
  });

  it('clears the validation error when the user starts typing after an error', () => {
    render(<CompanySearch />);
    // Trigger validation error
    fireEvent.click(screen.getByRole('button', { name: /search/i }));
    expect(screen.getByRole('alert')).toBeInTheDocument();
    // Start typing — error should disappear
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'I' } });
    expect(screen.queryByRole('alert')).toBeNull();
  });
});
