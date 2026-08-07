import React, { useState } from 'react';
import { Order, PurchaseOrder, ViewMode } from '../../types';
import { FileText, Search, Printer, CheckCircle2, ShoppingBag, Truck, RotateCcw } from 'lucide-react';

interface OrdersModalProps {
  orders: Order[];
  purchases?: PurchaseOrder[];
  currentView?: ViewMode;
  onSelectView?: (view: ViewMode) => void;
  onReprintOrder: (order: Order) => void;
}

export const OrdersModal: React.FC<OrdersModalProps> = ({
  orders,
  purchases = [],
  currentView = 'orders',
  onSelectView,
  onReprintOrder,
}) => {
  const [search, setSearch] = useState('');

  const isPurchaseMode = currentView === 'purchases' || currentView === 'purchase-returns';
  const isReturnMode = currentView === 'returns' || currentView === 'purchase-returns';

  // Headings based on current view mode
  const getHeaderInfo = () => {
    switch (currentView) {
      case 'purchases':
        return {
          title: 'Danh sách Nhập hàng (Mua hàng)',
          subtitle: 'Quản lý phiếu nhập hàng & đơn mua từ Nhà cung cấp vật tư Chống Thấm 36',
          icon: Truck,
        };
      case 'purchase-returns':
        return {
          title: 'Danh sách Trả hàng nhập',
          subtitle: 'Quản lý lịch sử phiếu trả hàng lại cho Nhà cung cấp',
          icon: RotateCcw,
        };
      case 'returns':
        return {
          title: 'Danh sách Trả hàng (Khách hàng)',
          subtitle: 'Quản lý đơn khách hàng hoàn trả sản phẩm & vật tư',
          icon: RotateCcw,
        };
      case 'orders':
      default:
        return {
          title: 'Quản lý Đơn hàng & Hóa đơn',
          subtitle: 'Lịch sử giao dịch bán hàng cửa hàng Chống Thấm 36',
          icon: FileText,
        };
    }
  };

  const headerInfo = getHeaderInfo();
  const IconComponent = headerInfo.icon;

  const filteredOrders = orders.filter(
    (o) =>
      o.orderCode.toLowerCase().includes(search.toLowerCase()) ||
      o.customerName.toLowerCase().includes(search.toLowerCase())
  );

  const filteredPurchases = purchases.filter(
    (p) =>
      p.code.toLowerCase().includes(search.toLowerCase()) ||
      p.supplierName.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex-1 bg-[#f3f4f6] p-4 flex flex-col space-y-4 overflow-auto">
      {/* Top Header */}
      <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 bg-indigo-50 text-[#1e0b54] rounded-lg border border-indigo-100">
            <IconComponent className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-base font-extrabold text-gray-900">{headerInfo.title}</h2>
            <p className="text-xs text-gray-500 mt-0.5">{headerInfo.subtitle}</p>
          </div>
        </div>

        {/* View Switcher Tabs */}
        {onSelectView && (
          <div className="flex items-center space-x-1 bg-gray-100 p-1 rounded-lg border border-gray-200 text-xs font-medium">
            <button
              onClick={() => onSelectView('purchases')}
              className={`px-3 py-1.5 rounded-md transition-colors ${
                currentView === 'purchases'
                  ? 'bg-[#1e0b54] text-white font-bold shadow-xs'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200'
              }`}
            >
              Nhập hàng
            </button>
            <button
              onClick={() => onSelectView('purchase-returns')}
              className={`px-3 py-1.5 rounded-md transition-colors ${
                currentView === 'purchase-returns'
                  ? 'bg-[#1e0b54] text-white font-bold shadow-xs'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200'
              }`}
            >
              Trả hàng nhập
            </button>
            <button
              onClick={() => onSelectView('orders')}
              className={`px-3 py-1.5 rounded-md transition-colors ${
                currentView === 'orders'
                  ? 'bg-[#1e0b54] text-white font-bold shadow-xs'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200'
              }`}
            >
              Hóa đơn bán
            </button>
            <button
              onClick={() => onSelectView('returns')}
              className={`px-3 py-1.5 rounded-md transition-colors ${
                currentView === 'returns'
                  ? 'bg-[#1e0b54] text-white font-bold shadow-xs'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200'
              }`}
            >
              Khách trả hàng
            </button>
          </div>
        )}
      </div>

      {/* Search Input */}
      <div className="bg-white rounded-lg shadow-sm p-3 border border-gray-100 relative">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={
            isPurchaseMode
              ? 'Tìm kiếm mã phiếu nhập (PN000...) hoặc tên Nhà cung cấp...'
              : 'Tìm kiếm mã hóa đơn (HD102...) hoặc tên khách hàng...'
          }
          className="w-full pl-9 pr-3 py-1.5 text-xs border border-gray-300 rounded-md focus:outline-none focus:border-[#1e0b54]"
        />
      </div>

      {/* Table Content */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden flex-1">
        {isPurchaseMode ? (
          /* Table for Mua hàng / Nhập hàng */
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100 border-b text-gray-600 font-bold uppercase text-[11px]">
              <tr>
                <th className="p-3">Mã phiếu nhập</th>
                <th className="p-3">Thời gian nhập</th>
                <th className="p-3">Nhà cung cấp</th>
                <th className="p-3 text-center">Số mặt hàng</th>
                <th className="p-3 text-right">Tổng tiền nhập</th>
                <th className="p-3 text-center">Trạng thái</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredPurchases.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-gray-400 italic">
                    Chưa có phiếu nhập hàng nào.
                  </td>
                </tr>
              ) : (
                filteredPurchases.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-3 font-mono font-bold text-[#1e0b54]">{p.code}</td>
                    <td className="p-3 text-gray-500">{p.date}</td>
                    <td className="p-3 font-bold text-gray-900">{p.supplierName}</td>
                    <td className="p-3 text-center font-bold">{p.itemsCount} mặt hàng</td>
                    <td className="p-3 text-right font-extrabold text-[#1e0b54] font-mono">
                      {p.totalAmount.toLocaleString('vi-VN')}đ
                    </td>
                    <td className="p-3 text-center">
                      <span className="bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-full font-bold text-[10px] inline-flex items-center border border-emerald-200">
                        <CheckCircle2 className="w-3 h-3 mr-1" />
                        {p.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        ) : (
          /* Table for Hóa đơn bán hàng / Trả hàng */
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
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-gray-400 italic">
                    Chưa có hóa đơn nào.
                  </td>
                </tr>
              ) : (
                filteredOrders.map((ord) => (
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
                ))
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};
