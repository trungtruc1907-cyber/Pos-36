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
import { ChevronRight, BarChart2, List } from 'lucide-react';
import { Order, Product } from '../../types';
import { getTopProductsData, getTopCustomersData } from '../../utils/dashboardUtils';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

interface TopChartsSectionProps {
  orders: Order[];
  products: Product[];
}

export const TopChartsSection: React.FC<TopChartsSectionProps> = ({ orders, products }) => {
  const [productFilter, setProductFilter] = useState('Theo doanh thu thuần');
  const [timeFilterProducts, setTimeFilterProducts] = useState('Tháng này');
  const [timeFilterCustomers, setTimeFilterCustomers] = useState('Tháng này');

  // Compute Top Products dynamically from DB
  const topProductsRes = getTopProductsData(orders, products, timeFilterProducts, productFilter);
  const cleanProdValues = (topProductsRes?.values || []).map((v) => (isNaN(v) || v == null ? 0 : v));

  const productsChartData = {
    labels: topProductsRes?.labels || [],
    datasets: [
      {
        label: productFilter === 'Theo số lượng' ? 'Số lượng' : 'Doanh thu (tr)',
        data: cleanProdValues,
        backgroundColor: '#1e0b54',
        borderRadius: 3,
        barThickness: 12,
      },
    ],
  };

  const rawMaxProd = Math.max(...cleanProdValues, 5);
  const maxProdVal = isNaN(rawMaxProd) || !isFinite(rawMaxProd) ? 5 : rawMaxProd;
  const suggestedMaxProd = Math.ceil(maxProdVal * 1.2);

  const productsChartOptions = {
    indexAxis: 'y' as const,
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (context: any) =>
            productFilter === 'Theo số lượng'
              ? `${context.parsed.x} sản phẩm`
              : `${context.parsed.x} tr VNĐ`,
        },
      },
    },
    scales: {
      x: {
        beginAtZero: true,
        suggestedMax: suggestedMaxProd,
        grid: { color: '#f3f4f6' },
        ticks: {
          callback: (value: any) =>
            productFilter === 'Theo số lượng'
              ? `${value}`
              : value > 0
              ? `${value} tr`
              : '0',
          font: { size: 10 },
        },
      },
      y: {
        grid: { display: false },
        ticks: {
          font: { size: 10 },
          color: '#374151',
          callback: function(this: any, val: any) {
            const label = this.getLabelForValue(val as number);
            return typeof label === 'string' && label.length > 20 ? label.substring(0, 18) + '…' : label;
          },
        },
      },
    },
  };

  // Compute Top Customers dynamically from DB
  const topCustomersRes = getTopCustomersData(orders, timeFilterCustomers);
  const cleanCustValues = (topCustomersRes?.values || []).map((v) => (isNaN(v) || v == null ? 0 : v));

  const customersChartData = {
    labels: topCustomersRes?.labels || [],
    datasets: [
      {
        label: 'Giá trị (tr)',
        data: cleanCustValues,
        backgroundColor: '#1e0b54',
        borderRadius: 3,
        barThickness: 12,
      },
    ],
  };

  const rawMaxCust = Math.max(...cleanCustValues, 5);
  const maxCustVal = isNaN(rawMaxCust) || !isFinite(rawMaxCust) ? 5 : rawMaxCust;
  const suggestedMaxCust = Math.ceil(maxCustVal * 1.2);

  const customersChartOptions = {
    indexAxis: 'y' as const,
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (context: any) => `${context.parsed.x} tr VNĐ`,
        },
      },
    },
    scales: {
      x: {
        beginAtZero: true,
        suggestedMax: suggestedMaxCust,
        grid: { color: '#f3f4f6' },
        ticks: {
          callback: (value: any) => (value > 0 ? `${value} tr` : '0'),
          font: { size: 10 },
        },
      },
      y: {
        grid: { display: false },
        ticks: {
          font: { size: 10 },
          color: '#374151',
          callback: function(this: any, val: any) {
            const label = this.getLabelForValue(val as number);
            return typeof label === 'string' && label.length > 20 ? label.substring(0, 18) + '…' : label;
          },
        },
      },
    },
  };

  const [productDisplayMode, setProductDisplayMode] = useState<'list' | 'chart'>('list');

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* Top 10 Products Card */}
      <section className="bg-white rounded-xl shadow-2xs p-4 border border-gray-100/80 flex flex-col justify-between">
        <div className="flex justify-between items-center mb-3">
          <div className="flex items-center space-x-1 cursor-pointer group">
            <h2 className="text-base font-bold text-gray-900 group-hover:text-[#1e0b54] transition-colors">
              Top 10 hàng bán chạy
            </h2>
            <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-[#1e0b54] transition-colors" />
          </div>

          <div className="flex items-center space-x-1.5 text-xs">
            <button
              onClick={() => setProductDisplayMode(productDisplayMode === 'list' ? 'chart' : 'list')}
              className="p-1 text-gray-500 hover:text-[#1e0b54] transition-colors rounded hover:bg-gray-100"
              title="Đổi chế độ xem"
            >
              {productDisplayMode === 'list' ? <BarChart2 className="w-4 h-4" /> : <List className="w-4 h-4" />}
            </button>
            <select
              value={productFilter}
              onChange={(e) => setProductFilter(e.target.value)}
              className="border border-gray-200 rounded py-0.5 px-1.5 text-gray-600 bg-gray-50 focus:outline-none"
            >
              <option>Theo doanh thu thuần</option>
              <option>Theo số lượng</option>
            </select>
            <select
              value={timeFilterProducts}
              onChange={(e) => setTimeFilterProducts(e.target.value)}
              className="border border-gray-200 rounded py-0.5 px-1.5 text-gray-600 bg-gray-50 focus:outline-none"
            >
              <option>Tháng này</option>
              <option>Tháng trước</option>
              <option>Hôm nay</option>
            </select>
          </div>
        </div>

        {productDisplayMode === 'list' ? (
          <div className="divide-y divide-gray-100/80 my-1">
            {topProductsRes.labels.length > 0 ? (
              topProductsRes.labels.map((label, idx) => (
                <div key={idx} className="flex items-center justify-between py-2.5 text-xs sm:text-sm hover:bg-gray-50/60 px-1 rounded transition-colors">
                  <div className="flex items-center space-x-3 min-w-0 pr-2">
                    <span className="font-bold text-gray-400 text-xs w-6 shrink-0">#{idx + 1}</span>
                    <span className="font-medium text-gray-800 truncate">{label}</span>
                  </div>
                  <span className="font-bold text-[#1e0b54] shrink-0 text-xs sm:text-sm">
                    {productFilter === 'Theo số lượng'
                      ? `${topProductsRes.values[idx]} SL`
                      : `${topProductsRes.values[idx]} tr VNĐ`}
                  </span>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-xs text-gray-400">Chưa có dữ liệu bán hàng.</div>
            )}
          </div>
        ) : (
          <div className="h-72 w-full">
            <Bar data={productsChartData} options={productsChartOptions} />
          </div>
        )}
      </section>

      {/* Top 10 Customers Card */}
      <section className="bg-white rounded-xl shadow-2xs p-4 border border-gray-100/80 flex flex-col justify-between">
        <div className="flex justify-between items-center mb-3">
          <div className="flex items-center space-x-1 cursor-pointer group">
            <h2 className="text-base font-bold text-gray-900 group-hover:text-[#1e0b54] transition-colors">
              Top 10 khách mua nhiều nhất
            </h2>
            <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-[#1e0b54] transition-colors" />
          </div>
          <select
            value={timeFilterCustomers}
            onChange={(e) => setTimeFilterCustomers(e.target.value)}
            className="border border-gray-200 rounded py-0.5 px-1.5 text-xs text-gray-600 bg-gray-50 focus:outline-none"
          >
            <option>Tháng này</option>
            <option>Tháng trước</option>
            <option>Hôm nay</option>
          </select>
        </div>

        <div className="h-72 w-full">
          <Bar data={customersChartData} options={customersChartOptions} />
        </div>
      </section>
    </div>
  );
};
