import React, { useState } from 'react';
import { Customer, ViewMode } from '../../types';
import { Users, Search, Phone, MapPin, UserPlus, X, Building2, UserCheck, Tag } from 'lucide-react';

interface CustomersModalProps {
  customers: Customer[];
  currentView?: ViewMode;
  onSelectView?: (view: ViewMode) => void;
  onAddCustomer: (customer: Customer) => void;
}

export const CustomersModal: React.FC<CustomersModalProps> = ({
  customers,
  currentView = 'customers',
  onSelectView,
  onAddCustomer,
}) => {
  const [search, setSearch] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');

  const getHeaderInfo = () => {
    switch (currentView) {
      case 'suppliers':
        return {
          title: 'Danh sách Nhà cung cấp',
          subtitle: 'Quản lý đối tác nhà cung cấp vật tư & hóa chất Chống Thấm 36',
          icon: Building2,
          btnText: 'Thêm Nhà cung cấp',
        };
      case 'employees':
        return {
          title: 'Danh sách Nhân viên',
          subtitle: 'Quản lý thông tin nhân viên cửa hàng & phân quyền',
          icon: UserCheck,
          btnText: 'Thêm Nhân viên',
        };
      case 'promotions':
        return {
          title: 'Chương trình Khuyến mãi',
          subtitle: 'Quản lý các chính sách ưu đãi, bảng giá & đợt giảm giá',
          icon: Tag,
          btnText: 'Tạo Khuyến mãi',
        };
      case 'customers':
      default:
        return {
          title: 'Danh sách Khách hàng',
          subtitle: 'Quản lý khách hàng, nhà thầu & đại lý phân phối',
          icon: Users,
          btnText: 'Thêm Khách hàng',
        };
    }
  };

  const headerInfo = getHeaderInfo();
  const IconComponent = headerInfo.icon;

  const filtered = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.phone.includes(search)
  );

  const handleSave = () => {
    if (!name.trim()) return;
    onAddCustomer({
      id: `c-${Date.now()}`,
      name: name.trim(),
      phone: phone.trim(),
      address: address.trim(),
      totalSpent: 0,
      orderCount: 0,
    });
    setShowAdd(false);
    setName('');
    setPhone('');
  };

  return (
    <div className="flex-1 bg-[#f3f4f6] p-4 flex flex-col space-y-4 overflow-auto">
      {/* Top Header Row */}
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
          {onSelectView && (
            <div className="flex items-center space-x-1 bg-gray-100 p-1 rounded-lg border border-gray-200 text-xs font-medium">
              <button
                onClick={() => onSelectView('customers')}
                className={`px-3 py-1.5 rounded-md transition-colors ${
                  currentView === 'customers'
                    ? 'bg-[#1e0b54] text-white font-bold shadow-xs'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200'
                }`}
              >
                Khách hàng
              </button>
              <button
                onClick={() => onSelectView('suppliers')}
                className={`px-3 py-1.5 rounded-md transition-colors ${
                  currentView === 'suppliers'
                    ? 'bg-[#1e0b54] text-white font-bold shadow-xs'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200'
                }`}
              >
                Nhà cung cấp
              </button>
              <button
                onClick={() => onSelectView('employees')}
                className={`px-3 py-1.5 rounded-md transition-colors ${
                  currentView === 'employees'
                    ? 'bg-[#1e0b54] text-white font-bold shadow-xs'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200'
                }`}
              >
                Nhân viên
              </button>
              <button
                onClick={() => onSelectView('promotions')}
                className={`px-3 py-1.5 rounded-md transition-colors ${
                  currentView === 'promotions'
                    ? 'bg-[#1e0b54] text-white font-bold shadow-xs'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200'
                }`}
              >
                Khuyến mãi
              </button>
            </div>
          )}

          <button
            onClick={() => setShowAdd(true)}
            className="bg-[#1e0b54] hover:bg-[#15073c] text-white font-bold px-3.5 py-2 rounded-md text-xs flex items-center shadow-md transition-colors"
          >
            <UserPlus className="w-4 h-4 mr-1.5 text-amber-400" />
            {headerInfo.btnText}
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white rounded-lg shadow-sm p-3 border border-gray-100 relative">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={`Tìm kiếm tên hoặc SĐT trong ${headerInfo.title.toLowerCase()}...`}
          className="w-full pl-9 pr-3 py-1.5 text-xs border border-gray-300 rounded focus:outline-none focus:border-[#1e0b54]"
        />
      </div>

      {/* Main Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden flex-1">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-100 border-b text-gray-600 font-bold uppercase text-[11px]">
            <tr>
              <th className="p-3">Tên {currentView === 'suppliers' ? 'Nhà cung cấp' : currentView === 'employees' ? 'Nhân viên' : 'Khách hàng'}</th>
              <th className="p-3">Số điện thoại</th>
              <th className="p-3">Khu vực / Địa chỉ</th>
              <th className="p-3 text-center">Số giao dịch</th>
              <th className="p-3 text-right">Tổng giá trị</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filtered.map((c) => (
              <tr key={c.id} className="hover:bg-slate-50 transition-colors">
                <td className="p-3 font-bold text-gray-900">{c.name}</td>
                <td className="p-3 font-mono text-gray-600">
                  {c.phone ? (
                    <span className="flex items-center">
                      <Phone className="w-3 h-3 mr-1 text-gray-400" />
                      {c.phone}
                    </span>
                  ) : (
                    '-'
                  )}
                </td>
                <td className="p-3 text-gray-500">
                  {c.address ? (
                    <span className="flex items-center">
                      <MapPin className="w-3 h-3 mr-1 text-gray-400" />
                      {c.address}
                    </span>
                  ) : (
                    '-'
                  )}
                </td>
                <td className="p-3 text-center font-bold">{c.orderCount}</td>
                <td className="p-3 text-right font-extrabold text-[#1e0b54] font-mono">
                  {c.totalSpent.toLocaleString('vi-VN')}đ
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showAdd && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-5 max-w-sm w-full space-y-3">
            <div className="flex justify-between items-center border-b pb-2">
              <h3 className="font-bold text-[#1e0b54] text-xs">{headerInfo.btnText}</h3>
              <button onClick={() => setShowAdd(false)}>
                <X className="w-4 h-4 text-gray-400" />
              </button>
            </div>
            <div className="space-y-2 text-xs">
              <input
                type="text"
                placeholder="Tên *"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full p-2 border rounded"
              />
              <input
                type="text"
                placeholder="SĐT"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full p-2 border rounded"
              />
              <input
                type="text"
                placeholder="Địa chỉ"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full p-2 border rounded"
              />
            </div>
            <div className="flex justify-end space-x-2 pt-2 border-t">
              <button
                onClick={() => setShowAdd(false)}
                className="px-3 py-1 border rounded text-xs"
              >
                Hủy
              </button>
              <button
                onClick={handleSave}
                className="px-4 py-1 bg-[#1e0b54] text-white rounded text-xs font-bold"
              >
                Lưu
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
