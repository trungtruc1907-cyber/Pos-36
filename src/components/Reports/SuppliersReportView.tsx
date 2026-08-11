import React, { useState, useMemo } from 'react';
import { PurchaseOrder, Supplier, Product } from '../../types';
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
  Search,
  Building2,
  BarChart3,
  Filter,
  EyeOff,
  Eye
} from 'lucide-react';

interface SuppliersReportViewProps {
  purchases?: PurchaseOrder[];
  suppliers?: Supplier[];
  products?: Product[];
  onSwitchReportTab?: (tab: 'daily' | 'sales' | 'products' | 'suppliers') => void;
  activeReportTab?: string;
}

interface SupplierReportItem {
  id: string;
  code: string;
  name: string;
  phone: string;
  importCount: number;
  importValue: number;
  returnCount: number;
  returnValue: number;
  netImportValue: number;
  currentDebt: number;
}

export const SuppliersReportView: React.FC<SuppliersReportViewProps> = ({
  purchases = [],
  suppliers = [],
  products = [],
  onSwitchReportTab,
  activeReportTab = 'suppliers',
}) => {
  // Sidebar Configuration State
  const [viewMode, setViewMode] = useState<'Biểu đồ' | 'Báo cáo'>('Biểu đồ');
  const [concern, setConcern] = useState<'Nhập hàng' | 'Công nợ' | 'Hàng nhập theo NCC'>('Nhập hàng');
  const [showConcernDropdown, setShowConcernDropdown] = useState(false);
  const [supplierSearch, setSupplierSearch] = useState('');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Document view options
  const [orientation, setOrientation] = useState<'Hiển thị dọc' | 'Hiển thị ngang'>('Hiển thị ngang');
  const [zoomLevel, setZoomLevel] = useState<number>(100);

  // Date Range Picker State
  const [fromDate, setFromDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
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

  // Date Formatter helpers
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

  const currentTimestampStr = useMemo(() => {
    const d = new Date();
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const yyyy = d.getFullYear();
    const hh = String(d.getHours()).padStart(2, '0');
    const min = String(d.getMinutes()).padStart(2, '0');
    return `${dd}/${mm}/${yyyy} ${hh}:${min}`;
  }, []);

  // Aggregated Supplier Data from Database & Purchase Orders
  const supplierReportList = useMemo(() => {
    const map = new Map<string, SupplierReportItem>();

    // Initial default supplier list including sample / database suppliers
    const defaultSuppliersList: Supplier[] = [
      {
        id: 'SUP-001',
        code: 'NCC000048',
        name: 'Công ty cổ phần đầu tư và xúc tiến thương mại Hà Thanh',
        phone: '0988123456',
        currentDebt: 12500000,
        totalPurchased: 25500000,
      },
      {
        id: 'SUP-002',
        code: 'NCC000049',
        name: 'Cường Việt NA',
        phone: '0975325757',
        currentDebt: 5200000,
        totalPurchased: 18400000,
      },
      {
        id: 'SUP-003',
        code: 'NCC000050',
        name: 'Tập đoàn Sika Việt Nam',
        phone: '0903888999',
        currentDebt: 0,
        totalPurchased: 15200000,
      },
      {
        id: 'SUP-004',
        code: 'NCC000051',
        name: 'Công ty TNHH Quicseal Việt Nam',
        phone: '0912345678',
        currentDebt: 3400000,
        totalPurchased: 12100000,
      },
      {
        id: 'SUP-005',
        code: 'NCC000052',
        name: 'Nhà phân phối chống thấm Bestmix',
        phone: '0934567890',
        currentDebt: 8000000,
        totalPurchased: 9800000,
      },
    ];

    // Combine database suppliers with defaults
    const combinedSuppliersMap = new Map<string, Supplier>();
    defaultSuppliersList.forEach((s) => combinedSuppliersMap.set(s.name, s));
    suppliers.forEach((s) => combinedSuppliersMap.set(s.name, s));

    // Seed map with known suppliers
    combinedSuppliersMap.forEach((s) => {
      map.set(s.name, {
        id: s.id,
        code: s.code || 'NCC-UNNAMED',
        name: s.name,
        phone: s.phone || '',
        importCount: s.totalPurchased ? 1 : 0,
        importValue: s.totalPurchased || 0,
        returnCount: 0,
        returnValue: 0,
        netImportValue: s.totalPurchased || 0,
        currentDebt: s.currentDebt || 0,
      });
    });

    // Aggregate from purchases
    purchases.forEach((p) => {
      if (p.status === 'Đã hủy') return;
      const sName = p.supplierName || 'Nhà cung cấp vãng lai';
      const existing = map.get(sName) || {
        id: p.supplierCode || 'SUP-TEMP',
        code: p.supplierCode || 'NCC000099',
        name: sName,
        phone: '',
        importCount: 0,
        importValue: 0,
        returnCount: 0,
        returnValue: 0,
        netImportValue: 0,
        currentDebt: 0,
      };

      if (p.type === 'return' || p.status === 'Đã trả hàng') {
        existing.returnCount += 1;
        existing.returnValue += p.totalAmount || 0;
      } else {
        existing.importCount += 1;
        existing.importValue += p.totalAmount || 0;
      }

      existing.netImportValue = existing.importValue - existing.returnValue;
      map.set(sName, existing);
    });

    let list = Array.from(map.values());

    // Filter by Search Query
    if (supplierSearch.trim()) {
      const q = supplierSearch.toLowerCase().trim();
      list = list.filter(
        (item) =>
          item.code.toLowerCase().includes(q) ||
          item.name.toLowerCase().includes(q) ||
          item.phone.toLowerCase().includes(q)
      );
    }

    // Sort according to selected Concern
    if (concern === 'Công nợ') {
      list.sort((a, b) => b.currentDebt - a.currentDebt);
    } else {
      list.sort((a, b) => b.netImportValue - a.netImportValue);
    }

    return list;
  }, [suppliers, purchases, supplierSearch, concern]);

  // Top 10 Suppliers for Chart View
  const top10Suppliers = useMemo(() => {
    return supplierReportList.slice(0, 10);
  }, [supplierReportList]);

  // Grand Totals Summary
  const grandTotals = useMemo(() => {
    const totalSuppliersCount = supplierReportList.length;
    const totalImportValue = supplierReportList.reduce((sum, s) => sum + s.importValue, 0);
    const totalReturnValue = supplierReportList.reduce((sum, s) => sum + s.returnValue, 0);
    const totalNetImportValue = supplierReportList.reduce((sum, s) => sum + s.netImportValue, 0);
    const totalDebt = supplierReportList.reduce((sum, s) => sum + s.currentDebt, 0);

    return {
      totalSuppliersCount,
      totalImportValue,
      totalReturnValue,
      totalNetImportValue,
      totalDebt,
    };
  }, [supplierReportList]);

  // Maximum value for horizontal bar chart scaling
  const maxChartVal = useMemo(() => {
    if (top10Suppliers.length === 0) return 30000000;
    const maxVal = Math.max(
      ...top10Suppliers.map((s) => (concern === 'Công nợ' ? s.currentDebt : s.netImportValue))
    );
    // Ceiling to nice steps of 3M or 6M
    return Math.max(30000000, Math.ceil(maxVal / 3000000) * 3000000);
  }, [top10Suppliers, concern]);

  // Export CSV Handler
  const handleExportCSV = () => {
    let csvContent = 'data:text/csv;charset=utf-8,';
    csvContent += `BAO CAO NHA CUNG CAP (${concern.toUpperCase()})\n`;
    csvContent += `Tu ngay: ${formattedFromDate} den ngay: ${formattedToDate}\n`;
    csvContent += `Ngay lap: ${currentTimestampStr}\n\n`;

    csvContent += 'Ma NCC,Ten nha cung cap,So dien thoai,Gia tri nhap,Gia tri tra,Gia tri nhap thuan,No hien tai\n';
    supplierReportList.forEach((s) => {
      csvContent += `"${s.code}","${s.name}","${s.phone}",${s.importValue},${s.returnValue},${s.netImportValue},${s.currentDebt}\n`;
    });
    csvContent += `Tong cong (${grandTotals.totalSuppliersCount} NCC),,,${grandTotals.totalImportValue},${grandTotals.totalReturnValue},${grandTotals.totalNetImportValue},${grandTotals.totalDebt}\n`;

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Bao_cao_Nha_cung_cap_${formattedFromDate.replace(/\//g, '-')}.csv`);
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
          #printable-supplier-report, #printable-supplier-report * {
            visibility: visible;
          }
          #printable-supplier-report {
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

      {/* Top Header Bar matching screenshot: "Báo cáo nhà cung cấp" */}
      <div className="bg-white border-b border-gray-200 px-6 py-3.5 flex items-center justify-between shadow-xs no-print">
        <h1 className="text-xl font-bold text-gray-900 tracking-tight">
          Báo cáo nhà cung cấp
        </h1>
        <div className="text-xs text-gray-500 font-medium">
          Chi nhánh: <span className="font-bold text-gray-800">Tổng Kho Chống Thấm 36</span>
        </div>
      </div>

      {/* Main Workspace Layout */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden p-4 md:p-6 gap-6 relative">
        
        {/* LEFT SIDEBAR CONTROLS PANEL */}
        {!sidebarCollapsed && (
          <div className="w-full md:w-64 lg:w-72 bg-white rounded-xl border border-gray-200 p-4 shadow-sm shrink-0 flex flex-col space-y-5 no-print relative transition-all">
            
            {/* Section 1: Kiểu hiển thị (Biểu đồ / Báo cáo) */}
            <div>
              <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-2">
                Kiểu hiển thị
              </label>
              
              {/* Pill Switcher matching screenshot: Biểu đồ (blue pill) | Báo cáo */}
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
            </div>

            <hr className="border-gray-200" />

            {/* Section 2: Mối quan tâm Dropdown matching screenshot */}
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
                  <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-xl z-30 py-1 space-y-0.5">
                    {(['Nhập hàng', 'Công nợ', 'Hàng nhập theo NCC'] as const).map((item) => (
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

            {/* Section 3: Nhà cung cấp Search Filter matching screenshot */}
            <div className="space-y-2">
              <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block">
                Nhà cung cấp
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={supplierSearch}
                  onChange={(e) => setSupplierSearch(e.target.value)}
                  placeholder="Theo mã, tên, số điện thoại"
                  className="w-full p-2.5 pr-8 text-xs border border-gray-300 rounded-lg bg-white font-medium text-gray-800 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
                <Search className="w-4 h-4 text-gray-400 absolute right-2.5 top-3 pointer-events-none" />
              </div>
            </div>

            {/* Bottom Export Action Button */}
            <div className="mt-auto pt-2">
              <button
                onClick={handleExportCSV}
                className="w-full py-2 px-3 border border-gray-300 hover:border-gray-400 bg-white text-gray-700 hover:text-gray-900 rounded-lg text-xs font-bold flex items-center justify-center space-x-2 shadow-2xs transition-all cursor-pointer active:scale-98"
              >
                <Download className="w-4 h-4 text-gray-600" />
                <span>Xuất file Excel</span>
              </button>
            </div>

          </div>
        )}

        {/* Collapsible Circular Button on Sidebar Border matching screenshot (<) */}
        <button
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          className="hidden md:flex absolute left-4 md:left-[278px] top-1/2 -translate-y-1/2 z-20 w-7 h-7 bg-white hover:bg-blue-50 text-blue-600 border border-blue-400 rounded-full shadow-md items-center justify-center transition-all cursor-pointer active:scale-90"
          title={sidebarCollapsed ? 'Hiện bộ lọc' : 'Ẩn bộ lọc'}
          style={{ left: sidebarCollapsed ? '16px' : '278px' }}
        >
          {sidebarCollapsed ? (
            <ChevronRight className="w-4 h-4 text-blue-600 stroke-[2.5]" />
          ) : (
            <ChevronLeft className="w-4 h-4 text-blue-600 stroke-[2.5]" />
          )}
        </button>

        {/* RIGHT MAIN VIEW AREA */}
        <div className="flex-1 bg-white rounded-xl border border-gray-200 shadow-sm flex flex-col overflow-hidden relative">
          
          {viewMode === 'Biểu đồ' ? (
            /* CHART VIEW MODE matching screenshot */
            <div className="flex-1 p-6 md:p-10 flex flex-col overflow-y-auto">
              
              {/* Top Chart Title matching screenshot */}
              <div className="text-center mb-8">
                <h2 className="text-sm md:text-base font-medium text-gray-800 tracking-tight">
                  {concern === 'Công nợ'
                    ? 'Top 10 nhà cung cấp có công nợ lớn nhất'
                    : 'Top 10 nhà cung cấp nhập hàng nhiều nhất (đã trừ trả hàng)'}
                </h2>
              </div>

              {/* HORIZONTAL BAR CHART AREA matching screenshot */}
              <div className="flex-1 flex flex-col justify-center min-h-[380px] max-w-5xl mx-auto w-full px-4">
                
                {/* Horizontal Bars List */}
                <div className="space-y-6 relative z-10">
                  {top10Suppliers.length > 0 ? (
                    top10Suppliers.map((supplier) => {
                      const val = concern === 'Công nợ' ? supplier.currentDebt : supplier.netImportValue;
                      const pct = Math.max(1, Math.min(100, (val / maxChartVal) * 100));

                      return (
                        <div key={supplier.id} className="grid grid-cols-12 items-center gap-4 text-xs font-medium">
                          {/* Y-Axis Supplier Name Label (Left column) */}
                          <div className="col-span-4 md:col-span-3 text-right text-gray-600 font-normal pr-2 truncate" title={supplier.name}>
                            {supplier.name}
                          </div>

                          {/* Bar Graphic Column */}
                          <div className="col-span-8 md:col-span-9 flex items-center h-7 relative group">
                            <div
                              style={{ width: `${pct}%` }}
                              className="bg-[#0066ff] hover:bg-blue-700 h-6 transition-all duration-300 rounded-2xs cursor-pointer shadow-2xs relative"
                            >
                              {/* Hover Tooltip showing exact amount */}
                              <div className="opacity-0 group-hover:opacity-100 pointer-events-none absolute left-full top-1/2 -translate-y-1/2 ml-2 bg-slate-900 text-white text-[11px] font-mono px-2 py-1 rounded shadow-lg z-20 whitespace-nowrap transition-opacity">
                                {val.toLocaleString('vi-VN')}đ
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="text-center py-12 text-gray-400 italic">
                      Chưa có dữ liệu nhà cung cấp phù hợp
                    </div>
                  )}
                </div>

                {/* X-AXIS GRID LINES & LABELS matching screenshot */}
                <div className="mt-8 border-t border-gray-300 pt-2 grid grid-cols-12 text-[11px] text-gray-500 font-normal text-center">
                  <div className="col-span-4 md:col-span-3 text-right pr-2"></div>
                  <div className="col-span-8 md:col-span-9 grid grid-cols-10 text-[11px] font-mono text-gray-500">
                    <span>0</span>
                    <span>3 tr</span>
                    <span>6 tr</span>
                    <span>9 tr</span>
                    <span>12 tr</span>
                    <span>15 tr</span>
                    <span>18 tr</span>
                    <span>21 tr</span>
                    <span>24 tr</span>
                    <span>27 tr</span>
                  </div>
                </div>

              </div>

            </div>
          ) : (
            /* REPORT PAPER VIEW MODE */
            <div className="flex-1 flex flex-col overflow-hidden bg-slate-600">
              
              {/* Document Toolbar */}
              <div className="bg-slate-800 text-slate-200 px-4 py-2 border-b border-slate-700 flex items-center justify-between shadow-md shrink-0 no-print flex-wrap gap-2 text-xs">
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

                <div className="flex items-center space-x-2 bg-slate-900/60 px-3 py-1 rounded-md border border-slate-700">
                  <span className="font-mono text-xs text-slate-300">
                    Trang <span className="bg-slate-800 text-white px-2 py-0.5 rounded border border-slate-600 font-bold">1</span> / 1
                  </span>
                </div>

                <div className="flex items-center space-x-3">
                  <button
                    onClick={handleExportCSV}
                    className="flex items-center space-x-1 bg-slate-700 hover:bg-slate-600 text-white px-2.5 py-1 rounded text-xs font-semibold cursor-pointer transition-colors"
                  >
                    <Download className="w-3.5 h-3.5 text-amber-400" />
                    <span>Xuất file</span>
                  </button>

                  <button
                    onClick={handlePrint}
                    className="flex items-center space-x-1 bg-blue-600 hover:bg-blue-500 text-white px-3 py-1 rounded text-xs font-bold cursor-pointer transition-colors shadow-sm"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>In báo cáo</span>
                  </button>
                </div>
              </div>

              {/* Printable Document Paper Sheet */}
              <div className="flex-1 overflow-auto p-6 md:p-10 flex justify-center items-start">
                <div
                  id="printable-supplier-report"
                  className="bg-white shadow-2xl border border-gray-200 text-gray-900 w-full max-w-[960px] min-h-[900px] p-8 md:p-10 font-sans my-2"
                >
                  <div className="text-[11px] text-gray-500 font-medium mb-6">
                    Ngày lập: {currentTimestampStr}
                  </div>

                  <div className="text-center space-y-1 mb-6">
                    <h2 className="text-xl font-bold tracking-tight text-gray-900">
                      Báo cáo nhập hàng theo nhà cung cấp
                    </h2>
                    <p className="text-xs text-gray-600 font-medium">
                      Từ ngày {formattedFromDate} đến ngày {formattedToDate}
                    </p>
                    <p className="text-xs font-semibold text-gray-700">Chi nhánh: Tổng Kho Chống Thấm 36</p>
                  </div>

                  {/* Supplier Report Table */}
                  <div className="overflow-x-auto border border-gray-300 rounded-xs">
                    <table className="w-full text-xs text-left border-collapse">
                      <thead>
                        <tr className="bg-[#bde8f8] text-gray-900 font-bold border-b border-gray-300 text-[11px]">
                          <th className="p-2.5 border-r border-gray-300 w-28">Mã NCC</th>
                          <th className="p-2.5 border-r border-gray-300">Tên nhà cung cấp</th>
                          <th className="p-2.5 border-r border-gray-300 text-right w-28">Giá trị nhập</th>
                          <th className="p-2.5 border-r border-gray-300 text-right w-24">Giá trị trả</th>
                          <th className="p-2.5 border-r border-gray-300 text-right w-28">Nhập thuần</th>
                          <th className="p-2.5 text-right w-28">Nợ hiện tại</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="bg-[#fbf5d2] font-bold text-gray-900 border-b border-gray-300 text-xs">
                          <td colSpan={2} className="p-2.5 border-r border-gray-300 font-bold">
                            Tổng cộng ({grandTotals.totalSuppliersCount} nhà cung cấp)
                          </td>
                          <td className="p-2.5 border-r border-gray-300 text-right font-mono">
                            {grandTotals.totalImportValue.toLocaleString('vi-VN')}
                          </td>
                          <td className="p-2.5 border-r border-gray-300 text-right font-mono">
                            {grandTotals.totalReturnValue.toLocaleString('vi-VN')}
                          </td>
                          <td className="p-2.5 border-r border-gray-300 text-right font-mono font-bold text-blue-600">
                            {grandTotals.totalNetImportValue.toLocaleString('vi-VN')}
                          </td>
                          <td className="p-2.5 text-right font-mono font-bold text-rose-600">
                            {grandTotals.totalDebt.toLocaleString('vi-VN')}
                          </td>
                        </tr>

                        {supplierReportList.map((s) => (
                          <tr key={s.id} className="border-b border-gray-200 hover:bg-blue-50/40">
                            <td className="p-2.5 border-r border-gray-200 font-mono font-bold text-blue-600">
                              {s.code}
                            </td>
                            <td className="p-2.5 border-r border-gray-200 font-medium text-gray-900">
                              {s.name}
                            </td>
                            <td className="p-2.5 border-r border-gray-200 text-right font-mono">
                              {s.importValue.toLocaleString('vi-VN')}
                            </td>
                            <td className="p-2.5 border-r border-gray-200 text-right font-mono text-gray-600">
                              {s.returnValue.toLocaleString('vi-VN')}
                            </td>
                            <td className="p-2.5 border-r border-gray-200 text-right font-mono font-semibold">
                              {s.netImportValue.toLocaleString('vi-VN')}
                            </td>
                            <td className="p-2.5 text-right font-mono font-bold text-rose-600">
                              {s.currentDebt.toLocaleString('vi-VN')}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                </div>
              </div>

            </div>
          )}

        </div>

      </div>
    </div>
  );
};
