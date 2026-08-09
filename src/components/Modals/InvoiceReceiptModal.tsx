import React from 'react';
import { CartItem, PaymentMethod } from '../../types';
import { Printer, CheckCircle, X, Download } from 'lucide-react';

interface InvoiceReceiptModalProps {
  orderCode: string;
  date: string;
  customerName: string;
  cart: CartItem[];
  discount: number;
  surcharge: number;
  amountPaid: number;
  paymentMethod: PaymentMethod;
  totalAmount: number;
  note?: string;
  onClose: () => void;
}

export const InvoiceReceiptModal: React.FC<InvoiceReceiptModalProps> = ({
  orderCode,
  date,
  customerName,
  cart,
  discount,
  surcharge,
  amountPaid,
  paymentMethod,
  totalAmount,
  note,
  onClose,
}) => {
  const changeReturn = amountPaid - totalAmount;

  const getPaymentMethodLabel = (pm: PaymentMethod) => {
    switch (pm) {
      case 'cash':
        return 'Tiền mặt';
      case 'transfer':
        return 'Chuyển khoản QR';
      case 'card':
        return 'Quẹt thẻ';
      case 'wallet':
        return 'Ví điện tử';
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-lg shadow-2xl max-w-lg w-full overflow-hidden flex flex-col my-8">
        {/* Header Banner */}
        <div className="bg-[#1e0b54] text-white p-4 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <CheckCircle className="w-6 h-6 text-emerald-400" />
            <div>
              <h3 className="font-extrabold text-base">Thanh toán thành công!</h3>
              <p className="text-xs text-indigo-200">Mã hóa đơn: {orderCode}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-300 hover:text-white p-1 rounded hover:bg-white/10"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Printable Receipt Body */}
        <div id="printable-receipt" className="p-6 text-gray-800 text-xs space-y-4 font-sans bg-white">
          {/* Store Logo & Header */}
          <div className="text-center border-b pb-4 space-y-1">
            <h2 className="text-lg font-black text-[#1e0b54] tracking-tight">CHỐNG THẤM 36</h2>
            <p className="text-[11px] text-gray-600 font-medium">
              Chuyên vật liệu chống thấm & keo xây dựng cao cấp
            </p>
            <p className="text-[11px] text-gray-500">ĐC: Lô 36 KĐT Mới, TP Thanh Hóa | Hotline: 0915 586 234</p>
            <h1 className="text-base font-extrabold text-gray-900 uppercase pt-2 tracking-wide">
              HÓA ĐƠN BÁN HÀNG
            </h1>
            <p className="text-[10px] text-gray-400 font-mono">Mã HĐ: {orderCode} | Ngày: {date}</p>
          </div>

          {/* Customer & Cashier Info */}
          <div className="grid grid-cols-2 gap-2 text-[11px] bg-slate-50 p-2.5 rounded border border-gray-200">
            <div>
              <span className="text-gray-500">Khách hàng:</span>{' '}
              <span className="font-bold text-gray-900">{customerName}</span>
            </div>
            <div className="text-right">
              <span className="text-gray-500">Thu ngân:</span>{' '}
              <span className="font-bold text-gray-900">admin</span>
            </div>
            {note && (
              <div className="col-span-2 pt-1 border-t border-gray-200 text-gray-600">
                <span className="font-semibold">Ghi chú:</span> {note}
              </div>
            )}
          </div>

          {/* Items Table */}
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b-2 border-gray-900 text-[10px] font-bold text-gray-600 uppercase">
                <th className="py-1.5">Tên sản phẩm</th>
                <th className="py-1.5 text-center">ĐVT</th>
                <th className="py-1.5 text-right">SL</th>
                <th className="py-1.5 text-right">Đơn giá</th>
                <th className="py-1.5 text-right">Thành tiền</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {cart.map((item, idx) => (
                <tr key={idx} className="text-[11px]">
                  <td className="py-2 pr-1 font-medium text-gray-900">
                    {item.product.name}
                  </td>
                  <td className="py-2 text-center text-gray-500">{item.product.unit}</td>
                  <td className="py-2 text-right font-bold">{item.quantity}</td>
                  <td className="py-2 text-right font-mono">
                    {item.unitPrice.toLocaleString('vi-VN')}
                  </td>
                  <td className="py-2 text-right font-bold font-mono">
                    {(item.quantity * item.unitPrice).toLocaleString('vi-VN')}đ
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Totals Summary */}
          <div className="border-t-2 border-gray-900 pt-3 space-y-1.5 text-xs">
            {discount > 0 && (
              <div className="flex justify-between text-gray-600">
                <span>Giảm giá:</span>
                <span className="font-mono">-{discount.toLocaleString('vi-VN')}đ</span>
              </div>
            )}
            {surcharge > 0 && (
              <div className="flex justify-between text-gray-600">
                <span>Thu khác:</span>
                <span className="font-mono">+{surcharge.toLocaleString('vi-VN')}đ</span>
              </div>
            )}
            <div className="flex justify-between text-sm font-extrabold text-gray-900 pt-1 border-t">
              <span>Tổng cộng cần trả:</span>
              <span className="text-[#1e0b54] font-mono">
                {totalAmount.toLocaleString('vi-VN')}đ
              </span>
            </div>
            <div className="flex justify-between text-gray-700">
              <span>Khách thanh toán ({getPaymentMethodLabel(paymentMethod)}):</span>
              <span className="font-mono font-bold">
                {amountPaid.toLocaleString('vi-VN')}đ
              </span>
            </div>
            {changeReturn >= 0 ? (
              <div className="flex justify-between text-emerald-700 font-semibold">
                <span>Tiền thừa trả khách:</span>
                <span className="font-mono">{changeReturn.toLocaleString('vi-VN')}đ</span>
              </div>
            ) : (
              <div className="flex justify-between text-amber-700 font-semibold">
                <span>Khách còn nợ:</span>
                <span className="font-mono">
                  {Math.abs(changeReturn).toLocaleString('vi-VN')}đ
                </span>
              </div>
            )}
          </div>

          {/* QR Code & Footer Message */}
          <div className="text-center pt-4 border-t border-dashed border-gray-300 space-y-2">
            <div className="flex justify-center">
              <div className="p-2 border border-gray-200 rounded-md bg-gray-50 inline-block">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=CHONGTHAM36_${orderCode}_${totalAmount}`}
                  alt="VietQR Chuyển khoản"
                  className="w-20 h-20"
                />
              </div>
            </div>
            <p className="text-[10px] text-gray-500 font-medium">
              Quét mã QR để kiểm tra bảo hành & lưu hóa đơn điện tử
            </p>
            <p className="text-xs font-bold text-[#1e0b54]">
              Cảm ơn Quý khách & Hẹn gặp lại!
            </p>
          </div>
        </div>

        {/* Modal Action Footer */}
        <div className="bg-gray-100 p-4 flex justify-between items-center border-t">
          <button
            onClick={() => window.print()}
            className="px-4 py-2 bg-amber-400 hover:bg-amber-500 text-[#1e0b54] font-bold rounded text-xs flex items-center shadow transition-all"
          >
            <Printer className="w-4 h-4 mr-1.5" />
            In hóa đơn (Ctrl + P)
          </button>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-[#1e0b54] hover:bg-[#15073c] text-white font-bold rounded text-xs transition-colors"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
