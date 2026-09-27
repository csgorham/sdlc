import type { TimeWindow } from '@/types/finance';
import { useDashboardStore } from '@/store/dashboardStore';
import { TimeWindowTabs } from '@/components/TimeWindowTabs/TimeWindowTabs';
import { CompanySearch } from '@/components/CompanySearch/CompanySearch';
import { FocusedCompanyPanel } from '@/components/FocusedCompanyPanel/FocusedCompanyPanel';
import styles from './DashboardLayout.module.css';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const activeWindow = useDashboardStore((s) => s.activeWindow);
  const setWindow = useDashboardStore((s) => s.setWindow);

  return (
    <div className={styles.wrapper}>
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <div className={styles.brand}>
            <span className={styles.brandIbm}>IBM</span>
            <span className={styles.brandTitle}>Finance Dashboard</span>
          </div>
          <TimeWindowTabs
            active={activeWindow}
            onChange={(w: TimeWindow) => setWindow(w)}
          />
          {/* Company search — right side of header; additive, no changes to tabs or brand */}
          <CompanySearch />
        </div>
      </header>
      <main className={styles.main}>
        {children}
        {/* Focused panel renders below the active view; returns null when no symbol selected */}
        <FocusedCompanyPanel />
      </main>
    </div>
  );
}
