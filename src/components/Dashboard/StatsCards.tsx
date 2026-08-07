import React from 'react';
import { DollarSign, RotateCcw, ArrowDown, ArrowUp } from 'lucide-react';

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
  return (
    <section className="bg-white rounded-lg shadow-sm p-4 border border-gray-100">
      <h2 className="text-base font-bold text-gray-800 mb-4">Kết quả bán hàng hôm nay</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Stat Card 1: Doanh thu */}
        <div className="flex items-center p-2 rounded-md hover:bg-gray-50 transition-colors">
          <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-[#1e0b54] mr-3 shrink-0">
            <DollarSign className="w-5 h-5 text-[#1e0b54]" />
          </div>
          <div>
            <div className="text-xs text-gray-500 font-medium">Doanh thu</div>
            <div className="text-lg font-extrabold text-gray-900">
              {todayRevenue.toLocaleString('vi-VN')}
            </div>
            <div className="text-xs text-gray-400">{todayOrdersCount} hóa đơn</div>
          </div>
        </div>

        {/* Stat Card 2: Trả hàng */}
        <div className="flex items-center p-2 rounded-md hover:bg-gray-50 transition-colors sm:border-l sm:border-gray-100 sm:pl-4">
          <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center text-amber-600 mr-3 shrink-0">
            <RotateCcw className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-gray-500 font-medium">Trả hàng</div>
            <div className="text-lg font-extrabold text-gray-900">
              {todayReturns.toLocaleString('vi-VN')}
            </div>
          </div>
        </div>

        {/* Stat Card 3: Doanh thu thuần so với hôm qua */}
        <div className="flex items-center p-2 rounded-md hover:bg-gray-50 transition-colors lg:border-l lg:border-gray-100 lg:pl-4">
          <div
            className={`w-10 h-10 rounded-full flex items-center justify-center mr-3 shrink-0 ${
              vsYesterdayPercent >= 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-500'
            }`}
          >
            {vsYesterdayPercent >= 0 ? (
              <ArrowUp className="w-6 h-6 text-emerald-600" />
            ) : (
              <ArrowDown className="w-6 h-6 text-red-500" />
            )}
          </div>
          <div>
            <div className="text-xs text-gray-500 font-medium">Doanh thu thuần</div>
            <div
              className={`text-lg font-extrabold ${
                vsYesterdayPercent >= 0 ? 'text-emerald-600' : 'text-red-600'
              }`}
            >
              {vsYesterdayPercent > 0 ? `+${vsYesterdayPercent}%` : `${vsYesterdayPercent}%`}
            </div>
            <div className="text-xs text-gray-400">So với hôm qua</div>
          </div>
        </div>

        {/* Stat Card 4: So với cùng kỳ tháng trước */}
        <div className="flex items-center p-2 rounded-md hover:bg-gray-50 transition-colors lg:border-l lg:border-gray-100 lg:pl-4">
          <div
            className={`w-10 h-10 rounded-full flex items-center justify-center mr-3 shrink-0 ${
              vsLastMonthPercent >= 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-500'
            }`}
          >
            {vsLastMonthPercent >= 0 ? (
              <ArrowUp className="w-6 h-6 text-emerald-600" />
            ) : (
              <ArrowDown className="w-6 h-6 text-red-500" />
            )}
          </div>
          <div>
            <div className="text-xs text-gray-500 font-medium">Doanh thu thuần</div>
            <div
              className={`text-lg font-extrabold ${
                vsLastMonthPercent >= 0 ? 'text-emerald-600' : 'text-red-600'
              }`}
            >
              {vsLastMonthPercent > 0 ? `+${vsLastMonthPercent}%` : `${vsLastMonthPercent}%`}
            </div>
            <div className="text-xs text-gray-400">So với cùng kỳ tháng trước</div>
          </div>
        </div>
      </div>
    </section>
  );
};
