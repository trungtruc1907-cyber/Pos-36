import React, { useState, useMemo } from 'react';
import { Order, PurchaseOrder, DebtPaymentRecord, Product, Customer, Supplier } from '../../types';
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
  PieChart,
  DollarSign,
  Package
} from 'lucide-react';

import { SalesReportView } from './SalesReportView';
import { ProductsReportView } from './ProductsReportView';
import { SuppliersReportView } from './SuppliersReportView';

interface DailyReportViewProps {
  orders: Order[];
  purchases?: PurchaseOrder[];
  debtPayments?: DebtPaymentRecord[];
  products?: Product[];
  customers?: Customer[];
  suppliers?: Supplier[];
  initialTab?: 'daily' | 'sales' | 'products' | 'suppliers';
}

export const DailyReportView: React.FC<DailyReportViewProps> = ({
  orders = [],
  purchases = [],
  debtPayments = [],
  products = [],
  customers = [],
  suppliers = [],
  initialTab = 'suppliers',
}) => {
  const [reportTab, setReportTab] = useState<'daily' | 'sales' | 'products' | 'suppliers'>(initialTab);

  if (reportTab === 'suppliers') {
    return (
      <SuppliersReportView
        purchases={purchases}
        suppliers={suppliers}
        products={products}
        onSwitchReportTab={setReportTab}
        activeReportTab="suppliers"
      />
    );
  }

  if (reportTab === 'products') {
    return (
      <ProductsReportView
        orders={orders}
        products={products}
        customers={customers}
        suppliers={suppliers}
        onSwitchReportTab={setReportTab}
        activeReportTab="products"
      />
    );
  }

  if (reportTab === 'sales') {
    return (
      <SalesReportView
        orders={orders}
        products={products}
        customers={customers}
        suppliers={suppliers}
        onSwitchReportTab={setReportTab}
        activeReportTab="sales"
      />
    );
  }

  // Left Sidebar Controls State
  const [displayType, setDisplayType] = useState<'Báo cáo'>('Báo cáo');
  const [orientation, setOrientation] = useState<'Hiển thị dọc' | 'Hiển thị ngang'>('Hiển thị dọc');
  const [concern, setConcern] = useState<'Bán hàng' | 'Thu chi' | 'Hàng hóa' | 'Tổng hợp'>('Bán hàng');
  
  // Date Picker State (YYYY-MM-DD string)
  const todayStr = useMemo(() => {
    const d = new Date();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }, []);

  const [selectedDate, setSelectedDate] = useState<string>(todayStr);

  // Expanded Groups in Report Document
  const [expandedGroups, setExpandedGroups] = useState<{ [key: string]: boolean }>({
    sales: true,
    returns: true,
    cashIn: true,
    cashOut: true,
  });

  // Toolbar & Canvas Zoom State
  const [zoomLevel, setZoomLevel] = useState<number>(100);
  const [showConcernDropdown, setShowConcernDropdown] = useState(false);
  const [showExportDropdown, setShowExportDropdown] = useState(false);

  // Format date helper: "YYYY-MM-DD" -> "DD/MM/YYYY"
  const formattedSelectedDate = useMemo(() => {
    if (!selectedDate) return '';
    const parts = selectedDate.split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return selectedDate;
  }, [selectedDate]);

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

  // Filter Orders for selected date
  const filteredDateOrders = useMemo(() => {
    return orders.filter((ord) => {
      if (!ord.date) return false;
      return ord.date.includes(formattedSelectedDate);
    });
  }, [orders, formattedSelectedDate]);

  // Separate Sales vs Returns
  const salesOrders = useMemo(() => {
    return filteredDateOrders.filter(
      (o) => o.status !== 'Đã hủy' && o.status !== 'Trả hàng' && !o.orderCode.startsWith('HDTH')
    );
  }, [filteredDateOrders]);

  const returnOrders = useMemo(() => {
    return filteredDateOrders.filter(
      (o) => o.status !== 'Đã hủy' && (o.status === 'Trả hàng' || o.orderCode.startsWith('HDTH'))
    );
  }, [filteredDateOrders]);

  // Filter Purchases for selected date
  const filteredPurchases = useMemo(() => {
    return purchases.filter((p) => {
      if (!p.date) return false;
      return p.date.includes(formattedSelectedDate);
    });
  }, [purchases, formattedSelectedDate]);

  // Filter Debt Payments for selected date
  const filteredDebtPayments = useMemo(() => {
    return debtPayments.filter((dp) => {
      if (!dp.date) return false;
      return dp.date.includes(formattedSelectedDate);
    });
  }, [debtPayments, formattedSelectedDate]);

  // Calculations for Sales Report ("Bán hàng")
  const salesSummary = useMemo(() => {
    const totalSalesCount = salesOrders.length;
    const totalSalesQty = salesOrders.reduce(
      (sum, o) => sum + (o.itemsCount || o.items?.reduce((s, i) => s + i.quantity, 0) || 0),
      0
    );
    const totalSalesRevenue = salesOrders.reduce((sum, o) => sum + (o.subtotal || o.totalAmount || 0), 0);
    const totalSalesActualPaid = salesOrders.reduce((sum, o) => sum + (o.amountPaid || 0), 0);

    const totalReturnCount = returnOrders.length;
    const totalReturnQty = returnOrders.reduce(
      (sum, o) => sum + (o.itemsCount || o.items?.reduce((s, i) => s + i.quantity, 0) || 0),
      0
    );
    const totalReturnRevenue = returnOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
    const totalReturnActualPaid = returnOrders.reduce((sum, o) => sum + (o.amountPaid || 0), 0);

    return {
      totalSalesCount,
      totalSalesQty,
      totalSalesRevenue,
      totalSalesActualPaid,
      totalReturnCount,
      totalReturnQty,
      totalReturnRevenue,
      totalReturnActualPaid,
      netRevenue: totalSalesRevenue - totalReturnRevenue,
      netActualPaid: totalSalesActualPaid - totalReturnActualPaid,
    };
  }, [salesOrders, returnOrders]);

  // Aggregated Product Items for Goods Report ("Hàng hóa")
  const productSummary = useMemo(() => {
    const map = new Map<
      string,
      {
        code: string;
        name: string;
        unit: string;
        soldQty: number;
        soldRevenue: number;
        returnQty: number;
        returnAmount: number;
      }
    >();

    // Add Sales
    salesOrders.forEach((o) => {
      (o.items || []).forEach((item) => {
        const code = item.product?.code || 'SP000';
        const name = item.product?.name || 'Sản phẩm';
        const unit = item.product?.unit || 'cái';
        const existing = map.get(code) || {
          code,
          name,
          unit,
          soldQty: 0,
          soldRevenue: 0,
          returnQty: 0,
          returnAmount: 0,
        };
        existing.soldQty += item.quantity;
        existing.soldRevenue += item.quantity * item.unitPrice;
        map.set(code, existing);
      });
    });

    // Add Returns
    returnOrders.forEach((o) => {
      (o.items || []).forEach((item) => {
        const code = item.product?.code || 'SP000';
        const name = item.product?.name || 'Sản phẩm';
        const unit = item.product?.unit || 'cái';
        const existing = map.get(code) || {
          code,
          name,
          unit,
          soldQty: 0,
          soldRevenue: 0,
          returnQty: 0,
          returnAmount: 0,
        };
        existing.returnQty += item.quantity;
        existing.returnAmount += item.quantity * item.unitPrice;
        map.set(code, existing);
      });
    });

    return Array.from(map.values());
  }, [salesOrders, returnOrders]);

  // Toggle expanded groups
  const toggleGroup = (groupKey: string) => {
    setExpandedGroups((prev) => ({
      ...prev,
      [groupKey]: !prev[groupKey],
    }));
  };

  // Print Report Document
  const handlePrint = () => {
    window.print();
  };

  // Export CSV/Excel
  const handleExportCSV = () => {
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += `BAO CAO CUOI NGAY VE ${concern.toUpperCase()}\n`;
    csvContent += `Ngay lap: ${currentTimestampStr}\n`;
    csvContent += `Ngay bao cao: ${formattedSelectedDate}\n\n`;

    if (concern === 'Bán hàng') {
      csvContent += "Ma giao dich,Thoi gian,So luong,Doanh thu,Thu khac,VAT,Lam tron,Phi tra hang,Thuc thu\n";
      salesOrders.forEach(o => {
        csvContent += `${o.orderCode},${o.date},${o.itemsCount || 0},${o.totalAmount || 0},0,0,0,0,${o.amountPaid || 0}\n`;
      });
    } else if (concern === 'Hàng hóa') {
      csvContent += "Ma hang,Ten hang,DVT,SL Ban,Doanh thu ban,SL Tra,Gia tri tra,Thuc xuat,Thuc thu\n";
      productSummary.forEach(p => {
        csvContent += `${p.code},"${p.name}",${p.unit},${p.soldQty},${p.soldRevenue},${p.returnQty},${p.returnAmount},${p.soldQty - p.returnQty},${p.soldRevenue - p.returnAmount}\n`;
      });
    }

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Bao_cao_cuoi_ngay_${concern}_${formattedSelectedDate.replace(/\//g, '-')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans text-gray-800">
      {/* Print Specific CSS Stylesheet injection */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #printable-report-document, #printable-report-document * {
            visibility: visible;
          }
          #printable-report-document {
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
          Báo cáo cuối ngày
        </h1>
        <div className="text-xs text-gray-500 font-medium">
          Chi nhánh: <span className="font-bold text-gray-800">Tổng Kho Chống Thấm 36</span>
        </div>
      </div>
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden p-4 md:p-6 gap-6">
        
        {/* LEFT SIDEBAR PANEL (Filter & Configuration) */}
        <div className="w-full md:w-64 lg:w-72 bg-white rounded-xl border border-gray-200 p-4 shadow-sm shrink-0 flex flex-col space-y-5 no-print">
          
          {/* Section 1: Kiểu hiển thị */}
          <div>
            <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-2">
              Kiểu hiển thị
            </label>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setDisplayType('Báo cáo')}
                className="bg-blue-600 hover:bg-blue-700 text-white rounded-full px-5 py-1.5 font-bold text-xs shadow-sm transition-all cursor-pointer"
              >
                Báo cáo
              </button>
            </div>

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

          {/* Section 2: Mối quan tâm */}
          <div className="relative">
            <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-2">
              Mối quan tâm
            </label>
            
            <div className="relative">
              <button
                onClick={() => setShowConcernDropdown(!showConcernDropdown)}
                className="w-full p-2.5 text-xs border border-blue-500 rounded-lg bg-white font-medium text-left flex items-center justify-between shadow-xs cursor-pointer focus:ring-2 focus:ring-blue-500"
              >
                <span className="font-semibold text-gray-800">{concern}</span>
                <ChevronDown className="w-4 h-4 text-gray-500" />
              </button>

              {showConcernDropdown && (
                <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-xl z-30 py-1 space-y-0.5">
                  {(['Bán hàng', 'Thu chi', 'Hàng hóa', 'Tổng hợp'] as const).map((item) => (
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

          {/* Section 3: Ngày báo cáo */}
          <div>
            <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-2">
              Thời gian báo cáo
            </label>
            <div className="relative">
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full p-2 text-xs border border-gray-300 rounded-lg bg-white font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none cursor-pointer"
              />
            </div>
            <div className="mt-2 text-[11px] text-gray-500 italic">
              Đang chọn ngày: <span className="font-bold text-gray-800">{formattedSelectedDate}</span>
            </div>
          </div>

          {/* Summary Stats Box in Left Sidebar */}
          <div className="mt-auto bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-2 text-xs">
            <div className="font-bold text-slate-700 border-b border-slate-200 pb-1">
              Thống kê nhanh ngày {formattedSelectedDate}
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Đơn bán:</span>
              <span className="font-bold text-indigo-900 font-mono">{salesSummary.totalSalesCount} đơn</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Doanh thu bán:</span>
              <span className="font-bold text-emerald-700 font-mono">
                {salesSummary.totalSalesRevenue.toLocaleString('vi-VN')}đ
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Trả hàng:</span>
              <span className="font-bold text-amber-700 font-mono">
                {salesSummary.totalReturnRevenue.toLocaleString('vi-VN')}đ
              </span>
            </div>
            <div className="flex justify-between pt-1 border-t border-slate-200">
              <span className="font-bold text-gray-800">Thực thu thuần:</span>
              <span className="font-black text-[#1e0b54] font-mono">
                {salesSummary.netActualPaid.toLocaleString('vi-VN')}đ
              </span>
            </div>
          </div>

        </div>

        {/* RIGHT MAIN CANVAS AREA (PDF Document Viewer Preview) */}
        <div className="flex-1 bg-slate-600 rounded-xl border border-slate-700 shadow-inner flex flex-col overflow-hidden relative">
          
          {/* Document Viewer Toolbar */}
          <div className="bg-slate-800 text-slate-200 px-4 py-2 border-b border-slate-700 flex items-center justify-between shadow-md shrink-0 no-print flex-wrap gap-2 text-xs">
            
            {/* Left toolbar controls: Refresh */}
            <div className="flex items-center space-x-1">
              <button
                onClick={() => setSelectedDate(todayStr)}
                className="p-1.5 hover:bg-slate-700 rounded text-slate-300 hover:text-white transition-colors cursor-pointer"
                title="Hôm nay"
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

              {/* Export Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setShowExportDropdown(!showExportDropdown)}
                  className="flex items-center space-x-1 bg-slate-700 hover:bg-slate-600 text-white px-2.5 py-1 rounded text-xs font-semibold cursor-pointer transition-colors"
                >
                  <Download className="w-3.5 h-3.5 text-amber-400" />
                  <span>Xuất file</span>
                  <ChevronDown className="w-3 h-3 ml-0.5" />
                </button>

                {showExportDropdown && (
                  <div className="absolute right-0 top-full mt-1 bg-white text-gray-800 border border-gray-200 rounded-md shadow-xl z-30 py-1 w-36">
                    <button
                      onClick={() => {
                        handleExportCSV();
                        setShowExportDropdown(false);
                      }}
                      className="w-full text-left px-3 py-1.5 text-xs font-medium hover:bg-blue-50 hover:text-blue-700 flex items-center space-x-2 cursor-pointer"
                    >
                      <TableIcon className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Xuất Excel/CSV</span>
                    </button>
                    <button
                      onClick={() => {
                        handlePrint();
                        setShowExportDropdown(false);
                      }}
                      className="w-full text-left px-3 py-1.5 text-xs font-medium hover:bg-blue-50 hover:text-blue-700 flex items-center space-x-2 cursor-pointer"
                    >
                      <FileText className="w-3.5 h-3.5 text-rose-600" />
                      <span>In / Xuất PDF</span>
                    </button>
                  </div>
                )}
              </div>

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

          {/* Document Canvas Container with Zoom & Scroll */}
          <div className="flex-1 overflow-auto p-4 md:p-8 flex justify-center items-start">
            
            {/* WHITE PRINTED REPORT SHEET (A4 Document Look matching screenshot) */}
            <div
              id="printable-report-document"
              style={{ transform: `scale(${zoomLevel / 100})`, transformOrigin: 'top center' }}
              className={`bg-white shadow-2xl border border-gray-200 text-gray-900 transition-all duration-200 ${
                orientation === 'Hiển thị ngang' ? 'w-full max-w-[1100px]' : 'w-full max-w-[880px]'
              } min-h-[950px] p-8 md:p-10 font-sans my-2`}
            >
              
              {/* Document Header Timestamp */}
              <div className="text-[11px] text-gray-600 font-medium mb-6">
                Ngày lập: {currentTimestampStr}
              </div>

              {/* Document Title Header Block */}
              <div className="text-center space-y-1 mb-8">
                <h2 className="text-xl md:text-2xl font-bold tracking-tight text-gray-900">
                  Báo cáo cuối ngày về {concern.toLowerCase()}
                </h2>
                <div className="text-xs text-gray-700 font-medium space-y-0.5 pt-1">
                  <p>Ngày bán: {formattedSelectedDate}</p>
                  <p>Ngày thanh toán: {formattedSelectedDate}</p>
                  <p className="font-semibold">Chi nhánh: Tổng Kho Chống Thấm 36</p>
                </div>
              </div>

              {/* ==================== 1. BÁO CÁO BÁN HÀNG ==================== */}
              {concern === 'Bán hàng' && (
                <div className="space-y-4">
                  <div className="overflow-x-auto border border-gray-300 rounded-xs">
                    <table className="w-full text-xs text-left border-collapse">
                      {/* Sky Blue Table Header matching screenshot (#bde8f8) */}
                      <thead>
                        <tr className="bg-[#bde8f8] text-gray-900 font-bold border-b border-gray-300 text-[11px]">
                          <th className="p-2 border-r border-gray-300">Mã giao dịch</th>
                          <th className="p-2 border-r border-gray-300">Thời gian</th>
                          <th className="p-2 border-r border-gray-300 text-right">SL</th>
                          <th className="p-2 border-r border-gray-300 text-right">Doanh thu</th>
                          <th className="p-2 border-r border-gray-300 text-right">Thu khác</th>
                          <th className="p-2 border-r border-gray-300 text-right">VAT</th>
                          <th className="p-2 border-r border-gray-300 text-right">Làm tròn</th>
                          <th className="p-2 border-r border-gray-300 text-right">Phí trả hàng</th>
                          <th className="p-2 text-right">Thực thu</th>
                        </tr>
                      </thead>

                      <tbody>
                        {/* Group 1: Hóa đơn bán hàng */}
                        <tr className="bg-[#fbf5d2] font-bold text-gray-900 border-b border-gray-300 text-xs hover:bg-[#f8eed1] transition-colors">
                          <td className="p-2 border-r border-gray-300">
                            <button
                              onClick={() => toggleGroup('sales')}
                              className="flex items-center space-x-1 cursor-pointer hover:underline font-bold text-gray-900"
                            >
                              <span className="w-4 h-4 rounded bg-white/80 border border-gray-400 flex items-center justify-center text-[10px] font-mono shrink-0">
                                {expandedGroups.sales ? '-' : '+'}
                              </span>
                              <span>Hóa đơn: {salesSummary.totalSalesCount}</span>
                            </button>
                          </td>
                          <td className="p-2 border-r border-gray-300 font-mono text-gray-600">---</td>
                          <td className="p-2 border-r border-gray-300 text-right font-mono">
                            {salesSummary.totalSalesQty}
                          </td>
                          <td className="p-2 border-r border-gray-300 text-right font-mono">
                            {salesSummary.totalSalesRevenue.toLocaleString('vi-VN')}
                          </td>
                          <td className="p-2 border-r border-gray-300 text-right font-mono">0</td>
                          <td className="p-2 border-r border-gray-300 text-right font-mono">0</td>
                          <td className="p-2 border-r border-gray-300 text-right font-mono">0</td>
                          <td className="p-2 border-r border-gray-300 text-right font-mono">0</td>
                          <td className="p-2 text-right font-mono font-black text-emerald-900">
                            {salesSummary.totalSalesActualPaid.toLocaleString('vi-VN')}
                          </td>
                        </tr>

                        {/* Individual Sales Invoices List */}
                        {expandedGroups.sales && (
                          salesOrders.length > 0 ? (
                            salesOrders.map((ord) => (
                              <tr key={ord.id || ord.orderCode} className="border-b border-gray-200 hover:bg-blue-50/40 text-gray-800">
                                <td className="p-2 pl-6 border-r border-gray-200 font-mono font-semibold text-blue-900">
                                  {ord.orderCode}
                                </td>
                                <td className="p-2 border-r border-gray-200 font-mono text-gray-600 text-[11px]">
                                  {ord.date?.split(' ')[1] || ord.date}
                                </td>
                                <td className="p-2 border-r border-gray-200 text-right font-mono">
                                  {ord.itemsCount || ord.items?.reduce((s, i) => s + i.quantity, 0) || 0}
                                </td>
                                <td className="p-2 border-r border-gray-200 text-right font-mono">
                                  {(ord.subtotal || ord.totalAmount || 0).toLocaleString('vi-VN')}
                                </td>
                                <td className="p-2 border-r border-gray-200 text-right font-mono text-gray-400">0</td>
                                <td className="p-2 border-r border-gray-200 text-right font-mono text-gray-400">0</td>
                                <td className="p-2 border-r border-gray-200 text-right font-mono text-gray-400">0</td>
                                <td className="p-2 border-r border-gray-200 text-right font-mono text-gray-400">0</td>
                                <td className="p-2 text-right font-mono font-bold text-gray-900">
                                  {(ord.amountPaid || 0).toLocaleString('vi-VN')}
                                </td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td colSpan={9} className="p-3 text-center text-gray-500 italic text-[11px]">
                                Không có hóa đơn bán hàng nào trong ngày {formattedSelectedDate}
                              </td>
                            </tr>
                          )
                        )}

                        {/* Group 2: Trả hàng bán (if any) */}
                        {salesSummary.totalReturnCount > 0 && (
                          <>
                            <tr className="bg-amber-100/70 font-bold text-gray-900 border-b border-gray-300 text-xs">
                              <td className="p-2 border-r border-gray-300">
                                <button
                                  onClick={() => toggleGroup('returns')}
                                  className="flex items-center space-x-1 cursor-pointer hover:underline font-bold text-gray-900"
                                >
                                  <span className="w-4 h-4 rounded bg-white/80 border border-gray-400 flex items-center justify-center text-[10px] font-mono shrink-0">
                                    {expandedGroups.returns ? '-' : '+'}
                                  </span>
                                  <span>Trả hàng: {salesSummary.totalReturnCount}</span>
                                </button>
                              </td>
                              <td className="p-2 border-r border-gray-300 font-mono text-gray-600">---</td>
                              <td className="p-2 border-r border-gray-300 text-right font-mono text-amber-900">
                                {salesSummary.totalReturnQty}
                              </td>
                              <td className="p-2 border-r border-gray-300 text-right font-mono text-amber-900">
                                {salesSummary.totalReturnRevenue.toLocaleString('vi-VN')}
                              </td>
                              <td className="p-2 border-r border-gray-300 text-right font-mono">0</td>
                              <td className="p-2 border-r border-gray-300 text-right font-mono">0</td>
                              <td className="p-2 border-r border-gray-300 text-right font-mono">0</td>
                              <td className="p-2 border-r border-gray-300 text-right font-mono">0</td>
                              <td className="p-2 text-right font-mono font-black text-amber-900">
                                {salesSummary.totalReturnActualPaid.toLocaleString('vi-VN')}
                              </td>
                            </tr>

                            {expandedGroups.returns && (
                              returnOrders.map((ord) => (
                                <tr key={ord.id || ord.orderCode} className="border-b border-gray-200 hover:bg-amber-50/40 text-gray-800">
                                  <td className="p-2 pl-6 border-r border-gray-200 font-mono font-semibold text-amber-900">
                                    {ord.orderCode}
                                  </td>
                                  <td className="p-2 border-r border-gray-200 font-mono text-gray-600 text-[11px]">
                                    {ord.date?.split(' ')[1] || ord.date}
                                  </td>
                                  <td className="p-2 border-r border-gray-200 text-right font-mono">
                                    {ord.itemsCount || ord.items?.reduce((s, i) => s + i.quantity, 0) || 0}
                                  </td>
                                  <td className="p-2 border-r border-gray-200 text-right font-mono">
                                    {(ord.totalAmount || 0).toLocaleString('vi-VN')}
                                  </td>
                                  <td className="p-2 border-r border-gray-200 text-right font-mono text-gray-400">0</td>
                                  <td className="p-2 border-r border-gray-200 text-right font-mono text-gray-400">0</td>
                                  <td className="p-2 border-r border-gray-200 text-right font-mono text-gray-400">0</td>
                                  <td className="p-2 border-r border-gray-200 text-right font-mono text-gray-400">0</td>
                                  <td className="p-2 text-right font-mono font-bold text-amber-900">
                                    {(ord.amountPaid || 0).toLocaleString('vi-VN')}
                                  </td>
                                </tr>
                              ))
                            )}
                          </>
                        )}
                      </tbody>

                      {/* Total Footer Row */}
                      <tfoot>
                        <tr className="bg-slate-200/80 font-black text-gray-900 border-t-2 border-gray-400 text-xs">
                          <td className="p-2.5 border-r border-gray-300">TỔNG CỘNG THỰC TẾ</td>
                          <td className="p-2.5 border-r border-gray-300 font-mono">---</td>
                          <td className="p-2.5 border-r border-gray-300 text-right font-mono">
                            {salesSummary.totalSalesQty - salesSummary.totalReturnQty}
                          </td>
                          <td className="p-2.5 border-r border-gray-300 text-right font-mono">
                            {salesSummary.netRevenue.toLocaleString('vi-VN')}
                          </td>
                          <td className="p-2.5 border-r border-gray-300 text-right font-mono">0</td>
                          <td className="p-2.5 border-r border-gray-300 text-right font-mono">0</td>
                          <td className="p-2.5 border-r border-gray-300 text-right font-mono">0</td>
                          <td className="p-2.5 border-r border-gray-300 text-right font-mono">0</td>
                          <td className="p-2.5 text-right font-mono font-black text-[#1e0b54] text-sm">
                            {salesSummary.netActualPaid.toLocaleString('vi-VN')}đ
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>
              )}

              {/* ==================== 2. BÁO CÁO THU CHI ==================== */}
              {concern === 'Thu chi' && (
                <div className="space-y-4">
                  <div className="overflow-x-auto border border-gray-300 rounded-xs">
                    <table className="w-full text-xs text-left border-collapse">
                      <thead>
                        <tr className="bg-[#bde8f8] text-gray-900 font-bold border-b border-gray-300 text-[11px]">
                          <th className="p-2 border-r border-gray-300">Mã giao dịch / Hóa đơn</th>
                          <th className="p-2 border-r border-gray-300">Khách hàng / Đối tác</th>
                          <th className="p-2 border-r border-gray-300">Thời gian</th>
                          <th className="p-2 border-r border-gray-300">Phương thức</th>
                          <th className="p-2 border-r border-gray-300 text-right">Thu tiền</th>
                          <th className="p-2 text-right">Chi tiền</th>
                        </tr>
                      </thead>
                      <tbody>
                        {/* Thu tiền bán hàng */}
                        <tr className="bg-[#fbf5d2] font-bold text-gray-900 border-b border-gray-300">
                          <td colSpan={4} className="p-2 border-r border-gray-300">
                            1. THU TIỀN BÁN HÀNG ({salesOrders.length} hóa đơn)
                          </td>
                          <td className="p-2 border-r border-gray-300 text-right font-mono font-bold text-emerald-800">
                            {salesSummary.totalSalesActualPaid.toLocaleString('vi-VN')}
                          </td>
                          <td className="p-2 text-right font-mono text-gray-400">0</td>
                        </tr>
                        {salesOrders.map((ord) => (
                          <tr key={ord.id} className="border-b border-gray-200 hover:bg-gray-50 text-gray-800">
                            <td className="p-2 border-r border-gray-200 font-mono font-semibold text-indigo-900">{ord.orderCode}</td>
                            <td className="p-2 border-r border-gray-200">{ord.customerName}</td>
                            <td className="p-2 border-r border-gray-200 font-mono text-[11px]">{ord.date}</td>
                            <td className="p-2 border-r border-gray-200">{ord.paymentMethod === 'cash' ? 'Tiền mặt' : 'Chuyển khoản'}</td>
                            <td className="p-2 border-r border-gray-200 text-right font-mono font-semibold text-emerald-700">{(ord.amountPaid || 0).toLocaleString('vi-VN')}</td>
                            <td className="p-2 text-right font-mono text-gray-400">0</td>
                          </tr>
                        ))}

                        {/* Chi hoàn trả hàng */}
                        {returnOrders.length > 0 && (
                          <>
                            <tr className="bg-amber-100/70 font-bold text-gray-900 border-b border-gray-300">
                              <td colSpan={4} className="p-2 border-r border-gray-300">
                                2. CHI HOÀN TIỀN TRẢ HÀNG ({returnOrders.length} phiếu)
                              </td>
                              <td className="p-2 border-r border-gray-300 text-right font-mono text-gray-400">0</td>
                              <td className="p-2 text-right font-mono font-bold text-amber-900">
                                {salesSummary.totalReturnActualPaid.toLocaleString('vi-VN')}
                              </td>
                            </tr>
                            {returnOrders.map((ord) => (
                              <tr key={ord.id} className="border-b border-gray-200 hover:bg-gray-50 text-gray-800">
                                <td className="p-2 border-r border-gray-200 font-mono font-semibold text-amber-900">{ord.orderCode}</td>
                                <td className="p-2 border-r border-gray-200">{ord.customerName}</td>
                                <td className="p-2 border-r border-gray-200 font-mono text-[11px]">{ord.date}</td>
                                <td className="p-2 border-r border-gray-200">{ord.paymentMethod === 'cash' ? 'Tiền mặt' : 'Chuyển khoản'}</td>
                                <td className="p-2 border-r border-gray-200 text-right font-mono text-gray-400">0</td>
                                <td className="p-2 text-right font-mono font-semibold text-amber-700">{(ord.amountPaid || 0).toLocaleString('vi-VN')}</td>
                              </tr>
                            ))}
                          </>
                        )}
                      </tbody>
                      <tfoot>
                        <tr className="bg-slate-200 font-black text-gray-900 border-t-2 border-gray-400">
                          <td colSpan={4} className="p-2.5">TỔNG THỰC THU RÒNG TRONG NGÀY</td>
                          <td colSpan={2} className="p-2.5 text-right font-mono font-black text-[#1e0b54] text-sm">
                            {salesSummary.netActualPaid.toLocaleString('vi-VN')}đ
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>
              )}

              {/* ==================== 3. BÁO CÁO HÀNG HÓA ==================== */}
              {concern === 'Hàng hóa' && (
                <div className="space-y-4">
                  <div className="overflow-x-auto border border-gray-300 rounded-xs">
                    <table className="w-full text-xs text-left border-collapse">
                      <thead>
                        <tr className="bg-[#bde8f8] text-gray-900 font-bold border-b border-gray-300 text-[11px]">
                          <th className="p-2 border-r border-gray-300">Mã hàng</th>
                          <th className="p-2 border-r border-gray-300">Tên hàng hóa</th>
                          <th className="p-2 border-r border-gray-300">ĐVT</th>
                          <th className="p-2 border-r border-gray-300 text-right">SL Bán</th>
                          <th className="p-2 border-r border-gray-300 text-right">Doanh thu bán</th>
                          <th className="p-2 border-r border-gray-300 text-right">SL Trả</th>
                          <th className="p-2 border-r border-gray-300 text-right">Thực xuất</th>
                          <th className="p-2 text-right">Doanh thu thuần</th>
                        </tr>
                      </thead>
                      <tbody>
                        {productSummary.length > 0 ? (
                          productSummary.map((p) => (
                            <tr key={p.code} className="border-b border-gray-200 hover:bg-gray-50 text-gray-800">
                              <td className="p-2 border-r border-gray-200 font-mono font-bold text-indigo-900">{p.code}</td>
                              <td className="p-2 border-r border-gray-200 font-semibold">{p.name}</td>
                              <td className="p-2 border-r border-gray-200 text-gray-600">{p.unit}</td>
                              <td className="p-2 border-r border-gray-200 text-right font-mono font-semibold">{p.soldQty}</td>
                              <td className="p-2 border-r border-gray-200 text-right font-mono">{p.soldRevenue.toLocaleString('vi-VN')}</td>
                              <td className="p-2 border-r border-gray-200 text-right font-mono text-amber-800">{p.returnQty}</td>
                              <td className="p-2 border-r border-gray-200 text-right font-mono font-bold text-emerald-800">{p.soldQty - p.returnQty}</td>
                              <td className="p-2 text-right font-mono font-bold text-gray-900">
                                {(p.soldRevenue - p.returnAmount).toLocaleString('vi-VN')}
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={8} className="p-4 text-center text-gray-500 italic">
                              Không có giao dịch hàng hóa nào trong ngày {formattedSelectedDate}
                            </td>
                          </tr>
                        )}
                      </tbody>
                      <tfoot>
                        <tr className="bg-[#fbf5d2] font-black text-gray-900 border-t-2 border-gray-400">
                          <td colSpan={3} className="p-2.5 border-r border-gray-300">TỔNG CỘNG HÀNG HÓA</td>
                          <td className="p-2.5 border-r border-gray-300 text-right font-mono">
                            {productSummary.reduce((s, p) => s + p.soldQty, 0)}
                          </td>
                          <td className="p-2.5 border-r border-gray-300 text-right font-mono">
                            {productSummary.reduce((s, p) => s + p.soldRevenue, 0).toLocaleString('vi-VN')}
                          </td>
                          <td className="p-2.5 border-r border-gray-300 text-right font-mono">
                            {productSummary.reduce((s, p) => s + p.returnQty, 0)}
                          </td>
                          <td className="p-2.5 border-r border-gray-300 text-right font-mono font-bold">
                            {productSummary.reduce((s, p) => s + (p.soldQty - p.returnQty), 0)}
                          </td>
                          <td className="p-2.5 text-right font-mono font-black text-[#1e0b54] text-sm">
                            {productSummary.reduce((s, p) => s + (p.soldRevenue - p.returnAmount), 0).toLocaleString('vi-VN')}đ
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>
              )}

              {/* ==================== 4. BÁO CÁO TỔNG HỢP ==================== */}
              {concern === 'Tổng hợp' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Block 1: Sales Summary */}
                    <div className="p-4 bg-blue-50/50 rounded-lg border border-blue-200 space-y-2">
                      <div className="font-bold text-blue-900 border-b border-blue-200 pb-2 text-sm flex items-center justify-between">
                        <span>1. TỔNG HỢP BÁN HÀNG</span>
                        <Package className="w-4 h-4 text-blue-700" />
                      </div>
                      <div className="space-y-1.5 text-xs">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Tổng số đơn hàng:</span>
                          <span className="font-mono font-bold">{salesSummary.totalSalesCount} đơn</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Tổng số sản phẩm bán:</span>
                          <span className="font-mono font-bold">{salesSummary.totalSalesQty} sp</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Doanh thu gộp:</span>
                          <span className="font-mono font-bold text-emerald-700">{salesSummary.totalSalesRevenue.toLocaleString('vi-VN')}đ</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Giá trị trả hàng:</span>
                          <span className="font-mono font-bold text-amber-700">-{salesSummary.totalReturnRevenue.toLocaleString('vi-VN')}đ</span>
                        </div>
                        <div className="flex justify-between pt-1 border-t border-blue-200 font-bold">
                          <span className="text-gray-900">Doanh thu thuần:</span>
                          <span className="font-mono font-black text-indigo-900 text-sm">{salesSummary.netRevenue.toLocaleString('vi-VN')}đ</span>
                        </div>
                      </div>
                    </div>

                    {/* Block 2: Cashflow Summary */}
                    <div className="p-4 bg-emerald-50/50 rounded-lg border border-emerald-200 space-y-2">
                      <div className="font-bold text-emerald-900 border-b border-emerald-200 pb-2 text-sm flex items-center justify-between">
                        <span>2. TỔNG HỢP THU CHI REALTIME</span>
                        <DollarSign className="w-4 h-4 text-emerald-700" />
                      </div>
                      <div className="space-y-1.5 text-xs">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Tiền thực thu từ khách:</span>
                          <span className="font-mono font-bold text-emerald-700">{salesSummary.totalSalesActualPaid.toLocaleString('vi-VN')}đ</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Tiền thực chi trả khách:</span>
                          <span className="font-mono font-bold text-amber-700">-{salesSummary.totalReturnActualPaid.toLocaleString('vi-VN')}đ</span>
                        </div>
                        <div className="flex justify-between pt-1 border-t border-emerald-200 font-bold">
                          <span className="text-gray-900">Thực thu ròng phát sinh:</span>
                          <span className="font-mono font-black text-emerald-900 text-sm">{salesSummary.netActualPaid.toLocaleString('vi-VN')}đ</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Document Footer Signatures */}
              <div className="mt-16 pt-8 border-t border-gray-200 grid grid-cols-2 text-center text-xs text-gray-700 font-medium">
                <div>
                  <p className="font-bold uppercase tracking-wide">Người lập báo cáo</p>
                  <p className="text-[11px] text-gray-500 mt-0.5">(Ký, ghi rõ họ tên)</p>
                  <div className="h-16"></div>
                  <p className="font-bold text-gray-900">Thu ngân / Nhân viên</p>
                </div>
                <div>
                  <p className="font-bold uppercase tracking-wide">Chủ cửa hàng / Quản lý</p>
                  <p className="text-[11px] text-gray-500 mt-0.5">(Ký, ghi rõ họ tên)</p>
                  <div className="h-16"></div>
                  <p className="font-bold text-gray-900">Tổng Kho Chống Thấm 36</p>
                </div>
              </div>

            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
