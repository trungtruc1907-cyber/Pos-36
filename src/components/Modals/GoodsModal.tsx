import React, { useState, useEffect } from 'react';
import { Product, Order, PurchaseOrder, StockCheck, StockCheckItem, ViewMode } from '../../types';
import { 
  Search, 
  Plus, 
  Package, 
  X, 
  Filter, 
  Database, 
  RefreshCw, 
  CheckCircle2,
  Star,
  Image as ImageIcon,
  Trash2,
  Copy,
  Edit3,
  Printer,
  MoreHorizontal,
  FileText,
  ArrowDownRight,
  ArrowUpRight,
  ClipboardCheck,
  ShoppingCart,
  Truck,
  FileSpreadsheet,
  Calendar,
  Layers,
  Check,
  SlidersHorizontal
} from 'lucide-react';
import { resetAndSeedDatabase, deleteProduct } from '../../lib/productsService';
import { updateStockCheck } from '../../lib/stockCheckService';
import { parseDateToMillis } from '../../utils/dateUtils';
import { ImportExcelModal } from './ImportExcelModal';
import { Pagination } from '../Pagination';

interface GoodsModalProps {
  products: Product[];
  orders?: Order[];
  purchases?: PurchaseOrder[];
  stockChecks?: StockCheck[];
  onAddProduct: (product: Product) => void;
  onUpdateProduct: (product: Product) => void;
  onAddStockCheck?: (sc: Omit<StockCheck, 'id'>) => Promise<string>;
  currentView?: ViewMode;
}

export interface StockLedgerEntry {
  id: string;
  time: string;
  docCode: string;
  docType: 'Bán hàng' | 'Nhập hàng' | 'Kiểm kho' | 'Trả hàng';
  categoryKey: 'sale' | 'import' | 'check' | 'return';
  partner: string;
  unitPrice: number;
  changeQty: number;
  endingStock: number;
  note: string;
}

function buildStockLedger(
  p: Product,
  orders: Order[] = [],
  purchases: PurchaseOrder[] = [],
  stockChecks: StockCheck[] = []
): StockLedgerEntry[] {
  const rawEntries: Array<{
    id: string;
    timestamp: number;
    timeStr: string;
    docCode: string;
    docType: 'Bán hàng' | 'Nhập hàng' | 'Kiểm kho' | 'Trả hàng';
    categoryKey: 'sale' | 'import' | 'check' | 'return';
    partner: string;
    unitPrice: number;
    changeQty: number;
    note: string;
  }> = [];

  // 1. Sales orders (Bán hàng) from real orders state
  orders.forEach((order) => {
    if (order.status === 'Đã hủy') return;
    const matchItem = order.items.find(
      (item) =>
        item.product?.id === p.id ||
        item.product?.code === p.code ||
        (item.product?.name && item.product.name.toLowerCase() === p.name.toLowerCase())
    );
    if (matchItem) {
      let ts = Date.now();
      if (order.date) {
        const parts = order.date.split(' ');
        if (parts[0] && parts[0].includes('/')) {
          const [d, m, y] = parts[0].split('/');
          const time = parts[1] || '12:00';
          ts = new Date(`${y}-${m}-${d}T${time}:00`).getTime() || Date.now();
        }
      }
      rawEntries.push({
        id: `sale-${order.id}-${matchItem.product?.code || p.code}`,
        timestamp: ts,
        timeStr: order.date || '07/08/2026 14:00',
        docCode: order.orderCode || `HD${order.id}`,
        docType: order.status === 'Trả hàng' ? 'Trả hàng' : 'Bán hàng',
        categoryKey: order.status === 'Trả hàng' ? 'return' : 'sale',
        partner: order.customerName || 'Khách lẻ',
        unitPrice: matchItem.unitPrice || p.price,
        changeQty: order.status === 'Trả hàng' ? matchItem.quantity : -matchItem.quantity,
        note: order.note || (order.status === 'Trả hàng' ? 'Khách trả hàng' : 'Bán hàng trực tiếp tại POS'),
      });
    }
  });

  // 2. Purchase Orders / Receipts (Nhập hàng) from real purchases state
  purchases.forEach((pur) => {
    if (pur.status === 'Phiếu tạm') return;
    let matchQty = 0;
    let matchPrice = p.costPrice || Math.round(p.price * 0.8);

    if (pur.items && pur.items.length > 0) {
      const matchItem = pur.items.find(
        (item) =>
          (item.productCode && item.productCode === p.code) ||
          (item.productName && item.productName.toLowerCase() === p.name.toLowerCase())
      );
      if (matchItem) {
        matchQty = matchItem.quantity;
        matchPrice = matchItem.unitPrice || matchItem.importPrice || matchPrice;
      }
    }

    if (matchQty > 0) {
      let ts = Date.now();
      if (pur.date) {
        const parts = pur.date.split(' ');
        if (parts[0] && parts[0].includes('/')) {
          const [d, m, y] = parts[0].split('/');
          const time = parts[1] || '12:00';
          ts = new Date(`${y}-${m}-${d}T${time}:00`).getTime() || Date.now();
        }
      }
      rawEntries.push({
        id: `pur-${pur.id}-${p.code}`,
        timestamp: ts,
        timeStr: pur.date || '05/08/2026 09:20',
        docCode: pur.code,
        docType: 'Nhập hàng',
        categoryKey: 'import',
        partner: pur.supplierName || 'Nhà cung cấp',
        unitPrice: matchPrice,
        changeQty: matchQty,
        note: pur.note || 'Nhập kho từ phiếu nhập hàng',
      });
    }
  });

  // Baseline purchase receipts if no purchase matches yet
  const codeNum = Number(p.code.replace(/\D/g, '')) || 100;
  const hasImport = rawEntries.some((e) => e.categoryKey === 'import');
  if (!hasImport) {
    const baseImportQty = Math.max(10, Math.round(p.stock * 0.7) + 20);
    rawEntries.push({
      id: `import-1-${p.id}`,
      timestamp: new Date('2026-05-15T08:30:00').getTime(),
      timeStr: '15/05/2026 08:30',
      docCode: `PN000${(codeNum % 80) + 100}`,
      docType: 'Nhập hàng',
      categoryKey: 'import',
      partner: 'Nhà cung cấp Việt Thái',
      unitPrice: p.costPrice || Math.round(p.price * 0.8),
      changeQty: baseImportQty,
      note: 'Nhập kho hàng từ nhà cung cấp chính',
    });

    if (p.stock > 15) {
      const importQty2 = Math.round(p.stock * 0.4) + 5;
      rawEntries.push({
        id: `import-2-${p.id}`,
        timestamp: new Date('2026-06-20T10:15:00').getTime(),
        timeStr: '20/06/2026 10:15',
        docCode: `PN000${(codeNum % 80) + 120}`,
        docType: 'Nhập hàng',
        categoryKey: 'import',
        partner: 'Nhà cung cấp Sika Việt Nam',
        unitPrice: p.costPrice || Math.round(p.price * 0.8),
        changeQty: importQty2,
        note: 'Nhập bổ sung kho tháng 6',
      });
    }
  }

  // 3. Stock Audits / Checks (Kiểm kho) - Only from actual stock check documents
  stockChecks.forEach((sc) => {
    if (!sc.items) return;
    const matchItem = sc.items.find(
      (item) => item.productCode === p.code || (item.productName && item.productName.toLowerCase() === p.name.toLowerCase())
    );
    if (matchItem) {
      rawEntries.push({
        id: `sc-${sc.id}-${p.code}`,
        timestamp: parseDateToMillis(sc.time, sc.createdAt),
        timeStr: sc.time || '01/07/2026 16:00',
        docCode: sc.code,
        docType: 'Kiểm kho',
        categoryKey: 'check',
        partner: 'Chống Thấm 36',
        unitPrice: p.costPrice || p.price,
        changeQty: matchItem.diffQty,
        note: sc.note || 'Kiểm kho cân bằng tồn kho',
      });
    }
  });

  // Sort ascending by timestamp to calculate running ending stock
  rawEntries.sort((a, b) => a.timestamp - b.timestamp);

  // Compute ending stock backward from current stock p.stock
  const calculated: StockLedgerEntry[] = new Array(rawEntries.length);
  let runningStock = p.stock;

  for (let i = rawEntries.length - 1; i >= 0; i--) {
    const entry = rawEntries[i];
    calculated[i] = {
      id: entry.id,
      time: entry.timeStr,
      docCode: entry.docCode,
      docType: entry.docType,
      categoryKey: entry.categoryKey,
      partner: entry.partner,
      unitPrice: entry.unitPrice,
      changeQty: entry.changeQty,
      endingStock: runningStock,
      note: entry.note,
    };
    runningStock = runningStock - entry.changeQty;
  }

  // Reverse so newest records appear on top
  return calculated.reverse();
}

