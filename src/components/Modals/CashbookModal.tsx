import React from 'react';
import { Landmark, ArrowUpRight, ArrowDownLeft, DollarSign } from 'lucide-react';

interface CashbookModalProps {
  todayRevenue: number;
}

export const CashbookModal: React.FC<CashbookModalProps> = ({ todayRevenue }) => {
  return (
    <div className="flex-1 bg-[#f3f4f6] p-4 flex flex-col space-y-4 overflow-auto">
      <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-100 flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <Landmark className="w-6 h-6 text-[#1e0b54]" />
          <div>
            <h2 className="text-base font-extrabold text-gray-900">Sổ Quỹ & Dòng Tiền</h2>
            <p className="text-xs text-gray-500">Báo cáo thu chi tiền mặt và tiền gửi ngân hàng</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
          <div className="text-xs text-gray-500 flex items-center mb-1">
            <DollarSign className="w-4 h-4 text-emerald-600 mr-1" /> Tồn quỹ đầu kỳ
          </div>
          <div className="text-lg font-black text-gray-900 font-mono">142,500,000đ</div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
          <div className="text-xs text-gray-500 flex items-center mb-1">
            <ArrowDownLeft className="w-4 h-4 text-emerald-600 mr-1" /> Thu hôm nay
          </div>
          <div className="text-lg font-black text-emerald-600 font-mono">
            +{todayRevenue.toLocaleString('vi-VN')}đ
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
          <div className="text-xs text-gray-500 flex items-center mb-1">
            <ArrowUpRight className="w-4 h-4 text-red-500 mr-1" /> Chi hôm nay
          </div>
          <div className="text-lg font-black text-red-600 font-mono">-1,440,000đ</div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-100 flex-1">
        <h3 className="font-bold text-xs text-gray-800 mb-3">Nhật ký Thu - Chi gần đây</h3>
        <div className="space-y-2 text-xs">
          <div className="flex justify-between items-center p-2.5 bg-slate-50 rounded border border-gray-100">
            <div>
              <div className="font-bold text-gray-900">Thu tiền bán đơn HD10294 (Chống Thấm 36)</div>
              <div className="text-[10px] text-gray-400">Hôm nay 14:26 | Thu tiền mặt</div>
            </div>
            <div className="font-bold text-emerald-600 font-mono text-sm">+640,000đ</div>
          </div>

          <div className="flex justify-between items-center p-2.5 bg-slate-50 rounded border border-gray-100">
            <div>
              <div className="font-bold text-gray-900">Chi nhập kho vật liệu Sika / Quicseal</div>
              <div className="text-[10px] text-gray-400">Một ngày trước | Chuyển khoản ngân hàng</div>
            </div>
            <div className="font-bold text-red-600 font-mono text-sm">-1,440,000đ</div>
          </div>
        </div>
      </div>
    </div>
  );
};
