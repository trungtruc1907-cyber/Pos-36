import React, { useState } from 'react';
import { ActivityLog } from '../../types';
import { 
  ChevronRight, 
  ChevronDown, 
  Monitor, 
  ShoppingBag, 
  PackageOpen, 
  X,
  FileText,
  UserCheck,
  Building2,
  Box,
  RotateCcw
} from 'lucide-react';

interface RightSidebarProps {
  activityLogs: ActivityLog[];
  onOpenQrInfo: () => void;
  onSelectOrder?: (orderCode: string) => void;
}

type FilterCategory = 'all' | 'inventory' | 'customer_debt' | 'supplier_debt';

export const RightSidebar: React.FC<RightSidebarProps> = ({ activityLogs, onOpenQrInfo, onSelectOrder }) => {
  const [showSecurityDetails, setShowSecurityDetails] = useState(false);
  const [securityDismissed, setSecurityDismissed] = useState(false);
  const [activeFilter, setActiveFilter] = useState<FilterCategory>('all');

  const filteredLogs = activityLogs.filter((log) => {
    if (activeFilter === 'all') return true;
    if (activeFilter === 'inventory') {
      return (
        log.type === 'inventory' ||
        log.type === 'import' ||
        log.type === 'sale' ||
        log.type === 'return' ||
        Boolean(log.inventoryImpact)
      );
    }
    if (activeFilter === 'customer_debt') {
      return (
        log.type === 'customer_debt' ||
        Boolean(log.customerDebtImpact)
      );
    }
    if (activeFilter === 'supplier_debt') {
      return (
        log.type === 'supplier_debt' ||
        log.type === 'import' ||
        Boolean(log.supplierDebtImpact)
      );
    }
    return true;
  });

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
        <div className="flex justify-between items-center mb-2">
          <h2 className="text-sm font-bold text-gray-800">Hoạt động gần đây</h2>
          <span className="text-[11px] text-gray-500 font-medium">{filteredLogs.length} thao tác</span>
        </div>

        {/* Filter categories tabs */}
        <div className="flex items-center gap-1 mb-3 overflow-x-auto pb-1 text-[11px]">
          <button
            onClick={() => setActiveFilter('all')}
            className={`px-2 py-1 rounded-full whitespace-nowrap transition-colors ${
              activeFilter === 'all'
                ? 'bg-blue-600 text-white font-bold'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Tất cả
          </button>
          <button
            onClick={() => setActiveFilter('inventory')}
            className={`px-2 py-1 rounded-full whitespace-nowrap transition-colors ${
              activeFilter === 'inventory'
                ? 'bg-blue-600 text-white font-bold'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            📦 Tồn kho
          </button>
          <button
            onClick={() => setActiveFilter('customer_debt')}
            className={`px-2 py-1 rounded-full whitespace-nowrap transition-colors ${
              activeFilter === 'customer_debt'
                ? 'bg-blue-600 text-white font-bold'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            💳 Nợ KH
          </button>
          <button
            onClick={() => setActiveFilter('supplier_debt')}
            className={`px-2 py-1 rounded-full whitespace-nowrap transition-colors ${
              activeFilter === 'supplier_debt'
                ? 'bg-blue-600 text-white font-bold'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            🏭 Nợ NCC
          </button>
        </div>

        <div className="overflow-y-auto pr-1 scrollbar-hide relative flex-1 max-h-[460px]">
          {/* Vertical Timeline Line */}
          <div className="absolute left-[15px] top-2 bottom-2 w-px bg-gray-200 z-0" />

          {filteredLogs.length === 0 ? (
            <div className="text-center text-xs text-gray-400 py-8">
              Không có hoạt động nào trong mục này
            </div>
          ) : (
            <div className="space-y-3 relative z-10">
              {filteredLogs.map((log) => {
                const isSale = log.type === 'sale';
                const isReturn = log.type === 'return';
                const isImport = log.type === 'import';
                const isCustomerDebt = log.type === 'customer_debt';
                const isSupplierDebt = log.type === 'supplier_debt';

                const extractedCode = log.actionText.match(/(HD|PN|TH|KH|NCC)\d+/)?.[0];
                const code = log.orderCode || log.entityCode || extractedCode;

                return (
                  <div
                    key={log.id}
                    onClick={() => {
                      if (isSale && code && onSelectOrder) {
                        onSelectOrder(code);
                      }
                    }}
                    className={`flex items-start group p-2 rounded-lg transition-all ${
                      isSale && code && onSelectOrder
                        ? 'hover:bg-indigo-50/70 cursor-pointer border border-transparent hover:border-indigo-100'
                        : 'hover:bg-gray-50'
                    }`}
                  >
                    <div className="w-8 h-8 rounded-full bg-white border border-gray-200 flex shrink-0 items-center justify-center text-gray-500 mr-2.5 z-10 group-hover:border-blue-600 transition-colors shadow-2xs mt-0.5">
                      {isImport ? (
                        <PackageOpen className="w-4 h-4 text-amber-600" />
                      ) : isReturn ? (
                        <RotateCcw className="w-4 h-4 text-emerald-600" />
                      ) : isCustomerDebt ? (
                        <UserCheck className="w-4 h-4 text-purple-600" />
                      ) : isSupplierDebt ? (
                        <Building2 className="w-4 h-4 text-rose-600" />
                      ) : log.type === 'inventory' ? (
                        <Box className="w-4 h-4 text-blue-600" />
                      ) : (
                        <ShoppingBag className="w-4 h-4 text-[#1e0b54]" />
                      )}
                    </div>

                    <div className="text-xs text-gray-700 leading-snug flex-1 min-w-0">
                      <div>
                        <span className="text-blue-600 font-semibold hover:underline cursor-pointer">
                          {log.storeName}
                        </span>{' '}
                        {log.actionText}{' '}
                        {code && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (isSale && onSelectOrder) onSelectOrder(code);
                            }}
                            className="inline-flex items-center gap-1 font-extrabold text-blue-800 bg-blue-100/90 hover:bg-blue-200 px-1.5 py-0.5 rounded text-[11px] underline decoration-blue-400 transition-colors mx-0.5 shadow-2xs"
                            title={isSale ? "Click để xem hóa đơn" : "Mã tham chiếu"}
                          >
                            <FileText className="w-3 h-3 text-blue-700" />
                            {code}
                          </button>
                        )}{' '}
                        {log.formattedAmount && (
                          <span className="font-bold text-gray-900">
                            với giá trị {log.formattedAmount}
                          </span>
                        )}
                      </div>

                      {/* Detailed impact badges */}
                      <div className="flex flex-wrap gap-1 mt-1">
                        {log.inventoryImpact && (
                          <span className="inline-flex items-center text-[10px] bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded font-medium border border-blue-100">
                            📦 Tồn kho: {log.inventoryImpact}
                          </span>
                        )}
                        {log.customerDebtImpact && (
                          <span className="inline-flex items-center text-[10px] bg-purple-50 text-purple-700 px-1.5 py-0.5 rounded font-medium border border-purple-100">
                            💳 Công nợ KH: {log.customerDebtImpact}
                          </span>
                        )}
                        {log.supplierDebtImpact && (
                          <span className="inline-flex items-center text-[10px] bg-amber-50 text-amber-800 px-1.5 py-0.5 rounded font-medium border border-amber-100">
                            🏭 Công nợ NCC: {log.supplierDebtImpact}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center justify-between text-[10px] text-gray-400 mt-1">
                        <span>{log.time}</span>
                        {isSale && code && (
                          <span className="text-blue-600 font-bold group-hover:underline flex items-center text-[10px]">
                            Xem hóa đơn <ChevronRight className="w-3 h-3 ml-0.5" />
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </aside>
  );
};
