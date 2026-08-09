import React from 'react';
import { Banknote, RotateCcw, ArrowDown, ArrowUp } from 'lucide-react';

interface StatsCardsProps {
  todayRevenue: number;
  todayOrdersCount: number;
  todayReturns: number;
  vsYesterdayPercent: number;
  vsLastMonthPercent: number;
}

export const StatsCards: React.FC<StatsCardsProps> = ({
  todayRevenue,
  todayReturns,
  vsYesterdayPercent,
  vsLastMonthPercent,
}) => {
  return (
    <section className="space-y-3">
      <h2 className="text-base font-bold text-gray-900 px-0.5">Kết quả bán hàng hôm nay</h2>

      {/* Row 1: 2 Cards (Doanh thu & Trả hàng) */}
      <div className="grid grid-cols-2 gap-3">
        {/* Doanh thu */}
        <div className="bg-white rounded-xl p-4 shadow-2xs border border-gray-100/80 flex flex-col justify-between">
          <div className="flex items-center space-x-2 text-gray-500 text-xs font-medium">
            <div className="w-7 h-7 rounded-lg bg-gray-100 flex items-center justify-center text-gray-700 shrink-0">
              <Banknote className="w-4 h-4" />
            </div>
            <span>Doanh thu</span>
          </div>
          <div className="text-xl sm:text-2xl font-bold text-[#1e0b54] mt-2 tracking-tight">
            {todayRevenue.toLocaleString('vi-VN')}
          </div>
        </div>

        {/* Trả hàng */}
        <div className="bg-white rounded-xl p-4 shadow-2xs border border-gray-100/80 flex flex-col justify-between">
          <div className="flex items-center space-x-2 text-gray-500 text-xs font-medium">
            <div className="w-7 h-7 rounded-lg bg-gray-100 flex items-center justify-center text-gray-700 shrink-0">
              <RotateCcw className="w-4 h-4" />
            </div>
            <span>Trả hàng</span>
          </div>
          <div className="text-xl sm:text-2xl font-bold text-[#1e0b54] mt-2 tracking-tight">
            {todayReturns.toLocaleString('vi-VN')}
          </div>
        </div>
      </div>

      {/* Row 2: Doanh thu thuần so với hôm qua */}
      <div className="bg-white rounded-xl p-3.5 sm:p-4 shadow-2xs border border-gray-100/80 flex items-center justify-between">
        <span className="text-xs sm:text-sm font-medium text-gray-700">Doanh thu thuần so với hôm qua</span>
        <div
          className={`px-3 py-1 rounded-full text-xs font-bold flex items-center space-x-0.5 ${
            vsYesterdayPercent >= 0
              ? 'bg-emerald-100/80 text-emerald-700'
              : 'bg-red-100/80 text-red-600'
          }`}
        >
          {vsYesterdayPercent >= 0 ? (
            <ArrowUp className="w-3.5 h-3.5 mr-0.5" />
          ) : (
            <ArrowDown className="w-3.5 h-3.5 mr-0.5" />
          )}
          <span>{vsYesterdayPercent > 0 ? `+${vsYesterdayPercent}%` : `${vsYesterdayPercent}%`}</span>
        </div>
      </div>

      {/* Row 3: So với cùng kỳ tháng trước */}
      <div className="bg-white rounded-xl p-3.5 sm:p-4 shadow-2xs border border-gray-100/80 flex items-center justify-between">
        <span className="text-xs sm:text-sm font-medium text-gray-700">So với cùng kỳ tháng trước</span>
        <div
          className={`px-3 py-1 rounded-full text-xs font-bold flex items-center space-x-0.5 ${
            vsLastMonthPercent >= 0
              ? 'bg-emerald-100/80 text-emerald-700'
              : 'bg-red-100/80 text-red-600'
          }`}
        >
          {vsLastMonthPercent >= 0 ? (
            <ArrowUp className="w-3.5 h-3.5 mr-0.5" />
          ) : (
            <ArrowDown className="w-3.5 h-3.5 mr-0.5" />
          )}
          <span>{vsLastMonthPercent > 0 ? `+${vsLastMonthPercent}%` : `${vsLastMonthPercent}%`}</span>
        </div>
      </div>
    </section>
  );
};

