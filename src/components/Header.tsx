import React, { useState } from 'react';
import { ViewMode } from '../types';
import { Logo } from './Logo';
import { 
  Search, 
  Truck, 
  Palette, 
  MessageSquare, 
  Headphones, 
  Bell, 
  Settings, 
  User, 
  ShoppingCart, 
  ChevronDown,
  Menu,
  X,
  LayoutDashboard,
  Package,
  ShoppingBag,
  Receipt,
  Users,
  Wallet,
  FileText
} from 'lucide-react';

interface HeaderProps {
  currentView: ViewMode;
  onSelectView: (view: ViewMode, subTab?: string) => void;
  onOpenPos: () => void;
  unreadNotifications: number;
}

export const Header: React.FC<HeaderProps> = ({
  currentView,
  onSelectView,
  onOpenPos,
  unreadNotifications,
}) => {
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleSelect = (view: ViewMode, subTab?: string) => {
    onSelectView(view, subTab);
    setActiveDropdown(null);
    setMobileMenuOpen(false);
  };

  const isGoodsActive = currentView === 'goods' || currentView === 'stock-check';
  const isPurchasesActive = currentView === 'suppliers' || currentView === 'purchases' || currentView === 'purchase-returns';
  const isOrdersActive = currentView === 'orders' || currentView === 'returns';
  const isCustomersActive = currentView === 'customers' || currentView === 'promotions';

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-40 shadow-xs">
      {/* Mobile Top Header Row (exact screenshot format) */}
      <div className="flex sm:hidden items-center justify-between px-3.5 py-2 bg-white border-b border-gray-100">
        <button
          type="button"
          onClick={() => setMobileMenuOpen(true)}
          className="p-1.5 rounded-lg text-gray-800 hover:bg-gray-100 transition-colors"
          aria-label="Menu"
        >
          <Menu className="w-6 h-6" />
        </button>

        {/* Centered Sailboat Logo with 36 */}
        <div 
          onClick={() => handleSelect('dashboard')} 
          className="flex items-center justify-center cursor-pointer select-none"
        >
          <Logo className="w-8 h-8" />
        </div>

        <button 
          type="button"
          className="p-1.5 rounded-lg text-gray-800 hover:bg-gray-100 transition-colors relative"
          aria-label="Notification"
        >
          <Bell className="w-6 h-6" />
          {unreadNotifications > 0 && (
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse" />
          )}
        </button>
      </div>

      {/* Desktop Top Header Row */}
      <div className="hidden sm:flex items-center justify-between px-4 py-2 text-sm">
        {/* Left: Brand Logo & Search */}
        <div className="flex items-center space-x-4">
          <div 
            onClick={() => handleSelect('dashboard')}
            className="flex items-center space-x-2 cursor-pointer group hover:opacity-90 transition-opacity"
          >
            <Logo className="w-10 h-10" showText />
          </div>

          <div className="relative w-48 sm:w-64">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-400">
              <Search className="w-4 h-4" />
            </span>
            <input
              type="text"
              placeholder="Tìm kiếm..."
              className="w-full py-1.5 pl-9 pr-3 text-sm bg-gray-50 border border-gray-300 rounded-md focus:outline-none focus:border-[#1e0b54] focus:ring-1 focus:ring-[#1e0b54]"
            />
          </div>
        </div>

        {/* Right Action Icons & Utilities */}
        <div className="flex items-center space-x-3 sm:space-x-5 text-gray-600">
          <button className="hidden md:flex items-center hover:text-[#1e0b54] transition-colors">
            <Truck className="w-4 h-4 mr-1 text-[#1e0b54]" />
            <span className="text-xs font-medium">Giao hàng</span>
            <ChevronDown className="w-3 h-3 ml-1" />
          </button>

          <button title="Giao diện" className="hover:text-[#1e0b54] p-1">
            <Palette className="w-4 h-4" />
          </button>

          <button title="Trò chuyện" className="hover:text-[#1e0b54] p-1">
            <MessageSquare className="w-4 h-4" />
          </button>

          <button title="Hỗ trợ" className="hover:text-[#1e0b54] p-1">
            <Headphones className="w-4 h-4" />
          </button>

          <button className="flex items-center hover:text-[#1e0b54] text-xs font-medium">
            <span className="w-5 h-3.5 mr-1 bg-red-600 rounded-[1px] inline-flex items-center justify-center text-[8px] text-yellow-300 font-bold">★</span>
            <span>Tiếng Việt</span>
            <ChevronDown className="w-3 h-3 ml-0.5" />
          </button>

          <button className="hover:text-[#1e0b54] p-1 relative" title="Thông báo">
            <Bell className="w-4 h-4" />
            {unreadNotifications > 0 && (
              <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full animate-pulse" />
            )}
          </button>

          <button className="hover:text-[#1e0b54] p-1" title="Cài đặt">
            <Settings className="w-4 h-4" />
          </button>

          <div className="flex items-center space-x-1 pl-2 border-l border-gray-200">
            <User className="w-5 h-5 text-gray-700" />
            <span className="text-xs font-semibold text-gray-800 hidden lg:inline">admin</span>
          </div>
        </div>
      </div>

      {/* Primary Navigation Bar (Navy Blue) */}
      <div className="bg-[#1e0b54] px-2 sm:px-4 flex items-center justify-between text-white relative z-30">
        <div className={`flex-1 ${activeDropdown ? 'overflow-visible' : 'overflow-x-auto lg:overflow-visible'} scrollbar-none py-0.5`}>
          <nav className="flex space-x-1 min-w-max lg:min-w-0 relative">
            {/* Tổng quan */}
            <button
              onClick={() => handleSelect('dashboard')}
              className={`px-2.5 sm:px-3 py-2.5 font-medium text-xs sm:text-sm rounded-t-md transition-colors ${
                currentView === 'dashboard'
                  ? 'bg-[#15073c] text-white border-b-2 border-amber-400'
                  : 'text-indigo-200 hover:text-white hover:bg-white/10'
              }`}
            >
              Tổng quan
            </button>

            {/* Hàng hóa (With Submenu) */}
            <div 
              className="relative group"
              onMouseEnter={() => setActiveDropdown('goods')}
              onMouseLeave={() => setActiveDropdown(null)}
            >
              <button
                onClick={(e) => {
                  if (window.innerWidth < 1024) {
                    e.stopPropagation();
                    setActiveDropdown(activeDropdown === 'goods' ? null : 'goods');
                  } else {
                    handleSelect('goods');
                  }
                }}
                className={`px-2.5 sm:px-3 py-2.5 font-medium text-xs sm:text-sm flex items-center transition-colors ${
                  isGoodsActive
                    ? 'bg-[#15073c] text-white border-b-2 border-amber-400'
                    : 'text-indigo-200 hover:text-white hover:bg-white/10'
                }`}
              >
                Hàng hóa
                <ChevronDown className="w-3.5 h-3.5 ml-1 opacity-70 group-hover:opacity-100" />
              </button>

              {/* Submenu Dropdown for Hàng hóa */}
              <div className={`absolute left-0 top-full bg-white text-gray-800 shadow-2xl rounded-b-lg border border-gray-200 p-4 z-50 transition-all duration-150 w-[280px] sm:w-[380px] max-w-[90vw] ${
                activeDropdown === 'goods' ? 'block opacity-100' : 'hidden group-hover:block'
              }`}>
                <div className="grid grid-cols-2 gap-4">
                  {/* Column 1: Hàng hóa */}
                  <div className="pr-3 border-r border-gray-100">
                    <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2.5">
                      Hàng hóa
                    </div>
                    <button
                      onClick={() => handleSelect('goods')}
                      className="w-full text-left text-xs font-medium text-gray-800 hover:text-[#1e0b54] hover:bg-indigo-50/70 px-2.5 py-2 rounded transition-colors block"
                    >
                      Danh sách hàng hóa
                    </button>
                  </div>

                  {/* Column 2: Kho hàng */}
                  <div className="pl-1">
                    <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2.5">
                      Kho hàng
                    </div>
                    <button
                      onClick={() => handleSelect('stock-check')}
                      className="w-full text-left text-xs font-medium text-gray-800 hover:text-[#1e0b54] hover:bg-indigo-50/70 px-2.5 py-2 rounded transition-colors block"
                    >
                      Kiểm kho
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Mua hàng (With Submenu) */}
            <div 
              className="relative group"
              onMouseEnter={() => setActiveDropdown('purchases')}
              onMouseLeave={() => setActiveDropdown(null)}
            >
              <button
                onClick={(e) => {
                  if (window.innerWidth < 1024) {
                    e.stopPropagation();
                    setActiveDropdown(activeDropdown === 'purchases' ? null : 'purchases');
                  } else {
                    handleSelect('purchases');
                  }
                }}
                className={`px-2.5 sm:px-3 py-2.5 font-medium text-xs sm:text-sm flex items-center transition-colors ${
                  isPurchasesActive
                    ? 'bg-[#15073c] text-white border-b-2 border-amber-400'
                    : 'text-indigo-200 hover:text-white hover:bg-white/10'
                }`}
              >
                Mua hàng
                <ChevronDown className="w-3.5 h-3.5 ml-1 opacity-70 group-hover:opacity-100" />
              </button>

              {/* Submenu Dropdown for Mua hàng */}
              <div className={`absolute left-0 top-full bg-white text-gray-800 shadow-2xl rounded-b-lg border border-gray-200 p-4 z-50 transition-all duration-150 w-[280px] sm:w-[380px] max-w-[90vw] ${
                activeDropdown === 'purchases' ? 'block opacity-100' : 'hidden group-hover:block'
              }`}>
                <div className="grid grid-cols-2 gap-4">
                  {/* Column 1: Nhà cung cấp */}
                  <div className="pr-3 border-r border-gray-100">
                    <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2.5">
                      Nhà cung cấp
                    </div>
                    <button
                      onClick={() => handleSelect('suppliers')}
                      className="w-full text-left text-xs font-medium text-gray-800 hover:text-[#1e0b54] hover:bg-indigo-50/70 px-2.5 py-2 rounded transition-colors block"
                    >
                      Nhà cung cấp
                    </button>
                  </div>

                  {/* Column 2: Mua hàng */}
                  <div className="pl-1">
                    <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2.5">
                      Mua hàng
                    </div>
                    <div className="space-y-1">
                      <button
                        onClick={() => handleSelect('purchases')}
                        className="w-full text-left text-xs font-medium text-gray-800 hover:text-[#1e0b54] hover:bg-indigo-50/70 px-2.5 py-2 rounded transition-colors block"
                      >
                        Nhập hàng
                      </button>
                      <button
                        onClick={() => handleSelect('purchase-returns')}
                        className="w-full text-left text-xs font-medium text-gray-800 hover:text-[#1e0b54] hover:bg-indigo-50/70 px-2.5 py-2 rounded transition-colors block"
                      >
                        Trả hàng nhập
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

          {/* Đơn hàng (With Submenu) */}
          <div 
            className="relative group"
            onMouseEnter={() => setActiveDropdown('orders')}
            onMouseLeave={() => setActiveDropdown(null)}
          >
            <button
              onClick={(e) => {
                if (window.innerWidth < 1024) {
                  e.stopPropagation();
                  setActiveDropdown(activeDropdown === 'orders' ? null : 'orders');
                } else {
                  handleSelect('orders');
                }
              }}
              className={`px-3 py-2.5 font-medium text-xs sm:text-sm flex items-center transition-colors ${
                isOrdersActive
                  ? 'bg-[#15073c] text-white border-b-2 border-amber-400'
                  : 'text-indigo-200 hover:text-white hover:bg-white/10'
              }`}
            >
              Đơn hàng
              <ChevronDown className="w-3.5 h-3.5 ml-1 opacity-70 group-hover:opacity-100" />
            </button>

            {/* Submenu Dropdown for Đơn hàng */}
            <div className={`absolute left-0 top-full bg-white text-gray-800 shadow-2xl rounded-b-lg border border-gray-200 p-3 z-50 transition-all duration-150 min-w-[180px] ${
              activeDropdown === 'orders' ? 'block opacity-100' : 'hidden group-hover:block'
            }`}>
              <div className="space-y-1">
                <button
                  onClick={() => handleSelect('orders')}
                  className="w-full text-left text-xs font-medium text-gray-800 hover:text-[#1e0b54] hover:bg-indigo-50/70 px-3 py-2 rounded transition-colors block"
                >
                  Hóa đơn
                </button>
                <button
                  onClick={() => handleSelect('returns')}
                  className="w-full text-left text-xs font-medium text-gray-800 hover:text-[#1e0b54] hover:bg-indigo-50/70 px-3 py-2 rounded transition-colors block"
                >
                  Trả hàng
                </button>
              </div>
            </div>
          </div>

          {/* Khách hàng (With Submenu) */}
          <div 
            className="relative group"
            onMouseEnter={() => setActiveDropdown('customers')}
            onMouseLeave={() => setActiveDropdown(null)}
          >
            <button
              onClick={(e) => {
                if (window.innerWidth < 1024) {
                  e.stopPropagation();
                  setActiveDropdown(activeDropdown === 'customers' ? null : 'customers');
                } else {
                  handleSelect('customers');
                }
              }}
              className={`px-3 py-2.5 font-medium text-xs sm:text-sm flex items-center transition-colors ${
                isCustomersActive
                  ? 'bg-[#15073c] text-white border-b-2 border-amber-400'
                  : 'text-indigo-200 hover:text-white hover:bg-white/10'
              }`}
            >
              Khách hàng
              <ChevronDown className="w-3.5 h-3.5 ml-1 opacity-70 group-hover:opacity-100" />
            </button>

            {/* Submenu Dropdown for Khách hàng */}
            <div className={`absolute left-0 top-full bg-white text-gray-800 shadow-2xl rounded-b-lg border border-gray-200 p-3 z-50 transition-all duration-150 min-w-[180px] ${
              activeDropdown === 'customers' ? 'block opacity-100' : 'hidden group-hover:block'
            }`}>
              <div className="space-y-1">
                <button
                  onClick={() => handleSelect('customers')}
                  className="w-full text-left text-xs font-medium text-gray-800 hover:text-[#1e0b54] hover:bg-indigo-50/70 px-3 py-2 rounded transition-colors block"
                >
                  Khách hàng
                </button>
                <button
                  onClick={() => handleSelect('promotions')}
                  className="w-full text-left text-xs font-medium text-gray-800 hover:text-[#1e0b54] hover:bg-indigo-50/70 px-3 py-2 rounded transition-colors block"
                >
                  Khuyến mãi
                </button>
              </div>
            </div>
          </div>

          {/* Sổ quỹ */}
          <button
            onClick={() => handleSelect('cashbook')}
            className={`px-3 py-2.5 font-medium text-xs sm:text-sm transition-colors ${
              currentView === 'cashbook'
                ? 'bg-[#15073c] text-white border-b-2 border-amber-400'
                : 'text-indigo-200 hover:text-white hover:bg-white/10'
            }`}
          >
            Sổ quỹ
          </button>

          {/* Báo cáo (With Multi-Column Submenu as in Image 4) */}
          <div 
            className="relative group"
            onMouseEnter={() => setActiveDropdown('reports')}
            onMouseLeave={() => setActiveDropdown(null)}
          >
            <button
              onClick={(e) => {
                if (window.innerWidth < 1024) {
                  e.stopPropagation();
                  setActiveDropdown(activeDropdown === 'reports' ? null : 'reports');
                } else {
                  handleSelect('reports');
                }
              }}
              className={`px-3 py-2.5 font-medium text-xs sm:text-sm flex items-center transition-colors ${
                currentView === 'reports'
                  ? 'bg-[#15073c] text-white border-b-2 border-amber-400'
                  : 'text-indigo-200 hover:text-white hover:bg-white/10'
              }`}
            >
              Báo cáo
              <ChevronDown className="w-3.5 h-3.5 ml-1 opacity-70 group-hover:opacity-100" />
            </button>

            {/* Submenu Dropdown for Báo cáo */}
            <div className={`absolute right-0 sm:left-0 top-full bg-white text-gray-800 shadow-2xl rounded-b-lg border border-gray-200 p-4 z-50 transition-all duration-150 w-[280px] sm:w-[420px] max-w-[90vw] ${
              activeDropdown === 'reports' ? 'block opacity-100' : 'hidden group-hover:block'
            }`}>
              <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                Báo cáo
              </div>
              <div className="grid grid-cols-2 gap-x-6 gap-y-1">
                {/* Column 1 */}
                <div className="space-y-0.5">
                  <button
                    onClick={() => handleSelect('reports', 'daily')}
                    className="w-full text-left text-xs font-medium text-gray-800 hover:text-[#1e0b54] hover:bg-indigo-50/70 px-2.5 py-1.5 rounded transition-colors block"
                  >
                    Cuối ngày
                  </button>
                  <button
                    onClick={() => handleSelect('reports', 'sales')}
                    className="w-full text-left text-xs font-medium text-gray-800 hover:text-[#1e0b54] hover:bg-indigo-50/70 px-2.5 py-1.5 rounded transition-colors block"
                  >
                    Bán hàng
                  </button>
                  <button
                    onClick={() => handleSelect('reports')}
                    className="w-full text-left text-xs font-medium text-gray-800 hover:text-[#1e0b54] hover:bg-indigo-50/70 px-2.5 py-1.5 rounded transition-colors block"
                  >
                    Đặt hàng
                  </button>
                  <button
                    onClick={() => handleSelect('reports', 'products')}
                    className="w-full text-left text-xs font-medium text-gray-800 hover:text-[#1e0b54] hover:bg-indigo-50/70 px-2.5 py-1.5 rounded transition-colors block"
                  >
                    Hàng hóa
                  </button>
                  <button
                    onClick={() => handleSelect('reports')}
                    className="w-full text-left text-xs font-medium text-gray-800 hover:text-[#1e0b54] hover:bg-indigo-50/70 px-2.5 py-1.5 rounded transition-colors block"
                  >
                    Khách hàng
                  </button>
                </div>

                {/* Column 2 */}
                <div className="space-y-0.5">
                  <button
                    onClick={() => handleSelect('reports', 'suppliers')}
                    className="w-full text-left text-xs font-medium text-gray-800 hover:text-[#1e0b54] hover:bg-indigo-50/70 px-2.5 py-1.5 rounded transition-colors block"
                  >
                    Nhà cung cấp
                  </button>
                  <button
                    onClick={() => handleSelect('reports')}
                    className="w-full text-left text-xs font-medium text-gray-800 hover:text-[#1e0b54] hover:bg-indigo-50/70 px-2.5 py-1.5 rounded transition-colors block"
                  >
                    Nhân viên
                  </button>
                  <button
                    onClick={() => handleSelect('reports')}
                    className="w-full text-left text-xs font-medium text-gray-800 hover:text-[#1e0b54] hover:bg-indigo-50/70 px-2.5 py-1.5 rounded transition-colors block"
                  >
                    Kênh bán hàng
                  </button>
                  <button
                    onClick={() => handleSelect('reports')}
                    className="w-full text-left text-xs font-medium text-gray-800 hover:text-[#1e0b54] hover:bg-indigo-50/70 px-2.5 py-1.5 rounded transition-colors block"
                  >
                    Tài chính
                  </button>
                </div>
              </div>
            </div>
          </div>

        </nav>
      </div>

        {/* POS Button */}
        <button
          onClick={onOpenPos}
          className="my-1 ml-4 bg-amber-400 hover:bg-amber-500 text-[#1e0b54] font-bold px-4 py-1.5 rounded-md text-sm flex items-center shadow-md transition-all shrink-0 hover:scale-105 active:scale-95"
        >
          <ShoppingCart className="w-4 h-4 mr-2" />
          Bán hàng
        </button>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex sm:hidden">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/50 transition-opacity"
            onClick={() => setMobileMenuOpen(false)}
          />

          {/* Drawer Content */}
          <div className="relative w-4/5 max-w-xs bg-white h-full shadow-2xl flex flex-col z-10">
            {/* Drawer Header */}
            <div className="p-4 bg-[#1e0b54] text-white flex items-center justify-between">
              <Logo className="w-8 h-8" showText variant="white" />
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="p-1 rounded-md hover:bg-white/10 text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Menu Nav Links */}
            <div className="flex-1 overflow-y-auto p-3 space-y-1">
              <button
                onClick={() => handleSelect('dashboard')}
                className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-semibold transition-colors ${
                  currentView === 'dashboard'
                    ? 'bg-[#1e0b54] text-white'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <LayoutDashboard className="w-4 h-4" />
                <span>Tổng quan</span>
              </button>

              <button
                onClick={() => handleSelect('goods')}
                className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-semibold transition-colors ${
                  isGoodsActive
                    ? 'bg-[#1e0b54] text-white'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <Package className="w-4 h-4" />
                <span>Hàng hóa</span>
              </button>

              <button
                onClick={() => handleSelect('purchases')}
                className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-semibold transition-colors ${
                  isPurchasesActive
                    ? 'bg-[#1e0b54] text-white'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <ShoppingBag className="w-4 h-4" />
                <span>Mua hàng</span>
              </button>

              <button
                onClick={() => handleSelect('orders')}
                className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-semibold transition-colors ${
                  isOrdersActive
                    ? 'bg-[#1e0b54] text-white'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <Receipt className="w-4 h-4" />
                <span>Đơn hàng</span>
              </button>

              <button
                onClick={() => handleSelect('customers')}
                className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-semibold transition-colors ${
                  isCustomersActive
                    ? 'bg-[#1e0b54] text-white'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <Users className="w-4 h-4" />
                <span>Khách hàng</span>
              </button>

              <button
                onClick={() => handleSelect('cashbook')}
                className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-semibold transition-colors ${
                  currentView === 'cashbook'
                    ? 'bg-[#1e0b54] text-white'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <Wallet className="w-4 h-4" />
                <span>Sổ quỹ</span>
              </button>

              <button
                onClick={() => handleSelect('reports')}
                className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-semibold transition-colors ${
                  currentView === 'reports'
                    ? 'bg-[#1e0b54] text-white'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <FileText className="w-4 h-4" />
                <span>Báo cáo</span>
              </button>
            </div>

            {/* Bottom POS Button inside Mobile Menu */}
            <div className="p-3 border-t border-gray-200">
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenPos();
                }}
                className="w-full bg-amber-400 hover:bg-amber-500 text-[#1e0b54] font-bold py-2.5 rounded-lg text-sm flex items-center justify-center shadow-md transition-colors"
              >
                <ShoppingCart className="w-4 h-4 mr-2" />
                Bán hàng (POS)
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

