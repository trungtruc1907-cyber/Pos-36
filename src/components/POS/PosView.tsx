import React, { useState, useMemo } from 'react';
import { Product, CartItem, Customer, PaymentMethod, InvoiceTab } from '../../types';
import { 
  Search, 
  Plus, 
  X, 
  Trash2, 
  RotateCcw, 
  Printer, 
  RefreshCw, 
  UserPlus, 
  Edit3, 
  ArrowLeft, 
  CheckCircle2, 
  ChevronDown, 
  Zap, 
  Clock, 
  PhoneCall, 
  HelpCircle, 
  Bell, 
  QrCode,
  CreditCard,
  Wallet,
  DollarSign,
  Package
} from 'lucide-react';

interface PosViewProps {
  products: Product[];
  customers: Customer[];
  onBackToDashboard: () => void;
  onCompleteCheckout: (orderData: {
    customerCode?: string;
    customerName: string;
    cart: CartItem[];
    subtotal: number;
    discount: number;
    surcharge: number;
    amountPaid: number;
    paymentMethod: PaymentMethod;
    totalAmount: number;
    note: string;
  }) => void;
  onAddNewCustomer: (newCustomer: Customer) => void;
}

export const PosView: React.FC<PosViewProps> = ({
  products,
  customers,
  onBackToDashboard,
  onCompleteCheckout,
  onAddNewCustomer,
}) => {
  // Multiple Invoice Tabs State
  const [tabs, setTabs] = useState<InvoiceTab[]>([
    {
      id: 'tab-1',
      title: 'Hóa đơn 1',
      cart: [],
      customerId: 'c7',
      customerCode: 'KH000009',
      customerName: 'Khách lẻ',
      discount: 0,
      surcharge: 0,
      amountPaid: 0,
      paymentMethod: 'cash',
      note: '',
    },
  ]);

  const [activeTabId, setActiveTabId] = useState<string>('tab-1');
  const [searchQuery, setSearchQuery] = useState('');
  const [customerSearchQuery, setCustomerSearchQuery] = useState('');
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
  const [showAddCustomerModal, setShowAddCustomerModal] = useState(false);
  const [showCatalogDrawer, setShowCatalogDrawer] = useState(false);
  const [selectedCatalogCategory, setSelectedCatalogCategory] = useState<string>('Tất cả');
  const [posMode, setPosMode] = useState<'fast' | 'standard'>('fast');
  const [mobileTab, setMobileTab] = useState<'cart' | 'checkout'>('cart');

  // New Customer Form State
  const [newCustName, setNewCustName] = useState('');
  const [newCustPhone, setNewCustPhone] = useState('');
  const [newCustAddress, setNewCustAddress] = useState('');

  // Current active tab
  const activeTab = useMemo(() => {
    return tabs.find((t) => t.id === activeTabId) || tabs[0];
  }, [tabs, activeTabId]);

  // Calculations
  const rawTotal = useMemo(() => {
    return activeTab.cart.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
  }, [activeTab.cart]);

  const payableAmount = useMemo(() => {
    const net = rawTotal - (activeTab.discount || 0) + (activeTab.surcharge || 0);
    return net > 0 ? net : 0;
  }, [rawTotal, activeTab.discount, activeTab.surcharge]);

  const changeAmount = useMemo(() => {
    return (activeTab.amountPaid || 0) - payableAmount;
  }, [activeTab.amountPaid, payableAmount]);

  // Product Search Results
  const filteredProducts = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase();
    return products.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.code.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q)
    );
  }, [products, searchQuery]);

  // Customer Search Results
  const filteredCustomers = useMemo(() => {
    if (!customerSearchQuery.trim()) return customers;
    const q = customerSearchQuery.toLowerCase();
    return customers.filter(
      (c) => c.name.toLowerCase().includes(q) || c.phone.includes(q)
    );
  }, [customers, customerSearchQuery]);

  // Tab Handlers
  const handleAddTab = () => {
    const newId = `tab-${Date.now()}`;
    const newTab: InvoiceTab = {
      id: newId,
      title: `Hóa đơn ${tabs.length + 1}`,
      cart: [],
      customerId: 'c7',
      customerCode: 'KH000009',
      customerName: 'Khách lẻ',
      discount: 0,
      surcharge: 0,
      amountPaid: 0,
      paymentMethod: 'cash',
      note: '',
    };
    setTabs([...tabs, newTab]);
    setActiveTabId(newId);
  };

  const handleCloseTab = (idToClose: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (tabs.length === 1) return; // Keep at least 1 tab
    const newTabs = tabs.filter((t) => t.id !== idToClose);
    setTabs(newTabs);
    if (activeTabId === idToClose) {
      setActiveTabId(newTabs[0].id);
    }
  };

  const updateActiveTab = (updater: (prev: InvoiceTab) => InvoiceTab) => {
    setTabs((prevTabs) =>
      prevTabs.map((t) => (t.id === activeTabId ? updater(t) : t))
    );
  };

  // Cart operations
  const handleAddToCart = (product: Product) => {
    updateActiveTab((tab) => {
      const existingIndex = tab.cart.findIndex((item) => item.product.id === product.id);
      let newCart = [...tab.cart];
      if (existingIndex >= 0) {
        newCart[existingIndex] = {
          ...newCart[existingIndex],
          quantity: newCart[existingIndex].quantity + 1,
        };
      } else {
        newCart.push({
          product,
          quantity: 1,
          unitPrice: product.price,
        });
      }

      const newRawTotal = newCart.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
      const newPayable = newRawTotal - tab.discount + tab.surcharge;

      return {
        ...tab,
        cart: newCart,
        amountPaid: newPayable > 0 ? newPayable : 0,
      };
    });
    setSearchQuery('');
  };

  const handleUpdateQuantity = (productId: string, newQty: number) => {
    if (newQty < 1) return;
    updateActiveTab((tab) => {
      const newCart = tab.cart.map((item) =>
        item.product.id === productId ? { ...item, quantity: newQty } : item
      );
      const newRawTotal = newCart.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
      const newPayable = newRawTotal - tab.discount + tab.surcharge;
      return {
        ...tab,
        cart: newCart,
        amountPaid: newPayable > 0 ? newPayable : 0,
      };
    });
  };

  const handleUpdateUnitPrice = (productId: string, price: number) => {
    updateActiveTab((tab) => {
      const newCart = tab.cart.map((item) =>
        item.product.id === productId ? { ...item, unitPrice: price } : item
      );
      const newRawTotal = newCart.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
      const newPayable = newRawTotal - tab.discount + tab.surcharge;
      return {
        ...tab,
        cart: newCart,
        amountPaid: newPayable > 0 ? newPayable : 0,
      };
    });
  };

  const handleRemoveItem = (productId: string) => {
    updateActiveTab((tab) => {
      const newCart = tab.cart.filter((item) => item.product.id !== productId);
      const newRawTotal = newCart.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
      const newPayable = newRawTotal - tab.discount + tab.surcharge;
      return {
        ...tab,
        cart: newCart,
        amountPaid: newPayable > 0 ? newPayable : 0,
      };
    });
  };

  const handleResetCart = () => {
    updateActiveTab((tab) => ({
      ...tab,
      cart: [],
      discount: 0,
      surcharge: 0,
      amountPaid: 0,
      note: '',
    }));
  };

  // Add Customer Handler
  const handleSaveCustomer = () => {
    if (!newCustName.trim()) return;
    const newC: Customer = {
      id: `c-${Date.now()}`,
      name: newCustName.trim(),
      phone: newCustPhone.trim(),
      address: newCustAddress.trim(),
      totalSpent: 0,
      orderCount: 0,
    };
    onAddNewCustomer(newC);
    updateActiveTab((tab) => ({
      ...tab,
      customerId: newC.id,
      customerName: newC.name,
    }));
    setShowAddCustomerModal(false);
    setNewCustName('');
    setNewCustPhone('');
    setNewCustAddress('');
  };

  // Quick preset amounts
  const presetAmounts = useMemo(() => {
    const base = payableAmount;
    if (base <= 0) return [100000, 200000, 500000, 1000000];

    const presets = new Set<number>();
    presets.add(base);
    presets.add(Math.ceil(base / 10000) * 10000 + 10000);
    presets.add(Math.ceil(base / 50000) * 50000 + 50000);
    presets.add(Math.ceil(base / 100000) * 100000);
    presets.add(1000000);

    return Array.from(presets)
      .filter((a) => a >= base)
      .sort((a, b) => a - b)
      .slice(0, 5);
  }, [payableAmount]);

  // Final Checkout
  const handleCheckoutClick = () => {
    if (activeTab.cart.length === 0) {
      alert('Vui lòng chọn ít nhất 1 sản phẩm để thanh toán!');
      return;
    }

    onCompleteCheckout({
      customerCode: activeTab.customerCode || 'KH000009',
      customerName: activeTab.customerName,
      cart: activeTab.cart,
      subtotal: rawTotal,
      discount: activeTab.discount,
      surcharge: activeTab.surcharge,
      amountPaid: activeTab.amountPaid,
      paymentMethod: activeTab.paymentMethod,
      totalAmount: payableAmount,
      note: activeTab.note,
    });

    // Reset or close tab after payment
    handleResetCart();
  };

  return (
    <div className="h-screen w-full flex flex-col bg-gray-100 font-sans text-gray-800 overflow-hidden">
      {/* POS Top Header */}
      <header className="bg-[#1e0b54] text-white flex justify-between items-center px-4 h-14 shrink-0 shadow-md z-30">
        {/* Left: Product Search Input & Invoice Tabs */}
        <div className="flex items-center space-x-3 flex-1 min-w-0 pr-4">
          <button
            onClick={onBackToDashboard}
            className="flex items-center text-indigo-200 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors shrink-0"
            title="Trở về Tổng quan"
          >
            <ArrowLeft className="w-5 h-5 mr-1" />
            <span className="text-xs font-semibold hidden sm:inline">Tổng quan</span>
          </button>

          {/* Instant Search Bar */}
          <div className="relative w-64 md:w-80 lg:w-96 shrink-0">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
              <Search className="w-4 h-4" />
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm hàng hóa (Sika, Grout, Lưới...)"
              className="w-full py-1.5 pl-9 pr-8 bg-white text-gray-900 rounded-md text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 font-medium"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}

            {/* Live Search Dropdown */}
            {searchQuery && (
              <div className="absolute left-0 right-0 top-full mt-1 bg-white rounded-md shadow-2xl border border-gray-200 max-h-80 overflow-y-auto z-50 divide-y divide-gray-100">
                {filteredProducts.length > 0 ? (
                  filteredProducts.map((p) => (
                    <div
                      key={p.id}
                      onClick={() => handleAddToCart(p)}
                      className="p-2.5 hover:bg-indigo-50 cursor-pointer flex justify-between items-center transition-colors text-gray-900"
                    >
                      <div>
                        <div className="text-xs font-bold text-gray-900">{p.name}</div>
                        <div className="text-[10px] text-gray-500 font-mono">
                          Mã: {p.code} | Tồn: {p.stock} {p.unit}
                        </div>
                      </div>
                      <div className="text-right shrink-0 ml-2">
                        <div className="text-xs font-bold text-[#1e0b54]">
                          {p.price.toLocaleString('vi-VN')}đ
                        </div>
                        <span className="inline-block bg-indigo-100 text-[#1e0b54] text-[9px] px-1.5 py-0.5 rounded font-medium">
                          {p.unit}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-4 text-center text-xs text-gray-500">
                    Không tìm thấy sản phẩm phù hợp.
                  </div>
                )}
              </div>
            )}
          </div>

          <button
            onClick={() => setShowCatalogDrawer(true)}
            className="hidden lg:flex items-center px-2.5 py-1.5 bg-white/10 hover:bg-white/20 rounded-md text-xs font-medium text-white transition-colors shrink-0"
            title="Danh mục sản phẩm"
          >
            <Package className="w-4 h-4 mr-1 text-amber-400" />
            Danh mục
          </button>

          {/* Multiple Invoice Tabs */}
          <div className="hidden md:flex items-center space-x-1 overflow-x-auto scrollbar-hide py-1">
            {tabs.map((tab) => {
              const isActive = tab.id === activeTabId;
              return (
                <div
                  key={tab.id}
                  onClick={() => setActiveTabId(tab.id)}
                  className={`flex items-center space-x-2 px-3 py-1.5 rounded-t-md text-xs font-bold cursor-pointer transition-all ${
                    isActive
                      ? 'bg-white text-[#1e0b54] shadow-sm border-t-2 border-amber-400'
                      : 'bg-[#2a136b] text-indigo-200 hover:text-white hover:bg-[#341880]'
                  }`}
                >
                  <span>{tab.title}</span>
                  {tabs.length > 1 && (
                    <button
                      onClick={(e) => handleCloseTab(tab.id, e)}
                      className="hover:bg-gray-200 rounded-full p-0.5 transition-colors text-gray-500 hover:text-red-600"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>
              );
            })}
            <button
              onClick={handleAddTab}
              className="p-1.5 rounded-md hover:bg-white/20 text-indigo-200 hover:text-white transition-colors"
              title="Tạo hóa đơn mới"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Right Action Icons & Cashier Profile */}
        <div className="flex items-center space-x-2 shrink-0">
          <button
            onClick={handleResetCart}
            className="p-2 hover:bg-white/10 rounded-md text-indigo-200 hover:text-white transition-colors"
            title="Xóa giỏ hàng / Hoàn tác"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
          <button
            className="p-2 hover:bg-white/10 rounded-md text-indigo-200 hover:text-white transition-colors"
            title="Đồng bộ dữ liệu"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={() => window.print()}
            className="p-2 hover:bg-white/10 rounded-md text-indigo-200 hover:text-white transition-colors"
            title="In tạm tính"
          >
            <Printer className="w-4 h-4" />
          </button>

          <div className="h-5 w-px bg-indigo-800 mx-1 hidden sm:block" />

          {/* Store Brand Badge */}
          <div className="flex items-center space-x-2 bg-indigo-900/80 px-2.5 py-1 rounded-md text-xs font-bold border border-indigo-700/50">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span className="hidden sm:inline">Chống Thấm 36</span>
            <span className="text-amber-400">admin</span>
          </div>
        </div>
      </header>
      <div className="lg:hidden flex border-b border-indigo-900 bg-[#1e0b54] text-white shrink-0">
        <button
          onClick={() => setMobileTab('cart')}
          className={`flex-1 py-2.5 text-xs font-bold text-center border-b-2 flex items-center justify-center gap-1.5 transition-colors ${
            mobileTab === 'cart'
              ? 'border-amber-400 bg-[#15073c] text-white'
              : 'border-transparent text-indigo-200 hover:text-white'
          }`}
        >
          <Package className="w-4 h-4" />
          Giỏ hàng ({activeTab.cart.reduce((sum, i) => sum + i.quantity, 0)})
        </button>
        <button
          onClick={() => setMobileTab('checkout')}
          className={`flex-1 py-2.5 text-xs font-bold text-center border-b-2 flex items-center justify-center gap-1.5 transition-colors ${
            mobileTab === 'checkout'
              ? 'border-amber-400 bg-[#15073c] text-white'
              : 'border-transparent text-indigo-200 hover:text-white'
          }`}
        >
          <CreditCard className="w-4 h-4" />
          Thanh toán ({payableAmount.toLocaleString('vi-VN')}đ)
        </button>
      </div>

      {/* Main POS Split Screen */}
      <main className="flex-1 flex flex-col lg:flex-row overflow-hidden relative">
        {/* LEFT PANEL: CART & SELECTED ITEMS TABLE */}
        <section className={`flex-1 flex-col bg-white border-r border-gray-200 overflow-hidden min-w-0 ${mobileTab === 'cart' ? 'flex' : 'hidden lg:flex'}`}>
          <div className="flex-1 overflow-x-auto flex flex-col min-w-0">
            <div className="min-w-[620px] flex-1 flex flex-col">
              {/* Cart Items Header Table */}
              <div className="grid grid-cols-[40px_1fr_65px_100px_110px_120px_40px] gap-2 px-3 py-2 bg-gray-100 border-b border-gray-200 text-[11px] font-bold text-gray-600 uppercase tracking-wider sticky top-0 z-10">
                <div className="text-center">STT</div>
                <div>Sản phẩm</div>
                <div className="text-center">ĐVT</div>
                <div className="text-right">Số lượng</div>
                <div className="text-right">Đơn giá</div>
                <div className="text-right">Thành tiền</div>
                <div className="text-center">Xóa</div>
              </div>

              {/* Cart Scrollable Items */}
              <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
                {activeTab.cart.length > 0 ? (
                  activeTab.cart.map((item, index) => {
                    const itemTotal = item.quantity * item.unitPrice;
                    return (
                      <div
                        key={item.product.id}
                        className="grid grid-cols-[40px_1fr_65px_100px_110px_120px_40px] gap-2 items-center p-2.5 bg-white hover:bg-slate-50 rounded-md border border-gray-200/80 transition-colors group text-xs"
                      >
                        {/* STT */}
                        <div className="text-center font-bold text-gray-400">{index + 1}</div>

                        {/* Product Name & SKU */}
                        <div className="min-w-0 pr-2">
                          <div className="font-bold text-gray-900 truncate" title={item.product.name}>
                            {item.product.name}
                          </div>
                          <div className="text-[10px] text-gray-400 font-mono">
                            {item.product.code}
                          </div>
                        </div>

                        {/* Unit Badge */}
                        <div className="text-center">
                          <span className="inline-block px-1.5 py-0.5 bg-indigo-50 text-[#1e0b54] font-semibold text-[10px] rounded border border-indigo-100">
                            {item.product.unit}
                          </span>
                        </div>

                        {/* Quantity Control Buttons & Input */}
                        <div className="flex items-center justify-end space-x-1">
                          <button
                            onClick={() => handleUpdateQuantity(item.product.id, item.quantity - 1)}
                            className="w-6 h-6 bg-gray-100 hover:bg-gray-200 rounded text-gray-700 font-bold flex items-center justify-center transition-colors"
                          >
                            -
                          </button>
                          <input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={(e) =>
                              handleUpdateQuantity(
                                item.product.id,
                                parseInt(e.target.value) || 1
                              )
                            }
                            className="w-10 h-6 text-center border border-gray-300 rounded font-bold text-gray-900 text-xs focus:outline-none focus:border-[#1e0b54]"
                          />
                          <button
                            onClick={() => handleUpdateQuantity(item.product.id, item.quantity + 1)}
                            className="w-6 h-6 bg-gray-100 hover:bg-gray-200 rounded text-gray-700 font-bold flex items-center justify-center transition-colors"
                          >
                            +
                          </button>
                        </div>

                        {/* Unit Price Input */}
                        <div className="text-right">
                          <input
                            type="number"
                            value={item.unitPrice}
                            onChange={(e) =>
                              handleUpdateUnitPrice(
                                item.product.id,
                                parseFloat(e.target.value) || 0
                              )
                            }
                            className="w-24 h-6 text-right border-b border-dashed border-gray-300 focus:border-[#1e0b54] font-mono text-xs text-gray-800 bg-transparent focus:bg-white focus:outline-none"
                          />
                        </div>

                        {/* Total Amount */}
                        <div className="text-right font-bold text-[#1e0b54] font-mono text-xs">
                          {itemTotal.toLocaleString('vi-VN')}đ
                        </div>

                        {/* Delete Item Button */}
                        <div className="flex justify-center">
                          <button
                            onClick={() => handleRemoveItem(item.product.id)}
                            className="text-gray-400 hover:text-red-600 p-1 rounded hover:bg-red-50 transition-colors"
                            title="Xóa khỏi giỏ"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="h-64 flex flex-col items-center justify-center text-gray-400 p-8">
                    <Package className="w-12 h-12 mb-2 text-gray-300" />
                    <p className="text-sm font-semibold">Chưa có sản phẩm nào trong giỏ hàng</p>
                    <p className="text-xs text-gray-400 mt-1">
                      Nhập tên sản phẩm ở thanh tìm kiếm hoặc chọn từ danh mục bên dưới
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Cart Bottom Note Field */}
          <div className="p-3 bg-gray-50 border-t border-gray-200 shrink-0">
            <div className="relative">
              <Edit3 className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={activeTab.note}
                onChange={(e) =>
                  updateActiveTab((tab) => ({ ...tab, note: e.target.value }))
                }
                placeholder="Ghi chú đơn hàng (ví dụ: giao tại công trình, hẹn lấy chiều...)"
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-gray-300 rounded-md focus:outline-none focus:border-[#1e0b54]"
              />
            </div>
          </div>
        </section>

        {/* RIGHT PANEL: CHECKOUT & PAYMENT */}
        <section className={`w-full lg:w-[380px] xl:w-[420px] bg-white flex-col border-l border-gray-200 shrink-0 shadow-lg z-20 ${mobileTab === 'checkout' ? 'flex' : 'hidden lg:flex'}`}>
          {/* Customer Selection & DateTime Header */}
          <div className="p-3 bg-slate-50 border-b border-gray-200 space-y-2.5 shrink-0">
            <div className="flex justify-between items-center text-xs">
              {/* Active Customer Selector Dropdown Trigger */}
              <div className="relative flex-1 mr-2">
                <button
                  onClick={() => setShowCustomerDropdown(!showCustomerDropdown)}
                  className="flex items-center text-sm font-bold text-[#1e0b54] hover:text-indigo-900 transition-colors"
                >
                  <span className="truncate">{activeTab.customerName}</span>
                  <ChevronDown className="w-4 h-4 ml-1 shrink-0" />
                </button>

                {/* Customer Dropdown */}
                {showCustomerDropdown && (
                  <div className="absolute left-0 top-full mt-1 w-72 bg-white rounded-md shadow-2xl border border-gray-200 z-50 p-2 space-y-2">
                    <div className="relative">
                      <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        type="text"
                        value={customerSearchQuery}
                        onChange={(e) => setCustomerSearchQuery(e.target.value)}
                        placeholder="Tìm khách hàng..."
                        className="w-full pl-8 pr-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:border-[#1e0b54]"
                      />
                    </div>
                    <div className="max-h-48 overflow-y-auto divide-y divide-gray-100">
                      {filteredCustomers.map((c) => (
                        <div
                          key={c.id}
                          onClick={() => {
                            updateActiveTab((tab) => ({
                              ...tab,
                              customerId: c.id,
                              customerCode: c.code || (c.id === 'c1' ? 'KH000001' : c.id === 'c2' ? 'TS' : c.id === 'c7' ? 'KH000009' : 'KH000009'),
                              customerName: c.name,
                            }));
                            setShowCustomerDropdown(false);
                          }}
                          className="p-2 hover:bg-indigo-50 cursor-pointer transition-colors"
                        >
                          <div className="font-bold text-xs text-gray-800">{c.name}</div>
                          <div className="text-[10px] text-gray-500">{c.phone || 'Không có SĐT'}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Add New Customer Button & Timestamp */}
              <div className="flex items-center space-x-2 shrink-0">
                <button
                  onClick={() => setShowAddCustomerModal(true)}
                  className="p-1.5 bg-indigo-50 hover:bg-indigo-100 text-[#1e0b54] rounded border border-indigo-200 font-semibold text-[11px] flex items-center transition-colors"
                  title="Thêm khách hàng mới"
                >
                  <UserPlus className="w-3.5 h-3.5 mr-1" />
                  Thêm
                </button>
                <span className="text-[11px] text-gray-500 font-mono">
                  {new Date().toLocaleDateString('vi-VN')} {new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>
          </div>

          {/* Payment Breakdown */}
          <div className="p-4 flex-1 flex flex-col justify-between overflow-y-auto space-y-3">
            <div className="space-y-2 text-xs text-gray-700">
              {/* Tổng tiền hàng */}
              <div className="flex justify-between items-center">
                <span className="font-medium text-gray-600">
                  Tổng tiền hàng ({activeTab.cart.reduce((sum, i) => sum + i.quantity, 0)} sản phẩm)
                </span>
                <span className="font-bold font-mono text-sm text-gray-900">
                  {rawTotal.toLocaleString('vi-VN')}đ
                </span>
              </div>

              {/* Giảm giá */}
              <div className="flex justify-between items-center">
                <span className="font-medium text-gray-600">Giảm giá</span>
                <div className="flex items-center">
                  <input
                    type="number"
                    value={activeTab.discount || ''}
                    onChange={(e) =>
                      updateActiveTab((tab) => ({
                        ...tab,
                        discount: parseFloat(e.target.value) || 0,
                      }))
                    }
                    placeholder="0"
                    className="w-24 text-right border-b border-gray-300 focus:border-[#1e0b54] font-mono text-xs p-0.5 focus:outline-none"
                  />
                  <span className="ml-1 text-gray-400">đ</span>
                </div>
              </div>

              {/* Thu khác / Surcharge */}
              <div className="flex justify-between items-center">
                <span className="font-medium text-gray-600">Thu khác (Vận chuyển...)</span>
                <div className="flex items-center">
                  <input
                    type="number"
                    value={activeTab.surcharge || ''}
                    onChange={(e) =>
                      updateActiveTab((tab) => ({
                        ...tab,
                        surcharge: parseFloat(e.target.value) || 0,
                      }))
                    }
                    placeholder="0"
                    className="w-24 text-right border-b border-gray-300 focus:border-[#1e0b54] font-mono text-xs p-0.5 focus:outline-none"
                  />
                  <span className="ml-1 text-gray-400">đ</span>
                </div>
              </div>

              <div className="h-px bg-gray-200 my-2" />

              {/* Khách cần trả (Net Payable) */}
              <div className="flex justify-between items-center pt-1">
                <span className="text-sm font-extrabold text-gray-900">Khách cần trả</span>
                <span className="text-xl font-black text-[#1e0b54] font-mono">
                  {payableAmount.toLocaleString('vi-VN')}đ
                </span>
              </div>

              {/* Khách thanh toán */}
              <div className="flex justify-between items-center pt-2">
                <span className="font-bold text-gray-800">Khách thanh toán</span>
                <div className="flex items-center">
                  <input
                    type="number"
                    value={activeTab.amountPaid || ''}
                    onChange={(e) =>
                      updateActiveTab((tab) => ({
                        ...tab,
                        amountPaid: parseFloat(e.target.value) || 0,
                      }))
                    }
                    className="w-32 text-right font-black text-base font-mono text-emerald-700 border-b-2 border-emerald-500 focus:outline-none p-0.5"
                  />
                  <span className="ml-1 font-bold text-emerald-700">đ</span>
                </div>
              </div>

              {/* Change return calculation */}
              {changeAmount >= 0 ? (
                <div className="flex justify-between items-center text-xs text-emerald-600 font-semibold bg-emerald-50 p-2 rounded border border-emerald-100">
                  <span>Tiền thừa trả khách:</span>
                  <span className="font-bold font-mono text-sm">
                    {changeAmount.toLocaleString('vi-VN')}đ
                  </span>
                </div>
              ) : (
                <div className="flex justify-between items-center text-xs text-amber-600 font-semibold bg-amber-50 p-2 rounded border border-amber-100">
                  <span>Khách còn thiếu:</span>
                  <span className="font-bold font-mono text-sm">
                    {Math.abs(changeAmount).toLocaleString('vi-VN')}đ
                  </span>
                </div>
              )}

              {/* Payment Method Radio Options */}
              <div className="pt-3 space-y-1.5">
                <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block">
                  Phương thức thanh toán
                </span>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <label
                    onClick={() =>
                      updateActiveTab((tab) => ({ ...tab, paymentMethod: 'cash' }))
                    }
                    className={`flex items-center p-2 rounded border cursor-pointer transition-all ${
                      activeTab.paymentMethod === 'cash'
                        ? 'bg-indigo-50 border-[#1e0b54] text-[#1e0b54] font-bold'
                        : 'border-gray-200 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <DollarSign className="w-4 h-4 mr-1.5 text-emerald-600 shrink-0" />
                    <span>Tiền mặt</span>
                  </label>

                  <label
                    onClick={() =>
                      updateActiveTab((tab) => ({ ...tab, paymentMethod: 'transfer' }))
                    }
                    className={`flex items-center p-2 rounded border cursor-pointer transition-all ${
                      activeTab.paymentMethod === 'transfer'
                        ? 'bg-indigo-50 border-[#1e0b54] text-[#1e0b54] font-bold'
                        : 'border-gray-200 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <QrCode className="w-4 h-4 mr-1.5 text-blue-600 shrink-0" />
                    <span>Chuyển khoản QR</span>
                  </label>

                  <label
                    onClick={() =>
                      updateActiveTab((tab) => ({ ...tab, paymentMethod: 'card' }))
                    }
                    className={`flex items-center p-2 rounded border cursor-pointer transition-all ${
                      activeTab.paymentMethod === 'card'
                        ? 'bg-indigo-50 border-[#1e0b54] text-[#1e0b54] font-bold'
                        : 'border-gray-200 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <CreditCard className="w-4 h-4 mr-1.5 text-purple-600 shrink-0" />
                    <span>Quẹt thẻ</span>
                  </label>

                  <label
                    onClick={() =>
                      updateActiveTab((tab) => ({ ...tab, paymentMethod: 'wallet' }))
                    }
                    className={`flex items-center p-2 rounded border cursor-pointer transition-all ${
                      activeTab.paymentMethod === 'wallet'
                        ? 'bg-indigo-50 border-[#1e0b54] text-[#1e0b54] font-bold'
                        : 'border-gray-200 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <Wallet className="w-4 h-4 mr-1.5 text-amber-600 shrink-0" />
                    <span>Ví điện tử</span>
                  </label>
                </div>
              </div>

              {/* Preset Cash Amount Chips */}
              <div className="pt-2">
                <span className="text-[10px] text-gray-400 block mb-1">Gợi ý tiền mặt:</span>
                <div className="flex flex-wrap gap-1.5">
                  {presetAmounts.map((amt, idx) => (
                    <button
                      key={idx}
                      onClick={() =>
                        updateActiveTab((tab) => ({ ...tab, amountPaid: amt }))
                      }
                      className="px-2.5 py-1 bg-gray-100 hover:bg-indigo-100 hover:text-[#1e0b54] border border-gray-200 rounded font-mono text-xs text-gray-800 transition-colors"
                    >
                      {amt.toLocaleString('vi-VN')}đ
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Big prominent THANH TOÁN Button */}
            <div className="pt-3">
              <button
                onClick={handleCheckoutClick}
                disabled={activeTab.cart.length === 0}
                className={`w-full py-3.5 rounded-lg text-base font-extrabold uppercase tracking-wide flex items-center justify-center space-x-2 shadow-lg transition-all transform active:scale-98 ${
                  activeTab.cart.length > 0
                    ? 'bg-[#1e0b54] hover:bg-[#15073c] text-white cursor-pointer shadow-indigo-900/30'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                <CheckCircle2 className="w-5 h-5 text-amber-400" />
                <span>THANH TOÁN</span>
              </button>
            </div>
          </div>
        </section>
      </main>

      {/* POS Footer */}
      <footer className="bg-slate-100 border-t border-gray-200 px-4 h-9 flex items-center justify-between text-xs text-gray-600 shrink-0">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-1 border-r border-gray-300 pr-3">
            <button
              onClick={() => setPosMode('fast')}
              className={`px-2 py-0.5 rounded font-bold transition-colors ${
                posMode === 'fast'
                  ? 'bg-[#1e0b54] text-white'
                  : 'text-gray-600 hover:bg-gray-200'
              }`}
            >
              <Zap className="w-3 h-3 inline mr-1 text-amber-400" />
              Bán nhanh
            </button>
            <button
              onClick={() => setPosMode('standard')}
              className={`px-2 py-0.5 rounded font-bold transition-colors ${
                posMode === 'standard'
                  ? 'bg-[#1e0b54] text-white'
                  : 'text-gray-600 hover:bg-gray-200'
              }`}
            >
              <Clock className="w-3 h-3 inline mr-1 text-indigo-400" />
              Bán thường
            </button>
          </div>

          <div className="hidden sm:flex items-center text-gray-500 font-mono text-[11px]">
            Tải dữ liệu POS: Hoàn tất (100%)
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <a
            href="tel:0915586234"
            className="flex items-center text-blue-700 font-bold hover:underline"
          >
            <PhoneCall className="w-3.5 h-3.5 mr-1 text-blue-600" />
            Hotline: 0915 586 234
          </a>
          <button className="text-gray-500 hover:text-gray-800" title="Trợ giúp">
            <HelpCircle className="w-4 h-4" />
          </button>
          <button className="text-gray-500 hover:text-gray-800 relative" title="Thông báo hệ thống">
            <Bell className="w-4 h-4" />
          </button>
        </div>
      </footer>

      {/* Add Customer Modal */}
      {showAddCustomerModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-2xl max-w-md w-full p-5 space-y-4">
            <div className="flex justify-between items-center border-b pb-2">
              <h3 className="text-base font-bold text-[#1e0b54]">Thêm Khách hàng Mới</h3>
              <button
                onClick={() => setShowAddCustomerModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-gray-700 mb-1">
                  Tên khách hàng <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={newCustName}
                  onChange={(e) => setNewCustName(e.target.value)}
                  placeholder="Ví dụ: Anh Nam - Công trình 2"
                  className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:border-[#1e0b54]"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">Số điện thoại</label>
                <input
                  type="text"
                  value={newCustPhone}
                  onChange={(e) => setNewCustPhone(e.target.value)}
                  placeholder="0988..."
                  className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:border-[#1e0b54]"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">Địa chỉ công trình / giao hàng</label>
                <input
                  type="text"
                  value={newCustAddress}
                  onChange={(e) => setNewCustAddress(e.target.value)}
                  placeholder="Thanh Hóa..."
                  className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:border-[#1e0b54]"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-2 border-t">
              <button
                onClick={() => setShowAddCustomerModal(false)}
                className="px-4 py-2 border border-gray-300 rounded text-xs font-semibold text-gray-600 hover:bg-gray-100"
              >
                Hủy
              </button>
              <button
                onClick={handleSaveCustomer}
                className="px-4 py-2 bg-[#1e0b54] text-white rounded text-xs font-bold hover:bg-[#15073c]"
              >
                Lưu khách hàng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Catalog Quick Pick Modal / Drawer - Displayed by Product Group */}
      {showCatalogDrawer && (() => {
        const uniqueCategories = ['Tất cả', ...Array.from(new Set(products.map((p) => p.category || 'Khác')))];
        const filteredProducts = selectedCatalogCategory === 'Tất cả'
          ? products
          : products.filter((p) => (p.category || 'Khác') === selectedCatalogCategory);

        // Group filtered products by category
        const groupedMap = filteredProducts.reduce((acc, p) => {
          const cat = p.category || 'Khác';
          if (!acc[cat]) acc[cat] = [];
          acc[cat].push(p);
          return acc;
        }, {} as Record<string, Product[]>);

        return (
          <div className="fixed inset-0 bg-black/50 z-50 flex justify-end">
            <div className="bg-white w-full max-w-lg h-full flex flex-col p-4 shadow-2xl">
              <div className="flex justify-between items-center border-b pb-3 mb-2">
                <h3 className="font-bold text-base text-[#1e0b54] flex items-center">
                  <Package className="w-5 h-5 mr-2 text-amber-500" />
                  Danh mục theo Nhóm Sản Phẩm
                </h3>
                <button
                  onClick={() => setShowCatalogDrawer(false)}
                  className="text-gray-400 hover:text-gray-600 p-1"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Category Filter Pills */}
              <div className="flex gap-1.5 overflow-x-auto pb-2.5 mb-2 no-scrollbar">
                {uniqueCategories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCatalogCategory(cat)}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                      selectedCatalogCategory === cat
                        ? 'bg-[#1e0b54] text-white shadow-xs'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {/* Grouped Product List */}
              <div className="flex-1 overflow-y-auto space-y-4 pr-1">
                {Object.keys(groupedMap).length === 0 ? (
                  <div className="text-center text-xs text-gray-500 py-10">
                    Không có sản phẩm trong nhóm này.
                  </div>
                ) : (
                  Object.entries(groupedMap).map(([categoryName, productsList]) => {
                    const catProducts = productsList as Product[];
                    return (
                      <div key={categoryName} className="space-y-1.5">
                        <div className="bg-slate-100 px-3 py-1.5 rounded font-extrabold text-xs text-[#1e0b54] flex justify-between items-center border-l-4 border-amber-500">
                          <span>{categoryName}</span>
                          <span className="bg-white px-2 py-0.5 rounded-full text-[10px] text-gray-600 font-mono">
                            {catProducts.length} sản phẩm
                          </span>
                        </div>
                        <div className="grid grid-cols-1 gap-1.5">
                          {catProducts.map((p) => (
                          <div
                            key={p.id}
                            onClick={() => {
                              handleAddToCart(p);
                              setShowCatalogDrawer(false);
                            }}
                            className="p-2.5 border border-gray-200 rounded-lg hover:border-[#1e0b54] hover:bg-indigo-50/50 cursor-pointer flex justify-between items-center transition-all bg-white"
                          >
                            <div>
                              <div className="font-bold text-xs text-gray-900">{p.name}</div>
                              <div className="text-[11px] text-gray-500 font-mono">
                                Mã: {p.code} | ĐVT: {p.unit} | Tồn: {p.stock}
                              </div>
                            </div>
                            <div className="text-right ml-2 shrink-0">
                              <div className="font-extrabold text-sm text-[#1e0b54]">
                                {p.price.toLocaleString('vi-VN')}đ
                              </div>
                              <span className="text-[10px] text-emerald-600 font-semibold bg-emerald-50 px-1.5 py-0.5 rounded">
                                + Thêm
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })
              )}
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
};
