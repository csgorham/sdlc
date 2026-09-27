import type { TimeWindow } from '@/types/finance';
import styles from './TimeWindowTabs.module.css';

const TABS: { label: string; value: TimeWindow }[] = [
  { label: 'Today', value: 'day' },
  { label: '7 Days', value: '7d' },
  { label: 'Quarter', value: 'quarter' },
];

interface TimeWindowTabsProps {
  active: TimeWindow;
  onChange: (window: TimeWindow) => void;
}

export function TimeWindowTabs({ active, onChange }: TimeWindowTabsProps) {
  return (
    <nav className={styles.tabs} aria-label="Time window">
      {TABS.map(({ label, value }) => (
        <button
          key={value}
          className={`${styles.tab} ${active === value ? styles.active : ''}`}
          onClick={() => onChange(value)}
          aria-pressed={active === value}
        >
          {label}
        </button>
      ))}
    </nav>
  );
}
