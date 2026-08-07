import React, { useState } from 'react';
import { Product } from '../../types';
import { Search, Plus, Edit, Package, X, Filter } from 'lucide-react';

interface GoodsModalProps {
  products: Product[];
  onAddProduct: (product: Product) => void;
  onUpdateProduct: (product: Product) => void;
}

export const GoodsModal: React.FC<GoodsModalProps> = ({
  products,
  onAddProduct,
  onUpdateProduct,
}) => {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('Tất cả');
  const [showAddModal, setShowAddModal] = useState(false);

  // Form states
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [unit, setUnit] = useState('Bộ');
  const [price, setPrice] = useState(0);
  const [costPrice, setCostPrice] = useState(0);
  const [stock, setStock] = useState(50);
  const [category, setCategory] = useState('Chống thấm xi măng');

  const categories = ['Tất cả', ...Array.from(new Set(products.map((p) => p.category)))];

  const filtered = products.filter((p) => {
    const matchCat = selectedCategory === 'Tất cả' || p.category === selectedCategory;
    const matchQuery =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.code.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchQuery;
  });

  const handleSaveProduct = () => {
    if (!name.trim() || !code.trim()) return;
    const newP: Product = {
      id: `p-${Date.now()}`,
      code: code.trim(),
      name: name.trim(),
      unit,
      price: Number(price),
      costPrice: Number(costPrice),
      stock: Number(stock),
      category,
    };
    onAddProduct(newP);
    setShowAddModal(false);
    setCode('');
    setName('');
    setPrice(0);
  };

  return (
    <div className="flex-1 bg-[#f3f4f6] p-4 flex flex-col space-y-4 overflow-auto">
      {/* Top Bar Controls */}
      <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div className="flex items-center space-x-2">
          <Package className="w-6 h-6 text-[#1e0b54]" />
          <div>
            <h2 className="text-base font-extrabold text-gray-900">Quản lý Hàng hóa & Kho</h2>
            <p className="text-xs text-gray-500">Tổng số: {products.length} mặt hàng trong danh mục</p>
          </div>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="bg-[#1e0b54] hover:bg-[#15073c] text-white font-bold px-4 py-2 rounded-md text-xs flex items-center shadow-md transition-colors"
        >
          <Plus className="w-4 h-4 mr-1 text-amber-400" />
          Thêm hàng hóa mới
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-100 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm theo mã sản phẩm hoặc tên vật liệu..."
            className="w-full pl-9 pr-3 py-1.5 text-xs border border-gray-300 rounded-md focus:outline-none focus:border-[#1e0b54]"
          />
        </div>

        <div className="flex items-center space-x-2">
          <Filter className="w-4 h-4 text-gray-400" />
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="border border-gray-300 rounded text-xs py-1.5 pl-2 pr-6 bg-white focus:outline-none focus:border-[#1e0b54]"
          >
            {categories.map((cat, idx) => (
              <option key={idx} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden flex-1">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100 border-b text-gray-600 font-bold uppercase text-[11px]">
              <tr>
                <th className="p-3">Mã hàng</th>
                <th className="p-3">Tên sản phẩm</th>
                <th className="p-3">Nhóm hàng</th>
                <th className="p-3 text-center">ĐVT</th>
                <th className="p-3 text-right">Giá bán</th>
                <th className="p-3 text-right">Giá vốn</th>
                <th className="p-3 text-right">Tồn kho</th>
                <th className="p-3 text-center">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                  <td className="p-3 font-mono font-bold text-gray-700">{p.code}</td>
                  <td className="p-3 font-bold text-gray-900">{p.name}</td>
                  <td className="p-3 text-gray-500">{p.category}</td>
                  <td className="p-3 text-center">
                    <span className="bg-indigo-50 text-[#1e0b54] px-2 py-0.5 rounded font-semibold text-[10px]">
                      {p.unit}
                    </span>
                  </td>
                  <td className="p-3 text-right font-extrabold text-[#1e0b54] font-mono">
                    {p.price.toLocaleString('vi-VN')}đ
                  </td>
                  <td className="p-3 text-right text-gray-500 font-mono">
                    {p.costPrice.toLocaleString('vi-VN')}đ
                  </td>
                  <td className="p-3 text-right font-bold">
                    <span
                      className={
                        p.stock < 50 ? 'text-amber-600 font-mono' : 'text-emerald-600 font-mono'
                      }
                    >
                      {p.stock}
                    </span>
                  </td>
                  <td className="p-3 text-center">
                    <button
                      onClick={() => {
                        const newP = prompt('Nhập giá bán mới (VNĐ):', p.price.toString());
                        if (newP && !isNaN(Number(newP))) {
                          onUpdateProduct({ ...p, price: Number(newP) });
                        }
                      }}
                      className="text-blue-600 hover:text-blue-800 p-1 font-semibold text-[11px] hover:underline"
                    >
                      Sửa giá
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Product Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-2xl max-w-md w-full p-5 space-y-3">
            <div className="flex justify-between items-center border-b pb-2">
              <h3 className="font-bold text-[#1e0b54] text-sm">Thêm Hàng hóa Mới</h3>
              <button onClick={() => setShowAddModal(false)}>
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <div>
                <label className="block font-bold text-gray-700 mb-0.5">Mã sản phẩm / SKU</label>
                <input
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="Ví dụ: SK104, SIKA..."
                  className="w-full p-2 border border-gray-300 rounded"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-0.5">Tên sản phẩm vật liệu</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Nhập tên vật liệu..."
                  className="w-full p-2 border border-gray-300 rounded"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-gray-700 mb-0.5">Đơn vị tính (ĐVT)</label>
                  <select
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded"
                  >
                    <option>Bộ</option>
                    <option>Bao</option>
                    <option>cuộn</option>
                    <option>Can</option>
                    <option>Thùng</option>
                    <option>tuýp</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-gray-700 mb-0.5">Nhóm hàng</label>
                  <input
                    type="text"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-gray-700 mb-0.5">Giá bán (VNĐ)</label>
                  <input
                    type="number"
                    value={price}
                    onChange={(e) => setPrice(Number(e.target.value))}
                    className="w-full p-2 border border-gray-300 rounded"
                  />
                </div>
                <div>
                  <label className="block font-bold text-gray-700 mb-0.5">Giá vốn (VNĐ)</label>
                  <input
                    type="number"
                    value={costPrice}
                    onChange={(e) => setCostPrice(Number(e.target.value))}
                    className="w-full p-2 border border-gray-300 rounded"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-0.5">Số lượng tồn ban đầu</label>
                <input
                  type="number"
                  value={stock}
                  onChange={(e) => setStock(Number(e.target.value))}
                  className="w-full p-2 border border-gray-300 rounded"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-2 border-t">
              <button
                onClick={() => setShowAddModal(false)}
                className="px-3 py-1.5 border rounded text-xs"
              >
                Hủy
              </button>
              <button
                onClick={handleSaveProduct}
                className="px-4 py-1.5 bg-[#1e0b54] text-white rounded text-xs font-bold"
              >
                Lưu mặt hàng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