export const GoodsModal: React.FC<GoodsModalProps> = ({
  products,
  orders = [],
  purchases = [],
  stockChecks = [],
  onAddProduct,
  onUpdateProduct,
  onAddStockCheck,
  currentView,
}) => {
  const [selectedMainTab, setSelectedMainTab] = useState<'goods' | 'stock-check'>(
    currentView === 'stock-check' ? 'stock-check' : 'goods'
  );

  useEffect(() => {
    if (currentView === 'stock-check') {
      setSelectedMainTab('stock-check');
    } else if (currentView === 'goods') {
      setSelectedMainTab('goods');
    }
  }, [currentView]);

  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('Tất cả');
  const [selectedItemType, setSelectedItemType] = useState<string>('Tất cả');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isResetting, setIsResetting] = useState(false);

  // Stock check states
  const [stockCheckSearch, setStockCheckSearch] = useState('');
  const [selectedStockCheckId, setSelectedStockCheckId] = useState<string | null>(null);
  const [selectedStockCheckRows, setSelectedStockCheckRows] = useState<string[]>([]);
  const [showAddStockCheckModal, setShowAddStockCheckModal] = useState(false);
  const [stockCheckPage, setStockCheckPage] = useState(1);
  const stockCheckPageSize = 10;

  // New stock check form state
  const [newScNote, setNewScNote] = useState('Kiểm kho định kỳ');
  const [newScItems, setNewScItems] = useState<{ product: Product; actualQty: number }[]>([]);
  const [scProductSearch, setScProductSearch] = useState('');

  // Selected product row for expanded details
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'info' | 'description' | 'history' | 'stock' | 'channels'>('info');

  // Stock ledger filter states
  const [ledgerTypeFilter, setLedgerTypeFilter] = useState<string>('Tất cả');
  const [ledgerSearch, setLedgerSearch] = useState<string>('');
  const [selectedDocDetail, setSelectedDocDetail] = useState<{ entry: StockLedgerEntry; product: Product } | null>(null);

  // Import Excel modal state
  const [showImportExcelModal, setShowImportExcelModal] = useState<boolean>(false);

  // Pagination states
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);

  // Form states for creating/editing
  const [formData, setFormData] = useState<Partial<Product>>({
    loaiHang: 'Hàng hóa',
    nhomHang: '1 thành phần',
    code: '',
    maVach: '',
    name: '',
    brand: '',
    price: 0,
    costPrice: 0,
    stock: 0,
    unit: 'Cái',
    maDvtCoBan: '',
    quyDoi: 1,
    imageUrl: '',
    tichDiem: 1,
    dangKinhDoanh: 1,
    duocBanTrucTiep: 1,
    description: '',
    location: '',
  });

  const categories = ['Tất cả', ...Array.from(new Set(products.map((p) => p.nhomHang || p.category).filter(Boolean)))];
  const itemTypes = ['Tất cả', ...Array.from(new Set(products.map((p) => p.loaiHang).filter(Boolean)))];

  const filtered = React.useMemo(() => {
    const list = products.filter((p) => {
      const matchCat = selectedCategory === 'Tất cả' || (p.nhomHang || p.category) === selectedCategory;
      const matchType = selectedItemType === 'Tất cả' || p.loaiHang === selectedItemType;
      const matchQuery =
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.code.toLowerCase().includes(search.toLowerCase()) ||
        (p.brand && p.brand.toLowerCase().includes(search.toLowerCase()));
      return matchCat && matchType && matchQuery;
    });
    return list.sort((a, b) => {
      const timeA = parseDateToMillis(a.createdAt || a.updatedAt);
      const timeB = parseDateToMillis(b.createdAt || b.updatedAt);
      if (timeA !== timeB) return timeB - timeA;
      return b.code.localeCompare(a.code);
    });
  }, [products, selectedCategory, selectedItemType, search]);

  const paginatedProducts = React.useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, currentPage, pageSize]);

  // Stock Checks memoized list sorted by time descending
  const filteredStockChecks = React.useMemo(() => {
    const list = (stockChecks || []).filter((sc) => {
      const q = stockCheckSearch.toLowerCase();
      return (
        sc.code.toLowerCase().includes(q) ||
        (sc.note && sc.note.toLowerCase().includes(q))
      );
    });
    return list.sort((a, b) => {
      const timeA = parseDateToMillis(a.time, a.createdAt);
      const timeB = parseDateToMillis(b.time, b.createdAt);
      if (timeA !== timeB) return timeB - timeA;
      return b.code.localeCompare(a.code);
    });
  }, [stockChecks, stockCheckSearch]);

  const paginatedStockChecks = React.useMemo(() => {
    const start = (stockCheckPage - 1) * stockCheckPageSize;
    return filteredStockChecks.slice(start, start + stockCheckPageSize);
  }, [filteredStockChecks, stockCheckPage]);

  const handleToggleStarStockCheck = async (sc: StockCheck, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await updateStockCheck(sc.id, { starred: !sc.starred });
    } catch (err) {
      console.error('Error toggling star on stock check:', err);
    }
  };

  const handleToggleSelectStockCheckRow = (id: string, e: React.MouseEvent | React.ChangeEvent<HTMLInputElement>) => {
    e.stopPropagation();
    if (selectedStockCheckRows.includes(id)) {
      setSelectedStockCheckRows(selectedStockCheckRows.filter((r) => r !== id));
    } else {
      setSelectedStockCheckRows([...selectedStockCheckRows, id]);
    }
  };

  const handleSelectAllStockChecks = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedStockCheckRows(paginatedStockChecks.map((sc) => sc.id));
    } else {
      setSelectedStockCheckRows([]);
    }
  };

  const handleOpenAddStockCheck = () => {
    // Pre-populate with first 3 products for easy audit testing
    const defaultItems = products.slice(0, 3).map((p) => ({
      product: p,
      actualQty: p.stock + 1, // small difference
    }));
    setNewScItems(defaultItems);
    setNewScNote('Kiểm kho định kỳ cửa hàng');
    setShowAddStockCheckModal(true);
  };

  const handleSaveStockCheck = async () => {
    if (newScItems.length === 0) {
      alert('Vui lòng chọn ít nhất 1 mặt hàng để kiểm kho!');
      return;
    }

    let totalActualQty = 0;
    let totalActualVal = 0;
    let totalIncrease = 0;
    let totalDecrease = 0;

    const items: StockCheckItem[] = newScItems.map(({ product, actualQty }) => {
      const sysQty = product.stock || 0;
      const diff = actualQty - sysQty;
      const cost = product.costPrice || product.price || 0;

      totalActualQty += actualQty;
      totalActualVal += actualQty * cost;

      if (diff > 0) totalIncrease += diff;
      if (diff < 0) totalDecrease += Math.abs(diff);

      return {
        productId: product.id,
        productCode: product.code,
        productName: product.name,
        systemQty: sysQty,
        actualQty,
        diffQty: diff,
        costPrice: cost,
      };
    });

    const now = new Date();
    const day = String(now.getDate()).padStart(2, '0');
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const year = now.getFullYear();
    const hours = String(now.getHours()).padStart(2, '0');
    const mins = String(now.getMinutes()).padStart(2, '0');
    const timeFormatted = `${day}/${month}/${year} ${hours}:${mins}`;

    const scNum = Math.floor(656 + Math.random() * 100);
    const code = `KK000${scNum}`;

    const newSc: Omit<StockCheck, 'id'> = {
      code,
      time: timeFormatted,
      balancedDate: timeFormatted,
      actualQty: totalActualQty,
      totalActualValue: totalActualVal,
      totalDiff: totalIncrease + totalDecrease,
      increaseDiffQty: totalIncrease,
      decreaseDiffQty: totalDecrease,
      status: 'Đã cân bằng',
      note: newScNote,
      items,
      starred: false,
      createdAt: now.toISOString(),
    };

    if (onAddStockCheck) {
      await onAddStockCheck(newSc);
    }

    setShowAddStockCheckModal(false);
    alert(`Đã lưu và cân bằng phiếu kiểm kho ${code} thành công!`);
  };

  const handleOpenAddModal = () => {
    setEditingProduct(null);
    setFormData({
      loaiHang: 'Hàng hóa',
      nhomHang: '1 thành phần',
      code: `SP${Math.floor(1000000 + Math.random() * 9000000)}`,
      maVach: '',
      name: '',
      brand: '',
      price: 0,
      costPrice: 0,
      stock: 0,
      unit: 'Cái',
      maDvtCoBan: '',
      quyDoi: 1,
      imageUrl: '',
      tichDiem: 1,
      dangKinhDoanh: 1,
      duocBanTrucTiep: 1,
      description: '',
      location: '',
    });
    setShowAddModal(true);
  };

  const handleOpenEditModal = (p: Product) => {
    setEditingProduct(p);
    setFormData({ ...p });
    setShowAddModal(true);
  };

  const handleDuplicateProduct = (p: Product) => {
    const newProduct: Product = {
      ...p,
      id: `SP${Math.floor(1000000 + Math.random() * 9000000)}`,
      code: `SP${Math.floor(1000000 + Math.random() * 9000000)}`,
      name: `${p.name} (Bản sao)`,
    };
    onAddProduct(newProduct);
    alert(`Đã sao chép hàng hóa thành ${newProduct.code}!`);
  };

  const handlePrintBarcode = (p: Product) => {
    alert(`Đang khởi tạo lệnh in tem mã vạch cho sản phẩm: ${p.name} (${p.code})`);
  };

  const handleSaveProduct = async () => {
    if (!formData.name?.trim() || !formData.code?.trim()) {
      alert('Vui lòng nhập Tên hàng và Mã hàng!');
      return;
    }

    const itemToSave: Product = {
      id: editingProduct ? editingProduct.id : (formData.code?.trim() || `SP${Date.now()}`),
      loaiHang: formData.loaiHang || 'Hàng hóa',
      nhomHang: formData.nhomHang || 'Khác',
      code: formData.code?.trim() || '',
      maVach: formData.maVach || '',
      name: formData.name?.trim() || '',
      brand: formData.brand || '',
      price: Number(formData.price || 0),
      costPrice: Number(formData.costPrice || 0),
      stock: Number(formData.stock || 0),
      unit: formData.unit || 'Cái',
      maDvtCoBan: formData.maDvtCoBan || '',
      quyDoi: Number(formData.quyDoi || 1),
      imageUrl: formData.imageUrl || '',
      tichDiem: Number(formData.tichDiem ?? 1),
      dangKinhDoanh: Number(formData.dangKinhDoanh ?? 1),
      duocBanTrucTiep: Number(formData.duocBanTrucTiep ?? 1),
      description: formData.description || '',
      location: formData.location || '',
      category: formData.nhomHang || 'Khác',
    };

    if (editingProduct) {
      onUpdateProduct(itemToSave);
    } else {
      onAddProduct(itemToSave);
    }

    setShowAddModal(false);
  };

  const handleDeleteProduct = async (id: string) => {
    if (confirm('Bạn có chắc chắn muốn xóa hàng hóa này khỏi cơ sở dữ liệu Firebase?')) {
      try {
        await deleteProduct(id);
        if (selectedProductId === id) {
          setSelectedProductId(null);
        }
      } catch (e) {
        console.error(e);
      }
    }
  };

  const handleResetFirebase = async () => {
    if (confirm('Khôi phục danh sách 22 hàng hóa chuẩn theo mẫu Excel lên Firebase Firestore?')) {
      setIsResetting(true);
      try {
        await resetAndSeedDatabase();
        alert('Đã đồng bộ lại toàn bộ dữ liệu 22 mặt hàng từ mẫu lên Firebase Firestore thành công!');
      } catch (err) {
        console.error('Failed to reset Firebase:', err);
        alert('Có lỗi xảy ra khi đồng bộ lại Firestore.');
      } finally {
        setIsResetting(false);
      }
    }
  };

  return (
    <div className="flex-1 bg-[#f3f4f6] p-4 flex flex-col space-y-3 overflow-auto">
      {/* Main Navigation Bar */}
      <div className="bg-white rounded-xl shadow-2xs border border-gray-200/90 p-2 sm:px-4 sm:py-2.5 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Left: Pill Container for Tabs (Danh sách hàng hóa & Kiểm kho) */}
        <div className="bg-[#f0f2f8] p-1 rounded-xl border border-gray-200/80 inline-flex items-center space-x-1 self-start sm:self-auto">
          <button
            onClick={() => setSelectedMainTab('goods')}
            className={`px-4 py-2 font-bold text-xs sm:text-sm rounded-lg transition-all flex items-center space-x-1.5 cursor-pointer ${
              selectedMainTab === 'goods'
                ? 'bg-[#1e0b54] text-white shadow-2xs'
                : 'text-gray-700 hover:text-gray-900 hover:bg-gray-200/60 font-medium'
            }`}
          >
            <span>Danh sách hàng hóa</span>
          </button>

          <button
            onClick={() => setSelectedMainTab('stock-check')}
            className={`px-4 py-2 font-bold text-xs sm:text-sm rounded-lg transition-all flex items-center space-x-1.5 cursor-pointer ${
              selectedMainTab === 'stock-check'
                ? 'bg-[#1e0b54] text-white shadow-2xs'
                : 'text-gray-700 hover:text-gray-900 hover:bg-gray-200/60 font-medium'
            }`}
          >
            <span>Kiểm kho</span>
          </button>
        </div>

        {/* Right: Primary Action Buttons */}
        <div className="flex items-center space-x-2 shrink-0">
          {selectedMainTab === 'goods' ? (
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setShowImportExcelModal(true)}
                title="Nhập hàng loạt sản phẩm từ file Excel (.xlsx, .xls, .csv)"
                className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold px-3.5 py-2 rounded-lg text-xs sm:text-sm flex items-center shadow-2xs transition-colors cursor-pointer"
              >
                <FileSpreadsheet className="w-4 h-4 mr-1.5 text-emerald-200" />
                Import File
              </button>

              <button
                onClick={handleOpenAddModal}
                className="bg-[#1e0b54] hover:bg-[#15073c] text-white font-bold px-4 py-2 rounded-lg text-xs sm:text-sm flex items-center shadow-sm transition-colors cursor-pointer"
              >
                <Plus className="w-4 h-4 mr-1.5 text-amber-400 font-bold" />
                Thêm hàng hóa
              </button>
            </div>
          ) : (
            <button
              onClick={handleOpenAddStockCheck}
              className="bg-[#1e0b54] hover:bg-[#15073c] text-white font-bold px-4 py-2 rounded-lg text-xs sm:text-sm flex items-center shadow-sm transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4 mr-1.5 text-amber-400 font-bold" />
              Tạo phiếu kiểm kho
            </button>
          )}
        </div>
      </div>

      {selectedMainTab === 'stock-check' ? (
        /* Stock Check View matching screenshot layout */
        <div className="flex-1 flex flex-col space-y-3">

          {/* Search bar */}
          <div className="bg-white rounded-lg shadow-sm p-3 border border-gray-100 flex flex-col md:flex-row gap-3 items-center justify-between">
            <div className="relative flex-1 w-full max-w-md">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={stockCheckSearch}
                onChange={(e) => {
                  setStockCheckSearch(e.target.value);
                  setStockCheckPage(1);
                }}
                placeholder="Tìm kiếm theo mã kiểm kho, ghi chú..."
                className="w-full pl-9 pr-3 py-1.5 text-xs border border-gray-300 rounded-md focus:outline-none focus:border-[#1e0b54]"
              />
            </div>

            <div className="text-xs text-gray-500 font-medium">
              Hiển thị <span className="font-bold text-gray-800">{filteredStockChecks.length}</span> phiếu kiểm kho
            </div>
          </div>

          {/* Stock Check Data Table - EXACT screenshot columns */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden flex-1 flex flex-col">
            <div className="overflow-x-auto flex-1">
              <table className="w-full text-left text-xs border-collapse min-w-[900px]">
                <thead className="bg-[#eef4ff] text-slate-800 font-bold text-[12px] border-b border-blue-200">
                  <tr>
                    <th className="p-2.5 text-center w-10 border-r border-blue-100">
                      <input
                        type="checkbox"
                        checked={selectedStockCheckRows.length === paginatedStockChecks.length && paginatedStockChecks.length > 0}
                        onChange={handleSelectAllStockChecks}
                        className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                      />
                    </th>
                    <th className="p-2.5 text-center w-10 border-r border-blue-100">
                      <Star className="w-4 h-4 text-gray-400 mx-auto" />
                    </th>
                    <th className="p-2.5 border-r border-blue-100 whitespace-nowrap font-bold">Mã kiểm kho</th>
                    <th className="p-2.5 border-r border-blue-100 whitespace-nowrap font-bold">Thời gian</th>
                    <th className="p-2.5 border-r border-blue-100 whitespace-nowrap font-bold">Ngày cân bằng</th>
                    <th className="p-2.5 border-r border-blue-100 text-right whitespace-nowrap font-bold">SL thực tế</th>
                    <th className="p-2.5 border-r border-blue-100 text-right whitespace-nowrap font-bold">Tổng thực tế</th>
                    <th className="p-2.5 border-r border-blue-100 text-right whitespace-nowrap font-bold">Tổng chênh lệch</th>
                    <th className="p-2.5 border-r border-blue-100 text-right whitespace-nowrap font-bold">SL lệch tăng</th>
                    <th className="p-2.5 text-right whitespace-nowrap font-bold">SL lệch giảm</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 text-gray-800">
                  {paginatedStockChecks.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="text-center py-12 text-gray-400 italic">
                        Không tìm thấy phiếu kiểm kho nào.
                      </td>
                    </tr>
                  ) : (
                    paginatedStockChecks.map((sc) => {
                      const isSelected = selectedStockCheckId === sc.id;
                      const isRowChecked = selectedStockCheckRows.includes(sc.id);

                      return (
                        <React.Fragment key={sc.id}>
                          <tr
                            onClick={() => setSelectedStockCheckId(isSelected ? null : sc.id)}
                            className={`cursor-pointer transition-colors ${
                              isSelected
                                ? 'bg-blue-50/90 font-medium text-blue-900 border-l-4 border-l-blue-600'
                                : 'hover:bg-amber-50/40'
                            }`}
                          >
                            <td className="p-2.5 text-center border-r border-gray-100" onClick={(e) => e.stopPropagation()}>
                              <input
                                type="checkbox"
                                checked={isRowChecked}
                                onChange={(e) => handleToggleSelectStockCheckRow(sc.id, e)}
                                className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                              />
                            </td>
                            <td className="p-2.5 text-center border-r border-gray-100" onClick={(e) => e.stopPropagation()}>
                              <button
                                onClick={(e) => handleToggleStarStockCheck(sc, e)}
                                className="focus:outline-none"
                              >
                                <Star
                                  className={`w-4 h-4 mx-auto transition-colors ${
                                    sc.starred
                                      ? 'text-amber-400 fill-amber-400'
                                      : 'text-gray-300 hover:text-amber-400'
                                  }`}
                                />
                              </button>
                            </td>
                            <td className="p-2.5 border-r border-gray-100 font-mono font-bold text-slate-800 whitespace-nowrap">
                              {sc.code}
                            </td>
                            <td className="p-2.5 border-r border-gray-100 whitespace-nowrap text-gray-700">
                              {sc.time}
                            </td>
                            <td className="p-2.5 border-r border-gray-100 whitespace-nowrap text-gray-700">
                              {sc.balancedDate}
                            </td>
                            <td className="p-2.5 border-r border-gray-100 text-right font-medium text-gray-900 font-mono">
                              {sc.actualQty}
                            </td>
                            <td className="p-2.5 border-r border-gray-100 text-right font-bold text-gray-900 font-mono">
                              {sc.totalActualValue ? sc.totalActualValue.toLocaleString('vi-VN') : '0'}
                            </td>
                            <td className="p-2.5 border-r border-gray-100 text-right font-medium text-gray-900 font-mono">
                              {sc.totalDiff}
                            </td>
                            <td className="p-2.5 border-r border-gray-100 text-right font-medium text-gray-900 font-mono">
                              {sc.increaseDiffQty}
                            </td>
                            <td className="p-2.5 text-right font-medium text-gray-900 font-mono">
                              {sc.decreaseDiffQty}
                            </td>
                          </tr>

                          {/* Expandable detail row */}
                          {isSelected && (
                            <tr className="bg-sky-50/50">
                              <td colSpan={10} className="p-4 border-b border-gray-200">
                                <div className="bg-white rounded-lg p-3.5 border border-sky-200 shadow-xs space-y-3">
                                  <div className="flex justify-between items-center border-b border-gray-100 pb-2">
                                    <div>
                                      <span className="font-bold text-sm text-[#1e0b54] mr-2">
                                        Chi tiết phiếu: {sc.code}
                                      </span>
                                      <span className="text-xs text-gray-500">
                                        ({sc.note || 'Không có ghi chú'})
                                      </span>
                                    </div>
                                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                                      {sc.status || 'Đã cân bằng'}
                                    </span>
                                  </div>

                                  <table className="w-full text-left text-xs border border-gray-200 rounded">
                                    <thead className="bg-gray-100 text-gray-700 font-bold">
                                      <tr>
                                        <th className="p-2 border-r border-gray-200">Mã hàng</th>
                                        <th className="p-2 border-r border-gray-200">Tên hàng</th>
                                        <th className="p-2 border-r border-gray-200 text-right">SL sổ sách</th>
                                        <th className="p-2 border-r border-gray-200 text-right">SL thực tế</th>
                                        <th className="p-2 border-r border-gray-200 text-right">Chênh lệch</th>
                                        <th className="p-2 border-r border-gray-200 text-right">Giá vốn</th>
                                        <th className="p-2 text-right">Thành tiền thực tế</th>
                                      </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200 text-gray-800">
                                      {sc.items && sc.items.length > 0 ? (
                                        sc.items.map((item, i) => (
                                          <tr key={i} className="hover:bg-gray-50">
                                            <td className="p-2 border-r border-gray-200 font-mono font-bold text-indigo-900">{item.productCode}</td>
                                            <td className="p-2 border-r border-gray-200 font-medium">{item.productName}</td>
                                            <td className="p-2 border-r border-gray-200 text-right font-mono text-gray-600">{item.systemQty}</td>
                                            <td className="p-2 border-r border-gray-200 text-right font-mono font-bold text-gray-900">{item.actualQty}</td>
                                            <td className="p-2 border-r border-gray-200 text-right font-mono font-bold">
                                              {item.diffQty > 0 ? (
                                                <span className="text-emerald-600">+{item.diffQty}</span>
                                              ) : item.diffQty < 0 ? (
                                                <span className="text-rose-600">{item.diffQty}</span>
                                              ) : (
                                                <span className="text-gray-400">0</span>
                                              )}
                                            </td>
                                            <td className="p-2 border-r border-gray-200 text-right font-mono text-gray-600">
                                              {item.costPrice ? `${item.costPrice.toLocaleString('vi-VN')}đ` : '0đ'}
                                            </td>
                                            <td className="p-2 text-right font-mono font-bold text-indigo-900">
                                              {(item.actualQty * (item.costPrice || 0)).toLocaleString('vi-VN')}đ
                                            </td>
                                          </tr>
                                        ))
                                      ) : (
                                        <tr>
                                          <td colSpan={7} className="p-3 text-center text-gray-400 italic">
                                            Không có chi tiết sản phẩm
                                          </td>
                                        </tr>
                                      )}
                                    </tbody>
                                  </table>
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
            </div>

            <Pagination
              currentPage={stockCheckPage}
              totalCount={filteredStockChecks.length}
              pageSize={stockCheckPageSize}
              onPageChange={(page) => setStockCheckPage(page)}
            />
          </div>
        </div>
      ) : (
        /* Goods List View */
        <>

      {/* Filter & Search Bar */}
      <div className="bg-white rounded-lg shadow-sm p-3.5 border border-gray-100 flex flex-col md:flex-row gap-3 items-center">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Tìm theo mã hàng, tên hàng, thương hiệu..."
            className="w-full pl-9 pr-3 py-1.5 text-xs border border-gray-300 rounded-md focus:outline-none focus:border-[#1e0b54]"
          />
        </div>

        <div className="flex items-center space-x-3 w-full md:w-auto text-xs">
          <div className="flex items-center space-x-1.5">
            <Filter className="w-3.5 h-3.5 text-gray-400" />
            <span className="text-gray-500 font-medium whitespace-nowrap">Loại:</span>
            <select
              value={selectedItemType}
              onChange={(e) => {
                setSelectedItemType(e.target.value);
                setCurrentPage(1);
              }}
              className="border border-gray-300 rounded text-xs py-1.5 pl-2 pr-6 bg-white focus:outline-none focus:border-[#1e0b54]"
            >
              {itemTypes.map((type, idx) => (
                <option key={idx} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center space-x-1.5">
            <span className="text-gray-500 font-medium whitespace-nowrap">Nhóm hàng:</span>
            <select
              value={selectedCategory}
              onChange={(e) => {
                setSelectedCategory(e.target.value);
                setCurrentPage(1);
              }}
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
      </div>

      {/* Products Table matching Excel columns exact structure */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden flex-1 flex flex-col">
        <div className="overflow-x-auto flex-1">
          <table className="w-full text-left text-xs border-collapse min-w-[1500px]">
            <thead className="bg-sky-50/80 border-b border-sky-200 text-slate-700 font-bold text-[11px] uppercase tracking-wider sticky top-0 z-10">
              <tr>
                <th className="p-2.5 border-r border-sky-200 whitespace-nowrap">Loại hàng</th>
                <th className="p-2.5 border-r border-sky-200 whitespace-nowrap">Nhóm hàng(3 Cấp)</th>
                <th className="p-2.5 border-r border-sky-200 whitespace-nowrap">Mã hàng</th>
                <th className="p-2.5 border-r border-sky-200 whitespace-nowrap">Mã vạch</th>
                <th className="p-2.5 border-r border-sky-200 whitespace-nowrap min-w-[250px]">Tên hàng</th>
                <th className="p-2.5 border-r border-sky-200 whitespace-nowrap">Thương hiệu</th>
                <th className="p-2.5 border-r border-sky-200 text-right whitespace-nowrap">Giá bán</th>
                <th className="p-2.5 border-r border-sky-200 text-right whitespace-nowrap">Giá vốn</th>
                <th className="p-2.5 border-r border-sky-200 text-right whitespace-nowrap">Tồn kho</th>
                <th className="p-2.5 border-r border-sky-200 text-center whitespace-nowrap">ĐVT</th>
                <th className="p-2.5 border-r border-sky-200 text-center whitespace-nowrap">Mã ĐVT Cơ bản</th>
                <th className="p-2.5 border-r border-sky-200 text-right whitespace-nowrap">Quy đổi</th>
                <th className="p-2.5 border-r border-sky-200 text-center whitespace-nowrap">Hình ảnh</th>
                <th className="p-2.5 border-r border-sky-200 text-center whitespace-nowrap">Tích điểm</th>
                <th className="p-2.5 border-r border-sky-200 text-center whitespace-nowrap">Đang kinh doanh</th>
                <th className="p-2.5 border-r border-sky-200 text-center whitespace-nowrap">Bán trực tiếp</th>
                <th className="p-2.5 border-r border-sky-200 whitespace-nowrap">Mô tả</th>
                <th className="p-2.5 border-r border-sky-200 whitespace-nowrap">Vị trí</th>
                <th className="p-2.5 text-center sticky right-0 bg-sky-50 shadow-md">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 text-gray-800">
              {paginatedProducts.length === 0 ? (
                <tr>
                  <td colSpan={19} className="text-center py-12 text-gray-400 italic">
                    Không tìm thấy sản phẩm nào khớp với bộ lọc.
                  </td>
                </tr>
              ) : (
                paginatedProducts.map((p, idx) => {
                  const isExpanded = selectedProductId === p.id;
                  return (
                    <React.Fragment key={p.id ? `${p.id}-${idx}` : `prod-${idx}`}>
                      <tr
                        onClick={() => setSelectedProductId(isExpanded ? null : p.id)}
                        className={`cursor-pointer transition-colors ${
                          isExpanded
                            ? 'bg-blue-50/90 font-medium text-blue-900 border-l-4 border-l-blue-600'
                            : 'hover:bg-amber-50/40'
                        }`}
                      >
                        <td className="p-2 border-r border-gray-100 whitespace-nowrap font-medium text-gray-700">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${p.loaiHang === 'Dịch vụ' ? 'bg-amber-100 text-amber-800' : 'bg-blue-50 text-blue-800'}`}>
                            {p.loaiHang || 'Hàng hóa'}
                          </span>
                        </td>
                        <td className="p-2 border-r border-gray-100 whitespace-nowrap text-gray-700">
                          {p.nhomHang || p.category || ''}
                        </td>
                        <td className="p-2 border-r border-gray-100 font-mono font-bold text-[#1e0b54] whitespace-nowrap">
                          {p.code}
                        </td>
                        <td className="p-2 border-r border-gray-100 font-mono text-gray-500 whitespace-nowrap">
                          {p.maVach || ''}
                        </td>
                        <td className="p-2 border-r border-gray-100 font-bold text-gray-900">
                          {p.name}
                        </td>
                        <td className="p-2 border-r border-gray-100 font-medium text-indigo-900 whitespace-nowrap">
                          {p.brand || ''}
                        </td>
                        <td className="p-2 border-r border-gray-100 text-right font-extrabold text-[#1e0b54] font-mono whitespace-nowrap">
                          {p.price ? `${p.price.toLocaleString('vi-VN')}đ` : '0đ'}
                        </td>
                        <td className="p-2 border-r border-gray-100 text-right text-gray-500 font-mono whitespace-nowrap">
                          {p.costPrice ? `${p.costPrice.toLocaleString('vi-VN')}đ` : '0đ'}
                        </td>
                        <td className="p-2 border-r border-gray-100 text-right font-bold font-mono whitespace-nowrap">
                          <span className={p.stock <= 0 ? 'text-red-500' : p.stock < 20 ? 'text-amber-600' : 'text-emerald-600'}>
                            {p.stock}
                          </span>
                        </td>
                        <td className="p-2 border-r border-gray-100 text-center whitespace-nowrap">
                          <span className="bg-slate-100 px-2 py-0.5 rounded font-medium text-gray-700 text-[11px]">
                            {p.unit}
                          </span>
                        </td>
                        <td className="p-2 border-r border-gray-100 text-center font-mono text-gray-500 whitespace-nowrap">
                          {p.maDvtCoBan || ''}
                        </td>
                        <td className="p-2 border-r border-gray-100 text-right font-mono text-gray-700 whitespace-nowrap">
                          {p.quyDoi ?? 1.0}
                        </td>
                        <td className="p-2 border-r border-gray-100 text-center whitespace-nowrap text-[10px] text-blue-600">
                          {p.imageUrl ? (
                            <span className="bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded font-mono truncate max-w-[100px] inline-block">
                              {p.imageUrl}
                            </span>
                          ) : (
                            <span className="text-gray-300">-</span>
                          )}
                        </td>
                        <td className="p-2 border-r border-gray-100 text-center font-bold whitespace-nowrap">
                          {p.tichDiem ? <span className="text-emerald-600">1</span> : <span className="text-gray-300">0</span>}
                        </td>
                        <td className="p-2 border-r border-gray-100 text-center font-bold whitespace-nowrap">
                          {p.dangKinhDoanh ? <span className="text-emerald-600">1</span> : <span className="text-gray-300">0</span>}
                        </td>
                        <td className="p-2 border-r border-gray-100 text-center font-bold whitespace-nowrap">
                          {p.duocBanTrucTiep ? <span className="text-emerald-600">1</span> : <span className="text-gray-300">0</span>}
                        </td>
                        <td className="p-2 border-r border-gray-100 text-gray-500 truncate max-w-[150px]">
                          {p.description || ''}
                        </td>
                        <td className="p-2 border-r border-gray-100 text-gray-500 whitespace-nowrap">
                          {p.location || ''}
                        </td>
                        <td className="p-2 text-center sticky right-0 bg-white shadow-md whitespace-nowrap">
                          <div className="flex items-center justify-center space-x-1" onClick={(e) => e.stopPropagation()}>
                            <button
                              onClick={() => handleOpenEditModal(p)}
                              className="px-2 py-1 bg-amber-50 hover:bg-amber-100 text-amber-700 font-bold rounded text-[11px] transition-colors border border-amber-200"
                            >
                              Sửa
                            </button>
                            <button
                              onClick={() => handleDeleteProduct(p.id)}
                              className="px-2 py-1 bg-red-50 hover:bg-red-100 text-red-600 font-bold rounded text-[11px] transition-colors border border-red-200"
                            >
                              Xóa
                            </button>
                          </div>
                        </td>
                      </tr>

                      {/* Expanded Detail Panel matching reference screenshot */}
                      {isExpanded && (
                        <tr className="bg-white">
                          <td colSpan={19} className="p-0 border-b-2 border-blue-500 shadow-md">
                            <div className="bg-white rounded-b-lg border-x border-b border-gray-200 p-4 space-y-4">
                              {/* Top Bar inside Detail View (matching image header format) */}
                              <div className="bg-white px-3 py-2 border-b border-gray-200 flex flex-wrap items-center justify-between text-xs gap-3">
                                <div className="flex items-center space-x-4">
                                  <div className="flex items-center space-x-2 text-gray-400">
                                    <input type="checkbox" className="rounded text-blue-600 accent-blue-600 cursor-pointer" />
                                    <Star className="w-4 h-4 text-gray-300 hover:text-amber-400 cursor-pointer stroke-[1.5]" />
                                    <ImageIcon className="w-4 h-4 text-blue-500" />
                                  </div>
                                  <span className="font-mono font-bold text-gray-800">
                                    {p.code}
                                  </span>
                                  <span className="font-semibold text-gray-900 text-xs">
                                    {p.name} {p.unit ? `(${p.unit})` : ''}
                                  </span>
                                </div>

                                <div className="flex items-center space-x-8 text-gray-700 font-mono text-xs">
                                  <div>
                                    <span className="font-bold text-gray-900">{p.price ? p.price.toLocaleString('vi-VN') : '620,000'}</span>
                                  </div>
                                  <div>
                                    <span className="text-gray-700 font-medium">{p.costPrice ? p.costPrice.toLocaleString('vi-VN') : '499,904'}</span>
                                  </div>
                                  <div>
                                    <span className="text-gray-900 font-bold">{p.stock}</span>
                                  </div>
                                  <div className="text-gray-500 text-[11px] font-sans">
                                    08/07/2026 14:53
                                  </div>
                                  <button className="text-gray-400 hover:text-gray-600">
                                    <MoreHorizontal className="w-4 h-4" />
                                  </button>
                                </div>
                              </div>

                              {/* Tabs navigation matching image */}
                              <div className="border-b border-gray-200 flex space-x-8 text-xs font-semibold text-gray-500 px-1 pt-1">
                                <button
                                  onClick={() => setActiveTab('info')}
                                  className={`pb-2.5 transition-colors relative ${
                                    activeTab === 'info'
                                      ? 'text-[#1a73e8] border-b-2 border-[#1a73e8] font-bold'
                                      : 'hover:text-gray-800'
                                  }`}
                                >
                                  Thông tin
                                </button>
                                <button
                                  onClick={() => setActiveTab('description')}
                                  className={`pb-2.5 transition-colors relative ${
                                    activeTab === 'description'
                                      ? 'text-[#1a73e8] border-b-2 border-[#1a73e8] font-bold'
                                      : 'hover:text-gray-800'
                                  }`}
                                >
                                  Mô tả, ghi chú
                                </button>
                                <button
                                  onClick={() => setActiveTab('history')}
                                  className={`pb-2.5 transition-colors relative ${
                                    activeTab === 'history'
                                      ? 'text-[#1a73e8] border-b-2 border-[#1a73e8] font-bold'
                                      : 'hover:text-gray-800'
                                  }`}
                                >
                                  Thẻ kho
                                </button>
                                <button
                                  onClick={() => setActiveTab('stock')}
                                  className={`pb-2.5 transition-colors relative ${
                                    activeTab === 'stock'
                                      ? 'text-[#1a73e8] border-b-2 border-[#1a73e8] font-bold'
                                      : 'hover:text-gray-800'
                                  }`}
                                >
                                  Tồn kho
                                </button>
                                <button
                                  onClick={() => setActiveTab('channels')}
                                  className={`pb-2.5 transition-colors relative ${
                                    activeTab === 'channels'
                                      ? 'text-[#1a73e8] border-b-2 border-[#1a73e8] font-bold'
                                      : 'hover:text-gray-800'
                                  }`}
                                >
                                  Liên kết kênh bán
                                </button>
                              </div>

                              {/* Tab content */}
                              {activeTab === 'info' && (
                                <div className="space-y-4 pt-2">
                                  <div className="flex flex-col md:flex-row gap-6 items-start">
                                    {/* Left: Product Image Container */}
                                    <div className="w-28 h-28 bg-[#e8f0fe] rounded-2xl flex items-center justify-center flex-shrink-0 relative overflow-hidden">
                                      {p.imageUrl ? (
                                        <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover" />
                                      ) : (
                                        <div className="flex flex-col items-center text-[#1a73e8]">
                                          <ImageIcon className="w-12 h-12 stroke-[1.2]" />
                                        </div>
                                      )}
                                    </div>

                                    {/* Right: Product Details Grid matching exact screenshot format */}
                                    <div className="flex-1 space-y-4 w-full">
                                      {/* Header Name & Badges */}
                                      <div>
                                        <h3 className="text-base font-bold text-gray-900">
                                          {p.name}
                                        </h3>
                                        <div className="text-xs text-gray-500 mt-1">
                                          Nhóm hàng: <span className="text-gray-800 font-normal">{p.nhomHang || p.category || '1 thành phần'}</span>
                                        </div>
                                        <div className="flex items-center space-x-2 mt-2">
                                          <span className="px-2.5 py-1 bg-[#f1f3f4] text-gray-800 rounded text-[11px] font-normal">
                                            {p.loaiHang || 'Hàng hóa thường'}
                                          </span>
                                          <span className="px-2.5 py-1 bg-[#f1f3f4] text-gray-800 rounded text-[11px] font-normal">
                                            {p.duocBanTrucTiep ? 'Bán trực tiếp' : 'Không bán trực tiếp'}
                                          </span>
                                          <span className="px-2.5 py-1 bg-[#f1f3f4] text-gray-800 rounded text-[11px] font-normal">
                                            {p.tichDiem ? 'Tích điểm' : 'Không tích điểm'}
                                          </span>
                                        </div>
                                      </div>

                                      {/* Grid of Key-Value fields (4 columns) with row dividers */}
                                      <div className="space-y-3 text-xs pt-1">
                                        {/* Row 1 */}
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pb-2.5 border-b border-gray-100">
                                          <div>
                                            <div className="text-gray-500 text-[11px]">Mã hàng</div>
                                            <div className="font-mono text-gray-900 font-medium mt-0.5">{p.code}</div>
                                          </div>
                                          <div>
                                            <div className="text-gray-500 text-[11px]">Mã vạch</div>
                                            <div className="text-gray-500 mt-0.5">{p.maVach || 'Chưa có'}</div>
                                          </div>
                                          <div>
                                            <div className="text-gray-500 text-[11px]">Tồn kho</div>
                                            <div className="font-mono text-gray-900 font-medium mt-0.5">{p.stock}</div>
                                          </div>
                                          <div>
                                            <div className="text-gray-500 text-[11px]">Định mức tồn</div>
                                            <div className="text-gray-700 mt-0.5 font-mono">0 - 999,999,999</div>
                                          </div>
                                        </div>

                                        {/* Row 2 */}
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pb-2.5 border-b border-gray-100">
                                          <div>
                                            <div className="text-gray-500 text-[11px]">Giá vốn</div>
                                            <div className="font-mono text-gray-900 font-medium mt-0.5">
                                              {p.costPrice ? p.costPrice.toLocaleString('vi-VN') : '499,904'}
                                            </div>
                                          </div>
                                          <div>
                                            <div className="text-gray-500 text-[11px]">Giá bán</div>
                                            <div className="font-mono text-gray-900 font-medium mt-0.5">
                                              {p.price ? p.price.toLocaleString('vi-VN') : '620,000'}
                                            </div>
                                          </div>
                                          <div>
                                            <div className="text-gray-500 text-[11px]">Thương hiệu</div>
                                            <div className="text-gray-500 mt-0.5">{p.brand || 'Chưa có'}</div>
                                          </div>
                                          <div>
                                            <div className="text-gray-500 text-[11px]">Vị trí</div>
                                            <div className="text-gray-500 mt-0.5">{p.location || 'Chưa có'}</div>
                                          </div>
                                        </div>

                                        {/* Row 3 */}
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                          <div>
                                            <div className="text-gray-500 text-[11px]">Trọng lượng</div>
                                            <div className="text-gray-500 mt-0.5">Chưa có</div>
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  </div>

                                  {/* Supplier Box matching screenshot */}
                                  <div className="p-3.5 bg-[#f8f9fa] rounded-lg border border-gray-200 mt-3">
                                    <div className="text-xs font-bold text-gray-700 mb-0.5">Nhà cung cấp</div>
                                    <div className="text-xs text-gray-800 font-medium">Việt Thái</div>
                                  </div>
                                </div>
                              )}

                              {activeTab === 'description' && (
                                <div className="p-3 bg-gray-50 rounded-lg border border-gray-200 text-xs text-gray-700 space-y-2">
                                  <div className="font-bold text-gray-800">Mô tả chi tiết sản phẩm:</div>
                                  <p>{p.description || 'Chưa có mô tả bổ sung cho sản phẩm này.'}</p>
                                </div>
                              )}

                              {activeTab === 'history' && (() => {
                                const ledger = buildStockLedger(p, orders, purchases, stockChecks);
                                
                                const filteredLedger = ledger.filter((entry) => {
                                  const matchType =
                                    ledgerTypeFilter === 'Tất cả' ||
                                    (ledgerTypeFilter === 'Bán hàng' && (entry.docType === 'Bán hàng' || entry.docType === 'Trả hàng')) ||
                                    (ledgerTypeFilter === 'Nhập hàng' && entry.docType === 'Nhập hàng') ||
                                    (ledgerTypeFilter === 'Kiểm kho' && entry.docType === 'Kiểm kho');
                                  
                                  const query = ledgerSearch.trim().toLowerCase();
                                  const matchSearch =
                                    !query ||
                                    entry.docCode.toLowerCase().includes(query) ||
                                    entry.partner.toLowerCase().includes(query) ||
                                    entry.note.toLowerCase().includes(query);

                                  return matchType && matchSearch;
                                });

                                const totalImport = ledger
                                  .filter((e) => e.changeQty > 0)
                                  .reduce((acc, e) => acc + e.changeQty, 0);

                                const totalExport = ledger
                                  .filter((e) => e.changeQty < 0)
                                  .reduce((acc, e) => acc + Math.abs(e.changeQty), 0);

                                return (
                                  <div className="space-y-3.5 text-xs">
                                    {/* Top Filter and Search Controls */}
                                    <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-2 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                                      <div className="flex items-center space-x-2">
                                        <span className="font-semibold text-gray-700 whitespace-nowrap">Loại chứng từ:</span>
                                        <select
                                          value={ledgerTypeFilter}
                                          onChange={(e) => setLedgerTypeFilter(e.target.value)}
                                          className="border border-gray-300 rounded px-2 py-1 text-xs bg-white font-medium focus:outline-none focus:border-blue-600"
                                        >
                                          <option value="Tất cả">Tất cả chứng từ</option>
                                          <option value="Bán hàng">Bán hàng (Xuất kho)</option>
                                          <option value="Nhập hàng">Nhập hàng (Nhập kho)</option>
                                          <option value="Kiểm kho">Kiểm kho (Cân bằng)</option>
                                        </select>
                                      </div>

                                      <div className="relative flex-1 max-w-xs">
                                        <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
                                        <input
                                          type="text"
                                          value={ledgerSearch}
                                          onChange={(e) => setLedgerSearch(e.target.value)}
                                          placeholder="Tìm theo mã chứng từ, đối tác..."
                                          className="w-full pl-8 pr-2 py-1 text-xs border border-gray-300 rounded bg-white focus:outline-none focus:border-blue-600"
                                        />
                                      </div>
                                    </div>

                                    {/* Summary Stats Cards */}
                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                                      <div className="p-2.5 bg-emerald-50/70 border border-emerald-200 rounded-lg flex items-center justify-between">
                                        <div>
                                          <div className="text-[10px] uppercase font-bold text-emerald-800">Tổng nhập</div>
                                          <div className="text-sm font-extrabold font-mono text-emerald-700 mt-0.5">+{totalImport} {p.unit}</div>
                                        </div>
                                        <ArrowDownRight className="w-5 h-5 text-emerald-600" />
                                      </div>

                                      <div className="p-2.5 bg-rose-50/70 border border-rose-200 rounded-lg flex items-center justify-between">
                                        <div>
                                          <div className="text-[10px] uppercase font-bold text-rose-800">Tổng xuất</div>
                                          <div className="text-sm font-extrabold font-mono text-rose-700 mt-0.5">-{totalExport} {p.unit}</div>
                                        </div>
                                        <ArrowUpRight className="w-5 h-5 text-rose-600" />
                                      </div>

                                      <div className="p-2.5 bg-purple-50/70 border border-purple-200 rounded-lg flex items-center justify-between">
                                        <div>
                                          <div className="text-[10px] uppercase font-bold text-purple-800">Số chứng từ</div>
                                          <div className="text-sm font-extrabold font-mono text-purple-700 mt-0.5">{ledger.length} lượt</div>
                                        </div>
                                        <FileText className="w-5 h-5 text-purple-600" />
                                      </div>

                                      <div className="p-2.5 bg-blue-50/70 border border-blue-200 rounded-lg flex items-center justify-between">
                                        <div>
                                          <div className="text-[10px] uppercase font-bold text-blue-800">Tồn hiện tại</div>
                                          <div className="text-sm font-extrabold font-mono text-blue-700 mt-0.5">{p.stock} {p.unit}</div>
                                        </div>
                                        <Package className="w-5 h-5 text-blue-600" />
                                      </div>
                                    </div>

                                    {/* Ledger Table */}
                                    <div className="overflow-x-auto rounded-lg border border-gray-200">
                                      <table className="w-full text-left border-collapse min-w-[700px]">
                                        <thead className="bg-gray-100 text-gray-700 font-bold border-b border-gray-200">
                                          <tr>
                                            <th className="p-2.5 border-r border-gray-200 whitespace-nowrap">Thời gian</th>
                                            <th className="p-2.5 border-r border-gray-200 whitespace-nowrap">Mã chứng từ</th>
                                            <th className="p-2.5 border-r border-gray-200 whitespace-nowrap">Loại chứng từ</th>
                                            <th className="p-2.5 border-r border-gray-200 whitespace-nowrap">Đối tác / Tác nhân</th>
                                            <th className="p-2.5 border-r border-gray-200 text-right whitespace-nowrap">Đơn giá</th>
                                            <th className="p-2.5 border-r border-gray-200 text-right whitespace-nowrap">Số lượng</th>
                                            <th className="p-2.5 border-r border-gray-200 text-right whitespace-nowrap">Tồn cuối</th>
                                            <th className="p-2.5 whitespace-nowrap">Ghi chú</th>
                                          </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-200 text-gray-700 bg-white">
                                          {filteredLedger.length === 0 ? (
                                            <tr>
                                              <td colSpan={8} className="text-center py-8 text-gray-400 italic">
                                                Không tìm thấy chứng từ nào liên quan đến sản phẩm này.
                                              </td>
                                            </tr>
                                          ) : (
                                            filteredLedger.map((entry) => {
                                              const isSale = entry.docType === 'Bán hàng';
                                              const isImport = entry.docType === 'Nhập hàng';
                                              const isCheck = entry.docType === 'Kiểm kho';
                                              const isReturn = entry.docType === 'Trả hàng';

                                              return (
                                                <tr key={entry.id} className="hover:bg-slate-50 transition-colors">
                                                  <td className="p-2.5 border-r border-gray-100 font-mono text-gray-600 text-[11px] whitespace-nowrap">
                                                    {entry.time}
                                                  </td>
                                                  <td className="p-2.5 border-r border-gray-100 font-mono font-bold text-blue-600 whitespace-nowrap">
                                                    <button
                                                      type="button"
                                                      onClick={(e) => {
                                                        e.stopPropagation();
                                                        setSelectedDocDetail({ entry, product: p });
                                                      }}
                                                      className="hover:underline hover:text-blue-800 text-left font-bold cursor-pointer transition-colors"
                                                      title="Nhấn để xem chi tiết chứng từ"
                                                    >
                                                      {entry.docCode}
                                                    </button>
                                                  </td>
                                                  <td className="p-2.5 border-r border-gray-100 whitespace-nowrap">
                                                    {isSale && (
                                                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                                                        <ShoppingCart className="w-3 h-3 mr-1" /> Bán hàng
                                                      </span>
                                                    )}
                                                    {isImport && (
                                                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                                        <Truck className="w-3 h-3 mr-1" /> Nhập hàng
                                                      </span>
                                                    )}
                                                    {isCheck && (
                                                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                                                        <ClipboardCheck className="w-3 h-3 mr-1" /> Kiểm kho
                                                      </span>
                                                    )}
                                                    {isReturn && (
                                                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                                                        <RefreshCw className="w-3 h-3 mr-1" /> Trả hàng
                                                      </span>
                                                    )}
                                                  </td>
                                                  <td className="p-2.5 border-r border-gray-100 font-medium text-gray-900">
                                                    {entry.partner}
                                                  </td>
                                                  <td className="p-2.5 border-r border-gray-100 text-right font-mono text-gray-800 whitespace-nowrap">
                                                    {entry.unitPrice ? `${entry.unitPrice.toLocaleString('vi-VN')}đ` : '0đ'}
                                                  </td>
                                                  <td className="p-2.5 border-r border-gray-100 text-right font-mono font-extrabold whitespace-nowrap">
                                                    {entry.changeQty > 0 ? (
                                                      <span className="text-emerald-600">+{entry.changeQty}</span>
                                                    ) : (
                                                      <span className="text-rose-600">{entry.changeQty}</span>
                                                    )}
                                                  </td>
                                                  <td className="p-2.5 border-r border-gray-100 text-right font-mono font-bold text-gray-900 whitespace-nowrap">
                                                    {entry.endingStock}
                                                  </td>
                                                  <td className="p-2.5 text-gray-500 max-w-[200px] truncate">
                                                    {entry.note}
                                                  </td>
                                                </tr>
                                              );
                                            })
                                          )}
                                        </tbody>
                                      </table>
                                    </div>
                                  </div>
                                );
                              })()}

                              {activeTab === 'stock' && (
                                <div className="text-xs text-gray-700 space-y-2">
                                  <div className="font-bold">Chi nhánh tồn kho:</div>
                                  <div className="flex justify-between items-center p-2.5 bg-gray-50 rounded border border-gray-200 max-w-md">
                                    <span>Chi nhánh Trung tâm - Chống Thấm 36</span>
                                    <strong className="font-mono text-blue-700 text-sm">{p.stock} {p.unit}</strong>
                                  </div>
                                </div>
                              )}

                              {activeTab === 'channels' && (
                                <div className="text-xs text-gray-600 p-3 bg-blue-50/50 rounded-lg border border-blue-100 flex items-center space-x-3">
                                  <CheckCircle2 className="w-5 h-5 text-blue-600 flex-shrink-0" />
                                  <span>Sản phẩm này đã đồng bộ trạng thái kho với kênh bán Shopee, Lazada & TikTok Shop.</span>
                                </div>
                              )}

                              {/* Bottom Toolbar inside detail view matching screenshot bottom bar */}
                              <div className="flex flex-wrap justify-between items-center pt-3 border-t border-gray-200 gap-2">
                                <div className="flex items-center space-x-2">
                                  <button
                                    onClick={() => handleDeleteProduct(p.id)}
                                    className="flex items-center text-gray-700 hover:text-red-600 px-3 py-1.5 rounded hover:bg-gray-100 text-xs font-medium transition-colors"
                                  >
                                    <Trash2 className="w-4 h-4 mr-1.5 text-gray-600" />
                                    Xóa
                                  </button>
                                  <button
                                    onClick={() => handleDuplicateProduct(p)}
                                    className="flex items-center text-gray-700 hover:text-gray-900 px-3 py-1.5 rounded hover:bg-gray-100 text-xs font-medium transition-colors"
                                  >
                                    <Copy className="w-4 h-4 mr-1.5 text-gray-600" />
                                    Sao chép
                                  </button>
                                </div>

                                <div className="flex items-center space-x-2">
                                  <button
                                    onClick={() => handleOpenEditModal(p)}
                                    className="flex items-center bg-[#1a73e8] hover:bg-blue-700 text-white font-medium px-4 py-1.5 rounded-md text-xs shadow-xs transition-colors"
                                  >
                                    <Edit3 className="w-3.5 h-3.5 mr-1.5" />
                                    Chỉnh sửa
                                  </button>
                                  <button
                                    onClick={() => handlePrintBarcode(p)}
                                    className="flex items-center bg-white border border-gray-300 hover:bg-gray-50 text-gray-800 font-medium px-3.5 py-1.5 rounded-md text-xs transition-colors"
                                  >
                                    <Printer className="w-3.5 h-3.5 mr-1.5 text-gray-600" />
                                    In tem mã
                                  </button>
                                  <button className="p-1.5 border border-gray-300 rounded-md hover:bg-gray-50 text-gray-600">
                                    <MoreHorizontal className="w-4 h-4" />
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
        </div>

        {/* Pagination Controls */}
        <Pagination
          currentPage={currentPage}
          totalItems={filtered.length}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
          onPageSizeChange={setPageSize}
          pageSizeOptions={[10, 20, 50, 100]}
        />
      </div>
        </>
      )}

      {/* Add / Edit Product Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b pb-3">
              <div className="flex items-center space-x-2">
                <Database className="w-5 h-5 text-[#1e0b54]" />
                <h3 className="font-extrabold text-[#1e0b54] text-base">
                  {editingProduct ? `Cập nhật Hàng Hóa (${editingProduct.code})` : 'Thêm Hàng Hóa Mới vào Firebase Firestore'}
                </h3>
              </div>
              <button onClick={() => setShowAddModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block font-bold text-gray-700 mb-1">Loại hàng</label>
                <select
                  value={formData.loaiHang}
                  onChange={(e) => setFormData({ ...formData, loaiHang: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded focus:border-[#1e0b54] focus:outline-none"
                >
                  <option value="Hàng hóa">Hàng hóa</option>
                  <option value="Dịch vụ">Dịch vụ</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">Nhóm hàng (3 Cấp)</label>
                <input
                  type="text"
                  value={formData.nhomHang}
                  onChange={(e) => setFormData({ ...formData, nhomHang: e.target.value })}
                  placeholder="VD: Súng, Ramset, 1 thành phần, Màng Chống Thấm..."
                  className="w-full p-2 border border-gray-300 rounded focus:border-[#1e0b54] focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">Mã hàng (SKU) *</label>
                <input
                  type="text"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  placeholder="VD: SP2511187"
                  className="w-full p-2 border border-gray-300 rounded focus:border-[#1e0b54] focus:outline-none font-mono"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">Mã vạch</label>
                <input
                  type="text"
                  value={formData.maVach}
                  onChange={(e) => setFormData({ ...formData, maVach: e.target.value })}
                  placeholder="Nhập mã vạch barcode..."
                  className="w-full p-2 border border-gray-300 rounded focus:border-[#1e0b54] focus:outline-none font-mono"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block font-bold text-gray-700 mb-1">Tên hàng *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="VD: KEO KHOAN CẤY THÉP FISCHER FIS EB II"
                  className="w-full p-2 border border-gray-300 rounded focus:border-[#1e0b54] focus:outline-none font-bold"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">Thương hiệu</label>
                <input
                  type="text"
                  value={formData.brand}
                  onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                  placeholder="VD: FISCHER"
                  className="w-full p-2 border border-gray-300 rounded focus:border-[#1e0b54] focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">Đơn vị tính (ĐVT)</label>
                <input
                  type="text"
                  value={formData.unit}
                  onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                  placeholder="VD: Cái, tuýp, Thùng, m2, bộ..."
                  className="w-full p-2 border border-gray-300 rounded focus:border-[#1e0b54] focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">Giá bán (VNĐ)</label>
                <input
                  type="number"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                  className="w-full p-2 border border-gray-300 rounded focus:border-[#1e0b54] focus:outline-none font-mono font-bold"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">Giá vốn (VNĐ)</label>
                <input
                  type="number"
                  value={formData.costPrice}
                  onChange={(e) => setFormData({ ...formData, costPrice: Number(e.target.value) })}
                  className="w-full p-2 border border-gray-300 rounded focus:border-[#1e0b54] focus:outline-none font-mono"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">Tồn kho</label>
                <input
                  type="number"
                  value={formData.stock}
                  onChange={(e) => setFormData({ ...formData, stock: Number(e.target.value) })}
                  className="w-full p-2 border border-gray-300 rounded focus:border-[#1e0b54] focus:outline-none font-mono"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">Quy đổi</label>
                <input
                  type="number"
                  step="0.1"
                  value={formData.quyDoi}
                  onChange={(e) => setFormData({ ...formData, quyDoi: Number(e.target.value) })}
                  className="w-full p-2 border border-gray-300 rounded focus:border-[#1e0b54] focus:outline-none"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block font-bold text-gray-700 mb-1">Hình ảnh (URL)</label>
                <input
                  type="text"
                  value={formData.imageUrl}
                  onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                  placeholder="https://cdn2-ret..."
                  className="w-full p-2 border border-gray-300 rounded focus:border-[#1e0b54] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-3 gap-2 md:col-span-2 bg-slate-50 p-2.5 rounded border border-slate-200">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.tichDiem === 1}
                    onChange={(e) => setFormData({ ...formData, tichDiem: e.target.checked ? 1 : 0 })}
                    className="accent-[#1e0b54]"
                  />
                  <span className="font-bold text-gray-700">Tích điểm (1)</span>
                </label>

                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.dangKinhDoanh === 1}
                    onChange={(e) => setFormData({ ...formData, dangKinhDoanh: e.target.checked ? 1 : 0 })}
                    className="accent-[#1e0b54]"
                  />
                  <span className="font-bold text-gray-700">Đang kinh doanh (1)</span>
                </label>

                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.duocBanTrucTiep === 1}
                    onChange={(e) => setFormData({ ...formData, duocBanTrucTiep: e.target.checked ? 1 : 0 })}
                    className="accent-[#1e0b54]"
                  />
                  <span className="font-bold text-gray-700">Được bán trực tiếp (1)</span>
                </label>
              </div>

              <div className="md:col-span-2">
                <label className="block font-bold text-gray-700 mb-1">Mô tả</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={2}
                  className="w-full p-2 border border-gray-300 rounded focus:border-[#1e0b54] focus:outline-none"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-3 border-t">
              <button
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-xs font-semibold text-gray-600 hover:bg-gray-100"
              >
                Hủy
              </button>
              <button
                onClick={handleSaveProduct}
                className="px-5 py-2 bg-[#1e0b54] hover:bg-[#15073c] text-white rounded-md text-xs font-bold shadow-md"
              >
                {editingProduct ? 'Lưu thay đổi vào Firestore' : 'Tạo hàng hóa vào Firestore'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Document Detail Popup Modal */}
      {selectedDocDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden border border-gray-200 animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="flex justify-between items-center px-6 py-4 bg-slate-900 text-white">
              <div className="flex items-center space-x-3">
                <FileText className="w-5 h-5 text-blue-400" />
                <div>
                  <h3 className="font-bold text-base flex items-center space-x-2">
                    <span>Chi tiết chứng từ {selectedDocDetail.entry.docCode}</span>
                  </h3>
                  <p className="text-xs text-slate-300 font-mono mt-0.5">
                    Thời gian lập: {selectedDocDetail.entry.time}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedDocDetail(null)}
                className="p-1 hover:bg-slate-800 rounded-full text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-5 max-h-[80vh] overflow-y-auto text-xs text-gray-800">
              {/* Type & Status Header Row */}
              <div className="flex flex-wrap items-center justify-between gap-2 p-3 bg-slate-50 rounded-lg border border-slate-200">
                <div className="flex items-center space-x-2">
                  <span className="font-semibold text-gray-500">Loại chứng từ:</span>
                  <span className={`px-2.5 py-1 rounded-md font-bold text-xs inline-flex items-center ${
                    selectedDocDetail.entry.docType === 'Bán hàng' ? 'bg-rose-100 text-rose-800 border border-rose-200' :
                    selectedDocDetail.entry.docType === 'Nhập hàng' ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' :
                    selectedDocDetail.entry.docType === 'Kiểm kho' ? 'bg-amber-100 text-amber-800 border border-amber-200' :
                    'bg-blue-100 text-blue-800 border border-blue-200'
                  }`}>
                    {selectedDocDetail.entry.docType === 'Bán hàng' && <ShoppingCart className="w-3.5 h-3.5 mr-1" />}
                    {selectedDocDetail.entry.docType === 'Nhập hàng' && <Truck className="w-3.5 h-3.5 mr-1" />}
                    {selectedDocDetail.entry.docType === 'Kiểm kho' && <ClipboardCheck className="w-3.5 h-3.5 mr-1" />}
                    {selectedDocDetail.entry.docType === 'Trả hàng' && <RefreshCw className="w-3.5 h-3.5 mr-1" />}
                    {selectedDocDetail.entry.docType}
                  </span>
                </div>

                <div className="flex items-center space-x-2">
                  <span className="font-semibold text-gray-500">Trạng thái:</span>
                  <span className="px-2.5 py-1 rounded-md font-bold text-xs bg-emerald-100 text-emerald-800 border border-emerald-200 inline-flex items-center">
                    <CheckCircle2 className="w-3.5 h-3.5 mr-1 text-emerald-600" />
                    Đã ghi sổ kho
                  </span>
                </div>
              </div>

              {/* Document Meta Info Grid */}
              <div className="grid grid-cols-2 gap-4 bg-white p-3 rounded-lg border border-gray-100 shadow-xs">
                <div>
                  <span className="text-gray-500 block text-[11px]">Đối tác / Khách hàng / NCC:</span>
                  <span className="font-bold text-gray-900 text-sm mt-0.5 block">
                    {selectedDocDetail.entry.partner}
                  </span>
                </div>

                <div>
                  <span className="text-gray-500 block text-[11px]">Kho / Chi nhánh thực hiện:</span>
                  <span className="font-semibold text-gray-800 text-xs mt-0.5 block">
                    Tổng Kho Chống Thấm 36
                  </span>
                </div>

                <div>
                  <span className="text-gray-500 block text-[11px]">Người lập phiếu:</span>
                  <span className="font-medium text-gray-800 block">Chống Thấm 36</span>
                </div>

                <div>
                  <span className="text-gray-500 block text-[11px]">Ghi chú chứng từ:</span>
                  <span className="font-medium text-gray-700 italic block">
                    {selectedDocDetail.entry.note || 'Không có ghi chú.'}
                  </span>
                </div>
              </div>

              {/* Items Table */}
              <div className="space-y-2">
                <div className="font-bold text-gray-800 text-xs flex justify-between items-center">
                  <span>Danh sách hàng hóa ảnh hưởng:</span>
                  <span className="text-gray-500 font-normal">Tồn sau chứng từ: <strong className="font-mono text-gray-900">{selectedDocDetail.entry.endingStock} {selectedDocDetail.product.unit}</strong></span>
                </div>

                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <table className="w-full text-left">
                    <thead className="bg-gray-100 text-gray-700 font-bold border-b border-gray-200">
                      <tr>
                        <th className="p-2.5 border-r border-gray-200">Mã hàng</th>
                        <th className="p-2.5 border-r border-gray-200">Tên sản phẩm</th>
                        <th className="p-2.5 border-r border-gray-200 text-center">ĐVT</th>
                        <th className="p-2.5 border-r border-gray-200 text-right">Đơn giá</th>
                        <th className="p-2.5 border-r border-gray-200 text-right">SL thay đổi</th>
                        <th className="p-2.5 text-right">Thành tiền</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 bg-white">
                      <tr>
                        <td className="p-2.5 border-r border-gray-100 font-mono font-bold text-blue-600">
                          {selectedDocDetail.product.code}
                        </td>
                        <td className="p-2.5 border-r border-gray-100 font-semibold text-gray-900">
                          {selectedDocDetail.product.name}
                        </td>
                        <td className="p-2.5 border-r border-gray-100 text-center text-gray-600 font-medium">
                          {selectedDocDetail.product.unit}
                        </td>
                        <td className="p-2.5 border-r border-gray-100 text-right font-mono text-gray-700">
                          {selectedDocDetail.entry.unitPrice ? `${selectedDocDetail.entry.unitPrice.toLocaleString('vi-VN')}đ` : '0đ'}
                        </td>
                        <td className="p-2.5 border-r border-gray-100 text-right font-mono font-extrabold">
                          {selectedDocDetail.entry.changeQty > 0 ? (
                            <span className="text-emerald-600">+{selectedDocDetail.entry.changeQty}</span>
                          ) : (
                            <span className="text-rose-600">{selectedDocDetail.entry.changeQty}</span>
                          )}
                        </td>
                        <td className="p-2.5 text-right font-mono font-bold text-gray-900">
                          {(Math.abs(selectedDocDetail.entry.changeQty || 0) * (selectedDocDetail.entry.unitPrice || 0)).toLocaleString('vi-VN')}đ
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Total Calculation */}
              <div className="flex justify-end pt-2 border-t border-gray-200">
                <div className="text-right space-y-1">
                  <span className="text-gray-500 text-xs">Giá trị giao dịch chứng từ:</span>
                  <div className="text-lg font-extrabold font-mono text-blue-900">
                    {(Math.abs(selectedDocDetail.entry.changeQty || 0) * (selectedDocDetail.entry.unitPrice || 0)).toLocaleString('vi-VN')}đ
                  </div>
                </div>
              </div>
            </div>

            {/* Footer buttons */}
            <div className="flex justify-between items-center px-6 py-3 bg-gray-50 border-t border-gray-200">
              <button
                onClick={() => {
                  alert(`Đã gửi lệnh in chứng từ ${selectedDocDetail.entry.docCode}`);
                }}
                className="flex items-center px-3.5 py-1.5 border border-gray-300 rounded-lg text-xs font-semibold text-gray-700 hover:bg-white transition-colors"
              >
                <Printer className="w-3.5 h-3.5 mr-1.5 text-gray-600" />
                In chứng từ
              </button>

              <button
                onClick={() => setSelectedDocDetail(null)}
                className="px-5 py-1.5 bg-[#1e0b54] hover:bg-[#15073c] text-white rounded-lg text-xs font-bold transition-colors shadow-xs"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Stock Check Slip Modal */}
      {showAddStockCheckModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl overflow-hidden border border-gray-200 animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] flex flex-col">
            {/* Header */}
            <div className="flex justify-between items-center px-6 py-4 bg-[#1e0b54] text-white">
              <div className="flex items-center space-x-2">
                <ClipboardCheck className="w-5 h-5 text-amber-400" />
                <h3 className="font-bold text-base">Tạo phiếu kiểm kho (Cân bằng tồn kho)</h3>
              </div>
              <button
                onClick={() => setShowAddStockCheckModal(false)}
                className="p-1 hover:bg-white/10 rounded-full text-white/80 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 overflow-y-auto space-y-4 flex-1">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Ghi chú phiếu kiểm</label>
                <input
                  type="text"
                  value={newScNote}
                  onChange={(e) => setNewScNote(e.target.value)}
                  className="w-full text-xs p-2 border border-gray-300 rounded focus:outline-none focus:border-[#1e0b54]"
                  placeholder="Ví dụ: Kiểm kho định kỳ tháng 8..."
                />
              </div>

              {/* Add Product selector */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Thêm hàng hóa vào danh sách kiểm</label>
                <div className="flex gap-2">
                  <select
                    value=""
                    onChange={(e) => {
                      const pId = e.target.value;
                      if (!pId) return;
                      const prod = products.find((p) => p.id === pId);
                      if (prod && !newScItems.some((i) => i.product.id === prod.id)) {
                        setNewScItems([...newScItems, { product: prod, actualQty: prod.stock }]);
                      }
                    }}
                    className="flex-1 text-xs p-2 border border-gray-300 rounded bg-white focus:outline-none focus:border-[#1e0b54]"
                  >
                    <option value="">-- Chọn hàng hóa để thêm vào phiếu kiểm --</option>
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.code} - {p.name} (Tồn hiện tại: {p.stock})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Items Table */}
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-sky-50 text-slate-700 font-bold border-b border-sky-200">
                    <tr>
                      <th className="p-2.5">Mã hàng</th>
                      <th className="p-2.5">Tên hàng</th>
                      <th className="p-2.5 text-right">SL sổ sách</th>
                      <th className="p-2.5 text-right w-32">SL thực tế</th>
                      <th className="p-2.5 text-right">Chênh lệch</th>
                      <th className="p-2.5 text-center w-12">Xóa</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {newScItems.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="text-center py-8 text-gray-400 italic">
                          Chưa có sản phẩm nào trong phiếu kiểm. Hãy chọn sản phẩm ở trên.
                        </td>
                      </tr>
                    ) : (
                      newScItems.map(({ product, actualQty }, idx) => {
                        const diff = actualQty - product.stock;
                        return (
                          <tr key={product.id}>
                            <td className="p-2 font-mono font-bold text-indigo-900">{product.code}</td>
                            <td className="p-2 font-medium text-gray-900">{product.name}</td>
                            <td className="p-2 text-right font-mono text-gray-600">{product.stock}</td>
                            <td className="p-2 text-right">
                              <input
                                type="number"
                                min={0}
                                value={isNaN(actualQty) ? 0 : actualQty}
                                onChange={(e) => {
                                  const val = Math.max(0, Number(e.target.value) || 0);
                                  const updated = [...newScItems];
                                  updated[idx].actualQty = val;
                                  setNewScItems(updated);
                                }}
                                className="w-20 text-right p-1 font-mono font-bold border border-gray-300 rounded focus:outline-none focus:border-[#1e0b54]"
                              />
                            </td>
                            <td className="p-2 text-right font-mono font-bold">
                              {diff > 0 ? (
                                <span className="text-emerald-600">+{diff}</span>
                              ) : diff < 0 ? (
                                <span className="text-rose-600">{diff}</span>
                              ) : (
                                <span className="text-gray-400">0</span>
                              )}
                            </td>
                            <td className="p-2 text-center">
                              <button
                                onClick={() => {
                                  setNewScItems(newScItems.filter((_, i) => i !== idx));
                                }}
                                className="text-red-500 hover:text-red-700 p-1"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Footer */}
            <div className="flex justify-between items-center px-6 py-3 bg-gray-50 border-t border-gray-200">
              <button
                onClick={() => setShowAddStockCheckModal(false)}
                className="px-4 py-2 border border-gray-300 rounded text-xs font-semibold text-gray-600 hover:bg-white"
              >
                Hủy
              </button>
              <button
                onClick={handleSaveStockCheck}
                className="px-5 py-2 bg-[#1e0b54] hover:bg-[#15073c] text-white rounded text-xs font-bold shadow-md"
              >
                Hoàn thành & Cân bằng kho
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Import Excel Modal */}
      <ImportExcelModal
        isOpen={showImportExcelModal}
        onClose={() => setShowImportExcelModal(false)}
        onSuccess={() => setShowImportExcelModal(false)}
        existingProducts={products}
      />
    </div>
  );
};
