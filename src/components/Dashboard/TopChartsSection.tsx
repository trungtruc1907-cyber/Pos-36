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

  const productsChartData = {
    labels: topProductsRes.labels,
    datasets: [
      {
        label: productFilter === 'Theo số lượng' ? 'Số lượng' : 'Doanh thu (tr)',
        data: topProductsRes.values,
        backgroundColor: '#1e0b54',
        borderRadius: 3,
        barThickness: 12,
      },
    ],
  };

  const maxProdVal = Math.max(...topProductsRes.values, 5);
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

  const customersChartData = {
    labels: topCustomersRes.labels,
    datasets: [
      {
        label: 'Giá trị (tr)',
        data: topCustomersRes.values,
        backgroundColor: '#1e0b54',
        borderRadius: 3,
        barThickness: 12,
      },
    ],
  };

  const maxCustVal = Math.max(...topCustomersRes.values, 5);
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

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* Top 10 Products Card */}
      <section className="bg-white rounded-lg shadow-sm p-4 border border-gray-100 flex flex-col justify-between">
        <div className="flex flex-wrap justify-between items-center mb-3 gap-2">
          <h2 className="text-sm font-bold text-gray-800">Top 10 hàng bán chạy</h2>
          <div className="flex space-x-1 text-xs">
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

        <div className="h-80 w-full">
          <Bar data={productsChartData} options={productsChartOptions} />
        </div>
      </section>

      {/* Top 10 Customers Card */}
      <section className="bg-white rounded-lg shadow-sm p-4 border border-gray-100 flex flex-col justify-between">
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-sm font-bold text-gray-800">Top 10 khách mua nhiều nhất</h2>
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

        <div className="h-80 w-full">
          <Bar data={customersChartData} options={customersChartOptions} />
        </div>
      </section>
    </div>
  );
};
