import { useDashboardStore } from '@/store/dashboardStore';
import { DashboardLayout } from '@/components/DashboardLayout/DashboardLayout';
import { ErrorBoundary } from '@/components/ErrorBoundary/ErrorBoundary';
import { DayView } from '@/views/DayView/DayView';
import { WeekView } from '@/views/WeekView/WeekView';
import { QuarterView } from '@/views/QuarterView/QuarterView';

export default function App() {
  const activeWindow = useDashboardStore((s) => s.activeWindow);

  const view = {
    day: <DayView />,
    '7d': <WeekView />,
    quarter: <QuarterView />,
  }[activeWindow];

  return (
    <ErrorBoundary>
      <DashboardLayout>
        <ErrorBoundary>{view}</ErrorBoundary>
      </DashboardLayout>
    </ErrorBoundary>
  );
}
