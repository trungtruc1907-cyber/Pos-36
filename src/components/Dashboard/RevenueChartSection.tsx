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
import { REVENUE_DAILY_CHART } from '../../data/mockData';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

interface RevenueChartSectionProps {
  totalRevenueNet: number;
}

export const RevenueChartSection: React.FC<RevenueChartSectionProps> = ({ totalRevenueNet }) => {
  const [activeTab, setActiveTab] = useState<'day' | 'hour' | 'weekday'>('day');
  const [timePeriod, setTimePeriod] = useState<string>('Tháng này');

  // Chart data setup based on tab
  const getChartData = () => {
    if (activeTab === 'hour') {
      return {
        labels: ['08h', '10h', '12h', '14h', '16h', '18h', '20h'],
        datasets: [
          {
            label: 'Doanh thu thuần (tr)',
            data: [2.5, 8.1, 14.2, 19.8, 11.0, 5.2, 2.1],
            backgroundColor: '#1e0b54',
            borderRadius: 4,
            barThickness: 24,
          },
        ],
      };
    } else if (activeTab === 'weekday') {
      return {
        labels: ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'Chủ Nhật'],
        datasets: [
          {
            label: 'Doanh thu thuần (tr)',
            data: [12.4, 18.2, 8.6, 14.1, 22.0, 31.5, 15.0],
            backgroundColor: '#1e0b54',
            borderRadius: 4,
            barThickness: 24,
          },
        ],
      };
    }

    // Default 'day'
    return {
      labels: REVENUE_DAILY_CHART.map((item) => item.day),
      datasets: [
        {
          label: 'Doanh thu thuần (tr)',
          data: REVENUE_DAILY_CHART.map((item) => item.amount),
          backgroundColor: '#1e0b54',
          borderRadius: 4,
          barThickness: 22,
        },
      ],
    };
  };

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
        max: 30,
        ticks: {
          stepSize: 3,
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
            {totalRevenueNet.toLocaleString('vi-VN')}đ
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
        <Bar data={getChartData()} options={options} />
      </div>
    </section>
  );
};
