import React, { useState } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import { Order } from '../../types';
import { getRevenueChartData } from '../../utils/dashboardUtils';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

interface RevenueChartSectionProps {
  orders: Order[];
}

export const RevenueChartSection: React.FC<RevenueChartSectionProps> = ({ orders }) => {
  const [activeTab, setActiveTab] = useState<'day' | 'hour' | 'weekday'>('day');
  const [timePeriod, setTimePeriod] = useState<string>('Tháng này');

  const chartRes = getRevenueChartData(orders, timePeriod, activeTab);

  const bgColors = chartRes.data.map((val) => {
    if (val === 0) return '#e2e8f0';
    const maxValInArr = Math.max(...chartRes.data);
    if (val === maxValInArr && maxValInArr > 0) return '#ffb830';
    return '#1e0b54';
  });

  const chartData = {
    labels: chartRes.labels,
    datasets: [
      {
        label: 'Doanh thu thuần (tr)',
        data: chartRes.data,
        backgroundColor: bgColors,
        borderRadius: 4,
        barThickness: activeTab === 'day' ? 24 : 28,
      },
    ],
  };

  const maxVal = Math.max(...chartRes.data, 10);
  const suggestedMax = Math.ceil(maxVal * 1.25);

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        callbacks: {
          label: (context: any) => `${context.parsed.y} triệu VNĐ`,
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        suggestedMax: suggestedMax,
        ticks: {
          callback: (value: any) => `${value} tr`,
          font: {
            size: 11,
          },
        },
        grid: {
          color: '#f3f4f6',
        },
        border: {
          display: false,
        },
      },
      x: {
        grid: {
          display: false,
        },
        border: {
          display: true,
          color: '#e5e7eb',
        },
      },
    },
  };

  return (
    <section className="bg-white rounded-lg shadow-sm p-4 border border-gray-100">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
        <div className="flex items-baseline space-x-3">
          <h2 className="text-base font-bold text-gray-800">Doanh thu thuần</h2>
          <span className="text-xl font-extrabold text-[#1e0b54]">
            {chartRes.totalNet.toLocaleString('vi-VN')}đ
          </span>
        </div>

        <select
          value={timePeriod}
          onChange={(e) => setTimePeriod(e.target.value)}
          className="border border-gray-300 rounded text-xs text-gray-700 py-1 pl-2 pr-6 bg-white focus:outline-none focus:border-[#1e0b54]"
        >
          <option>Tháng này</option>
          <option>Tháng trước</option>
          <option>Hôm nay</option>
          <option>Năm nay</option>
        </select>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-4">
        <nav className="-mb-px flex space-x-6 text-sm font-medium">
          <button
            onClick={() => setActiveTab('day')}
            className={`py-2 border-b-2 transition-colors ${
              activeTab === 'day'
                ? 'border-[#1e0b54] text-[#1e0b54] font-bold'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Theo ngày
          </button>
          <button
            onClick={() => setActiveTab('hour')}
            className={`py-2 border-b-2 transition-colors ${
              activeTab === 'hour'
                ? 'border-[#1e0b54] text-[#1e0b54] font-bold'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Theo giờ
          </button>
          <button
            onClick={() => setActiveTab('weekday')}
            className={`py-2 border-b-2 transition-colors ${
              activeTab === 'weekday'
                ? 'border-[#1e0b54] text-[#1e0b54] font-bold'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Theo thứ
          </button>
        </nav>
      </div>

      {/* Chart Canvas */}
      <div className="h-64 w-full">
        <Bar data={chartData} options={options} />
      </div>
    </section>
  );
};
