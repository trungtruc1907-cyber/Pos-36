import React, { useState, useMemo } from 'react';
import { Order, PurchaseOrder, Product, Customer, Supplier } from '../../types';
import { 
  Printer, 
  Download, 
  RotateCcw, 
  Search, 
  ChevronDown, 
  ChevronUp, 
  ChevronLeft, 
  ChevronRight, 
  ChevronsLeft, 
  ChevronsRight, 
  ZoomIn, 
  ZoomOut, 
  Maximize2, 
  FileText, 
  Check, 
  Plus, 
  Minus,
  Calendar,
  Building2,
  Table as TableIcon,
  BarChart3,
  TrendingUp,
  Users,
  ShoppingBag,
  DollarSign,
  Percent
} from 'lucide-react';

interface SalesReportViewProps {
  orders: Order[];
  products?: Product[];
  customers?: Customer[];
  suppliers?: Supplier[];
  onSwitchReportTab?: (tab: 'daily' | 'sales') => void;
  activeReportTab?: 'daily' | 'sales';
}

export const SalesReportView: React.FC<SalesReportViewProps> = ({
  orders = [],
  products = [],
  customers = [],
  suppliers = [],
  onSwitchReportTab,
  activeReportTab = 'sales',
}) => {
  // Sidebar Configuration State
  const [viewMode, setViewMode] = useState<'Báo cáo' | 'Biểu đồ'>('Báo cáo');
  const [orientation, setOrientation] = useState<'Hiển thị dọc' | 'Hiển thị ngang'>('Hiển thị dọc');
  const [concern, setConcern] = useState<
    'Thời gian' | 'Lợi nhuận' | 'Giảm giá HD' | 'Trả hàng' | 'Nhân viên' | 'Khách hàng' | 'Hàng hóa'
  >('Thời gian');

  // Date Range Picker State
  const [fromDate, setFromDate] = useState<string>(() => {
    // Default to 10/08/2026 or 7 days ago
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

  // UI Dropdowns & Zoom State
  const [showConcernDropdown, setShowConcernDropdown] = useState(false);
  const [showExportDropdown, setShowExportDropdown] = useState(false);
  const [zoomLevel, setZoomLevel] = useState<number>(100);
  const [expandedDates, setExpandedDates] = useState<{ [key: string]: boolean }>({});

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

  // Parse "DD/MM/YYYY" or "YYYY-MM-DD" into Date object for comparison
  const parseOrderDate = (dateStr?: string): Date | null => {
    if (!dateStr) return null;
    try {
      // Handles "DD/MM/YYYY HH:mm" or "YYYY-MM-DD"
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

  // Filter Orders within Date Range & valid status
  const filteredOrders = useMemo(() => {
    return orders.filter((ord) => {
      if (ord.status === 'Đã hủy') return false;
      const parsed = parseOrderDate(ord.date);
      if (!parsed) return true; // include if date parsing falls back
      return parsed >= fromDateObj && parsed <= toDateObj;
    });
  }, [orders, fromDateObj, toDateObj]);

  // Separate Sales Orders vs Return Orders
  const salesOrders = useMemo(() => {
    return filteredOrders.filter(
      (o) => o.status !== 'Trả hàng' && !o.orderCode.startsWith('HDTH')
    );
  }, [filteredOrders]);

  const returnOrders = useMemo(() => {
    return filteredOrders.filter(
      (o) => o.status === 'Trả hàng' || o.orderCode.startsWith('HDTH')
    );
  }, [filteredOrders]);

  // Map product cost prices for profit calculations
  const productCostMap = useMemo(() => {
    const map = new Map<string, number>();
    products.forEach((p) => {
      map.set(p.code, p.giaVon || p.price * 0.7);
    });
    return map;
  }, [products]);

  // Group Data By Date ("Thời gian")
  const dataByDate = useMemo(() => {
    const map = new Map<
      string,
      {
        dateStr: string;
        rawRevenue: number;
        returnVal: number;
        netRevenue: number;
        discountVal: number;
        cogs: number; // Giá vốn hàng bán
        grossProfit: number;
        ordersList: Order[];
      }
    >();

    filteredOrders.forEach((ord) => {
      const dateOnly = ord.date ? ord.date.split(' ')[0] : 'Khác';
      const existing = map.get(dateOnly) || {
        dateStr: dateOnly,
        rawRevenue: 0,
        returnVal: 0,
        netRevenue: 0,
        discountVal: 0,
        cogs: 0,
        grossProfit: 0,
        ordersList: [],
      };

      existing.ordersList.push(ord);

      const isReturn = ord.status === 'Trả hàng' || ord.orderCode.startsWith('HDTH');
      const orderAmount = ord.totalAmount || 0;
      const orderSubtotal = ord.subtotal || orderAmount;
      const orderDiscount = ord.discount || 0;

      // Calculate cost of goods sold for items
      let orderCogs = 0;
      (ord.items || []).forEach((item) => {
        const cost = item.product?.giaVon || productCostMap.get(item.product?.code || '') || (item.unitPrice * 0.7);
        orderCogs += cost * item.quantity;
      });

      if (isReturn) {
        existing.returnVal += orderAmount;
      } else {
        existing.rawRevenue += orderSubtotal;
        existing.discountVal += orderDiscount;
        existing.cogs += orderCogs;
      }

      existing.netRevenue = existing.rawRevenue - existing.returnVal;
      existing.grossProfit = existing.netRevenue - existing.cogs;

      map.set(dateOnly, existing);
    });

    // Sort dates descending
    return Array.from(map.values()).sort((a, b) => {
      const dateA = parseOrderDate(a.dateStr) || new Date(0);
      const dateB = parseOrderDate(b.dateStr) || new Date(0);
      return dateB.getTime() - dateA.getTime();
    });
  }, [filteredOrders, productCostMap]);

  // Group Data By Employee ("Nhân viên")
  const dataByEmployee = useMemo(() => {
    const map = new Map<
      string,
      {
        employeeName: string;
        orderCount: number;
        rawRevenue: number;
        returnVal: number;
        netRevenue: number;
      }
    >();

    filteredOrders.forEach((ord) => {
      const emp = ord.sellerName || 'Thu ngân / POS';
      const existing = map.get(emp) || {
        employeeName: emp,
        orderCount: 0,
        rawRevenue: 0,
        returnVal: 0,
        netRevenue: 0,
      };

      existing.orderCount += 1;
      const isReturn = ord.status === 'Trả hàng' || ord.orderCode.startsWith('HDTH');
      if (isReturn) {
        existing.returnVal += (ord.totalAmount || 0);
      } else {
        existing.rawRevenue += (ord.subtotal || ord.totalAmount || 0);
      }
      existing.netRevenue = existing.rawRevenue - existing.returnVal;

      map.set(emp, existing);
    });

    return Array.from(map.values());
  }, [filteredOrders]);

  // Grand Totals Summary
  const grandTotals = useMemo(() => {
    const totalRevenue = dataByDate.reduce((sum, item) => sum + item.rawRevenue, 0);
    const totalReturnVal = dataByDate.reduce((sum, item) => sum + item.returnVal, 0);
    const totalNetRevenue = totalRevenue - totalReturnVal;
    const totalDiscount = dataByDate.reduce((sum, item) => sum + item.discountVal, 0);
    const totalCogs = dataByDate.reduce((sum, item) => sum + item.cogs, 0);
    const totalGrossProfit = totalNetRevenue - totalCogs;
    const profitMargin = totalNetRevenue > 0 ? (totalGrossProfit / totalNetRevenue) * 100 : 0;

    return {
      totalRevenue,
      totalReturnVal,
      totalNetRevenue,
      totalDiscount,
      totalCogs,
      totalGrossProfit,
      profitMargin,
    };
  }, [dataByDate]);

  // Toggle expanded row for a date
  const toggleDateExpand = (dateStr: string) => {
    setExpandedDates((prev) => ({
      ...prev,
      [dateStr]: !prev[dateStr],
    }));
  };

  // Export to CSV
  const handleExportCSV = () => {
    let csvContent = 'data:text/csv;charset=utf-8,';
    csvContent += `BAO CAO BAN HANG THEO ${concern.toUpperCase()}\n`;
    csvContent += `Tu ngay: ${formattedFromDate} den ngay: ${formattedToDate}\n`;
    csvContent += `Ngay lap: ${currentTimestampStr}\n\n`;

    if (concern === 'Thời gian') {
      csvContent += 'Thoi gian,Doanh thu,Gia tri tra,Doanh thu thuan\n';
      dataByDate.forEach((d) => {
        csvContent += `${d.dateStr},${d.rawRevenue},${d.returnVal},${d.netRevenue}\n`;
      });
      csvContent += `Tong cong,${grandTotals.totalRevenue},${grandTotals.totalReturnVal},${grandTotals.totalNetRevenue}\n`;
    } else if (concern === 'Lợi nhuận') {
      csvContent += 'Thoi gian,Doanh thu,Gia von,Loi nhuan gop,Ty suat (%)\n';
      dataByDate.forEach((d) => {
        const margin = d.netRevenue > 0 ? ((d.grossProfit / d.netRevenue) * 100).toFixed(1) : '0';
        csvContent += `${d.dateStr},${d.rawRevenue},${d.cogs},${d.grossProfit},${margin}%\n`;
      });
    }

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Bao_cao_ban_hang_${concern}_${formattedFromDate.replace(/\//g, '-')}.csv`);
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
          #printable-sales-report, #printable-sales-report * {
            visibility: visible;
          }
          #printable-sales-report {
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
          Báo cáo bán hàng
        </h1>
        <div className="text-xs text-gray-500 font-medium">
          Chi nhánh: <span className="font-bold text-gray-800">Tổng Kho Chống Thấm 36</span>
        </div>
      </div>
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden p-4 md:p-6 gap-6">
        
        {/* LEFT SIDEBAR CONTROLS PANEL */}
        <div className="w-full md:w-64 lg:w-72 bg-white rounded-xl border border-gray-200 p-4 shadow-sm shrink-0 flex flex-col space-y-5 no-print">
          
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
            <div className="flex items-center space-x-1.5 bg-slate-100 p-1 rounded-full border border-gray-200">
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
            <div className="mt-3">
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
                  {(['Thời gian', 'Lợi nhuận', 'Giảm giá HD', 'Trả hàng', 'Nhân viên', 'Khách hàng', 'Hàng hóa'] as const).map((item) => (
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

          {/* Section 3: Khoảng thời gian Báo cáo */}
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

          {/* Stats summary in left sidebar */}
          <div className="mt-auto bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-2 text-xs">
            <div className="font-bold text-slate-700 border-b border-slate-200 pb-1">
              Doanh thu thuần phát sinh
            </div>
            <div className="text-base font-black text-[#1e0b54] font-mono">
              {grandTotals.totalNetRevenue.toLocaleString('vi-VN')}đ
            </div>
            <div className="flex justify-between text-[11px] text-gray-500">
              <span>Doanh thu gộp:</span>
              <span className="font-mono font-semibold text-gray-800">{grandTotals.totalRevenue.toLocaleString('vi-VN')}đ</span>
            </div>
            <div className="flex justify-between text-[11px] text-gray-500">
              <span>Giá trị hàng trả:</span>
              <span className="font-mono font-semibold text-amber-700">-{grandTotals.totalReturnVal.toLocaleString('vi-VN')}đ</span>
            </div>
          </div>

        </div>

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
              {/* Zoom controls */}
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

          {/* MAIN CONTENT AREA: Báo cáo (Document Paper Sheet) OR Biểu đồ (Interactive Charts) */}
          <div className="flex-1 overflow-auto p-4 md:p-8 flex justify-center items-start">
            
            {viewMode === 'Báo cáo' ? (
              /* A4 DOCUMENT REPORT SHEET matching screenshot */
              <div
                id="printable-sales-report"
                style={{ transform: `scale(${zoomLevel / 100})`, transformOrigin: 'top center' }}
                className={`bg-white shadow-2xl border border-gray-200 text-gray-900 transition-all duration-200 ${
                  orientation === 'Hiển thị ngang' ? 'w-full max-w-[1100px]' : 'w-full max-w-[880px]'
                } min-h-[950px] p-8 md:p-10 font-sans my-2`}
              >
                {/* Header Date Stamp on Paper */}
                <div className="text-[11px] text-gray-600 font-medium mb-6">
                  Ngày lập: {currentTimestampStr}
                </div>

                {/* Report Document Title Block */}
                <div className="text-center space-y-1 mb-8">
                  <h2 className="text-xl md:text-2xl font-bold tracking-tight text-gray-900">
                    Báo cáo bán hàng theo {concern.toLowerCase()}
                  </h2>
                  <div className="text-xs text-gray-700 font-medium space-y-0.5 pt-1">
                    <p>Từ ngày {formattedFromDate} đến ngày {formattedToDate}</p>
                    <p className="font-semibold">Chi nhánh: Tổng Kho Chống Thấm 36</p>
                    <p className="text-gray-500">Bảng giá: Tất cả</p>
                  </div>
                </div>

                {/* REPORT TABLE */}
                <div className="overflow-x-auto border border-gray-300 rounded-xs">
                  <table className="w-full text-xs text-left border-collapse">
                    
                    {/* Sky Blue Table Header (#bde8f8) matching screenshot */}
                    <thead>
                      <tr className="bg-[#bde8f8] text-gray-900 font-bold border-b border-gray-300 text-[11px]">
                        {concern === 'Thời gian' && (
                          <>
                            <th className="p-2.5 border-r border-gray-300">Thời gian</th>
                            <th className="p-2.5 border-r border-gray-300 text-right">Doanh thu</th>
                            <th className="p-2.5 border-r border-gray-300 text-right">Giá trị trả</th>
                            <th className="p-2.5 text-right">Doanh thu thuần</th>
                          </>
                        )}

                        {concern === 'Lợi nhuận' && (
                          <>
                            <th className="p-2.5 border-r border-gray-300">Thời gian</th>
                            <th className="p-2.5 border-r border-gray-300 text-right">Doanh thu thuần</th>
                            <th className="p-2.5 border-r border-gray-300 text-right">Giá vốn hàng bán</th>
                            <th className="p-2.5 border-r border-gray-300 text-right">Lợi nhuận gộp</th>
                            <th className="p-2.5 text-right">Tỷ suất LNG</th>
                          </>
                        )}

                        {concern === 'Giảm giá HD' && (
                          <>
                            <th className="p-2.5 border-r border-gray-300">Thời gian</th>
                            <th className="p-2.5 border-r border-gray-300 text-right">Doanh thu gộp</th>
                            <th className="p-2.5 border-r border-gray-300 text-right">Giảm giá hóa đơn</th>
                            <th className="p-2.5 text-right">Doanh thu thực tính</th>
                          </>
                        )}

                        {concern === 'Trả hàng' && (
                          <>
                            <th className="p-2.5 border-r border-gray-300">Thời gian</th>
                            <th className="p-2.5 border-r border-gray-300 text-right">Số lượng đơn trả</th>
                            <th className="p-2.5 border-r border-gray-300 text-right">Giá trị trả hàng</th>
                            <th className="p-2.5 text-right">Phí trả hàng</th>
                          </>
                        )}

                        {concern === 'Nhân viên' && (
                          <>
                            <th className="p-2.5 border-r border-gray-300">Nhân viên</th>
                            <th className="p-2.5 border-r border-gray-300 text-right">Số lượng đơn</th>
                            <th className="p-2.5 border-r border-gray-300 text-right">Doanh thu</th>
                            <th className="p-2.5 border-r border-gray-300 text-right">Giá trị trả</th>
                            <th className="p-2.5 text-right">Doanh thu thuần</th>
                          </>
                        )}

                        {(concern === 'Khách hàng' || concern === 'Hàng hóa') && (
                          <>
                            <th className="p-2.5 border-r border-gray-300">{concern}</th>
                            <th className="p-2.5 border-r border-gray-300 text-right">Doanh thu gộp</th>
                            <th className="p-2.5 border-r border-gray-300 text-right">Giá trị trả</th>
                            <th className="p-2.5 text-right">Doanh thu thuần</th>
                          </>
                        )}
                      </tr>
                    </thead>

                    <tbody>
                      {/* Pale Yellow Grand Total Row (#fbf5d2) matching screenshot */}
                      <tr className="bg-[#fbf5d2] font-bold text-gray-900 border-b border-gray-300 text-xs">
                        {concern === 'Thời gian' && (
                          <>
                            <td className="p-2.5 border-r border-gray-300 font-mono text-gray-500">---</td>
                            <td className="p-2.5 border-r border-gray-300 text-right font-mono font-bold">
                              {grandTotals.totalRevenue.toLocaleString('vi-VN')}
                            </td>
                            <td className="p-2.5 border-r border-gray-300 text-right font-mono font-bold text-amber-900">
                              {grandTotals.totalReturnVal.toLocaleString('vi-VN')}
                            </td>
                            <td className="p-2.5 text-right font-mono font-black text-blue-600 text-sm">
                              {grandTotals.totalNetRevenue.toLocaleString('vi-VN')}
                            </td>
                          </>
                        )}

                        {concern === 'Lợi nhuận' && (
                          <>
                            <td className="p-2.5 border-r border-gray-300 font-mono text-gray-500">---</td>
                            <td className="p-2.5 border-r border-gray-300 text-right font-mono font-bold">
                              {grandTotals.totalNetRevenue.toLocaleString('vi-VN')}
                            </td>
                            <td className="p-2.5 border-r border-gray-300 text-right font-mono font-bold text-gray-700">
                              {grandTotals.totalCogs.toLocaleString('vi-VN')}
                            </td>
                            <td className="p-2.5 border-r border-gray-300 text-right font-mono font-black text-emerald-800">
                              {grandTotals.totalGrossProfit.toLocaleString('vi-VN')}
                            </td>
                            <td className="p-2.5 text-right font-mono font-bold text-blue-700">
                              {grandTotals.profitMargin.toFixed(1)}%
                            </td>
                          </>
                        )}

                        {concern === 'Giảm giá HD' && (
                          <>
                            <td className="p-2.5 border-r border-gray-300 font-mono text-gray-500">---</td>
                            <td className="p-2.5 border-r border-gray-300 text-right font-mono font-bold">
                              {grandTotals.totalRevenue.toLocaleString('vi-VN')}
                            </td>
                            <td className="p-2.5 border-r border-gray-300 text-right font-mono font-bold text-amber-900">
                              {grandTotals.totalDiscount.toLocaleString('vi-VN')}
                            </td>
                            <td className="p-2.5 text-right font-mono font-black text-blue-600">
                              {grandTotals.totalNetRevenue.toLocaleString('vi-VN')}
                            </td>
                          </>
                        )}

                        {concern === 'Trả hàng' && (
                          <>
                            <td className="p-2.5 border-r border-gray-300 font-mono text-gray-500">---</td>
                            <td className="p-2.5 border-r border-gray-300 text-right font-mono font-bold">
                              {returnOrders.length}
                            </td>
                            <td className="p-2.5 border-r border-gray-300 text-right font-mono font-black text-amber-900">
                              {grandTotals.totalReturnVal.toLocaleString('vi-VN')}
                            </td>
                            <td className="p-2.5 text-right font-mono text-gray-500">0</td>
                          </>
                        )}

                        {concern === 'Nhân viên' && (
                          <>
                            <td className="p-2.5 border-r border-gray-300 font-mono text-gray-500">---</td>
                            <td className="p-2.5 border-r border-gray-300 text-right font-mono font-bold">
                              {filteredOrders.length}
                            </td>
                            <td className="p-2.5 border-r border-gray-300 text-right font-mono font-bold">
                              {grandTotals.totalRevenue.toLocaleString('vi-VN')}
                            </td>
                            <td className="p-2.5 border-r border-gray-300 text-right font-mono font-bold text-amber-900">
                              {grandTotals.totalReturnVal.toLocaleString('vi-VN')}
                            </td>
                            <td className="p-2.5 text-right font-mono font-black text-blue-600">
                              {grandTotals.totalNetRevenue.toLocaleString('vi-VN')}
                            </td>
                          </>
                        )}

                        {(concern === 'Khách hàng' || concern === 'Hàng hóa') && (
                          <>
                            <td className="p-2.5 border-r border-gray-300 font-mono text-gray-500">---</td>
                            <td className="p-2.5 border-r border-gray-300 text-right font-mono font-bold">
                              {grandTotals.totalRevenue.toLocaleString('vi-VN')}
                            </td>
                            <td className="p-2.5 border-r border-gray-300 text-right font-mono font-bold text-amber-900">
                              {grandTotals.totalReturnVal.toLocaleString('vi-VN')}
                            </td>
                            <td className="p-2.5 text-right font-mono font-black text-blue-600">
                              {grandTotals.totalNetRevenue.toLocaleString('vi-VN')}
                            </td>
                          </>
                        )}
                      </tr>

                      {/* DATA ROWS (Grouped by Date, Employee, etc.) */}
                      {concern === 'Thời gian' && (
                        dataByDate.length > 0 ? (
                          dataByDate.map((row) => (
                            <React.Fragment key={row.dateStr}>
                              <tr className="border-b border-gray-200 hover:bg-blue-50/40 text-gray-800 transition-colors">
                                <td className="p-2.5 border-r border-gray-200 font-medium">
                                  <button
                                    onClick={() => toggleDateExpand(row.dateStr)}
                                    className="flex items-center space-x-1.5 cursor-pointer font-bold text-blue-900 hover:underline"
                                  >
                                    <span className="w-4 h-4 rounded bg-gray-100 border border-gray-300 flex items-center justify-center text-[10px] font-mono shrink-0">
                                      {expandedDates[row.dateStr] ? '-' : '+'}
                                    </span>
                                    <span>{row.dateStr}</span>
                                  </button>
                                </td>
                                <td className="p-2.5 border-r border-gray-200 text-right font-mono font-semibold">
                                  {row.rawRevenue.toLocaleString('vi-VN')}
                                </td>
                                <td className="p-2.5 border-r border-gray-200 text-right font-mono text-amber-800 font-medium">
                                  {row.returnVal.toLocaleString('vi-VN')}
                                </td>
                                <td className="p-2.5 text-right font-mono font-bold text-blue-700">
                                  {row.netRevenue.toLocaleString('vi-VN')}
                                </td>
                              </tr>

                              {/* Expanded Row showing Order Details on that date */}
                              {expandedDates[row.dateStr] && (
                                <tr>
                                  <td colSpan={4} className="p-3 bg-slate-50 border-b border-gray-300 pl-8">
                                    <div className="text-[11px] font-bold text-slate-700 mb-2">
                                      Danh sách đơn hàng ngày {row.dateStr} ({row.ordersList.length} đơn):
                                    </div>
                                    <div className="space-y-1">
                                      {row.ordersList.map((ord) => (
                                        <div key={ord.id} className="flex justify-between text-[11px] bg-white p-2 rounded border border-slate-200">
                                          <div className="flex items-center space-x-2">
                                            <span className="font-mono font-bold text-indigo-900">{ord.orderCode}</span>
                                            <span className="text-gray-500">{ord.customerName}</span>
                                            <span className="text-gray-400 font-mono">{ord.date?.split(' ')[1] || ''}</span>
                                          </div>
                                          <div className="font-mono font-bold text-gray-800">
                                            {(ord.totalAmount || 0).toLocaleString('vi-VN')}đ
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  </td>
                                </tr>
                              )}
                            </React.Fragment>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={4} className="p-6 text-center text-gray-500 italic">
                              Không tìm thấy dữ liệu bán hàng trong khoảng thời gian từ {formattedFromDate} đến {formattedToDate}
                            </td>
                          </tr>
                        )
                      )}

                      {concern === 'Lợi nhuận' && (
                        dataByDate.map((row) => {
                          const margin = row.netRevenue > 0 ? ((row.grossProfit / row.netRevenue) * 100).toFixed(1) : '0';
                          return (
                            <tr key={row.dateStr} className="border-b border-gray-200 hover:bg-blue-50/40 text-gray-800">
                              <td className="p-2.5 border-r border-gray-200 font-bold text-indigo-900">{row.dateStr}</td>
                              <td className="p-2.5 border-r border-gray-200 text-right font-mono">{row.netRevenue.toLocaleString('vi-VN')}</td>
                              <td className="p-2.5 border-r border-gray-200 text-right font-mono text-gray-600">{row.cogs.toLocaleString('vi-VN')}</td>
                              <td className="p-2.5 border-r border-gray-200 text-right font-mono font-bold text-emerald-800">{row.grossProfit.toLocaleString('vi-VN')}</td>
                              <td className="p-2.5 text-right font-mono font-bold text-blue-700">{margin}%</td>
                            </tr>
                          );
                        })
                      )}

                      {concern === 'Nhân viên' && (
                        dataByEmployee.map((emp) => (
                          <tr key={emp.employeeName} className="border-b border-gray-200 hover:bg-blue-50/40 text-gray-800">
                            <td className="p-2.5 border-r border-gray-200 font-bold text-gray-900">{emp.employeeName}</td>
                            <td className="p-2.5 border-r border-gray-200 text-right font-mono">{emp.orderCount}</td>
                            <td className="p-2.5 border-r border-gray-200 text-right font-mono">{emp.rawRevenue.toLocaleString('vi-VN')}</td>
                            <td className="p-2.5 border-r border-gray-200 text-right font-mono text-amber-800">{emp.returnVal.toLocaleString('vi-VN')}</td>
                            <td className="p-2.5 text-right font-mono font-bold text-blue-700">{emp.netRevenue.toLocaleString('vi-VN')}</td>
                          </tr>
                        ))
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
              /* CHART VIEW mode (when user selects "Biểu đồ" pill) */
              <div className="w-full max-w-5xl bg-white p-6 md:p-8 rounded-2xl shadow-xl border border-gray-200 my-4 space-y-6">
                
                {/* Chart Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-200 pb-4">
                  <div>
                    <h2 className="text-lg font-extrabold text-gray-900 flex items-center space-x-2">
                      <BarChart3 className="w-5 h-5 text-blue-600" />
                      <span>Biểu đồ doanh thu bán hàng</span>
                    </h2>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Từ ngày {formattedFromDate} đến ngày {formattedToDate} - Chi nhánh Tổng Kho Chống Thấm 36
                    </p>
                  </div>

                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-bold text-gray-600">Chỉ số:</span>
                    <span className="px-2.5 py-1 bg-blue-50 text-blue-700 border border-blue-200 rounded text-xs font-bold">
                      Doanh thu thuần
                    </span>
                  </div>
                </div>

                {/* Key Metric Highlight Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-xl">
                    <div className="text-xs font-bold text-blue-800">Doanh thu thuần</div>
                    <div className="text-xl font-black text-[#1e0b54] font-mono mt-1">
                      {grandTotals.totalNetRevenue.toLocaleString('vi-VN')}đ
                    </div>
                  </div>

                  <div className="p-4 bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200 rounded-xl">
                    <div className="text-xs font-bold text-emerald-800">Lợi nhuận gộp</div>
                    <div className="text-xl font-black text-emerald-900 font-mono mt-1">
                      {grandTotals.totalGrossProfit.toLocaleString('vi-VN')}đ
                    </div>
                  </div>

                  <div className="p-4 bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 rounded-xl">
                    <div className="text-xs font-bold text-amber-800">Tỷ suất lợi nhuận</div>
                    <div className="text-xl font-black text-amber-900 font-mono mt-1">
                      {grandTotals.profitMargin.toFixed(1)}%
                    </div>
                  </div>
                </div>

                {/* Custom SVG Bar Chart Visualizer */}
                <div className="p-6 bg-slate-50 border border-slate-200 rounded-xl">
                  <div className="text-xs font-bold text-slate-700 mb-6 flex items-center justify-between">
                    <span>Diễn biến doanh thu theo {concern.toLowerCase()}</span>
                    <span className="text-[11px] text-gray-400">Đơn vị: VNĐ</span>
                  </div>

                  <div className="h-64 flex items-end space-x-4 md:space-x-8 justify-center pt-8 pb-2 border-b border-gray-300 px-4 overflow-x-auto">
                    {dataByDate.slice(0, 8).map((d) => {
                      const maxVal = Math.max(...dataByDate.map((i) => i.netRevenue), 1);
                      const heightPercent = Math.max(10, Math.min(100, (d.netRevenue / maxVal) * 100));

                      return (
                        <div key={d.dateStr} className="flex flex-col items-center group relative flex-1 min-w-[50px] max-w-[80px]">
                          {/* Tooltip on Hover */}
                          <div className="absolute -top-10 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900 text-white text-[10px] font-mono py-1 px-2 rounded shadow-lg whitespace-nowrap z-20 pointer-events-none">
                            {d.netRevenue.toLocaleString('vi-VN')}đ
                          </div>

                          {/* Bar Graphic */}
                          <div className="w-full bg-slate-200 rounded-t h-full flex items-end justify-center">
                            <div
                              style={{ height: `${heightPercent}%` }}
                              className="w-full bg-gradient-to-t from-blue-700 to-indigo-500 rounded-t group-hover:from-blue-600 group-hover:to-indigo-400 transition-all shadow-md"
                            />
                          </div>

                          {/* Date Label */}
                          <div className="text-[10px] font-mono text-gray-600 font-semibold mt-2 truncate w-full text-center">
                            {d.dateStr}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

              </div>
            )}

          </div>

        </div>

      </div>
    </div>
  );
};
