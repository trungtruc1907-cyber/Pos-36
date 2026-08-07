import React, { useState } from 'react';
import { Customer, Supplier, ViewMode } from '../../types';
import { Users, Search, Phone, MapPin, UserPlus, X, Building2, UserCheck, Tag, Mail, Pencil, Trash2, Lock, Edit3 } from 'lucide-react';

interface CustomersModalProps {
  customers: Customer[];
  suppliers?: Supplier[];
  currentView?: ViewMode;
  onSelectView?: (view: ViewMode) => void;
  onAddCustomer: (customer: Customer) => void;
  onAddSupplier?: (supplier: Omit<Supplier, 'id'>) => void;
  onUpdateSupplier?: (id: string, updates: Partial<Supplier>) => void;
  onDeleteSupplier?: (id: string) => void;
}

export const CustomersModal: React.FC<CustomersModalProps> = ({
  customers,
  suppliers = [],
  currentView = 'customers',
  onSelectView,
  onAddCustomer,
  onAddSupplier,
  onUpdateSupplier,
  onDeleteSupplier,
}) => {
  const [search, setSearch] = useState('');
  const [showAdd, setShowAdd] = useState(false);

  // Expanded row state for suppliers
  const [expandedSupplierId, setExpandedSupplierId] = useState<string | null>(null);
  const [supplierDetailTab, setSupplierDetailTab] = useState<'info' | 'history' | 'debt'>('info');

  // Edit supplier state
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);

  // Form states for Customer
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');

  // Form states for Supplier
  const [supplierCode, setSupplierCode] = useState('');
  const [supplierName, setSupplierName] = useState('');
  const [supplierPhone, setSupplierPhone] = useState('');
  const [supplierEmail, setSupplierEmail] = useState('');
  const [supplierDebt, setSupplierDebt] = useState('0');
  const [supplierPurchased, setSupplierPurchased] = useState('0');

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

  // Filter lists based on search
  const filteredCustomers = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.phone.includes(search)
  );

  const filteredSuppliers = suppliers.filter(
    (s) =>
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.code.toLowerCase().includes(search.toLowerCase()) ||
      s.phone.includes(search) ||
      (s.email && s.email.toLowerCase().includes(search.toLowerCase()))
  );

  // Totals for Suppliers
  const totalSupplierDebt = suppliers.reduce((sum, s) => sum + (s.currentDebt || 0), 0);
  const totalSupplierPurchased = suppliers.reduce((sum, s) => sum + (s.totalPurchased || 0), 0);

  const handleSaveCustomer = () => {
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
    setAddress('');
  };

  const handleSaveSupplier = () => {
    if (!supplierName.trim()) return;
    const nextSeq = suppliers.length + 39;
    const code = supplierCode.trim() || `NCC${String(nextSeq).padStart(6, '0')}`;

    if (onAddSupplier) {
      onAddSupplier({
        code,
        name: supplierName.trim(),
        phone: supplierPhone.trim(),
        email: supplierEmail.trim(),
        currentDebt: Number(supplierDebt) || 0,
        totalPurchased: Number(supplierPurchased) || 0,
        address: address.trim(),
        note: '',
      });
    }

    setShowAdd(false);
    setSupplierCode('');
    setSupplierName('');
    setSupplierPhone('');
    setSupplierEmail('');
    setSupplierDebt('0');
    setSupplierPurchased('0');
    setAddress('');
  };

  const handleSaveEditedSupplier = () => {
    if (!editingSupplier || !onUpdateSupplier) return;
    onUpdateSupplier(editingSupplier.id, {
      name: editingSupplier.name,
      code: editingSupplier.code,
      phone: editingSupplier.phone,
      email: editingSupplier.email,
      address: editingSupplier.address,
      currentDebt: Number(editingSupplier.currentDebt) || 0,
      totalPurchased: Number(editingSupplier.totalPurchased) || 0,
      note: editingSupplier.note,
    });
    setEditingSupplier(null);
  };

  const toggleExpandSupplier = (id: string) => {
    if (expandedSupplierId === id) {
      setExpandedSupplierId(null);
    } else {
      setExpandedSupplierId(id);
      setSupplierDetailTab('info');
    }
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
          placeholder={`Tìm kiếm tên, mã, SĐT trong ${headerInfo.title.toLowerCase()}...`}
          className="w-full pl-9 pr-3 py-1.5 text-xs border border-gray-300 rounded focus:outline-none focus:border-[#1e0b54]"
        />
      </div>

      {/* Main Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-x-auto flex-1">
        {currentView === 'suppliers' ? (
          /* Exact Supplier Table layout matching screenshot */
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-[#dbeafe] text-gray-900 font-semibold border-b border-gray-300 text-[11px] select-none">
                <th className="p-2.5 border-r border-gray-300 text-center w-10">
                  <input type="checkbox" className="rounded border-gray-300" />
                </th>
                <th className="p-2.5 border-r border-gray-300 min-w-[120px]">Mã nhà cung cấp</th>
                <th className="p-2.5 border-r border-gray-300 min-w-[180px]">Tên nhà cung cấp</th>
                <th className="p-2.5 border-r border-gray-300 min-w-[120px]">Điện thoại</th>
                <th className="p-2.5 border-r border-gray-300 min-w-[120px]">Email</th>
                <th className="p-2.5 border-r border-gray-300 text-right min-w-[140px]">Nợ cần trả hiện tại</th>
                <th className="p-2.5 text-right min-w-[140px]">Tổng mua</th>
              </tr>
              {/* Top Summary Row matching reference image */}
              <tr className="bg-white border-b border-gray-200 font-bold text-gray-900 text-xs">
                <td className="p-2.5 border-r border-gray-200"></td>
                <td className="p-2.5 border-r border-gray-200"></td>
                <td className="p-2.5 border-r border-gray-200"></td>
                <td className="p-2.5 border-r border-gray-200"></td>
                <td className="p-2.5 border-r border-gray-200"></td>
                <td className="p-2.5 border-r border-gray-200 text-right font-mono font-extrabold text-gray-900">
                  {totalSupplierDebt.toLocaleString('en-US')}
                </td>
                <td className="p-2.5 text-right font-mono font-extrabold text-gray-900">
                  {totalSupplierPurchased.toLocaleString('en-US')}
                </td>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 font-sans">
              {filteredSuppliers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-gray-400 italic">
                    Chưa có thông tin nhà cung cấp nào.
                  </td>
                </tr>
              ) : (
                filteredSuppliers.map((s, idx) => {
                  const isExpanded = expandedSupplierId === s.id;
                  return (
                    <React.Fragment key={s.id}>
                      <tr
                        onClick={() => toggleExpandSupplier(s.id)}
                        className={`cursor-pointer transition-colors ${
                          isExpanded
                            ? 'bg-[#e0f2fe] font-semibold'
                            : idx % 2 === 1
                            ? 'bg-[#f8fafc] hover:bg-[#e0f2fe]'
                            : 'bg-white hover:bg-[#e0f2fe]'
                        }`}
                      >
                        <td className="p-2.5 border-r border-gray-200 text-center" onClick={(e) => e.stopPropagation()}>
                          <input type="checkbox" className="rounded border-gray-300" />
                        </td>
                        <td className="p-2.5 border-r border-gray-200 font-mono text-gray-800 font-medium">
                          {s.code}
                        </td>
                        <td className="p-2.5 border-r border-gray-200 font-medium text-gray-900">
                          {s.name}
                        </td>
                        <td className="p-2.5 border-r border-gray-200 font-mono text-gray-700">
                          {s.phone || ''}
                        </td>
                        <td className="p-2.5 border-r border-gray-200 text-gray-600">
                          {s.email || ''}
                        </td>
                        <td className="p-2.5 border-r border-gray-200 text-right font-mono font-medium text-gray-900">
                          {s.currentDebt ? s.currentDebt.toLocaleString('en-US') : '0'}
                        </td>
                        <td className="p-2.5 text-right font-mono font-medium text-gray-900">
                          {s.totalPurchased ? s.totalPurchased.toLocaleString('en-US') : '0'}
                        </td>
                      </tr>

                      {/* Expanded Row Detail View matching screenshot */}
                      {isExpanded && (
                        <tr>
                          <td colSpan={7} className="p-0 bg-[#f8fafc] border-b-2 border-blue-200">
                            {/* Inner Header Tabs */}
                            <div className="flex border-b border-gray-200 bg-white px-6 pt-3 text-xs font-semibold text-gray-600">
                              <button
                                onClick={() => setSupplierDetailTab('info')}
                                className={`pb-2.5 px-3 border-b-2 transition-colors ${
                                  supplierDetailTab === 'info'
                                    ? 'border-blue-600 text-blue-600 font-bold'
                                    : 'border-transparent hover:text-gray-900'
                                }`}
                              >
                                Thông tin
                              </button>
                              <button
                                onClick={() => setSupplierDetailTab('history')}
                                className={`pb-2.5 px-3 border-b-2 transition-colors ${
                                  supplierDetailTab === 'history'
                                    ? 'border-blue-600 text-blue-600 font-bold'
                                    : 'border-transparent hover:text-gray-900'
                                }`}
                              >
                                Lịch sử nhập/trả hàng
                              </button>
                              <button
                                onClick={() => setSupplierDetailTab('debt')}
                                className={`pb-2.5 px-3 border-b-2 transition-colors ${
                                  supplierDetailTab === 'debt'
                                    ? 'border-blue-600 text-blue-600 font-bold'
                                    : 'border-transparent hover:text-gray-900'
                                }`}
                              >
                                Nợ cần trả nhà cung cấp
                              </button>
                            </div>

                            {/* Tab Content */}
                            {supplierDetailTab === 'info' && (
                              <div className="p-6 bg-white space-y-6">
                                {/* Title and Header metadata */}
                                <div className="flex justify-between items-start">
                                  <div>
                                    <div className="flex items-center space-x-2">
                                      <h3 className="text-base font-bold text-gray-900">{s.name}</h3>
                                      <span className="text-xs font-mono text-gray-500 font-medium">{s.code}</span>
                                    </div>
                                    <div className="flex items-center space-x-3 text-xs text-gray-500 mt-2">
                                      <span>Người tạo: <strong className="text-gray-700 font-semibold">Chống Thấm 36</strong></span>
                                      <span className="text-gray-300">|</span>
                                      <span>
                                        Ngày tạo:{' '}
                                        <strong className="text-gray-700 font-semibold">
                                          {s.createdAt ? new Date(s.createdAt).toLocaleDateString('vi-VN') : '27/06/2026'}
                                        </strong>
                                      </span>
                                      <span className="text-gray-300">|</span>
                                      <span>Nhóm nhà cung cấp: <strong className="text-gray-400 font-normal">Chưa có</strong></span>
                                    </div>
                                  </div>
                                  <div className="text-xs font-semibold text-gray-600">
                                    Tổng Kho Chống Thấm 36
                                  </div>
                                </div>

                                {/* Main Fields */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-12 text-xs border-t border-b border-gray-100 py-4">
                                  <div className="space-y-3">
                                    <div>
                                      <span className="block text-gray-500 mb-1">Điện thoại</span>
                                      <span className={`font-mono text-xs ${s.phone ? 'text-gray-900 font-semibold' : 'text-gray-400 font-normal'}`}>
                                        {s.phone || 'Chưa có'}
                                      </span>
                                    </div>
                                    <div>
                                      <span className="block text-gray-500 mb-1">Địa chỉ</span>
                                      <span className={`text-xs ${s.address ? 'text-gray-800' : 'text-gray-400'}`}>
                                        {s.address || 'Chưa có'}
                                      </span>
                                    </div>
                                  </div>

                                  <div className="space-y-3">
                                    <div>
                                      <span className="block text-gray-500 mb-1">Email</span>
                                      <span className={`text-xs ${s.email ? 'text-gray-900 font-medium' : 'text-gray-400'}`}>
                                        {s.email || 'Chưa có'}
                                      </span>
                                    </div>
                                  </div>
                                </div>

                                {/* Additional links & notes */}
                                <div className="space-y-2 text-xs">
                                  <button
                                    onClick={() => alert('Thêm thông tin xuất hóa đơn')}
                                    className="text-blue-600 hover:underline font-medium block"
                                  >
                                    Thêm thông tin xuất hóa đơn
                                  </button>

                                  <div className="flex items-center text-gray-500 pt-1">
                                    <Edit3 className="w-3.5 h-3.5 mr-1.5 text-gray-400" />
                                    <span>{s.note ? s.note : 'Chưa có ghi chú'}</span>
                                  </div>
                                </div>

                                {/* Action Buttons */}
                                <div className="flex justify-between items-center pt-4 border-t border-gray-100">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      if (window.confirm(`Bạn có chắc chắn muốn xóa nhà cung cấp "${s.name}" (${s.code})?`)) {
                                        if (onDeleteSupplier) onDeleteSupplier(s.id);
                                        setExpandedSupplierId(null);
                                      }
                                    }}
                                    className="flex items-center px-3 py-1.5 text-xs text-gray-600 hover:text-red-600 hover:bg-red-50 border border-gray-300 rounded transition-colors"
                                  >
                                    <Trash2 className="w-3.5 h-3.5 mr-1.5" />
                                    Xóa
                                  </button>

                                  <div className="flex items-center space-x-2">
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setEditingSupplier(s);
                                      }}
                                      className="flex items-center px-4 py-1.5 text-xs font-bold text-white bg-[#0066ff] hover:bg-blue-700 rounded shadow-xs transition-colors"
                                    >
                                      <Pencil className="w-3.5 h-3.5 mr-1.5" />
                                      Chỉnh sửa
                                    </button>

                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        alert(`Đã cập nhật trạng thái nhà cung cấp ${s.name}`);
                                      }}
                                      className="flex items-center px-3 py-1.5 text-xs font-medium text-gray-700 bg-white hover:bg-gray-50 border border-gray-300 rounded shadow-xs transition-colors"
                                    >
                                      <Lock className="w-3.5 h-3.5 mr-1.5 text-gray-500" />
                                      Ngừng hoạt động
                                    </button>
                                  </div>
                                </div>
                              </div>
                            )}

                            {supplierDetailTab === 'history' && (
                              <div className="p-4 bg-white">
                                <table className="w-full text-left text-xs border border-gray-200">
                                  <thead className="bg-gray-50 text-gray-600 font-bold border-b border-gray-200">
                                    <tr>
                                      <th className="p-2.5">Mã phiếu</th>
                                      <th className="p-2.5">Thời gian</th>
                                      <th className="p-2.5">Người tạo</th>
                                      <th className="p-2.5 text-right">Tổng tiền (VNĐ)</th>
                                      <th className="p-2.5 text-center">Trạng thái</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-gray-100">
                                    {s.totalPurchased > 0 ? (
                                      <tr className="hover:bg-gray-50">
                                        <td className="p-2.5 font-mono text-blue-600 font-bold">
                                          PN0000{String((s.id.charCodeAt(0) % 90) + 10)}
                                        </td>
                                        <td className="p-2.5 font-mono text-gray-600">27/06/2026 10:30</td>
                                        <td className="p-2.5 text-gray-800 font-medium">Chống Thấm 36</td>
                                        <td className="p-2.5 text-right font-mono font-bold text-gray-900">
                                          {s.totalPurchased.toLocaleString('vi-VN')}đ
                                        </td>
                                        <td className="p-2.5 text-center">
                                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-green-100 text-green-800">
                                            Đã nhập hàng
                                          </span>
                                        </td>
                                      </tr>
                                    ) : (
                                      <tr>
                                        <td colSpan={5} className="text-center py-6 text-gray-400 italic">
                                          Chưa có lịch sử nhập/trả hàng đối với nhà cung cấp này.
                                        </td>
                                      </tr>
                                    )}
                                  </tbody>
                                </table>
                              </div>
                            )}

                            {supplierDetailTab === 'debt' && (
                              <div className="p-4 bg-white">
                                <table className="w-full text-left text-xs border border-gray-200">
                                  <thead className="bg-gray-50 text-gray-600 font-bold border-b border-gray-200">
                                    <tr>
                                      <th className="p-2.5">Mã chứng từ</th>
                                      <th className="p-2.5">Thời gian</th>
                                      <th className="p-2.5">Loại</th>
                                      <th className="p-2.5 text-right">Giá trị (VNĐ)</th>
                                      <th className="p-2.5 text-right">Nợ cần trả (VNĐ)</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-gray-100">
                                    {s.currentDebt > 0 ? (
                                      <tr className="hover:bg-gray-50">
                                        <td className="p-2.5 font-mono text-blue-600 font-bold">
                                          PN0000{String((s.id.charCodeAt(0) % 90) + 10)}
                                        </td>
                                        <td className="p-2.5 font-mono text-gray-600">27/06/2026 10:30</td>
                                        <td className="p-2.5 text-gray-800 font-medium">Phiếu nhập hàng chưa thanh toán đủ</td>
                                        <td className="p-2.5 text-right font-mono font-bold text-gray-900">
                                          {s.totalPurchased.toLocaleString('vi-VN')}đ
                                        </td>
                                        <td className="p-2.5 text-right font-mono font-extrabold text-red-600">
                                          {s.currentDebt.toLocaleString('vi-VN')}đ
                                        </td>
                                      </tr>
                                    ) : (
                                      <tr>
                                        <td colSpan={5} className="text-center py-6 text-gray-400 italic">
                                          Không có nợ cần trả đối với nhà cung cấp này.
                                        </td>
                                      </tr>
                                    )}
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
        ) : (
          /* Standard Customer / Employee Table */
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100 border-b text-gray-600 font-bold uppercase text-[11px]">
              <tr>
                <th className="p-3">Tên {currentView === 'employees' ? 'Nhân viên' : 'Khách hàng'}</th>
                <th className="p-3">Số điện thoại</th>
                <th className="p-3">Khu vực / Địa chỉ</th>
                <th className="p-3 text-center">Số giao dịch</th>
                <th className="p-3 text-right">Tổng giá trị</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredCustomers.map((c) => (
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
        )}
      </div>

      {/* Edit Supplier Modal */}
      {editingSupplier && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-5 max-w-md w-full space-y-3">
            <div className="flex justify-between items-center border-b pb-2">
              <h3 className="font-bold text-[#1e0b54] text-sm">Chỉnh sửa Nhà cung cấp</h3>
              <button onClick={() => setEditingSupplier(null)}>
                <X className="w-4 h-4 text-gray-400 hover:text-gray-600" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-gray-700 font-semibold mb-1">Mã nhà cung cấp</label>
                <input
                  type="text"
                  value={editingSupplier.code}
                  onChange={(e) => setEditingSupplier({ ...editingSupplier, code: e.target.value })}
                  className="w-full p-2 border rounded focus:outline-none focus:border-[#1e0b54]"
                />
              </div>

              <div>
                <label className="block text-gray-700 font-semibold mb-1">Tên nhà cung cấp *</label>
                <input
                  type="text"
                  value={editingSupplier.name}
                  onChange={(e) => setEditingSupplier({ ...editingSupplier, name: e.target.value })}
                  className="w-full p-2 border rounded focus:outline-none focus:border-[#1e0b54]"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-gray-700 font-semibold mb-1">Điện thoại</label>
                  <input
                    type="text"
                    value={editingSupplier.phone || ''}
                    onChange={(e) => setEditingSupplier({ ...editingSupplier, phone: e.target.value })}
                    className="w-full p-2 border rounded focus:outline-none focus:border-[#1e0b54]"
                  />
                </div>
                <div>
                  <label className="block text-gray-700 font-semibold mb-1">Email</label>
                  <input
                    type="email"
                    value={editingSupplier.email || ''}
                    onChange={(e) => setEditingSupplier({ ...editingSupplier, email: e.target.value })}
                    className="w-full p-2 border rounded focus:outline-none focus:border-[#1e0b54]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-gray-700 font-semibold mb-1">Nợ cần trả hiện tại (VNĐ)</label>
                  <input
                    type="number"
                    value={editingSupplier.currentDebt || 0}
                    onChange={(e) => setEditingSupplier({ ...editingSupplier, currentDebt: Number(e.target.value) })}
                    className="w-full p-2 border rounded focus:outline-none focus:border-[#1e0b54]"
                  />
                </div>
                <div>
                  <label className="block text-gray-700 font-semibold mb-1">Tổng mua (VNĐ)</label>
                  <input
                    type="number"
                    value={editingSupplier.totalPurchased || 0}
                    onChange={(e) => setEditingSupplier({ ...editingSupplier, totalPurchased: Number(e.target.value) })}
                    className="w-full p-2 border rounded focus:outline-none focus:border-[#1e0b54]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-gray-700 font-semibold mb-1">Địa chỉ</label>
                <input
                  type="text"
                  value={editingSupplier.address || ''}
                  onChange={(e) => setEditingSupplier({ ...editingSupplier, address: e.target.value })}
                  className="w-full p-2 border rounded focus:outline-none focus:border-[#1e0b54]"
                />
              </div>

              <div>
                <label className="block text-gray-700 font-semibold mb-1">Ghi chú</label>
                <textarea
                  rows={2}
                  value={editingSupplier.note || ''}
                  onChange={(e) => setEditingSupplier({ ...editingSupplier, note: e.target.value })}
                  className="w-full p-2 border rounded focus:outline-none focus:border-[#1e0b54]"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-3 border-t">
              <button
                onClick={() => setEditingSupplier(null)}
                className="px-3 py-1.5 border rounded text-xs text-gray-600 hover:bg-gray-100"
              >
                Hủy
              </button>
              <button
                onClick={handleSaveEditedSupplier}
                className="px-4 py-1.5 bg-[#0066ff] hover:bg-blue-700 text-white rounded text-xs font-bold transition-colors"
              >
                Cập nhật cơ sở dữ liệu
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Modal */}
      {showAdd && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-5 max-w-md w-full space-y-3">
            <div className="flex justify-between items-center border-b pb-2">
              <h3 className="font-bold text-[#1e0b54] text-sm">{headerInfo.btnText}</h3>
              <button onClick={() => setShowAdd(false)}>
                <X className="w-4 h-4 text-gray-400 hover:text-gray-600" />
              </button>
            </div>

            {currentView === 'suppliers' ? (
              /* Add Supplier Form */
              <div className="space-y-3 text-xs">
                <div>
                  <label className="block text-gray-700 font-semibold mb-1">Mã nhà cung cấp (tự động nếu để trống)</label>
                  <input
                    type="text"
                    placeholder="VD: NCC000049"
                    value={supplierCode}
                    onChange={(e) => setSupplierCode(e.target.value)}
                    className="w-full p-2 border rounded focus:outline-none focus:border-[#1e0b54]"
                  />
                </div>

                <div>
                  <label className="block text-gray-700 font-semibold mb-1">Tên nhà cung cấp *</label>
                  <input
                    type="text"
                    placeholder="VD: Công ty Hóa chất ABC"
                    value={supplierName}
                    onChange={(e) => setSupplierName(e.target.value)}
                    className="w-full p-2 border rounded focus:outline-none focus:border-[#1e0b54]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-gray-700 font-semibold mb-1">Điện thoại</label>
                    <input
                      type="text"
                      placeholder="0912345678"
                      value={supplierPhone}
                      onChange={(e) => setSupplierPhone(e.target.value)}
                      className="w-full p-2 border rounded focus:outline-none focus:border-[#1e0b54]"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-700 font-semibold mb-1">Email</label>
                    <input
                      type="email"
                      placeholder="supplier@example.com"
                      value={supplierEmail}
                      onChange={(e) => setSupplierEmail(e.target.value)}
                      className="w-full p-2 border rounded focus:outline-none focus:border-[#1e0b54]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-gray-700 font-semibold mb-1">Nợ cần trả hiện tại (VNĐ)</label>
                    <input
                      type="number"
                      placeholder="0"
                      value={supplierDebt}
                      onChange={(e) => setSupplierDebt(e.target.value)}
                      className="w-full p-2 border rounded focus:outline-none focus:border-[#1e0b54]"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-700 font-semibold mb-1">Tổng mua (VNĐ)</label>
                    <input
                      type="number"
                      placeholder="0"
                      value={supplierPurchased}
                      onChange={(e) => setSupplierPurchased(e.target.value)}
                      className="w-full p-2 border rounded focus:outline-none focus:border-[#1e0b54]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-gray-700 font-semibold mb-1">Địa chỉ</label>
                  <input
                    type="text"
                    placeholder="Địa chỉ nhà cung cấp"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="w-full p-2 border rounded focus:outline-none focus:border-[#1e0b54]"
                  />
                </div>
              </div>
            ) : (
              /* Add Customer Form */
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
            )}

            <div className="flex justify-end space-x-2 pt-3 border-t">
              <button
                onClick={() => setShowAdd(false)}
                className="px-3 py-1.5 border rounded text-xs text-gray-600 hover:bg-gray-100"
              >
                Hủy
              </button>
              <button
                onClick={currentView === 'suppliers' ? handleSaveSupplier : handleSaveCustomer}
                className="px-4 py-1.5 bg-[#1e0b54] hover:bg-[#15073c] text-white rounded text-xs font-bold transition-colors"
              >
                Lưu vào cơ sở dữ liệu
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

