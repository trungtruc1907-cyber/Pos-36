import React from 'react';
import { StatsCards } from './StatsCards';
import { RevenueChartSection } from './RevenueChartSection';
import { TopChartsSection } from './TopChartsSection';
import { RightSidebar } from './RightSidebar';
import { Order, Product, ActivityLog } from '../../types';
import { getDashboardStats, getActivityLogsFromOrders } from '../../utils/dashboardUtils';

interface DashboardViewProps {
  orders: Order[];
  products: Product[];
  activityLogs?: ActivityLog[];
  todayRevenue?: number;
  todayOrdersCount?: number;
  onOpenQrInfo: () => void;
  onSelectOrder?: (orderCode: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  orders,
  products,
  activityLogs: externalActivityLogs,
  onOpenQrInfo,
  onSelectOrder,
}) => {
  const stats = getDashboardStats(orders, products);
  const dynamicLogs = getActivityLogsFromOrders(orders);
  const activeLogs = externalActivityLogs && externalActivityLogs.length > 0 ? externalActivityLogs : dynamicLogs;

  return (
    <main className="flex-1 bg-[#f3f4f6] p-4 flex flex-col lg:flex-row gap-4 overflow-auto">
      {/* Left Column: Stats & Charts */}
      <div className="flex-1 space-y-4 min-w-0">
        <StatsCards
          todayRevenue={stats.todayRevenue}
          todayOrdersCount={stats.todayOrdersCount}
          todayReturns={stats.todayReturns}
          vsYesterdayPercent={stats.vsYesterdayPercent}
          vsLastMonthPercent={stats.vsLastMonthPercent}
        />

        <RevenueChartSection orders={orders} />

        <TopChartsSection orders={orders} products={products} />
      </div>

      {/* Right Column: Promos & Recent Activities */}
      <RightSidebar
        activityLogs={activeLogs}
        onOpenQrInfo={onOpenQrInfo}
        onSelectOrder={onSelectOrder}
      />
    </main>
  );
};
