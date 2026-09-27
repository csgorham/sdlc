import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TimeWindowTabs } from '@/components/TimeWindowTabs/TimeWindowTabs';

describe('TimeWindowTabs', () => {
  it('renders all three tabs', () => {
    render(<TimeWindowTabs active="day" onChange={() => {}} />);
    expect(screen.getByText('Today')).toBeInTheDocument();
    expect(screen.getByText('7 Days')).toBeInTheDocument();
    expect(screen.getByText('Quarter')).toBeInTheDocument();
  });

  it('marks the active tab with aria-pressed=true', () => {
    render(<TimeWindowTabs active="7d" onChange={() => {}} />);
    const btn = screen.getByText('7 Days');
    expect(btn).toHaveAttribute('aria-pressed', 'true');
  });

  it('calls onChange with the selected window value', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<TimeWindowTabs active="day" onChange={onChange} />);
    await user.click(screen.getByText('Quarter'));
    expect(onChange).toHaveBeenCalledWith('quarter');
  });
});
