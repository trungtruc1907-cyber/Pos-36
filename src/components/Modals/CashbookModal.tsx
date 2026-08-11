import React, { useState } from 'react';
import { Wallet, CreditCard, Plus, ArrowUpRight, ArrowDownLeft } from 'lucide-react';
import { Order, PurchaseOrder, DebtPaymentRecord } from '../../types';

interface CashbookModalProps {
  todayRevenue?: number;
  orders?: Order[];
  purchases?: PurchaseOrder[];
  debtPayments?: DebtPaymentRecord[];
}

interface CustomTransaction {
  id: string;
  type: 'Thu' | 'Chi';
  method: 'Tiền mặt' | 'Chuyển khoản';
  description: string;
  date: string;
  amount: number;
}

export const CashbookModal: React.FC<CashbookModalProps> = ({ orders = [], purchases = [], debtPayments = [] }) => {
  const [customTransactions, setCustomTransactions] = useState<CustomTransaction[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTransType, setNewTransType] = useState<'Thu' | 'Chi'>('Thu');
  const [newTransMethod, setNewTransMethod] = useState<'Tiền mặt' | 'Chuyển khoản'>('Tiền mặt');
  const [newTransDesc, setNewTransDesc] = useState('');
  const [newTransAmount, setNewTransAmount] = useState<number | string>('');

  const isBankMethod = (method?: string) => {
    if (!method) return false;
    const m = method.toLowerCase();
    return (
      m === 'transfer' ||
      m === 'card' ||
      m === 'wallet' ||
      m === 'qr' ||
      m.includes('chuyển khoản') ||
      m.includes('thẻ') ||
      m.includes('ví')
    );
  };

  const isCashMethod = (method?: string) => {
    if (!method) return true;
    const m = method.toLowerCase();
    return m === 'cash' || m.includes('tiền mặt') || !isBankMethod(method);
  };

  // Compute Cash In / Cash Out from orders & purchases + debt payments + custom transactions
  const isReturnOrder = (o: Order) => o.status === 'Trả hàng' || o.orderCode.startsWith('HDTH') || o.orderCode.startsWith('TH');

  const cashInFromOrders = orders
    .filter((o) => isCashMethod(o.paymentMethod) && o.status !== 'Đã hủy' && !isReturnOrder(o) && (o.amountPaid || 0) > 0)
    .reduce((sum, o) => sum + (o.amountPaid || 0), 0);

  const cashOutFromOrderReturns = orders
    .filter((o) => isCashMethod(o.paymentMethod) && o.status !== 'Đã hủy' && isReturnOrder(o) && (o.amountPaid || 0) > 0)
    .reduce((sum, o) => sum + (o.amountPaid || 0), 0);

  const cashInFromCustomerDebt = debtPayments
    .filter((dp) => dp.type === 'customer_debt_pay' && isCashMethod(dp.paymentMethod))
    .reduce((sum, dp) => sum + (dp.amount || 0), 0);

  const cashInFromPurchaseReturns = purchases
    .filter((p) => (p.type === 'return' || p.code.startsWith('THN')) && p.status !== 'Phiếu tạm' && (p.paidAmount || 0) > 0)
    .reduce((sum, p) => sum + (p.paidAmount || 0), 0);

  const cashOutFromPurchases = purchases
    .filter((p) => p.type !== 'return' && !p.code.startsWith('THN') && p.status !== 'Phiếu tạm' && (p.paidAmount || 0) > 0)
    .reduce((sum, p) => sum + (p.paidAmount || 0), 0);

  const cashOutFromSupplierDebt = debtPayments
    .filter((dp) => dp.type === 'supplier_debt_pay' && isCashMethod(dp.paymentMethod))
    .reduce((sum, dp) => sum + (dp.amount || 0), 0);

  const customCashIn = customTransactions
    .filter((t) => t.method === 'Tiền mặt' && t.type === 'Thu')
    .reduce((sum, t) => sum + t.amount, 0);

  const customCashOut = customTransactions
    .filter((t) => t.method === 'Tiền mặt' && t.type === 'Chi')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalCashIn = cashInFromOrders + cashInFromCustomerDebt + cashInFromPurchaseReturns + customCashIn;
  const totalCashOut = cashOutFromPurchases + cashOutFromSupplierDebt + cashOutFromOrderReturns + customCashOut;
  const totalCash = totalCashIn - totalCashOut;

  // Compute Bank / Transfer In / Out
  const bankInFromOrders = orders
    .filter((o) => isBankMethod(o.paymentMethod) && o.status !== 'Đã hủy' && !isReturnOrder(o) && (o.amountPaid || 0) > 0)
    .reduce((sum, o) => sum + (o.amountPaid || 0), 0);

  const bankOutFromOrderReturns = orders
    .filter((o) => isBankMethod(o.paymentMethod) && o.status !== 'Đã hủy' && isReturnOrder(o) && (o.amountPaid || 0) > 0)
    .reduce((sum, o) => sum + (o.amountPaid || 0), 0);

  const bankInFromCustomerDebt = debtPayments
    .filter((dp) => dp.type === 'customer_debt_pay' && isBankMethod(dp.paymentMethod))
    .reduce((sum, dp) => sum + (dp.amount || 0), 0);

  const bankOutFromSupplierDebt = debtPayments
    .filter((dp) => dp.type === 'supplier_debt_pay' && isBankMethod(dp.paymentMethod))
    .reduce((sum, dp) => sum + (dp.amount || 0), 0);

  const customBankIn = customTransactions
    .filter((t) => t.method === 'Chuyển khoản' && t.type === 'Thu')
    .reduce((sum, t) => sum + t.amount, 0);

  const customBankOut = customTransactions
    .filter((t) => t.method === 'Chuyển khoản' && t.type === 'Chi')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalBankIn = bankInFromOrders + bankInFromCustomerDebt + customBankIn;
  const totalBankOut = bankOutFromSupplierDebt + bankOutFromOrderReturns + customBankOut;
  const totalBank = totalBankIn - totalBankOut;

  const totalFund = totalCash + totalBank;

  // Build Transaction Lists
  const cashList: CustomTransaction[] = [
    ...orders
      .filter((o) => isCashMethod(o.paymentMethod) && o.status !== 'Đã hủy' && !isReturnOrder(o) && (o.amountPaid || 0) > 0)
      .map((o) => ({
        id: o.id,
        type: 'Thu' as const,
        method: 'Tiền mặt' as const,
        description: `Thu tiền bán hàng đơn ${o.orderCode} (${o.customerName || 'Khách lẻ'})`,
        date: o.date,
        amount: o.amountPaid || 0,
      })),
    ...orders
      .filter((o) => isCashMethod(o.paymentMethod) && o.status !== 'Đã hủy' && isReturnOrder(o) && (o.amountPaid || 0) > 0)
      .map((o) => ({
        id: o.id,
        type: 'Chi' as const,
        method: 'Tiền mặt' as const,
        description: `Chi trả lại tiền cho KH: ${o.customerName || 'Khách lẻ'} (${o.orderCode})`,
        date: o.date,
        amount: o.amountPaid || 0,
      })),
    ...debtPayments
      .filter((dp) => dp.type === 'customer_debt_pay' && isCashMethod(dp.paymentMethod))
      .map((dp) => ({
        id: dp.id,
        type: 'Thu' as const,
        method: 'Tiền mặt' as const,
        description: `Thu nợ KH: ${dp.entityName}${dp.entityCode ? ' (' + dp.entityCode + ')' : ''}${dp.note ? ' - ' + dp.note : ''}`,
        date: dp.date,
        amount: dp.amount || 0,
      })),
    ...purchases
      .filter((p) => (p.type === 'return' || p.code.startsWith('THN')) && p.status !== 'Phiếu tạm' && (p.paidAmount || 0) > 0)
      .map((p) => ({
        id: p.id,
        type: 'Thu' as const,
        method: 'Tiền mặt' as const,
        description: `Thu tiền hoàn trả hàng nhập ${p.code} (${p.supplierName})`,
        date: p.date,
        amount: p.paidAmount || 0,
      })),
    ...purchases
      .filter((p) => p.type !== 'return' && !p.code.startsWith('THN') && p.status !== 'Phiếu tạm' && (p.paidAmount || 0) > 0)
      .map((p) => ({
        id: p.id,
        type: 'Chi' as const,
        method: 'Tiền mặt' as const,
        description: `Chi mua hàng ${p.code} (${p.supplierName})`,
        date: p.date,
        amount: p.paidAmount || 0,
      })),
    ...debtPayments
      .filter((dp) => dp.type === 'supplier_debt_pay' && isCashMethod(dp.paymentMethod))
      .map((dp) => ({
        id: dp.id,
        type: 'Chi' as const,
        method: 'Tiền mặt' as const,
        description: `Thanh toán nợ NCC: ${dp.entityName}${dp.entityCode ? ' (' + dp.entityCode + ')' : ''}${dp.note ? ' - ' + dp.note : ''}`,
        date: dp.date,
        amount: dp.amount || 0,
      })),
    ...customTransactions.filter((t) => t.method === 'Tiền mặt'),
  ];

  const bankList: CustomTransaction[] = [
    ...orders
      .filter((o) => isBankMethod(o.paymentMethod) && o.status !== 'Đã hủy' && !isReturnOrder(o) && (o.amountPaid || 0) > 0)
      .map((o) => ({
        id: o.id,
        type: 'Thu' as const,
        method: 'Chuyển khoản' as const,
        description: `Thu CK/Thẻ đơn ${o.orderCode} (${o.customerName || 'Khách lẻ'})`,
        date: o.date,
        amount: o.amountPaid || 0,
      })),
    ...orders
      .filter((o) => isBankMethod(o.paymentMethod) && o.status !== 'Đã hủy' && isReturnOrder(o) && (o.amountPaid || 0) > 0)
      .map((o) => ({
        id: o.id,
        type: 'Chi' as const,
        method: 'Chuyển khoản' as const,
        description: `Chi CK trả tiền hàng cho KH: ${o.customerName || 'Khách lẻ'} (${o.orderCode})`,
        date: o.date,
        amount: o.amountPaid || 0,
      })),
    ...debtPayments
      .filter((dp) => dp.type === 'customer_debt_pay' && isBankMethod(dp.paymentMethod))
      .map((dp) => ({
        id: dp.id,
        type: 'Thu' as const,
        method: 'Chuyển khoản' as const,
        description: `Thu nợ CK/Thẻ KH: ${dp.entityName}${dp.entityCode ? ' (' + dp.entityCode + ')' : ''}${dp.note ? ' - ' + dp.note : ''}`,
        date: dp.date,
        amount: dp.amount || 0,
      })),
    ...purchases
      .filter((p) => (p.type === 'return' || p.code.startsWith('THN')) && p.status !== 'Phiếu tạm' && isBankMethod(p.paymentMethod) && (p.paidAmount || 0) > 0)
      .map((p) => ({
        id: p.id,
        type: 'Thu' as const,
        method: 'Chuyển khoản' as const,
        description: `Thu CK hoàn trả hàng nhập ${p.code} (${p.supplierName})`,
        date: p.date,
        amount: p.paidAmount || 0,
      })),
    ...debtPayments
      .filter((dp) => dp.type === 'supplier_debt_pay' && isBankMethod(dp.paymentMethod))
      .map((dp) => ({
        id: dp.id,
        type: 'Chi' as const,
        method: 'Chuyển khoản' as const,
        description: `Thanh toán nợ CK/Thẻ NCC: ${dp.entityName}${dp.entityCode ? ' (' + dp.entityCode + ')' : ''}${dp.note ? ' - ' + dp.note : ''}`,
        date: dp.date,
        amount: dp.amount || 0,
      })),
    ...customTransactions.filter((t) => t.method === 'Chuyển khoản'),
  ];

  const handleCreateTransaction = () => {
    const val = typeof newTransAmount === 'number' ? newTransAmount : parseFloat(newTransAmount) || 0;
    if (val <= 0) {
      alert('Vui lòng nhập số tiền hợp lệ');
      return;
    }
    const newTx: CustomTransaction = {
      id: `TX${Date.now()}`,
      type: newTransType,
      method: newTransMethod,
      description: newTransDesc.trim() || `${newTransType} tiền ${newTransMethod}`,
      date: new Date().toLocaleString('vi-VN'),
      amount: val,
    };
    setCustomTransactions([newTx, ...customTransactions]);
    setShowAddModal(false);
    setNewTransAmount('');
    setNewTransDesc('');
  };

  return (
    <div className="flex-1 bg-[#f4f4f2] p-6 space-y-6 overflow-auto font-sans">
      {/* Top Header Bar with Add Transaction Button */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Sổ quỹ</h2>
          <p className="text-xs text-gray-500 mt-0.5">Quản lý dòng tiền mặt và tiền gửi ngân hàng</p>
        </div>

        <button
          type="button"
          onClick={() => setShowAddModal(true)}
          className="flex items-center space-x-1.5 px-4 py-2 bg-[#0066ff] hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Tạo phiếu Thu / Chi</span>
        </button>
      </div>

      {/* Top 3 Metric Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Card 1: Tổng quỹ */}
        <div className="bg-white rounded-2xl p-5 border border-gray-200/60 shadow-2xs flex flex-col justify-between">
          <div className="w-10 h-10 rounded-xl bg-[#ebf6ed] text-[#2e8248] flex items-center justify-center mb-3">
            <Wallet className="w-5 h-5" />
          </div>
          <div>
            <div className="text-sm font-medium text-gray-500 mb-1">Tổng quỹ</div>
            <div className="text-2xl font-bold text-gray-900 tracking-tight">
              {totalFund.toLocaleString('vi-VN')}đ
            </div>
          </div>
        </div>

        {/* Card 2: Tiền mặt */}
        <div className="bg-white rounded-2xl p-5 border border-gray-200/60 shadow-2xs flex flex-col justify-between">
          <div className="w-10 h-10 rounded-xl bg-[#eaf3ff] text-[#1a66ff] flex items-center justify-center mb-3">
            <CreditCard className="w-5 h-5" />
          </div>
          <div>
            <div className="text-sm font-medium text-gray-500 mb-1">Tiền mặt</div>
            <div className="text-2xl font-bold text-gray-900 tracking-tight">
              {totalCash.toLocaleString('vi-VN')}đ
            </div>
            <div className="text-xs text-gray-400 mt-1 font-normal">
              Thu: {totalCashIn.toLocaleString('vi-VN')}đ | Chi: {totalCashOut.toLocaleString('vi-VN')}đ
            </div>
          </div>
        </div>

        {/* Card 3: Chuyển khoản */}
        <div className="bg-white rounded-2xl p-5 border border-gray-200/60 shadow-2xs flex flex-col justify-between">
          <div className="w-10 h-10 rounded-xl bg-[#fdf4e7] text-[#a06a26] flex items-center justify-center mb-3">
            <CreditCard className="w-5 h-5" />
          </div>
          <div>
            <div className="text-sm font-medium text-gray-500 mb-1">Chuyển khoản</div>
            <div className="text-2xl font-bold text-gray-900 tracking-tight">
              {totalBank.toLocaleString('vi-VN')}đ
            </div>
            <div className="text-xs text-gray-400 mt-1 font-normal">
              Thu: {totalBankIn.toLocaleString('vi-VN')}đ | Chi: {totalBankOut.toLocaleString('vi-VN')}đ (gồm CK + Thẻ)
            </div>
          </div>
        </div>
      </div>

      {/* Bottom 2 Side-by-Side Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Left Panel: Chi tiết Tiền mặt */}
        <div className="bg-white rounded-2xl p-5 border border-gray-200/60 shadow-2xs flex flex-col min-h-[320px]">
          <div className="flex items-center space-x-2 text-sm font-bold text-gray-900 mb-4">
            <span className="text-base">💵</span>
            <span>Chi tiết Tiền mặt</span>
          </div>

          {/* Table Header Bar */}
          <div className="bg-[#f5f4f0] rounded-lg px-4 py-2.5 grid grid-cols-12 text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2">
            <div className="col-span-2">LOẠI</div>
            <div className="col-span-5">MÔ TẢ</div>
            <div className="col-span-3">NGÀY</div>
            <div className="col-span-2 text-right">SỐ TIỀN</div>
          </div>

          {/* List Content */}
          <div className="flex-1 flex flex-col justify-center">
            {cashList.length === 0 ? (
              <div className="py-16 text-center text-xs font-medium text-gray-400">
                Chưa có giao dịch
              </div>
            ) : (
              <div className="divide-y divide-gray-100 text-xs">
                {cashList.map((item, idx) => (
                  <div key={item.id ? `${item.id}-cash-${idx}` : `cash-${idx}`} className="grid grid-cols-12 py-3 px-2 items-center hover:bg-gray-50/80 rounded-lg transition-colors">
                    <div className="col-span-2">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold ${item.type === 'Thu' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
                        {item.type === 'Thu' ? <ArrowDownLeft className="w-3 h-3 mr-0.5" /> : <ArrowUpRight className="w-3 h-3 mr-0.5" />}
                        {item.type}
                      </span>
                    </div>
                    <div className="col-span-5 font-medium text-gray-800 truncate pr-2" title={item.description}>
                      {item.description}
                    </div>
                    <div className="col-span-3 text-gray-400 text-[11px]">
                      {item.date}
                    </div>
                    <div className={`col-span-2 text-right font-mono font-bold ${item.type === 'Thu' ? 'text-emerald-600' : 'text-red-600'}`}>
                      {item.type === 'Thu' ? '+' : '-'}{item.amount.toLocaleString('vi-VN')}đ
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Panel: Chi tiết Chuyển khoản */}
        <div className="bg-white rounded-2xl p-5 border border-gray-200/60 shadow-2xs flex flex-col min-h-[320px]">
          <div className="flex items-center space-x-2 text-sm font-bold text-gray-900 mb-4">
            <span className="text-base">🏦</span>
            <span>Chi tiết Chuyển khoản</span>
          </div>

          {/* Table Header Bar */}
          <div className="bg-[#f5f4f0] rounded-lg px-4 py-2.5 grid grid-cols-12 text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2">
            <div className="col-span-2">LOẠI</div>
            <div className="col-span-5">MÔ TẢ</div>
            <div className="col-span-3">NGÀY</div>
            <div className="col-span-2 text-right">SỐ TIỀN</div>
          </div>

          {/* List Content */}
          <div className="flex-1 flex flex-col justify-center">
            {bankList.length === 0 ? (
              <div className="py-16 text-center text-xs font-medium text-gray-400">
                Chưa có giao dịch
              </div>
            ) : (
              <div className="divide-y divide-gray-100 text-xs">
                {bankList.map((item, idx) => (
                  <div key={item.id ? `${item.id}-bank-${idx}` : `bank-${idx}`} className="grid grid-cols-12 py-3 px-2 items-center hover:bg-gray-50/80 rounded-lg transition-colors">
                    <div className="col-span-2">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold ${item.type === 'Thu' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
                        {item.type === 'Thu' ? <ArrowDownLeft className="w-3 h-3 mr-0.5" /> : <ArrowUpRight className="w-3 h-3 mr-0.5" />}
                        {item.type}
                      </span>
                    </div>
                    <div className="col-span-5 font-medium text-gray-800 truncate pr-2" title={item.description}>
                      {item.description}
                    </div>
                    <div className="col-span-3 text-gray-400 text-[11px]">
                      {item.date}
                    </div>
                    <div className={`col-span-2 text-right font-mono font-bold ${item.type === 'Thu' ? 'text-emerald-600' : 'text-red-600'}`}>
                      {item.type === 'Thu' ? '+' : '-'}{item.amount.toLocaleString('vi-VN')}đ
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal Tạo Phiếu Thu / Chi */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="bg-[#0066ff] px-5 py-4 text-white flex items-center justify-between">
              <h3 className="font-bold text-base">Tạo phiếu Thu / Chi mới</h3>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="text-white/80 hover:text-white cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-700 font-semibold mb-1">Loại phiếu</label>
                  <select
                    value={newTransType}
                    onChange={(e) => setNewTransType(e.target.value as 'Thu' | 'Chi')}
                    className="w-full p-2.5 border border-gray-300 rounded-xl bg-white text-xs"
                  >
                    <option value="Thu">Phiếu Thu (+)</option>
                    <option value="Chi">Phiếu Chi (-)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-gray-700 font-semibold mb-1">Phương thức</label>
                  <select
                    value={newTransMethod}
                    onChange={(e) => setNewTransMethod(e.target.value as 'Tiền mặt' | 'Chuyển khoản')}
                    className="w-full p-2.5 border border-gray-300 rounded-xl bg-white text-xs"
                  >
                    <option value="Tiền mặt">Tiền mặt</option>
                    <option value="Chuyển khoản">Chuyển khoản</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-gray-700 font-semibold mb-1">
                  Số tiền (VNĐ) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  min={0}
                  value={newTransAmount}
                  onChange={(e) => setNewTransAmount(e.target.value)}
                  className="w-full p-2.5 border border-gray-300 rounded-xl font-mono text-sm font-bold text-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Nhập số tiền..."
                />
              </div>

              <div>
                <label className="block text-gray-700 font-semibold mb-1">Mô tả / Lý do</label>
                <textarea
                  rows={2}
                  value={newTransDesc}
                  onChange={(e) => setNewTransDesc(e.target.value)}
                  className="w-full p-2.5 border border-gray-300 rounded-xl"
                  placeholder="Nhập nội dung thu / chi..."
                />
              </div>
            </div>

            <div className="p-4 bg-gray-50 border-t flex justify-end space-x-2">
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-xl text-xs font-semibold cursor-pointer"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleCreateTransaction}
                className="px-4 py-2 bg-[#0066ff] hover:bg-blue-700 text-white rounded-xl text-xs font-bold cursor-pointer"
              >
                Lưu giao dịch
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
