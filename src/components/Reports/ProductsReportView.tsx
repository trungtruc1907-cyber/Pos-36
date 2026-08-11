import React, { useState, useMemo } from 'react';
import { Order, Product, Customer, Supplier } from '../../types';
import { 
  Printer, 
  Download, 
  RotateCcw, 
  ChevronDown, 
  ChevronLeft, 
  ChevronRight, 
  ChevronsLeft, 
  ChevronsRight, 
  ZoomIn, 
  ZoomOut, 
  Check, 
  Building2,
  BarChart3,
  Filter,
  EyeOff,
  Eye
} from 'lucide-react';

interface ProductsReportViewProps {
  orders?: Order[];
  products?: Product[];
  customers?: Customer[];
  suppliers?: Supplier[];
  onSwitchReportTab?: (tab: 'daily' | 'sales' | 'products') => void;
  activeReportTab?: 'daily' | 'sales' | 'products';
}

interface ProductReportItem {
  code: string;
  name: string;
  unit: string;
  category: string;
  qtySold: number;
  revenue: number;
  qtyReturned: number;
  returnValue: number;
  netRevenue: number;
  cogs: number;
  grossProfit: number;
  stock: number;
  stockValue: number;
}

export const ProductsReportView: React.FC<ProductsReportViewProps> = ({
  orders = [],
  products = [],
  onSwitchReportTab,
  activeReportTab = 'products',
}) => {
  // Sidebar Configuration State
  const [viewMode, setViewMode] = useState<'Báo cáo' | 'Biểu đồ'>('Báo cáo');
  const [orientation, setOrientation] = useState<'Hiển thị dọc' | 'Hiển thị ngang'>('Hiển thị dọc');
  const [groupSameType, setGroupSameType] = useState<boolean>(false);
  const [groupCategory, setGroupCategory] = useState<boolean>(false);
  const [showFilterSidebar, setShowFilterSidebar] = useState<boolean>(true);

  // Concern Dropdown Selection
  const [concern, setConcern] = useState<
    'Bán hàng' | 'Lợi nhuận' | 'Giá trị kho' | 'Xuất nhập tồn' | 'Xuất nhập tồn chi tiết'
  >('Bán hàng');
  const [showConcernDropdown, setShowConcernDropdown] = useState(false);

  // Date Range Picker State
  const [fromDate, setFromDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  });

  const [toDate, setToDate] = useState<string>(() => {
    const d = new Date();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  });

  // UI Zoom & Export State
  const [zoomLevel, setZoomLevel] = useState<number>(100);

  // Helper date format: "YYYY-MM-DD" -> "DD/MM/YYYY"
  const formatDateStr = (dateStr: string) => {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return dateStr;
  };

  const formattedFromDate = useMemo(() => formatDateStr(fromDate), [fromDate]);
  const formattedToDate = useMemo(() => formatDateStr(toDate), [toDate]);

  // Current formatted Timestamp for "Ngày lập"
  const currentTimestampStr = useMemo(() => {
    const d = new Date();
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const yyyy = d.getFullYear();
    const hh = String(d.getHours()).padStart(2, '0');
    const min = String(d.getMinutes()).padStart(2, '0');
    return `${dd}/${mm}/${yyyy} ${hh}:${min}`;
  }, []);

  // Parse Date string for date range filtering
  const parseOrderDate = (dateStr?: string): Date | null => {
    if (!dateStr) return null;
    try {
      const datePart = dateStr.split(' ')[0];
      if (datePart.includes('/')) {
        const [d, m, y] = datePart.split('/').map(Number);
        return new Date(y, m - 1, d);
      } else if (datePart.includes('-')) {
        const [y, m, d] = datePart.split('-').map(Number);
        return new Date(y, m - 1, d);
      }
    } catch (e) {
      return null;
    }
    return null;
  };

  const fromDateObj = useMemo(() => {
    if (!fromDate) return new Date(2000, 0, 1);
    const [y, m, d] = fromDate.split('-').map(Number);
    return new Date(y, m - 1, d, 0, 0, 0);
  }, [fromDate]);

  const toDateObj = useMemo(() => {
    if (!toDate) return new Date(2099, 11, 31);
    const [y, m, d] = toDate.split('-').map(Number);
    return new Date(y, m - 1, d, 23, 59, 59);
  }, [toDate]);

  // Filter orders by Date Range and valid status
  const filteredOrders = useMemo(() => {
    return orders.filter((ord) => {
      if (ord.status === 'Đã hủy') return false;
      const parsed = parseOrderDate(ord.date);
      if (!parsed) return true;
      return parsed >= fromDateObj && parsed <= toDateObj;
    });
  }, [orders, fromDateObj, toDateObj]);

  // Product Map from Database Products List
  const productCatalogMap = useMemo(() => {
    const map = new Map<string, Product>();
    products.forEach((p) => {
      if (p.code) map.set(p.code, p);
      if (p.id) map.set(p.id, p);
    });
    return map;
  }, [products]);

  // Aggregate Product Sales Data from Database Orders
  const productSalesMap = useMemo(() => {
    const map = new Map<string, ProductReportItem>();

    // First seed with catalog products so all products are represented
    products.forEach((p) => {
      map.set(p.code || p.id, {
        code: p.code || 'SP-UNNAMED',
        name: p.name || 'Sản phẩm chưa đặt tên',
        unit: p.unit || 'Đơn vị',
        category: p.category || 'Chưa phân loại',
        qtySold: 0,
        revenue: 0,
        qtyReturned: 0,
        returnValue: 0,
        netRevenue: 0,
        cogs: 0,
        grossProfit: 0,
        stock: p.stock ?? 10,
        stockValue: (p.stock ?? 10) * (p.giaVon || p.price * 0.7),
      });
    });

    // Aggregate actual order items
    filteredOrders.forEach((ord) => {
      const isReturn = ord.status === 'Trả hàng' || ord.orderCode.startsWith('HDTH');
      (ord.items || []).forEach((item) => {
        const pCode = item.product?.code || item.productId || item.productName;
        const catalogP = productCatalogMap.get(pCode);
        const pName = catalogP?.name || item.productName || item.product?.name || 'Hàng hóa';
        const pUnit = catalogP?.unit || item.unit || 'Đơn vị';
        const pCat = catalogP?.category || 'Chưa phân loại';
        const costPrice = catalogP?.giaVon || (item.unitPrice * 0.7);

        const key = pCode || pName;
        const existing = map.get(key) || {
          code: pCode || 'SP00000',
          name: pName,
          unit: pUnit,
          category: pCat,
          qtySold: 0,
          revenue: 0,
          qtyReturned: 0,
          returnValue: 0,
          netRevenue: 0,
          cogs: 0,
          grossProfit: 0,
          stock: catalogP?.stock ?? 0,
          stockValue: (catalogP?.stock ?? 0) * costPrice,
        };

        const itemQty = item.quantity || 0;
        const itemAmount = item.total || itemQty * item.unitPrice;
        const itemCogs = itemQty * costPrice;

        if (isReturn) {
          existing.qtyReturned += itemQty;
          existing.returnValue += itemAmount;
        } else {
          existing.qtySold += itemQty;
          existing.revenue += itemAmount;
          existing.cogs += itemCogs;
        }

        existing.netRevenue = existing.revenue - existing.returnValue;
        existing.grossProfit = existing.netRevenue - existing.cogs;

        map.set(key, existing);
      });
    });

    return map;
  }, [filteredOrders, products, productCatalogMap]);

  // Convert Product Aggregation Map to Array
  const productReportList = useMemo(() => {
    let list: ProductReportItem[] = Array.from(productSalesMap.values());

    // Filter out products with 0 activity if needed, or sort by qtySold / revenue descending
    list.sort((a, b) => b.revenue - a.revenue || b.qtySold - a.qtySold);

    return list;
  }, [productSalesMap]);

  // Grand Totals Summary
  const grandTotals = useMemo(() => {
    const totalItemTypes = productReportList.length;
    const totalQtySold = productReportList.reduce((sum, p) => sum + p.qtySold, 0);
    const totalRevenue = productReportList.reduce((sum, p) => sum + p.revenue, 0);
    const totalQtyReturned = productReportList.reduce((sum, p) => sum + p.qtyReturned, 0);
    const totalReturnValue = productReportList.reduce((sum, p) => sum + p.returnValue, 0);
    const totalNetRevenue = totalRevenue - totalReturnValue;
    const totalCogs = productReportList.reduce((sum, p) => sum + p.cogs, 0);
    const totalGrossProfit = totalNetRevenue - totalCogs;
    const totalStockVal = productReportList.reduce((sum, p) => sum + p.stockValue, 0);

    return {
      totalItemTypes,
      totalQtySold,
      totalRevenue,
      totalQtyReturned,
      totalReturnValue,
      totalNetRevenue,
      totalCogs,
      totalGrossProfit,
      totalStockVal,
    };
  }, [productReportList]);

  // Export to CSV
  const handleExportCSV = () => {
    let csvContent = 'data:text/csv;charset=utf-8,';
    csvContent += `BAO CAO BAN HANG THEO HANG HOA (${concern.toUpperCase()})\n`;
    csvContent += `Tu ngay: ${formattedFromDate} den ngay: ${formattedToDate}\n`;
    csvContent += `Ngay lap: ${currentTimestampStr}\n\n`;

    csvContent += 'Ma hang,Ten hang,SL Ban,Doanh thu,SL Tra,Gia tri tra,Doanh thu thuan\n';
    productReportList.forEach((p) => {
      csvContent += `"${p.code}","${p.name}",${p.qtySold},${p.revenue},${p.qtyReturned},${p.returnValue},${p.netRevenue}\n`;
    });
    csvContent += `Tong cong (${grandTotals.totalItemTypes} mat hang),,${grandTotals.totalQtySold},${grandTotals.totalRevenue},${grandTotals.totalQtyReturned},${grandTotals.totalReturnValue},${grandTotals.totalNetRevenue}\n`;

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Bao_cao_hang_hoa_${formattedFromDate.replace(/\//g, '-')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans text-gray-800">
      {/* Print Specific CSS Stylesheet */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #printable-products-report, #printable-products-report * {
            visibility: visible;
          }
          #printable-products-report {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            margin: 0;
            padding: 20px;
            box-shadow: none !important;
            border: none !important;
            background: white !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      {/* Top Header Bar */}
      <div className="bg-white border-b border-gray-200 px-6 py-3.5 flex items-center justify-between shadow-xs no-print">
        <h1 className="text-xl font-bold text-gray-900 tracking-tight">
          Báo cáo hàng hóa
        </h1>
        <div className="text-xs text-gray-500 font-medium">
          Chi nhánh: <span className="font-bold text-gray-800">Tổng Kho Chống Thấm 36</span>
        </div>
      </div>

      {/* Main Workspace: Left Sidebar + Right Canvas */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden p-4 md:p-6 gap-6 relative">
        
        {/* LEFT SIDEBAR CONTROLS PANEL */}
        {showFilterSidebar && (
          <div className="w-full md:w-64 lg:w-72 bg-white rounded-xl border border-gray-200 p-4 shadow-sm shrink-0 flex flex-col space-y-5 no-print transition-all">
            
            {/* Top Export Button matching screenshot [ + Xuất tất cả ] */}
            <div>
              <button
                onClick={handleExportCSV}
                className="w-full py-2 px-3 border border-gray-300 hover:border-gray-400 bg-white text-gray-700 hover:text-gray-900 rounded-lg text-xs font-bold flex items-center justify-center space-x-2 shadow-2xs transition-all cursor-pointer active:scale-98"
              >
                <Download className="w-4 h-4 text-gray-600" />
                <span>Xuất tất cả</span>
              </button>
            </div>

            <hr className="border-gray-200" />

            {/* Section 1: Kiểu hiển thị * */}
            <div>
              <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-2">
                Kiểu hiển thị <span className="text-blue-600">*</span>
              </label>
              
              {/* Pill Switcher: Biểu đồ | Báo cáo */}
              <div className="flex items-center space-x-1.5 bg-slate-100 p-1 rounded-full border border-gray-200 mb-3">
                <button
                  onClick={() => setViewMode('Biểu đồ')}
                  className={`flex-1 py-1.5 px-3 rounded-full text-xs font-bold transition-all cursor-pointer ${
                    viewMode === 'Biểu đồ'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Biểu đồ
                </button>
                <button
                  onClick={() => setViewMode('Báo cáo')}
                  className={`flex-1 py-1.5 px-3 rounded-full text-xs font-bold transition-all cursor-pointer ${
                    viewMode === 'Báo cáo'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Báo cáo
                </button>
              </div>

              {/* Display Orientation Dropdown */}
              <div>
                <select
                  value={orientation}
                  onChange={(e) => setOrientation(e.target.value as any)}
                  className="w-full p-2 text-xs border border-gray-300 rounded-lg bg-white font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none cursor-pointer"
                >
                  <option value="Hiển thị dọc">Hiển thị dọc</option>
                  <option value="Hiển thị ngang">Hiển thị ngang</option>
                </select>
              </div>
            </div>

            {/* Checkboxes matching screenshot */}
            <div className="space-y-2 text-xs font-medium text-gray-700 pt-1">
              <label className="flex items-center space-x-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={groupSameType}
                  onChange={(e) => setGroupSameType(e.target.checked)}
                  className="w-4 h-4 rounded text-blue-600 border-gray-300 focus:ring-blue-500"
                />
                <span>Gộp hàng hóa cùng loại</span>
              </label>

              <label className="flex items-center space-x-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={groupCategory}
                  onChange={(e) => setGroupCategory(e.target.checked)}
                  className="w-4 h-4 rounded text-blue-600 border-gray-300 focus:ring-blue-500"
                />
                <span>Gộp theo nhóm hàng</span>
              </label>
            </div>

            <hr className="border-gray-200" />

            {/* Section 2: Mối quan tâm Dropdown */}
            <div className="relative">
              <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-2">
                Mối quan tâm
              </label>
              
              <div className="relative">
                <button
                  onClick={() => setShowConcernDropdown(!showConcernDropdown)}
                  className="w-full p-2.5 text-xs border border-blue-500 rounded-lg bg-white font-medium text-left flex items-center justify-between shadow-2xs cursor-pointer focus:ring-2 focus:ring-blue-500"
                >
                  <span className="font-semibold text-gray-800">{concern}</span>
                  <ChevronDown className="w-4 h-4 text-gray-500" />
                </button>

                {showConcernDropdown && (
                  <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-xl z-30 py-1 space-y-0.5 max-h-60 overflow-y-auto">
                    {(['Bán hàng', 'Lợi nhuận', 'Giá trị kho', 'Xuất nhập tồn', 'Xuất nhập tồn chi tiết'] as const).map((item) => (
                      <button
                        key={item}
                        onClick={() => {
                          setConcern(item);
                          setShowConcernDropdown(false);
                        }}
                        className={`w-full text-left px-3 py-2 text-xs font-medium flex items-center justify-between hover:bg-blue-50 transition-colors cursor-pointer ${
                          concern === item ? 'text-blue-600 font-bold bg-blue-50/60' : 'text-gray-700'
                        }`}
                      >
                        <span>{item}</span>
                        {concern === item && <Check className="w-4 h-4 text-blue-600" />}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <hr className="border-gray-200" />

            {/* Section 3: Khoảng thời gian */}
            <div className="space-y-3">
              <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block">
                Khoảng thời gian
              </label>
              <div>
                <span className="text-[11px] text-gray-500 block mb-1">Từ ngày:</span>
                <input
                  type="date"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                  className="w-full p-2 text-xs border border-gray-300 rounded-lg bg-white font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none cursor-pointer"
                />
              </div>
              <div>
                <span className="text-[11px] text-gray-500 block mb-1">Đến ngày:</span>
                <input
                  type="date"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                  className="w-full p-2 text-xs border border-gray-300 rounded-lg bg-white font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none cursor-pointer"
                />
              </div>

              {/* Quick preset buttons */}
              <div className="grid grid-cols-2 gap-1.5 pt-1 text-[10px]">
                <button
                  onClick={() => {
                    const today = new Date().toISOString().split('T')[0];
                    setFromDate(today);
                    setToDate(today);
                  }}
                  className="py-1 px-2 bg-gray-100 hover:bg-gray-200 rounded font-medium text-gray-700 transition-colors cursor-pointer"
                >
                  Hôm nay
                </button>
                <button
                  onClick={() => {
                    const d = new Date();
                    d.setDate(d.getDate() - 7);
                    setFromDate(d.toISOString().split('T')[0]);
                    setToDate(new Date().toISOString().split('T')[0]);
                  }}
                  className="py-1 px-2 bg-gray-100 hover:bg-gray-200 rounded font-medium text-gray-700 transition-colors cursor-pointer"
                >
                  7 ngày qua
                </button>
              </div>
            </div>

            {/* Bottom Stats Summary */}
            <div className="mt-auto bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-2 text-xs">
              <div className="font-bold text-slate-700 border-b border-slate-200 pb-1 flex justify-between">
                <span>Số mặt hàng:</span>
                <span className="font-mono text-indigo-900">{grandTotals.totalItemTypes}</span>
              </div>
              <div className="flex justify-between text-[11px] text-gray-600">
                <span>Tổng SL bán:</span>
                <span className="font-mono font-bold text-gray-800">{grandTotals.totalQtySold}</span>
              </div>
              <div className="flex justify-between text-[11px] text-gray-600">
                <span>Doanh thu thuần:</span>
                <span className="font-mono font-bold text-blue-700">{grandTotals.totalNetRevenue.toLocaleString('vi-VN')}đ</span>
              </div>
            </div>

          </div>
        )}

        {/* Collapsible Badge Overlay Button matching screenshot [ Ẩn bộ lọc ] */}
        <button
          onClick={() => setShowFilterSidebar(!showFilterSidebar)}
          className="hidden md:flex absolute left-4 md:left-[270px] top-8 z-20 bg-slate-800 text-white text-[11px] font-semibold px-2.5 py-1 rounded-r-md shadow-md hover:bg-slate-700 transition-all cursor-pointer items-center space-x-1 border-l border-slate-600"
          title={showFilterSidebar ? "Ẩn bộ lọc" : "Hiện bộ lọc"}
        >
          {showFilterSidebar ? (
            <>
              <EyeOff className="w-3.5 h-3.5 text-slate-300" />
              <span>Ẩn bộ lọc</span>
            </>
          ) : (
            <>
              <Eye className="w-3.5 h-3.5 text-slate-300" />
              <span>Hiện bộ lọc</span>
            </>
          )}
        </button>

        {/* RIGHT MAIN CANVAS AREA */}
        <div className="flex-1 bg-slate-600 rounded-xl border border-slate-700 shadow-inner flex flex-col overflow-hidden relative">
          
          {/* Document Viewer Toolbar */}
          <div className="bg-slate-800 text-slate-200 px-4 py-2 border-b border-slate-700 flex items-center justify-between shadow-md shrink-0 no-print flex-wrap gap-2 text-xs">
            
            {/* Left toolbar controls: Refresh */}
            <div className="flex items-center space-x-1">
              <button
                onClick={() => {
                  const today = new Date().toISOString().split('T')[0];
                  setToDate(today);
                }}
                className="p-1.5 hover:bg-slate-700 rounded text-slate-300 hover:text-white transition-colors cursor-pointer"
                title="Cập nhật dữ liệu"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>

            {/* Center toolbar controls: Pagination */}
            <div className="flex items-center space-x-2 bg-slate-900/60 px-3 py-1 rounded-md border border-slate-700">
              <button className="text-slate-400 hover:text-white disabled:opacity-30" disabled>
                <ChevronsLeft className="w-4 h-4" />
              </button>
              <button className="text-slate-400 hover:text-white disabled:opacity-30" disabled>
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="font-mono text-xs">
                <span className="bg-slate-800 text-white px-2 py-0.5 rounded border border-slate-600 font-bold">1</span> / 1
              </span>
              <button className="text-slate-400 hover:text-white disabled:opacity-30" disabled>
                <ChevronRight className="w-4 h-4" />
              </button>
              <button className="text-slate-400 hover:text-white disabled:opacity-30" disabled>
                <ChevronsRight className="w-4 h-4" />
              </button>
            </div>

            {/* Right toolbar controls: Zoom, Export, Print */}
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-1 bg-slate-900/60 px-2 py-1 rounded-md border border-slate-700">
                <button
                  onClick={() => setZoomLevel((z) => Math.max(70, z - 10))}
                  className="text-slate-300 hover:text-white p-0.5 cursor-pointer"
                  title="Thu nhỏ"
                >
                  <ZoomOut className="w-3.5 h-3.5" />
                </button>
                <span className="font-mono text-[11px] text-slate-300 px-1">{zoomLevel}%</span>
                <button
                  onClick={() => setZoomLevel((z) => Math.min(150, z + 10))}
                  className="text-slate-300 hover:text-white p-0.5 cursor-pointer"
                  title="Phóng to"
                >
                  <ZoomIn className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Export Button */}
              <button
                onClick={handleExportCSV}
                className="flex items-center space-x-1 bg-slate-700 hover:bg-slate-600 text-white px-2.5 py-1 rounded text-xs font-semibold cursor-pointer transition-colors"
              >
                <Download className="w-3.5 h-3.5 text-amber-400" />
                <span>Xuất file</span>
              </button>

              {/* Print Button */}
              <button
                onClick={handlePrint}
                className="flex items-center space-x-1 bg-blue-600 hover:bg-blue-500 text-white px-3 py-1 rounded text-xs font-bold cursor-pointer transition-colors shadow-sm"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>In báo cáo</span>
              </button>
            </div>
          </div>

          {/* MAIN CANVAS PAPER SHEET */}
          <div className="flex-1 overflow-auto p-4 md:p-8 flex justify-center items-start">
            
            {viewMode === 'Báo cáo' ? (
              /* A4 DOCUMENT SHEET matching screenshot */
              <div
                id="printable-products-report"
                style={{ transform: `scale(${zoomLevel / 100})`, transformOrigin: 'top center' }}
                className={`bg-white shadow-2xl border border-gray-200 text-gray-900 transition-all duration-200 ${
                  orientation === 'Hiển thị ngang' ? 'w-full max-w-[1100px]' : 'w-full max-w-[920px]'
                } min-h-[950px] p-8 md:p-10 font-sans my-2`}
              >
                {/* Header Timestamp */}
                <div className="text-[11px] text-gray-600 font-medium mb-6">
                  Ngày lập: {currentTimestampStr}
                </div>

                {/* Report Document Title Block */}
                <div className="text-center space-y-1 mb-6">
                  <h2 className="text-xl md:text-2xl font-bold tracking-tight text-gray-900">
                    Báo cáo bán hàng theo hàng hóa
                  </h2>
                  <div className="text-xs text-gray-700 font-medium space-y-0.5 pt-1">
                    <p>Từ ngày {formattedFromDate} đến ngày {formattedToDate}</p>
                    <p className="font-semibold">Chi nhánh: Tổng Kho Chống Thấm 36</p>
                    <p className="text-gray-500">Bảng giá: Tất cả</p>
                    <p className="text-[11px] italic text-gray-500 font-normal pt-1">
                      (Đã phân bổ giảm giá hóa đơn, giảm giá phiếu trả)
                    </p>
                  </div>
                </div>

                {/* PRODUCT SALES REPORT TABLE */}
                <div className="overflow-x-auto border border-gray-300 rounded-xs">
                  <table className="w-full text-xs text-left border-collapse">
                    
                    {/* Sky Blue Table Header (#bde8f8) matching screenshot */}
                    <thead>
                      <tr className="bg-[#bde8f8] text-gray-900 font-bold border-b border-gray-300 text-[11px]">
                        <th className="p-2.5 border-r border-gray-300 w-28">Mã hàng</th>
                        <th className="p-2.5 border-r border-gray-300">Tên hàng</th>
                        <th className="p-2.5 border-r border-gray-300 text-right w-20">SL Bán</th>
                        <th className="p-2.5 border-r border-gray-300 text-right w-28">Doanh thu</th>
                        <th className="p-2.5 border-r border-gray-300 text-right w-20">SL Trả</th>
                        <th className="p-2.5 border-r border-gray-300 text-right w-24">Giá trị trả</th>
                        <th className="p-2.5 text-right w-32">Doanh thu thuần</th>
                      </tr>
                    </thead>

                    <tbody>
                      {/* Pale Yellow Grand Total Row (#fbf5d2) matching screenshot */}
                      <tr className="bg-[#fbf5d2] font-bold text-gray-900 border-b border-gray-300 text-xs">
                        <td colSpan={2} className="p-2.5 border-r border-gray-300 font-bold text-gray-900">
                          SL mặt hàng: {grandTotals.totalItemTypes}
                        </td>
                        <td className="p-2.5 border-r border-gray-300 text-right font-mono font-bold">
                          {grandTotals.totalQtySold.toLocaleString('vi-VN')}
                        </td>
                        <td className="p-2.5 border-r border-gray-300 text-right font-mono font-bold">
                          {grandTotals.totalRevenue.toLocaleString('vi-VN')}
                        </td>
                        <td className="p-2.5 border-r border-gray-300 text-right font-mono font-bold">
                          {grandTotals.totalQtyReturned.toLocaleString('vi-VN')}
                        </td>
                        <td className="p-2.5 border-r border-gray-300 text-right font-mono font-bold">
                          {grandTotals.totalReturnValue.toLocaleString('vi-VN')}
                        </td>
                        <td className="p-2.5 text-right font-mono font-black text-blue-600 text-xs">
                          {grandTotals.totalNetRevenue.toLocaleString('vi-VN')}
                        </td>
                      </tr>

                      {/* PRODUCT DATA ROWS matching screenshot */}
                      {productReportList.length > 0 ? (
                        productReportList.map((p) => (
                          <tr key={p.code} className="border-b border-gray-200 hover:bg-blue-50/40 text-gray-800 transition-colors">
                            <td className="p-2.5 border-r border-gray-200 font-bold font-mono text-blue-600 hover:underline cursor-pointer">
                              {p.code}
                            </td>
                            <td className="p-2.5 border-r border-gray-200 font-medium text-gray-900 leading-snug">
                              {p.name}
                            </td>
                            <td className="p-2.5 border-r border-gray-200 text-right font-mono font-semibold">
                              {p.qtySold}
                            </td>
                            <td className="p-2.5 border-r border-gray-200 text-right font-mono">
                              {p.revenue.toLocaleString('vi-VN')}
                            </td>
                            <td className="p-2.5 border-r border-gray-200 text-right font-mono text-gray-600">
                              {p.qtyReturned}
                            </td>
                            <td className="p-2.5 border-r border-gray-200 text-right font-mono text-gray-600">
                              {p.returnValue.toLocaleString('vi-VN')}
                            </td>
                            <td className="p-2.5 text-right font-mono font-bold text-gray-900">
                              {p.netRevenue.toLocaleString('vi-VN')}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={7} className="p-6 text-center text-gray-500 italic">
                            Không tìm thấy dữ liệu hàng hóa trong khoảng thời gian này
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Report Signatures Footer */}
                <div className="mt-16 pt-8 border-t border-gray-200 grid grid-cols-2 text-center text-xs text-gray-700 font-medium">
                  <div>
                    <p className="font-bold uppercase tracking-wider text-gray-900">Người lập báo cáo</p>
                    <p className="text-[11px] text-gray-400 mt-1 italic">(Ký, ghi rõ họ tên)</p>
                  </div>
                  <div>
                    <p className="font-bold uppercase tracking-wider text-gray-900">Quản lý / Chủ cửa hàng</p>
                    <p className="text-[11px] text-gray-400 mt-1 italic">(Ký, ghi rõ họ tên)</p>
                  </div>
                </div>

              </div>
            ) : (
              /* CHART VIEW MODE */
              <div className="w-full max-w-5xl bg-white p-6 md:p-8 rounded-2xl shadow-xl border border-gray-200 my-4 space-y-6">
                <div className="flex justify-between items-center border-b border-gray-200 pb-4">
                  <h2 className="text-lg font-bold text-gray-900 flex items-center space-x-2">
                    <BarChart3 className="w-5 h-5 text-blue-600" />
                    <span>Biểu đồ doanh thu theo mặt hàng</span>
                  </h2>
                  <span className="text-xs text-gray-500">Từ {formattedFromDate} đến {formattedToDate}</span>
                </div>

                {/* Top 5 Products Bar Visualizer */}
                <div className="space-y-4">
                  {productReportList.slice(0, 7).map((p) => {
                    const maxRev = Math.max(...productReportList.map((i) => i.netRevenue), 1);
                    const pct = Math.max(5, Math.min(100, (p.netRevenue / maxRev) * 100));

                    return (
                      <div key={p.code} className="space-y-1">
                        <div className="flex justify-between text-xs font-semibold">
                          <span className="text-gray-800 font-medium">{p.code} - {p.name}</span>
                          <span className="font-mono text-blue-700 font-bold">{p.netRevenue.toLocaleString('vi-VN')}đ</span>
                        </div>
                        <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden border border-slate-200">
                          <div
                            style={{ width: `${pct}%` }}
                            className="bg-gradient-to-r from-blue-500 to-indigo-600 h-full rounded-full transition-all"
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

          </div>

        </div>

      </div>
    </div>
  );
};
