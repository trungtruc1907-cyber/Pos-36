import React, { useState } from 'react';
import { ActivityLog } from '../../types';
import { 
  QrCode, 
  Landmark, 
  ChevronRight, 
  ChevronDown, 
  Monitor, 
  ShoppingBag, 
  PackageOpen, 
  X,
  AlertTriangle
} from 'lucide-react';

interface RightSidebarProps {
  activityLogs: ActivityLog[];
  onOpenQrInfo: () => void;
}

export const RightSidebar: React.FC<RightSidebarProps> = ({ activityLogs, onOpenQrInfo }) => {
  const [showSecurityDetails, setShowSecurityDetails] = useState(false);
  const [securityDismissed, setSecurityDismissed] = useState(false);

  return (
    <aside className="w-full lg:w-80 space-y-4 flex flex-col shrink-0">


      {/* Security Alert Banner */}
      {!securityDismissed && (
        <div className="bg-amber-50 rounded-lg p-3 border border-amber-200 flex flex-col gap-2 transition-all">
          <div className="flex items-start justify-between">
            <div className="flex items-start">
              <Monitor className="w-4 h-4 text-amber-600 mt-0.5 mr-2 shrink-0" />
              <div className="text-xs text-gray-800 leading-snug">
                Có <span className="font-bold text-amber-700">2</span> hoạt động đăng nhập<br />
                <span className="font-bold text-amber-700">khác thường</span> cần kiểm tra.
              </div>
            </div>
            <div className="flex items-center space-x-1">
              <button
                onClick={() => setShowSecurityDetails(!showSecurityDetails)}
                className="text-gray-400 hover:text-gray-600 p-0.5"
                title="Chi tiết"
              >
                <ChevronDown className={`w-4 h-4 transition-transform ${showSecurityDetails ? 'rotate-180' : ''}`} />
              </button>
              <button
                onClick={() => setSecurityDismissed(true)}
                className="text-gray-400 hover:text-gray-600 p-0.5"
                title="Bỏ qua"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {showSecurityDetails && (
            <div className="text-[11px] bg-white/80 p-2 rounded border border-amber-100 space-y-1.5 text-gray-700 mt-1">
              <div className="flex items-center justify-between font-medium">
                <span>• Chrome (Hà Nội, VN)</span>
                <span className="text-gray-400">08:12 AM</span>
              </div>
              <div className="flex items-center justify-between font-medium">
                <span>• Firefox (Thanh Hóa, VN)</span>
                <span className="text-gray-400">Hôm qua</span>
              </div>
              <button 
                onClick={() => alert('Đã xác nhận an toàn cho 2 thiết bị!')}
                className="w-full mt-1 bg-amber-600 hover:bg-amber-700 text-white font-bold py-1 rounded text-[10px]"
              >
                Xác nhận an toàn
              </button>
            </div>
          )}
        </div>
      )}

      {/* Recent Activities Feed */}
      <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-100 flex-1 flex flex-col min-h-[380px]">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-sm font-bold text-gray-800">Hoạt động gần đây</h2>
          <span className="text-xs text-blue-600 hover:underline cursor-pointer">Tất cả</span>
        </div>

        <div className="overflow-y-auto pr-1 scrollbar-hide relative flex-1 max-h-[420px]">
          {/* Vertical Timeline Line */}
          <div className="absolute left-[15px] top-2 bottom-2 w-px bg-gray-200 z-0" />

          <div className="space-y-4 relative z-10">
            {activityLogs.map((log) => (
              <div key={log.id} className="flex items-start group">
                <div className="w-8 h-8 rounded-full bg-white border border-gray-200 flex shrink-0 items-center justify-center text-gray-500 mr-3 z-10 group-hover:border-[#1e0b54] group-hover:text-[#1e0b54] transition-colors shadow-2xs">
                  {log.type === 'import' ? (
                    <PackageOpen className="w-4 h-4 text-amber-600" />
                  ) : (
                    <ShoppingBag className="w-4 h-4 text-[#1e0b54]" />
                  )}
                </div>
                <div className="text-xs text-gray-700 leading-snug">
                  <span className="text-blue-600 font-semibold hover:underline cursor-pointer">
                    {log.storeName}
                  </span>{' '}
                  {log.actionText}{' '}
                  <span className="font-bold text-gray-900">
                    với giá trị {log.formattedAmount}
                  </span>
                  <div className="text-[10px] text-gray-400 mt-0.5">{log.time}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </aside>
  );
};
