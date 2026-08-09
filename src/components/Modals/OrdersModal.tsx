import React, { useState } from 'react';
import { Order, PurchaseOrder, ViewMode, Product, Supplier } from '../../types';
import { Pagination } from '../Pagination';
import { 
  FileText, 
  Search, 
  Printer, 
  CheckCircle2, 
  Truck, 
  RotateCcw, 
  Edit3, 
  Trash2, 
  Copy, 
  Download, 
  Pencil, 
  Save, 
  Calendar,
  Clock,
  ChevronDown,
  Tag,
  ExternalLink,
  Plus,
  ArrowLeft,
  LayoutGrid,
  QrCode,
  Eye,
  AlertCircle,
  FileSpreadsheet,
  User,
  Info
} from 'lucide-react';

interface OrdersModalProps {
  orders: Order[];
  purchases?: PurchaseOrder[];
  products?: Product[];
  suppliers?: Supplier[];
  currentView?: ViewMode;
  onSelectView?: (view: ViewMode) => void;
  onReprintOrder: (order: Order) => void;
  onUpdateOrder?: (id: string, updates: Partial<Order>) => void;
  onAddPurchase?: (purchase: PurchaseOrder) => void;
}

export const OrdersModal: React.FC<OrdersModalProps> = ({
  orders,
  purchases = [],
  products = [],
  suppliers = [],
  currentView = 'orders',
  onSelectView,
  onReprintOrder,
  onUpdateOrder,
  onAddPurchase,
}) => {
  const [search, setSearch] = useState('');
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  const [orderTab, setOrderTab] = useState<'info' | 'payments'>('info');
  const [editingNotes, setEditingNotes] = useState<Record<string, string>>({});

  // Add Purchase Tab state
  const [showAddPurchaseTab, setShowAddPurchaseTab] = useState<boolean>(false);
  const [showExitConfirm, setShowExitConfirm] = useState<boolean>(false);

  // New Purchase Form local state
  const [newSupplier, setNewSupplier] = useState<string>('Khang Hân (Hồng)');
  const [newPurchaseCode, setNewPurchaseCode] = useState<string>('');
  const [newOrderCode, setNewOrderCode] = useState<string>('');
  const [newInvoiceNo, setNewInvoiceNo] = useState<string>('');
  const [newDiscount, setNewDiscount] = useState<number>(0);
  const [newNote, setNewNote] = useState<string>('');

  const [newPurchaseItems, setNewPurchaseItems] = useState<
    {
      productCode: string;
      productName: string;
      unit: string;
      quantity: number;
      unitPrice: number;
      discount: number;
    }[]
  >([]);

  const [prodSearchKey, setProdSearchKey] = useState<string>('');
  const [showProdDropdown, setShowProdDropdown] = useState<boolean>(false);
  const [showSuppDropdown, setShowSuppDropdown] = useState<boolean>(false);

  // Pagination states
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);

  const isPurchaseMode = currentView === 'purchases' || currentView === 'purchase-returns';

  const toggleExpandOrder = (id: string) => {
    if (expandedOrderId === id) {
      setExpandedOrderId(null);
    } else {
      setExpandedOrderId(id);
      setOrderTab('info');
    }
  };
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

  const handleSaveNewPurchase = (status: 'Phiếu tạm' | 'Đã nhập hàng') => {
    const code = newPurchaseCode.trim() || `PN${String(Math.floor(100000 + Math.random() * 900000))}`;
    const now = new Date();
    const dateFormatted = `${now.getDate().toString().padStart(2, '0')}/${(now.getMonth() + 1).toString().padStart(2, '0')}/${now.getFullYear()} ${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

    const calculatedTotalItems = newPurchaseItems.reduce(
      (sum, item) => sum + (item.quantity * item.unitPrice - item.discount),
      0
    );
    const calculatedNetTotal = Math.max(0, calculatedTotalItems - newDiscount);

    const createdPurchase: PurchaseOrder = {
      id: `po-${Date.now()}`,
      code,
      date: dateFormatted,
      supplierName: newSupplier || 'Khang Hân (Hồng)',
      itemsCount: newPurchaseItems.length || 1,
      totalAmount: calculatedNetTotal,
      status,
      paidAmount: status === 'Đã nhập hàng' ? calculatedNetTotal : 0,
      creator: 'Chống Thấm 36',
      buyer: 'Chống Thấm 36',
      note: newNote,
      discount: newDiscount,
      items: newPurchaseItems.map((item) => ({
        productCode: item.productCode,
        productName: item.productName,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        importPrice: item.unitPrice,
        discount: item.discount,
      })),
    };

    if (onAddPurchase) {
      onAddPurchase(createdPurchase);
    }

    setNewPurchaseItems([]);
    setNewPurchaseCode('');
    setNewOrderCode('');
    setNewInvoiceNo('');
    setNewDiscount(0);
    setNewNote('');
    setShowAddPurchaseTab(false);
    alert(`Đã lưu phiếu nhập ${code} (${status}) thành công!`);
  };

  // If user opened "Thêm phiếu nhập" tab
  if (showAddPurchaseTab) {
    const calculatedTotalItems = newPurchaseItems.reduce(
      (sum, item) => sum + (item.quantity * item.unitPrice - item.discount),
      0
    );
    const calculatedNetTotal = Math.max(0, calculatedTotalItems - newDiscount);

    const defaultProductsList = products && products.length > 0 ? products : [
      { id: '1', code: 'SP2511189', name: 'Ramset Vitec 5006 (tuýp)', unit: 'tuýp', importPrice: 480000, stock: 12 },
      { id: '2', code: 'SP2511058', name: 'Grout 510 - Silver - 25kg/bao', unit: 'bao', importPrice: 180000, stock: 45 },
      { id: '3', code: 'SP2511002', name: 'Sika Latex TH (Can 5 lít)', unit: 'can', importPrice: 320000, stock: 20 },
      { id: '4', code: 'SP2511015', name: 'Chống thấm Polyurethane Vitec 270', unit: 'thùng', importPrice: 1250000, stock: 8 },
    ];

    const filteredProdOptions = defaultProductsList.filter((p) =>
      p.code.toLowerCase().includes(prodSearchKey.toLowerCase()) ||
      p.name.toLowerCase().includes(prodSearchKey.toLowerCase())
    );

    return (
      <div className="flex-1 bg-slate-100 flex flex-col h-full overflow-hidden relative">
        {/* Top Header Bar */}
        <div className="bg-white border-b border-gray-200 px-4 py-2 flex items-center justify-between shadow-xs z-10 shrink-0">
          <div className="flex items-center space-x-3 flex-1 max-w-3xl">
            <button
              type="button"
              onClick={() => setShowExitConfirm(true)}
              className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-700 transition-colors"
              title="Thoát màn hình Nhập hàng"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h2 className="text-base font-extrabold text-gray-900 whitespace-nowrap">Nhập hàng</h2>

            {/* Product Search Input */}
            <div className="relative flex-1">
              <div className="flex items-center border border-gray-300 rounded-lg bg-white px-3 py-1.5 focus-within:border-blue-600 focus-within:ring-1 focus-within:ring-blue-600">
                <Search className="w-4 h-4 text-gray-400 mr-2 shrink-0" />
                <input
                  type="text"
                  value={prodSearchKey}
                  onChange={(e) => {
                    setProdSearchKey(e.target.value);
                    setShowProdDropdown(true);
                  }}
                  onFocus={() => setShowProdDropdown(true)}
                  placeholder="Tìm hàng hóa theo mã hoặc tên (F3)"
                  className="w-full text-xs text-gray-800 placeholder-gray-400 bg-transparent focus:outline-none"
                />
                <div className="flex items-center space-x-1.5 ml-2 border-l border-gray-200 pl-2 text-gray-400">
                  <LayoutGrid className="w-4 h-4 hover:text-gray-600 cursor-pointer" />
                  <Plus
                    className="w-4 h-4 hover:text-blue-600 cursor-pointer"
                    onClick={() => {
                      const name = prompt('Nhập tên hàng hóa mới:');
                      if (name) {
                        setNewPurchaseItems((prev) => [
                          ...prev,
                          {
                            productCode: `SP${Math.floor(100000 + Math.random() * 900000)}`,
                            productName: name,
                            unit: 'bao',
                            quantity: 1,
                            unitPrice: 200000,
                            discount: 0,
                          },
                        ]);
                      }
                    }}
                  />
                </div>
              </div>

              {/* Dropdown Menu */}
              {showProdDropdown && prodSearchKey && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-xl z-50 max-h-60 overflow-y-auto">
                  {filteredProdOptions.length > 0 ? (
                    filteredProdOptions.map((p) => (
                      <div
                        key={p.id}
                        onClick={() => {
                          setNewPurchaseItems((prev) => {
                            const existingIdx = prev.findIndex((item) => item.productCode === p.code);
                            if (existingIdx > -1) {
                              const updated = [...prev];
                              updated[existingIdx].quantity += 1;
                              return updated;
                            }
                            return [
                              ...prev,
                              {
                                productCode: p.code,
                                productName: p.name,
                                unit: p.unit || 'bao',
                                quantity: 1,
                                unitPrice: p.importPrice || 180000,
                                discount: 0,
                              },
                            ];
                          });
                          setProdSearchKey('');
                          setShowProdDropdown(false);
                        }}
                        className="p-2.5 hover:bg-blue-50 cursor-pointer border-b border-gray-100 flex justify-between items-center text-xs"
                      >
                        <div>
                          <span className="font-mono font-bold text-blue-600 mr-2">{p.code}</span>
                          <span className="font-semibold text-gray-900">{p.name}</span>
                        </div>
                        <div className="text-right">
                          <span className="font-mono font-bold text-gray-800">
                            {(p.importPrice || 180000).toLocaleString('vi-VN')}đ
                          </span>
                          <span className="text-[11px] text-gray-500 block">Tồn: {p.stock}</span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-3 text-center text-xs text-gray-500">Không tìm thấy hàng hóa</div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Right utility icons */}
          <div className="flex items-center space-x-2 text-gray-500">
            <button type="button" className="p-1.5 hover:bg-gray-100 rounded-lg" title="Quét mã vạch">
              <QrCode className="w-4 h-4" />
            </button>
            <button type="button" className="p-1.5 hover:bg-gray-100 rounded-lg" title="In">
              <Printer className="w-4 h-4" />
            </button>
            <button type="button" className="p-1.5 hover:bg-gray-100 rounded-lg" title="Xem trước">
              <Eye className="w-4 h-4" />
            </button>
            <button type="button" className="p-1.5 hover:bg-gray-100 rounded-lg" title="Trợ giúp">
              <AlertCircle className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-3 p-3 overflow-hidden">
          {/* Left Table / Excel Dropzone */}
          <div className="lg:col-span-8 xl:col-span-9 bg-white rounded-xl shadow-2xs border border-gray-200 flex flex-col overflow-hidden">
            <div className="overflow-x-auto flex-1 flex flex-col">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-[#e0f2fe] text-gray-800 font-bold border-b border-blue-200 sticky top-0 z-10">
                  <tr>
                    <th className="p-2.5 text-center w-12 border-r border-blue-200">STT</th>
                    <th className="p-2.5 border-r border-blue-200">Mã hàng</th>
                    <th className="p-2.5 border-r border-blue-200">Tên hàng</th>
                    <th className="p-2.5 text-center w-20 border-r border-blue-200">ĐVT</th>
                    <th className="p-2.5 text-center w-28 border-r border-blue-200">Số lượng</th>
                    <th className="p-2.5 text-right w-32 border-r border-blue-200">Đơn giá</th>
                    <th className="p-2.5 text-right w-28 border-r border-blue-200">Giảm giá</th>
                    <th className="p-2.5 text-right w-36">Thành tiền</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 bg-white">
                  {newPurchaseItems.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="p-16 text-center">
                        <div className="flex flex-col items-center justify-center space-y-3 max-w-sm mx-auto">
                          <h3 className="font-extrabold text-gray-900 text-sm">Thêm sản phẩm từ file excel</h3>
                          <p className="text-xs text-gray-500">
                            (Tải về file mẫu:<a href="#" onClick={(e) => { e.preventDefault(); alert('Tải file mẫu Excel!'); }} className="text-blue-600 hover:underline font-semibold ml-1">Excel file</a>)
                          </p>
                          <label className="flex items-center justify-center px-5 py-2.5 bg-[#0066ff] hover:bg-blue-700 text-white font-bold text-xs rounded-lg cursor-pointer transition-colors shadow-sm">
                            <FileSpreadsheet className="w-4 h-4 mr-2" />
                            <span>Chọn file dữ liệu</span>
                            <input
                              type="file"
                              accept=".xlsx,.xls,.csv"
                              className="hidden"
                              onChange={() => {
                                setNewPurchaseItems([
                                  {
                                    productCode: 'SP2511189',
                                    productName: 'Ramset Vitec 5006 (tuýp)',
                                    unit: 'tuýp',
                                    quantity: 3,
                                    unitPrice: 480000,
                                    discount: 0,
                                  },
                                  {
                                    productCode: 'SP2511058',
                                    productName: 'Grout 510 - Silver - 25kg/bao',
                                    unit: 'bao',
                                    quantity: 5,
                                    unitPrice: 180000,
                                    discount: 0,
                                  },
                                ]);
                              }}
                            />
                          </label>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    newPurchaseItems.map((item, idx) => {
                      const rowTotal = item.quantity * item.unitPrice - item.discount;
                      return (
                        <tr key={idx} className="hover:bg-slate-50 transition-colors">
                          <td className="p-2.5 text-center font-bold text-gray-500 border-r border-gray-100">
                            {idx + 1}
                          </td>
                          <td className="p-2.5 font-mono font-bold text-blue-600 border-r border-gray-100">
                            {item.productCode}
                          </td>
                          <td className="p-2.5 font-medium text-gray-900 border-r border-gray-100">
                            {item.productName}
                          </td>
                          <td className="p-2.5 text-center text-gray-600 border-r border-gray-100 font-medium">
                            {item.unit}
                          </td>
                          <td className="p-2 border-r border-gray-100">
                            <div className="flex items-center justify-center space-x-1">
                              <button
                                type="button"
                                onClick={() => {
                                  setNewPurchaseItems((prev) =>
                                    prev.map((it, i) =>
                                      i === idx ? { ...it, quantity: Math.max(1, it.quantity - 1) } : it
                                    )
                                  );
                                }}
                                className="w-5 h-5 border border-gray-300 rounded flex items-center justify-center font-bold text-gray-600 hover:bg-gray-100"
                              >
                                -
                              </button>
                              <input
                                type="number"
                                min="1"
                                value={item.quantity}
                                onChange={(e) => {
                                  const val = parseInt(e.target.value) || 1;
                                  setNewPurchaseItems((prev) =>
                                    prev.map((it, i) => (i === idx ? { ...it, quantity: val } : it))
                                  );
                                }}
                                className="w-12 text-center font-bold border border-gray-300 rounded py-0.5 text-xs focus:outline-none focus:border-blue-600"
                              />
                              <button
                                type="button"
                                onClick={() => {
                                  setNewPurchaseItems((prev) =>
                                    prev.map((it, i) => (i === idx ? { ...it, quantity: it.quantity + 1 } : it))
                                  );
                                }}
                                className="w-5 h-5 border border-gray-300 rounded flex items-center justify-center font-bold text-gray-600 hover:bg-gray-100"
                              >
                                +
                              </button>
                            </div>
                          </td>
                          <td className="p-2 border-r border-gray-100 text-right">
                            <input
                              type="number"
                              value={item.unitPrice}
                              onChange={(e) => {
                                const val = parseFloat(e.target.value) || 0;
                                setNewPurchaseItems((prev) =>
                                  prev.map((it, i) => (i === idx ? { ...it, unitPrice: val } : it))
                                );
                              }}
                              className="w-24 text-right font-mono font-medium border border-gray-300 rounded px-1.5 py-0.5 text-xs focus:outline-none focus:border-blue-600"
                            />
                          </td>
                          <td className="p-2 border-r border-gray-100 text-right">
                            <input
                              type="number"
                              value={item.discount}
                              onChange={(e) => {
                                const val = parseFloat(e.target.value) || 0;
                                setNewPurchaseItems((prev) =>
                                  prev.map((it, i) => (i === idx ? { ...it, discount: val } : it))
                                );
                              }}
                              className="w-20 text-right font-mono text-gray-600 border border-gray-300 rounded px-1.5 py-0.5 text-xs focus:outline-none focus:border-blue-600"
                            />
                          </td>
                          <td className="p-2.5 text-right font-mono font-bold text-gray-900">
                            <div className="flex items-center justify-end space-x-2">
                              <span>{rowTotal.toLocaleString('vi-VN')}</span>
                              <button
                                type="button"
                                onClick={() => {
                                  setNewPurchaseItems((prev) => prev.filter((_, i) => i !== idx));
                                }}
                                className="text-gray-400 hover:text-rose-600 p-0.5 rounded transition-colors"
                                title="Xóa"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Right Sidebar */}
          <div className="lg:col-span-4 xl:col-span-3 bg-white rounded-xl shadow-2xs border border-gray-200 p-4 flex flex-col justify-between space-y-4 text-xs">
            <div className="space-y-3.5">
              {/* User and DateTime */}
              <div className="flex justify-between items-center border-b border-gray-100 pb-2.5">
                <div className="flex items-center space-x-1.5 font-bold text-gray-800 cursor-pointer">
                  <User className="w-4 h-4 text-gray-500" />
                  <span>Chống Thấm 36</span>
                  <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
                </div>
                <div className="font-mono text-gray-500 text-[11px]">
                  08/08/2026 01:26
                </div>
              </div>

              {/* Supplier Search */}
              <div className="relative">
                <div className="flex items-center space-x-1">
                  <div className="flex-1 flex items-center border border-gray-300 rounded-lg px-2.5 py-1.5 bg-white focus-within:border-blue-600">
                    <input
                      type="text"
                      value={newSupplier}
                      onChange={(e) => {
                        setNewSupplier(e.target.value);
                        setShowSuppDropdown(true);
                      }}
                      placeholder="Tìm nhà cung cấp"
                      className="w-full text-xs font-semibold text-gray-800 placeholder-gray-400 bg-transparent focus:outline-none"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const sName = prompt('Nhập tên Nhà cung cấp mới:');
                      if (sName) setNewSupplier(sName);
                    }}
                    className="p-1.5 border border-gray-300 hover:bg-gray-100 rounded-lg text-gray-600"
                    title="Thêm Nhà cung cấp"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>

                {showSuppDropdown && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-xl z-50 max-h-48 overflow-y-auto">
                    {['Khang Hân (Hồng)', 'Công ty Sika Việt Nam', 'Tổng kho Vitec', 'Nhà cung cấp vật tư 36']
                      .filter((s) => s.toLowerCase().includes(newSupplier.toLowerCase()))
                      .map((sName, i) => (
                        <div
                          key={i}
                          onClick={() => {
                            setNewSupplier(sName);
                            setShowSuppDropdown(false);
                          }}
                          className="p-2 hover:bg-blue-50 cursor-pointer text-xs font-medium text-gray-800 border-b border-gray-100"
                        >
                          {sName}
                        </div>
                      ))}
                  </div>
                )}
              </div>

              {/* Form Fields */}
              <div className="space-y-2.5 pt-1">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600 font-medium w-28">Mã phiếu nhập</span>
                  <input
                    type="text"
                    value={newPurchaseCode}
                    onChange={(e) => setNewPurchaseCode(e.target.value)}
                    placeholder="Mã phiếu tự động"
                    className="flex-1 text-right font-mono border border-gray-300 rounded px-2 py-1 text-xs focus:outline-none focus:border-blue-600"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-gray-600 font-medium w-28">Mã đặt hàng nhập</span>
                  <input
                    type="text"
                    value={newOrderCode}
                    onChange={(e) => setNewOrderCode(e.target.value)}
                    placeholder=""
                    className="flex-1 text-right font-mono border border-gray-300 rounded px-2 py-1 text-xs focus:outline-none focus:border-blue-600"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-gray-600 font-medium w-28">Trạng thái</span>
                  <span className="font-bold text-gray-700">Phiếu tạm</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-gray-600 font-medium w-28">Số hóa đơn đầu vào</span>
                  <input
                    type="text"
                    value={newInvoiceNo}
                    onChange={(e) => setNewInvoiceNo(e.target.value)}
                    placeholder="Nhập số hóa đơn đầu ..."
                    className="flex-1 text-right font-mono border border-gray-300 rounded px-2 py-1 text-xs focus:outline-none focus:border-blue-600"
                  />
                </div>

                {/* Calculations */}
                <div className="pt-2 border-t border-gray-100 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 font-medium flex items-center">
                      Tổng tiền hàng <Info className="w-3.5 h-3.5 text-gray-400 ml-1" />
                    </span>
                    <span className="font-mono font-bold text-gray-900 text-sm">
                      {calculatedTotalItems.toLocaleString('vi-VN')}
                    </span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 font-medium">Giảm giá</span>
                    <input
                      type="number"
                      value={newDiscount}
                      onChange={(e) => setNewDiscount(parseFloat(e.target.value) || 0)}
                      className="w-28 text-right font-mono border border-gray-300 rounded px-2 py-1 text-xs focus:outline-none focus:border-blue-600"
                    />
                  </div>

                  <div className="flex justify-between items-center pt-1 font-bold">
                    <span className="text-gray-900">Cần trả nhà cung cấp</span>
                    <span className="font-mono text-blue-600 text-sm">
                      {calculatedNetTotal.toLocaleString('vi-VN')}
                    </span>
                  </div>
                </div>

                {/* Note */}
                <div className="pt-2">
                  <textarea
                    rows={2}
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    placeholder="Ghi chú"
                    className="w-full p-2 border border-gray-300 rounded text-xs text-gray-800 focus:outline-none focus:border-blue-600"
                  />
                </div>
              </div>
            </div>

            {/* Action buttons */}
            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-gray-200">
              <button
                type="button"
                onClick={() => handleSaveNewPurchase('Phiếu tạm')}
                className="py-2.5 px-3 border border-blue-600 text-blue-600 hover:bg-blue-50 font-bold text-xs rounded-lg transition-colors text-center"
              >
                Lưu tạm
              </button>
              <button
                type="button"
                onClick={() => handleSaveNewPurchase('Đã nhập hàng')}
                className="py-2.5 px-3 bg-[#0066ff] hover:bg-blue-700 text-white font-bold text-xs rounded-lg transition-colors text-center shadow-sm"
              >
                Hoàn thành
              </button>
            </div>
          </div>
        </div>

        {/* Confirmation Modal when Closing Tab */}
        {showExitConfirm && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 space-y-4 border border-gray-200 animate-in fade-in zoom-in-95">
              <div className="flex items-center space-x-3 text-amber-600">
                <AlertCircle className="w-6 h-6 shrink-0" />
                <h3 className="text-base font-bold text-gray-900">Xác nhận thoát</h3>
              </div>
              <p className="text-xs text-gray-600 leading-relaxed">
                Bạn có chắc chắn muốn thoát khỏi màn hình <strong>Thêm phiếu nhập</strong>? Những thông tin chưa lưu trên phiếu này sẽ bị mất.
              </p>
              <div className="flex justify-end space-x-2 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowExitConfirm(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-xs font-semibold text-gray-700 hover:bg-gray-100 transition-colors"
                >
                  Ở lại
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowExitConfirm(false);
                    setShowAddPurchaseTab(false);
                    setNewPurchaseItems([]);
                  }}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold transition-colors shadow-xs"
                >
                  Đồng ý thoát
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

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

  const paginatedOrders = React.useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredOrders.slice(start, start + pageSize);
  }, [filteredOrders, currentPage, pageSize]);

  const paginatedPurchases = React.useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredPurchases.slice(start, start + pageSize);
  }, [filteredPurchases, currentPage, pageSize]);

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

        <div className="flex items-center space-x-3 w-full sm:w-auto justify-between sm:justify-end">
          {/* View Switcher Tabs */}
          {onSelectView && (
            <div className="flex items-center space-x-1 bg-gray-100 p-1 rounded-lg border border-gray-200 text-xs font-medium">
              {(currentView === 'purchases' || currentView === 'purchase-returns') ? (
                <>
                  <button
                    onClick={() => onSelectView('suppliers')}
                    className="px-3 py-1.5 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-200 transition-colors"
                  >
                    Nhà cung cấp
                  </button>
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
                </>
              ) : (
                <>
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
                </>
              )}
            </div>
          )}

          {currentView === 'purchases' && (
            <button
              type="button"
              onClick={() => setShowAddPurchaseTab(true)}
              className="bg-[#1e0b54] hover:bg-[#15073c] text-white font-bold px-3.5 py-2 rounded-lg text-xs flex items-center shadow-md transition-colors shrink-0"
            >
              <Plus className="w-4 h-4 mr-1.5 text-amber-400" />
              Thêm phiếu nhập
            </button>
          )}
        </div>
      </div>

      {/* Search Input */}
      <div className="bg-white rounded-lg shadow-sm p-3 border border-gray-100 flex items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
            placeholder={
              isPurchaseMode
                ? 'Tìm kiếm mã phiếu nhập (PN000...) hoặc tên Nhà cung cấp...'
                : 'Tìm kiếm mã hóa đơn (HD102...) hoặc tên khách hàng...'
            }
            className="w-full pl-9 pr-3 py-1.5 text-xs border border-gray-300 rounded-md focus:outline-none focus:border-[#1e0b54]"
          />
        </div>
      </div>

      {/* Table Content */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-x-auto flex-1">
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
              {paginatedPurchases.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-gray-400 italic">
                    Chưa có phiếu nhập hàng nào.
                  </td>
                </tr>
              ) : (
                paginatedPurchases.map((p) => {
                  const isExpanded = expandedOrderId === p.id;

                  return (
                    <React.Fragment key={p.id}>
                      <tr
                        onClick={() => toggleExpandOrder(p.id)}
                        className={`cursor-pointer transition-colors ${
                          isExpanded ? 'bg-[#e0f2fe] font-semibold' : 'hover:bg-[#e0f2fe]'
                        }`}
                      >
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

                      {/* Expanded Purchase Order Detail View */}
                      {isExpanded && (
                        <tr>
                          <td colSpan={6} className="p-0 bg-[#f8fafc] border-b-2 border-blue-200">
                            {/* Tab header */}
                            <div className="flex border-b border-gray-200 bg-white px-6 pt-3 text-xs font-semibold text-gray-600">
                              <button className="pb-2.5 px-3 border-b-2 border-blue-600 text-blue-600 font-bold">
                                Thông tin
                              </button>
                            </div>

                            {/* Tab content */}
                            <div className="p-6 bg-white space-y-5 text-xs">
                              {/* Top Title Bar */}
                              <div className="flex justify-between items-start">
                                <div className="flex items-center space-x-3">
                                  <span className="font-bold text-base text-gray-900">{p.code}</span>
                                  <span className="px-2.5 py-0.5 rounded text-[11px] font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
                                    {p.status || 'Đã nhập hàng'}
                                  </span>
                                </div>
                                <div className="text-xs font-semibold text-gray-600">
                                  Tổng Kho Chống Thấm 36
                                </div>
                              </div>

                              {/* Metadata Grid */}
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-y-3 gap-x-10 text-xs py-1">
                                <div className="space-y-2">
                                  <div className="flex items-center space-x-2">
                                    <span className="text-gray-500 w-20">Người tạo:</span>
                                    <span className="font-semibold text-gray-800">{p.creator || 'Chống Thấm 36'}</span>
                                  </div>
                                  <div className="flex items-center space-x-2">
                                    <span className="text-gray-500 w-20">Tên NCC:</span>
                                    <button type="button" className="font-semibold text-blue-600 hover:underline">
                                      {p.supplierName || 'Khang Hân (Hồng)'}
                                    </button>
                                  </div>
                                </div>

                                <div className="space-y-2">
                                  <div className="flex items-center space-x-2">
                                    <span className="text-gray-500 w-20">Người nhập:</span>
                                    <select className="border border-gray-300 rounded px-2 py-0.5 text-xs bg-white text-gray-800 font-medium focus:outline-none focus:border-blue-600">
                                      <option>{p.buyer || 'Chống Thấm 36'}</option>
                                      <option>Nhân viên 1</option>
                                    </select>
                                  </div>
                                  <div className="flex items-center space-x-2">
                                    <span className="text-gray-500 w-20">Ngày nhập:</span>
                                    <div className="flex items-center space-x-1 border border-gray-300 rounded px-2 py-0.5 bg-white text-gray-800 font-mono text-xs">
                                      <span>{p.date || '06/08/2026 09:53'}</span>
                                      <Calendar className="w-3.5 h-3.5 text-gray-400 ml-1" />
                                      <Clock className="w-3.5 h-3.5 text-gray-400 ml-1" />
                                    </div>
                                  </div>
                                </div>
                              </div>

                              {/* Items Table */}
                              <div className="border border-gray-200 rounded overflow-hidden">
                                <table className="w-full text-left text-xs">
                                  <thead className="bg-gray-100 text-gray-700 font-bold border-b border-gray-200">
                                    <tr>
                                      <th className="p-2.5 border-r border-gray-200">Mã hàng</th>
                                      <th className="p-2.5 border-r border-gray-200">Tên hàng</th>
                                      <th className="p-2.5 border-r border-gray-200 text-center">Số lượng</th>
                                      <th className="p-2.5 border-r border-gray-200 text-right">Đơn giá</th>
                                      <th className="p-2.5 border-r border-gray-200 text-right">Giảm giá</th>
                                      <th className="p-2.5 border-r border-gray-200 text-right">Giá nhập</th>
                                      <th className="p-2.5 text-right">
                                        <div className="flex items-center justify-between">
                                          <span>Thành tiền</span>
                                          <button
                                            type="button"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              alert('Thiết lập giá sản phẩm');
                                            }}
                                            className="text-blue-600 font-normal hover:underline flex items-center text-[11px] normal-case"
                                          >
                                            <Tag className="w-3 h-3 mr-1" />
                                            Thiết lập giá
                                          </button>
                                        </div>
                                      </th>
                                    </tr>
                                    <tr className="bg-slate-50 border-b border-gray-200">
                                      <th className="p-1.5 border-r border-gray-200">
                                        <input
                                          type="text"
                                          placeholder="Tìm mã hàng"
                                          className="w-full px-2 py-1 text-[11px] border border-gray-300 rounded bg-white font-normal focus:outline-none focus:border-blue-600"
                                        />
                                      </th>
                                      <th className="p-1.5 border-r border-gray-200">
                                        <input
                                          type="text"
                                          placeholder="Tìm tên hàng"
                                          className="w-full px-2 py-1 text-[11px] border border-gray-300 rounded bg-white font-normal focus:outline-none focus:border-blue-600"
                                        />
                                      </th>
                                      <th colSpan={5} className="p-1.5 bg-slate-50"></th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-gray-100 bg-white">
                                    {p.items && p.items.length > 0 ? (
                                      p.items.map((item, idx) => (
                                        <tr key={idx} className="hover:bg-slate-50">
                                          <td className="p-2.5 border-r border-gray-100 font-mono text-blue-600 font-semibold">
                                            {item.productCode || 'SP2511189'}
                                          </td>
                                          <td className="p-2.5 border-r border-gray-100 font-medium text-gray-900">
                                            {item.productName || 'Ramset Vitec 5006 (tuýp)'}
                                          </td>
                                          <td className="p-2.5 border-r border-gray-100 text-center font-bold">
                                            {item.quantity}
                                          </td>
                                          <td className="p-2.5 border-r border-gray-100 text-right font-mono text-gray-700">
                                            {(item.unitPrice || 480000).toLocaleString('vi-VN')}
                                          </td>
                                          <td className="p-2.5 border-r border-gray-100 text-right font-mono text-gray-400">
                                            {item.discount ? item.discount.toLocaleString('vi-VN') : ''}
                                          </td>
                                          <td className="p-2.5 border-r border-gray-100 text-right font-mono text-gray-700">
                                            {(item.importPrice || item.unitPrice || 480000).toLocaleString('vi-VN')}
                                          </td>
                                          <td className="p-2.5 text-right font-mono font-bold text-gray-900">
                                            <div className="flex justify-end items-center space-x-2">
                                              <span>
                                                {(item.quantity * (item.importPrice || item.unitPrice || 480000)).toLocaleString('vi-VN')}
                                              </span>
                                              <Tag className="w-3.5 h-3.5 text-gray-400 hover:text-blue-600 cursor-pointer" />
                                            </div>
                                          </td>
                                        </tr>
                                      ))
                                    ) : (
                                      <tr className="hover:bg-slate-50">
                                        <td className="p-2.5 border-r border-gray-100 font-mono text-blue-600 font-semibold">
                                          SP2511189
                                        </td>
                                        <td className="p-2.5 border-r border-gray-100 font-medium text-gray-900">
                                          Ramset Vitec 5006 (tuýp)
                                        </td>
                                        <td className="p-2.5 border-r border-gray-100 text-center font-bold">3</td>
                                        <td className="p-2.5 border-r border-gray-100 text-right font-mono text-gray-700">480,000</td>
                                        <td className="p-2.5 border-r border-gray-100 text-right font-mono text-gray-400"></td>
                                        <td className="p-2.5 border-r border-gray-100 text-right font-mono text-gray-700">480,000</td>
                                        <td className="p-2.5 text-right font-mono font-bold text-gray-900">
                                          <div className="flex justify-end items-center space-x-2">
                                            <span>1,440,000</span>
                                            <Tag className="w-3.5 h-3.5 text-gray-400 hover:text-blue-600 cursor-pointer" />
                                          </div>
                                        </td>
                                      </tr>
                                    )}
                                  </tbody>
                                </table>
                              </div>

                              {/* Bottom Note & Calculation Summary */}
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                                <div>
                                  <textarea
                                    rows={3}
                                    placeholder="Ghi chú..."
                                    value={p.note || ''}
                                    readOnly
                                    className="w-full p-2.5 border border-gray-200 rounded text-xs text-gray-700 focus:outline-none bg-gray-50/50"
                                  />
                                </div>

                                <div className="space-y-2 text-xs font-medium text-gray-700 text-right max-w-xs ml-auto">
                                  <div className="flex justify-between items-center">
                                    <span className="text-gray-500">Số lượng mặt hàng:</span>
                                    <span className="font-mono font-bold text-gray-900">{p.itemsCount || 1}</span>
                                  </div>
                                  <div className="flex justify-between items-center">
                                    <span className="text-gray-500">Tổng tiền hàng ({p.itemsCount || 3}):</span>
                                    <span className="font-mono font-bold text-gray-900">
                                      {p.totalAmount ? p.totalAmount.toLocaleString('vi-VN') : '1,440,000'}
                                    </span>
                                  </div>
                                  <div className="flex justify-between items-center">
                                    <span className="text-gray-500">Giảm giá ⓘ:</span>
                                    <span className="font-mono text-gray-700">{p.discount || 0}</span>
                                  </div>
                                  <div className="flex justify-between items-center font-bold text-gray-900 pt-1 border-t border-gray-200">
                                    <span>Tổng cộng:</span>
                                    <span className="font-mono text-gray-900">
                                      {p.totalAmount ? p.totalAmount.toLocaleString('vi-VN') : '1,440,000'}
                                    </span>
                                  </div>
                                  <div className="flex justify-between items-center">
                                    <span className="text-gray-500">Tiền đã trả NCC:</span>
                                    <span className="font-mono font-bold text-gray-900">
                                      {p.paidAmount !== undefined ? p.paidAmount.toLocaleString('vi-VN') : '0'}
                                    </span>
                                  </div>
                                </div>
                              </div>

                              {/* Bottom Action Bar */}
                              <div className="flex flex-wrap justify-between items-center pt-4 border-t border-gray-200 gap-2">
                                <div className="flex items-center space-x-2">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      alert(`Đã gửi yêu cầu hủy phiếu nhập ${p.code}`);
                                    }}
                                    className="flex items-center px-3 py-1.5 border border-gray-300 rounded text-xs font-medium text-gray-700 hover:bg-gray-100 transition-colors"
                                  >
                                    <Trash2 className="w-3.5 h-3.5 mr-1 text-gray-500" />
                                    Hủy
                                  </button>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      alert(`Đã sao chép phiếu nhập ${p.code}`);
                                    }}
                                    className="flex items-center px-3 py-1.5 border border-gray-300 rounded text-xs font-medium text-gray-700 hover:bg-gray-100 transition-colors"
                                  >
                                    <Copy className="w-3.5 h-3.5 mr-1 text-gray-500" />
                                    Sao chép
                                  </button>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      alert(`Đã xuất file phiếu nhập ${p.code}`);
                                    }}
                                    className="flex items-center px-3 py-1.5 border border-gray-300 rounded text-xs font-medium text-gray-700 hover:bg-gray-100 transition-colors"
                                  >
                                    <Download className="w-3.5 h-3.5 mr-1 text-gray-500" />
                                    Xuất file
                                  </button>
                                </div>

                                <div className="flex items-center space-x-2">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      alert(`Mở chi tiết phiếu ${p.code}`);
                                    }}
                                    className="flex items-center px-4 py-1.5 bg-[#0066ff] hover:bg-blue-700 text-white rounded text-xs font-bold shadow-xs transition-colors"
                                  >
                                    <ExternalLink className="w-3.5 h-3.5 mr-1.5" />
                                    Mở phiếu
                                  </button>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      alert(`Đã lưu thông tin phiếu nhập ${p.code}`);
                                    }}
                                    className="flex items-center px-3 py-1.5 border border-gray-300 rounded text-xs font-medium text-gray-700 hover:bg-gray-100 transition-colors"
                                  >
                                    <Save className="w-3.5 h-3.5 mr-1 text-gray-500" />
                                    Lưu
                                  </button>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      alert(`Tạo phiếu trả hàng nhập cho ${p.code}`);
                                    }}
                                    className="flex items-center px-3 py-1.5 border border-gray-300 rounded text-xs font-medium text-gray-700 hover:bg-gray-100 transition-colors"
                                  >
                                    <RotateCcw className="w-3.5 h-3.5 mr-1 text-gray-500" />
                                    Trả hàng nhập
                                  </button>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      alert(`In tem mã sản phẩm cho phiếu nhập ${p.code}`);
                                    }}
                                    className="flex items-center px-3 py-1.5 border border-gray-300 rounded text-xs font-medium text-gray-700 hover:bg-gray-100 transition-colors"
                                  >
                                    <Printer className="w-3.5 h-3.5 mr-1 text-gray-500" />
                                    In tem mã
                                  </button>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                    }}
                                    className="px-2 py-1.5 border border-gray-300 rounded text-xs font-medium text-gray-700 hover:bg-gray-100 transition-colors"
                                  >
                                    ...
                                  </button>
                                </div>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        ) : (
          /* Table for Hóa đơn bán hàng / Trả hàng matching exact screenshot structure */
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-[#dbeafe] text-gray-800 font-semibold border-b border-gray-300 text-[11px] select-none">
                  <th className="p-2 border-r border-gray-300 min-w-[100px]">Mã hóa đơn</th>
                  <th className="p-2 border-r border-gray-300 min-w-[130px]">Thời gian</th>
                  <th className="p-2 border-r border-gray-300 bg-[#f97316] text-white font-bold min-w-[90px] text-center">
                    Mã trả hàng
                  </th>
                  <th className="p-2 border-r border-gray-300 min-w-[90px]">Mã KH</th>
                  <th className="p-2 border-r border-gray-300 min-w-[150px]">Khách hàng</th>
                  <th className="p-2 border-r border-gray-300 text-right min-w-[120px]">Tổng tiền hàng</th>
                  <th className="p-2 border-r border-gray-300 text-right min-w-[90px]">Giảm giá</th>
                  <th className="p-2 border-r border-gray-300 text-right min-w-[120px]">Tổng sau giảm giá</th>
                  <th className="p-2 border-r border-gray-300 text-right min-w-[120px]">Khách đã trả</th>
                  <th className="p-2 text-center min-w-[60px]">In lại</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 font-sans">
                {paginatedOrders.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="text-center py-8 text-gray-400 italic">
                      Chưa có hóa đơn nào trong cơ sở dữ liệu.
                    </td>
                  </tr>
                ) : (
                  paginatedOrders.map((ord, idx) => {
                    const isExpanded = expandedOrderId === ord.id;
                    const subtotal = ord.subtotal || ord.totalAmount;
                    const discount = ord.discount || 0;
                    const netTotal = ord.totalAmount;
                    const paid = ord.amountPaid !== undefined ? ord.amountPaid : ord.totalAmount;
                    const itemCount = ord.items ? ord.items.reduce((sum, item) => sum + item.quantity, 0) : 1;

                    return (
                      <React.Fragment key={ord.id}>
                        <tr
                          onClick={() => toggleExpandOrder(ord.id)}
                          className={`cursor-pointer transition-colors ${
                            isExpanded
                              ? 'bg-[#e0f2fe] font-semibold'
                              : idx % 2 === 1
                              ? 'bg-[#f8fafc] hover:bg-[#e0f2fe]'
                              : 'bg-white hover:bg-[#e0f2fe]'
                          }`}
                        >
                          {/* Mã hóa đơn */}
                          <td className="p-2 border-r border-gray-200 font-mono text-blue-900 font-medium">
                            {ord.orderCode}
                          </td>

                          {/* Thời gian */}
                          <td className="p-2 border-r border-gray-200 text-gray-700 whitespace-nowrap">
                            {ord.date}
                          </td>

                          {/* Mã trả hàng */}
                          <td className="p-2 border-r border-gray-200 text-center font-mono text-gray-500">
                            {ord.returnCode || ''}
                          </td>

                          {/* Mã KH */}
                          <td className="p-2 border-r border-gray-200 font-mono text-gray-800 font-medium">
                            {ord.customerCode || 'KH000009'}
                          </td>

                          {/* Khách hàng */}
                          <td className="p-2 border-r border-gray-200 font-medium text-gray-900 truncate max-w-[200px]" title={ord.customerName}>
                            {ord.customerName}
                          </td>

                          {/* Tổng tiền hàng */}
                          <td className="p-2 border-r border-gray-200 text-right font-mono font-bold text-gray-800">
                            {subtotal ? subtotal.toLocaleString('en-US') : '0'}
                          </td>

                          {/* Giảm giá */}
                          <td className="p-2 border-r border-gray-200 text-right font-mono text-gray-700">
                            {discount > 0 ? discount.toLocaleString('en-US') : '0'}
                          </td>

                          {/* Tổng sau giảm giá */}
                          <td className="p-2 border-r border-gray-200 text-right font-mono font-bold text-[#1e0b54]">
                            {netTotal ? netTotal.toLocaleString('en-US') : '0'}
                          </td>

                          {/* Khách đã trả */}
                          <td className="p-2 border-r border-gray-200 text-right font-mono font-bold text-gray-900">
                            {paid ? paid.toLocaleString('en-US') : '0'}
                          </td>

                          {/* In lại action */}
                          <td className="p-2 text-center" onClick={(e) => e.stopPropagation()}>
                            <button
                              onClick={() => onReprintOrder(ord)}
                              className="p-1 hover:bg-indigo-100 rounded text-gray-600 hover:text-[#1e0b54] transition-colors"
                              title="In lại hóa đơn"
                            >
                              <Printer className="w-4 h-4 mx-auto" />
                            </button>
                          </td>
                        </tr>

                        {/* Expanded Detail Panel matching screenshot */}
                        {isExpanded && (
                          <tr>
                            <td colSpan={10} className="p-0 bg-[#f8fafc] border-b-2 border-blue-200">
                              {/* Expanded Tabs */}
                              <div className="flex border-b border-gray-200 bg-white px-6 pt-3 text-xs font-semibold text-gray-600">
                                <button
                                  onClick={() => setOrderTab('info')}
                                  className={`pb-2.5 px-3 border-b-2 transition-colors ${
                                    orderTab === 'info'
                                      ? 'border-blue-600 text-blue-600 font-bold'
                                      : 'border-transparent hover:text-gray-900'
                                  }`}
                                >
                                  Thông tin
                                </button>
                                <button
                                  onClick={() => setOrderTab('payments')}
                                  className={`pb-2.5 px-3 border-b-2 transition-colors ${
                                    orderTab === 'payments'
                                      ? 'border-blue-600 text-blue-600 font-bold'
                                      : 'border-transparent hover:text-gray-900'
                                  }`}
                                >
                                  Lịch sử thanh toán
                                </button>
                              </div>

                              {/* Tab "Thông tin" Content */}
                              {orderTab === 'info' && (
                                <div className="p-6 bg-white space-y-5 text-xs">
                                  {/* Top header row */}
                                  <div className="flex justify-between items-start">
                                    <div className="flex items-center space-x-3">
                                      <div className="flex items-center space-x-1 font-bold text-sm text-gray-900">
                                        <span>{ord.customerCode || 'KH000009'} - {ord.customerName}</span>
                                        <Edit3 className="w-3.5 h-3.5 text-blue-600 cursor-pointer ml-1 hover:text-blue-800" />
                                      </div>
                                      <span className="font-mono text-gray-500 font-medium text-xs">{ord.orderCode}</span>
                                      <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
                                        Hoàn thành
                                      </span>
                                    </div>
                                    <div className="text-xs font-semibold text-gray-600">
                                      Tổng Kho Chống Thấm 36
                                    </div>
                                  </div>

                                  {/* Metadata Grid */}
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-y-3 gap-x-10 text-xs py-2">
                                    <div className="space-y-2">
                                      <div className="flex items-center space-x-2">
                                        <span className="text-gray-500 w-20">Người tạo:</span>
                                        <span className="font-semibold text-gray-800">Chống Thấm 36</span>
                                      </div>
                                      <div className="flex items-center space-x-2">
                                        <span className="text-gray-500 w-20">Kênh bán:</span>
                                        <select className="border border-gray-300 rounded px-2 py-0.5 text-xs bg-white text-gray-800 font-medium focus:outline-none focus:border-blue-600">
                                          <option>Bán trực tiếp</option>
                                          <option>Online / Website</option>
                                          <option>Điện thoại</option>
                                        </select>
                                      </div>
                                    </div>

                                    <div className="space-y-2">
                                      <div className="flex items-center space-x-2">
                                        <span className="text-gray-500 w-20">Người bán:</span>
                                        <select className="border border-gray-300 rounded px-2 py-0.5 text-xs bg-white text-gray-800 font-medium focus:outline-none focus:border-blue-600">
                                          <option>Chống Thấm 36</option>
                                          <option>Nhân viên 1</option>
                                        </select>
                                      </div>
                                      <div className="flex items-center space-x-2">
                                        <span className="text-gray-500 w-20">Ngày bán:</span>
                                        <div className="flex items-center space-x-1 border border-gray-300 rounded px-2 py-0.5 bg-white text-gray-800 font-mono text-xs">
                                          <span>{ord.date}</span>
                                          <Calendar className="w-3.5 h-3.5 text-gray-400 ml-1" />
                                          <Clock className="w-3.5 h-3.5 text-gray-400 ml-1" />
                                        </div>
                                        <span className="text-gray-500 ml-4 mr-2">Bảng giá:</span>
                                        <span className="font-medium text-gray-800">Bảng giá chung</span>
                                      </div>
                                    </div>
                                  </div>

                                  {/* Items Table */}
                                  <div className="border border-gray-200 rounded overflow-hidden">
                                    <table className="w-full text-left text-xs">
                                      <thead className="bg-gray-100 text-gray-700 font-bold border-b border-gray-200">
                                        <tr>
                                          <th className="p-2.5 border-r border-gray-200">Mã hàng</th>
                                          <th className="p-2.5 border-r border-gray-200">Tên hàng</th>
                                          <th className="p-2.5 border-r border-gray-200 text-center">Số lượng</th>
                                          <th className="p-2.5 border-r border-gray-200 text-right">Đơn giá</th>
                                          <th className="p-2.5 border-r border-gray-200 text-right">Giảm giá</th>
                                          <th className="p-2.5 border-r border-gray-200 text-right">Giá bán</th>
                                          <th className="p-2.5 text-right">Thành tiền</th>
                                        </tr>
                                      </thead>
                                      <tbody className="divide-y divide-gray-100 bg-white">
                                        {ord.items && ord.items.length > 0 ? (
                                          ord.items.map((item, i) => (
                                            <tr key={i} className="hover:bg-slate-50">
                                              <td className="p-2.5 border-r border-gray-100 font-mono text-blue-600 font-semibold">
                                                {item.product?.code || 'SP2511058'}
                                              </td>
                                              <td className="p-2.5 border-r border-gray-100 font-medium text-gray-900">
                                                {item.product?.name || 'Sản phẩm vật tư'} {item.product?.unit ? `(${item.product.unit})` : ''}
                                              </td>
                                              <td className="p-2.5 border-r border-gray-100 text-center font-bold">
                                                {item.quantity}
                                              </td>
                                              <td className="p-2.5 border-r border-gray-100 text-right font-mono text-gray-700">
                                                {item.unitPrice ? item.unitPrice.toLocaleString('vi-VN') : '180,000'}
                                              </td>
                                              <td className="p-2.5 border-r border-gray-100 text-right font-mono text-gray-400">
                                                
                                              </td>
                                              <td className="p-2.5 border-r border-gray-100 text-right font-mono text-gray-700">
                                                {item.unitPrice ? item.unitPrice.toLocaleString('vi-VN') : '180,000'}
                                              </td>
                                              <td className="p-2.5 text-right font-mono font-bold text-gray-900">
                                                {((item.quantity || 1) * (item.unitPrice || 180000)).toLocaleString('vi-VN')}
                                              </td>
                                            </tr>
                                          ))
                                        ) : (
                                          <tr className="hover:bg-slate-50">
                                            <td className="p-2.5 border-r border-gray-100 font-mono text-blue-600 font-semibold">
                                              SP2511058
                                            </td>
                                            <td className="p-2.5 border-r border-gray-100 font-medium text-gray-900">
                                              Grout 510 - Silver - 25kg/bao (Bao)
                                             </td>
                                             <td className="p-2.5 border-r border-gray-100 text-center font-bold">1</td>
                                             <td className="p-2.5 border-r border-gray-100 text-right font-mono text-gray-700">180,000</td>
                                             <td className="p-2.5 border-r border-gray-100 text-right font-mono text-gray-400"></td>
                                             <td className="p-2.5 border-r border-gray-100 text-right font-mono text-gray-700">180,000</td>
                                             <td className="p-2.5 text-right font-mono font-bold text-gray-900">180,000</td>
                                           </tr>
                                         )}
                                       </tbody>
                                     </table>
                                   </div>

                                   {/* Bottom Note & Math summary */}
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                                    <div>
                                      <label className="block text-[11px] font-bold text-gray-600 mb-1">Ghi chú đơn hàng:</label>
                                      <textarea
                                        rows={3}
                                        placeholder="Nhập ghi chú đơn hàng..."
                                        value={editingNotes[ord.id] !== undefined ? editingNotes[ord.id] : (ord.note || '')}
                                        onChange={(e) =>
                                          setEditingNotes({ ...editingNotes, [ord.id]: e.target.value })
                                        }
                                        className="w-full p-2.5 border border-gray-300 rounded text-xs text-gray-800 focus:outline-none focus:border-blue-600 bg-white shadow-xs"
                                      />
                                    </div>

                                    <div className="space-y-2 text-xs font-medium text-gray-700 text-right max-w-xs ml-auto">
                                      <div className="flex justify-between items-center">
                                        <span className="text-gray-500">Tổng tiền hàng ({itemCount}):</span>
                                        <span className="font-mono font-bold text-gray-900">
                                          {subtotal ? subtotal.toLocaleString('vi-VN') : '180,000'}
                                        </span>
                                      </div>
                                      <div className="flex justify-between items-center">
                                        <span className="text-gray-500">Giảm giá hóa đơn:</span>
                                        <span className="font-mono text-gray-700">
                                          {discount > 0 ? discount.toLocaleString('vi-VN') : '0'}
                                        </span>
                                      </div>
                                      <div className="flex justify-between items-center">
                                        <span className="text-gray-500">Khách cần trả:</span>
                                        <span className="font-mono font-bold text-gray-900">
                                          {netTotal ? netTotal.toLocaleString('vi-VN') : '180,000'}
                                        </span>
                                      </div>
                                      <div className="flex justify-between items-center font-bold text-sm text-gray-900 pt-1 border-t border-gray-200">
                                        <span>Khách đã trả:</span>
                                        <span className="font-mono text-gray-900">
                                          {paid ? paid.toLocaleString('vi-VN') : '180,000'}
                                        </span>
                                      </div>
                                    </div>
                                  </div>

                                  {/* Action Buttons */}
                                  <div className="flex flex-wrap justify-between items-center pt-4 border-t border-gray-200 gap-2">
                                    <div className="flex items-center space-x-2">
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          alert(`Đã gửi yêu cầu hủy hóa đơn ${ord.orderCode}`);
                                        }}
                                        className="flex items-center px-3 py-1.5 border border-gray-300 rounded text-xs font-medium text-gray-700 hover:bg-gray-100 transition-colors"
                                      >
                                        <Trash2 className="w-3.5 h-3.5 mr-1 text-gray-500" />
                                        Hủy
                                      </button>
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          alert(`Đã sao chép hóa đơn ${ord.orderCode}`);
                                        }}
                                        className="flex items-center px-3 py-1.5 border border-gray-300 rounded text-xs font-medium text-gray-700 hover:bg-gray-100 transition-colors"
                                      >
                                        <Copy className="w-3.5 h-3.5 mr-1 text-gray-500" />
                                        Sao chép
                                      </button>
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          alert(`Đã xuất file hóa đơn ${ord.orderCode}`);
                                        }}
                                        className="flex items-center px-3 py-1.5 border border-gray-300 rounded text-xs font-medium text-gray-700 hover:bg-gray-100 transition-colors"
                                      >
                                        <Download className="w-3.5 h-3.5 mr-1 text-gray-500" />
                                        Xuất file
                                      </button>
                                    </div>

                                    <div className="flex items-center space-x-2">
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          const noteToSave = editingNotes[ord.id] !== undefined ? editingNotes[ord.id] : (ord.note || '');
                                          if (onUpdateOrder) {
                                            onUpdateOrder(ord.id, { note: noteToSave });
                                            alert(`Đã cập nhật ghi chú cho đơn hàng ${ord.orderCode}`);
                                          }
                                        }}
                                        className="flex items-center px-4 py-1.5 bg-[#0066ff] hover:bg-blue-700 text-white rounded text-xs font-bold shadow-xs transition-colors"
                                      >
                                        <Save className="w-3.5 h-3.5 mr-1.5" />
                                        Lưu ghi chú
                                       </button>
                                       <button
                                         onClick={(e) => {
                                           e.stopPropagation();
                                           alert(`Tạo phiếu trả hàng cho đơn ${ord.orderCode}`);
                                         }}
                                         className="flex items-center px-3 py-1.5 border border-gray-300 rounded text-xs font-medium text-gray-700 hover:bg-gray-100 transition-colors"
                                       >
                                         <RotateCcw className="w-3.5 h-3.5 mr-1 text-gray-500" />
                                         Trả hàng
                                       </button>
                                       <button
                                         onClick={(e) => {
                                           e.stopPropagation();
                                           onReprintOrder(ord);
                                         }}
                                         className="flex items-center px-3 py-1.5 border border-gray-300 rounded text-xs font-medium text-gray-700 hover:bg-gray-100 transition-colors"
                                       >
                                         <Printer className="w-3.5 h-3.5 mr-1 text-gray-500" />
                                         In
                                       </button>
                                     </div>
                                  </div>
                                </div>
                              )}

                              {/* Tab "Lịch sử thanh toán" Content */}
                              {orderTab === 'payments' && (
                                <div className="p-4 bg-white">
                                  <table className="w-full text-left text-xs border border-gray-200">
                                    <thead className="bg-gray-50 text-gray-600 font-bold border-b border-gray-200">
                                      <tr>
                                        <th className="p-2.5">Mã phiếu thu</th>
                                        <th className="p-2.5">Thời gian</th>
                                        <th className="p-2.5">Phương thức thanh toán</th>
                                        <th className="p-2.5 text-right">Giá trị (VNĐ)</th>
                                        <th className="p-2.5 text-center">Trạng thái</th>
                                      </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                      <tr className="hover:bg-gray-50">
                                        <td className="p-2.5 font-mono text-blue-600 font-bold">
                                          PT{ord.orderCode.replace(/\D/g, '') || '0009720'}
                                        </td>
                                        <td className="p-2.5 font-mono text-gray-600">{ord.date}</td>
                                        <td className="p-2.5 text-gray-800 font-medium">
                                          {ord.paymentMethod === 'qr' ? 'Chuyển khoản (Mã QR VietQR)' : 'Tiền mặt'}
                                        </td>
                                        <td className="p-2.5 text-right font-mono font-bold text-gray-900">
                                          {(paid || netTotal || 180000).toLocaleString('vi-VN')}đ
                                        </td>
                                        <td className="p-2.5 text-center">
                                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-green-100 text-green-800">
                                            Đã thanh toán
                                          </span>
                                        </td>
                                      </tr>
                                    </tbody>
                                  </table>
                                </div>
                              )}
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Controls */}
        <Pagination
          currentPage={currentPage}
          totalItems={isPurchaseMode ? filteredPurchases.length : filteredOrders.length}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
          onPageSizeChange={setPageSize}
          pageSizeOptions={[10, 20, 50, 100]}
        />
      </div>
    </div>
  );
};
