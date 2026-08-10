import React from 'react';
import { ArrowUp, ArrowDown, CornerUpLeft } from 'lucide-react';

interface StatsCardsProps {
  todayRevenue: number;
  todayOrdersCount: number;
  todayReturns: number;
  vsYesterdayPercent: number;
  vsLastMonthPercent: number;
}

export const StatsCards: React.FC<StatsCardsProps> = ({
  todayRevenue,
  todayOrdersCount,
  todayReturns,
  vsYesterdayPercent,
  vsLastMonthPercent,
}) => {
  const safeYesterday = isNaN(vsYesterdayPercent) || !isFinite(vsYesterdayPercent) ? 0 : vsYesterdayPercent;
  const safeLastMonth = isNaN(vsLastMonthPercent) || !isFinite(vsLastMonthPercent) ? 0 : vsLastMonthPercent;
  return (
    <section className="bg-white rounded-xl shadow-2xs border border-gray-100 p-5 sm:p-6">
      <h2 className="text-lg font-bold text-gray-900 mb-5">Kết quả bán hàng hôm nay</h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-y-5 sm:gap-y-6 lg:gap-y-0 divide-y sm:divide-y-0 divide-gray-100">
        
        {/* Item 1: Doanh thu */}
        <div className="flex items-start space-x-3.5 pr-0 lg:pr-4 pt-1 sm:pt-0">
          <div className="w-8 h-8 rounded-full bg-[#1890ff] text-white flex items-center justify-center font-bold text-sm shrink-0 mt-0.5 shadow-2xs">
            $
          </div>
          <div>
            <div className="text-xs text-gray-500 font-normal">Doanh thu</div>
            <div className="text-xl sm:text-2xl font-extrabold text-gray-900 tracking-tight leading-snug">
              {(todayRevenue || 0).toLocaleString('vi-VN')}
            </div>
            <div className="text-xs text-gray-400 mt-0.5">{todayOrdersCount} hóa đơn</div>
          </div>
        </div>

        {/* Item 2: Trả hàng */}
        <div className="flex items-start space-x-3.5 pt-4 sm:pt-0 lg:px-4 lg:border-l lg:border-gray-200/80">
          <div className="w-7 h-7 rounded-md bg-[#ff7a00] text-white flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
            <CornerUpLeft className="w-4 h-4 text-white stroke-[2.5]" />
          </div>
          <div>
            <div className="text-xs text-gray-500 font-normal">Trả hàng</div>
            <div className="text-xl sm:text-2xl font-extrabold text-gray-900 tracking-tight leading-snug">
              {(todayReturns || 0).toLocaleString('vi-VN')}
            </div>
          </div>
        </div>

        {/* Item 3: Doanh thu thuần - So với hôm qua */}
        <div className="flex items-start space-x-3 pt-4 sm:pt-0 lg:px-4 lg:border-l lg:border-gray-200/80">
          <div className="shrink-0 mt-0.5">
            {safeYesterday >= 0 ? (
              <ArrowUp className="w-5 h-5 text-[#00b074] stroke-[2.5]" />
            ) : (
              <ArrowDown className="w-5 h-5 text-red-500 stroke-[2.5]" />
            )}
          </div>
          <div>
            <div className="text-xs text-gray-500 font-normal">Doanh thu thuần</div>
            <div className="text-xl sm:text-2xl font-extrabold text-gray-900 tracking-tight leading-snug">
              {safeYesterday > 0 ? `+${safeYesterday}%` : `${safeYesterday}%`}
            </div>
            <div className="text-xs text-gray-400 mt-0.5">So với hôm qua</div>
          </div>
        </div>

        {/* Item 4: Doanh thu thuần - So với cùng kỳ tháng trước */}
        <div className="flex items-start space-x-3 pt-4 sm:pt-0 lg:pl-4 lg:border-l lg:border-gray-200/80">
          <div className="shrink-0 mt-0.5">
            {safeLastMonth >= 0 ? (
              <ArrowUp className="w-5 h-5 text-[#00b074] stroke-[2.5]" />
            ) : (
              <ArrowDown className="w-5 h-5 text-red-500 stroke-[2.5]" />
            )}
          </div>
          <div>
            <div className="text-xs text-gray-500 font-normal">Doanh thu thuần</div>
            <div className="text-xl sm:text-2xl font-extrabold text-gray-900 tracking-tight leading-snug">
              {safeLastMonth > 0 ? `+${safeLastMonth}%` : `${safeLastMonth}%`}
            </div>
            <div className="text-xs text-gray-400 mt-0.5">So với cùng kỳ tháng trước</div>
          </div>
        </div>

      </div>
    </section>
  );
};


