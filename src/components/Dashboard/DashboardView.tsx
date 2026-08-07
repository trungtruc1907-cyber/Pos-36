import React from 'react';
import { StatsCards } from './StatsCards';
import { RevenueChartSection } from './RevenueChartSection';
import { TopChartsSection } from './TopChartsSection';
import { RightSidebar } from './RightSidebar';
import { ActivityLog } from '../../types';

interface DashboardViewProps {
  activityLogs: ActivityLog[];
  todayRevenue: number;
  todayOrdersCount: number;
  onOpenQrInfo: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  activityLogs,
  todayRevenue,
  todayOrdersCount,
  onOpenQrInfo,
}) => {
  return (
    <main className="flex-1 bg-[#f3f4f6] p-4 flex flex-col lg:flex-row gap-4 overflow-auto">
      {/* Left Column: Stats & Charts */}
      <div className="flex-1 space-y-4 min-w-0">
        <StatsCards
          todayRevenue={todayRevenue}
          todayOrdersCount={todayOrdersCount}
          todayReturns={0}
          vsYesterdayPercent={-74.09}
          vsLastMonthPercent={28.52}
        />

        <RevenueChartSection totalRevenueNet={62907000} />

        <TopChartsSection />
      </div>

      {/* Right Column: Promos & Recent Activities */}
      <RightSidebar
        activityLogs={activityLogs}
        onOpenQrInfo={onOpenQrInfo}
      />
    </main>
  );
};
