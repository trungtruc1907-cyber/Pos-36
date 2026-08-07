import React, { useState } from 'react';
import { Order } from '../../types';
import { FileText, Search, Printer, CheckCircle2 } from 'lucide-react';

interface OrdersModalProps {
  orders: Order[];
  onReprintOrder: (order: Order) => void;
}

export const OrdersModal: React.FC<OrdersModalProps> = ({ orders, onReprintOrder }) => {
  const [search, setSearch] = useState('');

  const filtered = orders.filter(
    (o) =>
      o.orderCode.toLowerCase().includes(search.toLowerCase()) ||
      o.customerName.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex-1 bg-[#f3f4f6] p-4 flex flex-col space-y-4 overflow-auto">
      {/* Top Header */}
      <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-100 flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <FileText className="w-6 h-6 text-[#1e0b54]" />
          <div>
            <h2 className="text-base font-extrabold text-gray-900">Quản lý Đơn hàng & Hóa đơn</h2>
            <p className="text-xs text-gray-500">Lịch sử giao dịch bán hàng cửa hàng Chống Thấm 36</p>
          </div>
        </div>
      </div>

      {/* Search Input */}
      <div className="bg-white rounded-lg shadow-sm p-3 border border-gray-100 relative">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Tìm kiếm mã hóa đơn hoặc tên khách hàng..."
          className="w-full pl-9 pr-3 py-1.5 text-xs border border-gray-300 rounded-md focus:outline-none focus:border-[#1e0b54]"
        />
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden flex-1">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-100 border-b text-gray-600 font-bold uppercase text-[11px]">
            <tr>
              <th className="p-3">Mã hóa đơn</th>
              <th className="p-3">Thời gian</th>
              <th className="p-3">Khách hàng</th>
              <th className="p-3 text-center">Số lượng</th>
              <th className="p-3 text-right">Tổng tiền</th>
              <th className="p-3 text-center">Trạng thái</th>
              <th className="p-3 text-center">In lại</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filtered.map((ord) => (
              <tr key={ord.id} className="hover:bg-slate-50 transition-colors">
                <td className="p-3 font-mono font-bold text-[#1e0b54]">{ord.orderCode}</td>
                <td className="p-3 text-gray-500">{ord.date}</td>
                <td className="p-3 font-bold text-gray-900">{ord.customerName}</td>
                <td className="p-3 text-center font-bold">{ord.itemsCount} sp</td>
                <td className="p-3 text-right font-extrabold text-[#1e0b54] font-mono">
                  {ord.totalAmount.toLocaleString('vi-VN')}đ
                </td>
                <td className="p-3 text-center">
                  <span className="bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded font-bold text-[10px] inline-flex items-center">
                    <CheckCircle2 className="w-3 h-3 mr-1" />
                    {ord.status}
                  </span>
                </td>
                <td className="p-3 text-center">
                  <button
                    onClick={() => onReprintOrder(ord)}
                    className="p-1 hover:bg-gray-100 rounded text-gray-600 hover:text-[#1e0b54]"
                    title="In lại hóa đơn"
                  >
                    <Printer className="w-4 h-4 mx-auto" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
