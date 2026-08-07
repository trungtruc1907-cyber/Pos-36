import React from 'react';
import { ViewMode } from '../types';
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
  ChevronDown 
} from 'lucide-react';

interface HeaderProps {
  currentView: ViewMode;
  onSelectView: (view: ViewMode) => void;
  onOpenPos: () => void;
  unreadNotifications: number;
}

export const Header: React.FC<HeaderProps> = ({
  currentView,
  onSelectView,
  onOpenPos,
  unreadNotifications,
}) => {
  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-40 shadow-sm">
      {/* Top Header Row */}
      <div className="flex items-center justify-between px-4 py-2 text-sm">
        {/* Left: Brand Logo & Search */}
        <div className="flex items-center space-x-4">
          <div 
            onClick={() => onSelectView('dashboard')}
            className="flex items-center space-x-2 cursor-pointer group"
          >
            {/* Maritime / Sail Logo style matching Chống Thấm 36 */}
            <div className="w-10 h-10 bg-[#1e0b54] rounded-lg flex items-center justify-center text-white font-bold text-lg shadow-sm group-hover:scale-105 transition-transform">
              <span className="text-amber-400 font-extrabold tracking-tighter">CT36</span>
            </div>
            <div className="hidden sm:block">
              <div className="font-extrabold text-[#1e0b54] leading-none text-base">CHỐNG THẤM 36</div>
              <div className="text-[10px] text-gray-500 tracking-wider">HỆ THỐNG PHÂN PHỐI</div>
            </div>
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

          <button title="Giao diện" className="hidden sm:block hover:text-[#1e0b54] p-1">
            <Palette className="w-4 h-4" />
          </button>

          <button title="Trò chuyện" className="hidden sm:block hover:text-[#1e0b54] p-1">
            <MessageSquare className="w-4 h-4" />
          </button>

          <button title="Hỗ trợ" className="hidden sm:block hover:text-[#1e0b54] p-1">
            <Headphones className="w-4 h-4" />
          </button>

          <button className="flex items-center hover:text-[#1e0b54] text-xs font-medium">
            <span className="w-5 h-3.5 mr-1 bg-red-600 rounded-[1px] inline-flex items-center justify-center text-[8px] text-yellow-300 font-bold">★</span>
            <span className="hidden sm:inline">Tiếng Việt</span>
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
      <div className="bg-[#1e0b54] px-4 flex items-center justify-between text-white overflow-x-auto scrollbar-hide">
        <nav className="flex space-x-1 min-w-max">
          <button
            onClick={() => onSelectView('dashboard')}
            className={`px-3 py-2.5 font-medium text-sm rounded-t-md transition-colors ${
              currentView === 'dashboard'
                ? 'bg-[#15073c] text-white border-b-2 border-amber-400'
                : 'text-indigo-200 hover:text-white hover:bg-white/10'
            }`}
          >
            Tổng quan
          </button>

          <button
            onClick={() => onSelectView('goods')}
            className={`px-3 py-2.5 font-medium text-sm transition-colors ${
              currentView === 'goods'
                ? 'bg-[#15073c] text-white border-b-2 border-amber-400'
                : 'text-indigo-200 hover:text-white hover:bg-white/10'
            }`}
          >
            Hàng hóa
          </button>

          <button
            onClick={() => onSelectView('goods')}
            className="px-3 py-2.5 font-medium text-sm text-indigo-200 hover:text-white hover:bg-white/10 transition-colors"
          >
            Mua hàng
          </button>

          <button
            onClick={() => onSelectView('orders')}
            className={`px-3 py-2.5 font-medium text-sm transition-colors ${
              currentView === 'orders'
                ? 'bg-[#15073c] text-white border-b-2 border-amber-400'
                : 'text-indigo-200 hover:text-white hover:bg-white/10'
            }`}
          >
            Đơn hàng
          </button>

          <button
            onClick={() => onSelectView('customers')}
            className={`px-3 py-2.5 font-medium text-sm transition-colors ${
              currentView === 'customers'
                ? 'bg-[#15073c] text-white border-b-2 border-amber-400'
                : 'text-indigo-200 hover:text-white hover:bg-white/10'
            }`}
          >
            Khách hàng
          </button>

          <button
            onClick={() => onSelectView('dashboard')}
            className="px-3 py-2.5 font-medium text-sm text-indigo-200 hover:text-white hover:bg-white/10 transition-colors"
          >
            Nhân viên
          </button>

          <button
            onClick={() => onSelectView('cashbook')}
            className={`px-3 py-2.5 font-medium text-sm transition-colors ${
              currentView === 'cashbook'
                ? 'bg-[#15073c] text-white border-b-2 border-amber-400'
                : 'text-indigo-200 hover:text-white hover:bg-white/10'
            }`}
          >
            Sổ quỹ
          </button>

          <button
            onClick={() => onSelectView('reports')}
            className={`px-3 py-2.5 font-medium text-sm transition-colors ${
              currentView === 'reports'
                ? 'bg-[#15073c] text-white border-b-2 border-amber-400'
                : 'text-indigo-200 hover:text-white hover:bg-white/10'
            }`}
          >
            Báo cáo
          </button>

          <button
            onClick={() => onSelectView('online')}
            className="px-3 py-2.5 font-medium text-sm text-indigo-200 hover:text-white hover:bg-white/10 transition-colors"
          >
            Bán online
          </button>

          <button
            onClick={() => onSelectView('tax')}
            className="px-3 py-2.5 font-medium text-sm text-indigo-200 hover:text-white hover:bg-white/10 transition-colors relative"
          >
            Thuế & Kế toán
            <span className="absolute top-1 right-0 bg-red-500 text-white text-[9px] font-bold px-1 rounded transform translate-x-1 -translate-y-1">
              Mới
            </span>
          </button>
        </nav>

        {/* POS Button */}
        <button
          onClick={onOpenPos}
          className="my-1 ml-4 bg-amber-400 hover:bg-amber-500 text-[#1e0b54] font-bold px-4 py-1.5 rounded-md text-sm flex items-center shadow-md transition-all shrink-0 hover:scale-105 active:scale-95"
        >
          <ShoppingCart className="w-4 h-4 mr-2" />
          Bán hàng
        </button>
      </div>
    </header>
  );
};
