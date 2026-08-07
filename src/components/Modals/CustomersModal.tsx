import React, { useState } from 'react';
import { Customer } from '../../types';
import { Users, Search, Phone, MapPin, Plus, UserPlus, X } from 'lucide-react';

interface CustomersModalProps {
  customers: Customer[];
  onAddCustomer: (customer: Customer) => void;
}

export const CustomersModal: React.FC<CustomersModalProps> = ({ customers, onAddCustomer }) => {
  const [search, setSearch] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');

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
      <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-100 flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <Users className="w-6 h-6 text-[#1e0b54]" />
          <div>
            <h2 className="text-base font-extrabold text-gray-900">Danh sách Khách hàng</h2>
            <p className="text-xs text-gray-500">Quản lý đối tác & nhà thầu xây dựng</p>
          </div>
        </div>

        <button
          onClick={() => setShowAdd(true)}
          className="bg-[#1e0b54] text-white font-bold px-3 py-1.5 rounded text-xs flex items-center"
        >
          <UserPlus className="w-4 h-4 mr-1 text-amber-400" />
          Thêm Khách hàng
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-sm p-3 border border-gray-100 relative">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Tìm tên khách hàng hoặc SĐT..."
          className="w-full pl-9 pr-3 py-1.5 text-xs border border-gray-300 rounded focus:outline-none focus:border-[#1e0b54]"
        />
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden flex-1">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-100 border-b text-gray-600 font-bold uppercase text-[11px]">
            <tr>
              <th className="p-3">Tên Khách hàng</th>
              <th className="p-3">Số điện thoại</th>
              <th className="p-3">Khu vực / Địa chỉ</th>
              <th className="p-3 text-center">Số đơn</th>
              <th className="p-3 text-right">Tổng chi tiêu</th>
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
              <h3 className="font-bold text-[#1e0b54] text-xs">Thêm Khách hàng</h3>
              <button onClick={() => setShowAdd(false)}>
                <X className="w-4 h-4 text-gray-400" />
              </button>
            </div>
            <div className="space-y-2 text-xs">
              <input
                type="text"
                placeholder="Tên khách hàng *"
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
