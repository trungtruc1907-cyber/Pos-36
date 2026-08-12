import React, { useState } from 'react';
import { Order, PurchaseOrder, ViewMode, Product, Supplier, PaymentMethod, Customer } from '../../types';
import { parseDateToMillis } from '../../utils/dateUtils';
import { Pagination } from '../Pagination';
import { ColumnToggle, ColumnOption } from '../ColumnToggle';
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
  Info,
  X,
  CreditCard,
  Package,
  ClipboardCheck
} from 'lucide-react';

interface OrdersModalProps {
  orders: Order[];
  purchases?: PurchaseOrder[];
  products?: Product[];
  suppliers?: Supplier[];
  customers?: Customer[];
  currentView?: ViewMode;
  onSelectView?: (view: ViewMode) => void;
  onReprintOrder: (order: Order) => void;
  onUpdateOrder?: (id: string, updates: Partial<Order>) => void;
  onAddPurchase?: (purchase: PurchaseOrder) => void;
  onUpdatePurchase?: (id: string, updates: Partial<PurchaseOrder>) => void;
  onDeletePurchase?: (id: string) => void;
  onAddProduct?: (product: Product) => void;
  onUpdateProduct?: (product: Product) => void;
  onAddSupplier?: (supplier: Omit<Supplier, 'id'>) => void;
  onUpdateSupplier?: (id: string, updates: Partial<Supplier>) => void;
}

export const OrdersModal: React.FC<OrdersModalProps> = ({
  orders,
  purchases = [],
  products = [],
  suppliers = [],
  customers = [],
  currentView = 'orders',
  onSelectView,
  onReprintOrder,
  onUpdateOrder,
  onAddPurchase,
  onUpdatePurchase,
  onDeletePurchase,
  onAddProduct,
  onUpdateProduct,
  onAddSupplier,
  onUpdateSupplier,
}) => {
  const [search, setSearch] = useState('');

  const [orderColumns, setOrderColumns] = useState<ColumnOption[]>([
    { key: 'orderCode', label: 'Mã hóa đơn', visible: true },
    { key: 'date', label: 'Thời gian', visible: true },
    { key: 'returnCode', label: 'Mã trả hàng', visible: true },
    { key: 'customerCode', label: 'Mã KH', visible: true },
    { key: 'customerName', label: 'Khách hàng', visible: true },
    { key: 'subtotal', label: 'Tổng tiền hàng', visible: true },
    { key: 'discount', label: 'Giảm giá', visible: true },
    { key: 'netTotal', label: 'Tổng sau giảm giá', visible: true },
    { key: 'paid', label: 'Khách đã trả', visible: true },
  ]);

  const [purchaseColumns, setPurchaseColumns] = useState<ColumnOption[]>([
    { key: 'code', label: 'Mã phiếu', visible: true },
    { key: 'date', label: 'Thời gian', visible: true },
    { key: 'supplierName', label: 'Nhà cung cấp', visible: true },
    { key: 'itemsCount', label: 'Số mặt hàng', visible: true },
    { key: 'totalAmount', label: 'Tổng tiền', visible: true },
    { key: 'status', label: 'Trạng thái', visible: true },
  ]);

  const toggleOrdCol = (key: string) => {
    setOrderColumns((prev) => prev.map((c) => (c.key === key ? { ...c, visible: !c.visible } : c)));
  };

  const togglePurCol = (key: string) => {
    setPurchaseColumns((prev) => prev.map((c) => (c.key === key ? { ...c, visible: !c.visible } : c)));
  };
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  const [orderTab, setOrderTab] = useState<'info' | 'payments'>('info');
  const [editingNotes, setEditingNotes] = useState<Record<string, string>>({});

  // Add Purchase Tab state
  const [showAddPurchaseTab, setShowAddPurchaseTab] = useState<boolean>(false);
  const [editingPurchaseId, setEditingPurchaseId] = useState<string | null>(null);
  const [showExitConfirm, setShowExitConfirm] = useState<boolean>(false);
  const [showCompleteConfirmModal, setShowCompleteConfirmModal] = useState<boolean>(false);

  // Quick Add Product Modal State
  const [showQuickAddProdModal, setShowQuickAddProdModal] = useState<boolean>(false);
  const [quickCreatedProducts, setQuickCreatedProducts] = useState<Product[]>([]);
  const [quickProdName, setQuickProdName] = useState<string>('');
  const [quickProdCode, setQuickProdCode] = useState<string>('');
  const [quickProdUnit, setQuickProdUnit] = useState<string>('bao');
  const [quickProdCategory, setQuickProdCategory] = useState<string>('Chống thấm');
  const [quickProdCostPrice, setQuickProdCostPrice] = useState<number | string>(180000);
  const [quickProdPrice, setQuickProdPrice] = useState<number | string>(250000);
  const [quickProdQuantity, setQuickProdQuantity] = useState<number | string>(1);

  // Quick Add Supplier Modal State
  const [showQuickAddSuppModal, setShowQuickAddSuppModal] = useState<boolean>(false);
  const [quickSuppName, setQuickSuppName] = useState<string>('');
  const [quickSuppCode, setQuickSuppCode] = useState<string>('');
  const [quickSuppPhone, setQuickSuppPhone] = useState<string>('');
  const [quickSuppAddress, setQuickSuppAddress] = useState<string>('');
  const [quickSuppEmail, setQuickSuppEmail] = useState<string>('');
  const [quickSuppDebt, setQuickSuppDebt] = useState<number | string>(0);
  const [quickSuppNote, setQuickSuppNote] = useState<string>('');

  // New Purchase Form local state
  const [purchaseFormType, setPurchaseFormType] = useState<'import' | 'return'>('import');
  const [selectedRefPurchaseCode, setSelectedRefPurchaseCode] = useState<string>('');
  const [newSupplier, setNewSupplier] = useState<string>('');
  const [selectedSupplierCode, setSelectedSupplierCode] = useState<string>('');
  const [newPurchaseCode, setNewPurchaseCode] = useState<string>('');
  const [newOrderCode, setNewOrderCode] = useState<string>('');
  const [newInvoiceNo, setNewInvoiceNo] = useState<string>('');
  const [newDiscount, setNewDiscount] = useState<number>(0);
  const [discountType, setDiscountType] = useState<'amount' | 'percent'>('amount');
  const [newNote, setNewNote] = useState<string>('');
  const [paidToSupplier, setPaidToSupplier] = useState<number | string>(0);
  const [paymentMethod, setPaymentMethod] = useState<string>('Tiền mặt');

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

  // Edit Order Modal local state
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [showEditOrderModal, setShowEditOrderModal] = useState<boolean>(false);
  const [editOrderCode, setEditOrderCode] = useState<string>('');
  const [editOrderCustomerName, setEditOrderCustomerName] = useState<string>('');
  const [editOrderCustomerCode, setEditOrderCustomerCode] = useState<string>('');
  const [editOrderDate, setEditOrderDate] = useState<string>('');
  const [editOrderItems, setEditOrderItems] = useState<
    {
      product: Product;
      quantity: number;
      unitPrice: number;
      note?: string;
    }[]
  >([]);
  const [editOrderDiscount, setEditOrderDiscount] = useState<number>(0);
  const [editOrderSurcharge, setEditOrderSurcharge] = useState<number>(0);
  const [editOrderAmountPaid, setEditOrderAmountPaid] = useState<number>(0);
  const [editOrderPaymentMethod, setEditOrderPaymentMethod] = useState<PaymentMethod>('cash');
  const [editOrderNote, setEditOrderNote] = useState<string>('');
  const [editOrderStatus, setEditOrderStatus] = useState<'Đã thanh toán' | 'Đã hủy' | 'Trả hàng'>('Đã thanh toán');

  const [orderProdSearchKey, setOrderProdSearchKey] = useState<string>('');
  const [showOrderProdDropdown, setShowOrderProdDropdown] = useState<boolean>(false);
  const [orderCustSearchKey, setOrderCustSearchKey] = useState<string>('');
  const [showOrderCustDropdown, setShowOrderCustDropdown] = useState<boolean>(false);

  const handleOpenEditOrder = (ord: Order) => {
    setEditingOrder(ord);
    setEditOrderCode(ord.orderCode || '');
    setEditOrderCustomerName(ord.customerName || 'Khách lẻ');
    setEditOrderCustomerCode(ord.customerCode || 'KH000009');
    setEditOrderDate(ord.date || '');

    if (ord.items && ord.items.length > 0) {
      setEditOrderItems(
        ord.items.map((it) => {
          const matchedProd = products.find(
            (p) => p.code === it.product?.code || p.id === it.product?.id || p.name === it.product?.name
          );
          return {
            product: it.product || matchedProd || {
              id: `prod-${Date.now()}`,
              code: 'SP001',
              name: 'Sản phẩm vật tư',
              price: it.unitPrice || 100000,
              costPrice: 80000,
              stock: 100,
              unit: 'cái',
              category: 'Chung'
            },
            quantity: it.quantity || 1,
            unitPrice: it.unitPrice || 0,
            note: it.note || ''
          };
        })
      );
    } else {
      setEditOrderItems([]);
    }

    setEditOrderDiscount(ord.discount || 0);
    setEditOrderSurcharge(ord.surcharge || 0);
    setEditOrderAmountPaid(ord.amountPaid !== undefined ? ord.amountPaid : (ord.totalAmount || 0));
    setEditOrderPaymentMethod(ord.paymentMethod || 'cash');
    setEditOrderNote(ord.note || '');
    setEditOrderStatus(ord.status || 'Đã thanh toán');

    setShowEditOrderModal(true);
  };

  const handleSaveOrderEdits = () => {
    if (!editingOrder) return;

    if (editOrderItems.length === 0) {
      alert('Vui lòng chọn ít nhất 1 sản phẩm cho hóa đơn!');
      return;
    }

    const subtotal = editOrderItems.reduce(
      (sum, item) => sum + item.quantity * item.unitPrice,
      0
    );
    const totalAmount = Math.max(0, subtotal - editOrderDiscount + editOrderSurcharge);
    const itemsCount = editOrderItems.reduce((sum, item) => sum + item.quantity, 0);

    const updatedOrderData: Partial<Order> = {
      orderCode: editOrderCode,
      customerName: editOrderCustomerName,
      customerCode: editOrderCustomerCode,
      date: editOrderDate,
      items: editOrderItems,
      subtotal,
      discount: editOrderDiscount,
      surcharge: editOrderSurcharge,
      totalAmount,
      amountPaid: editOrderAmountPaid,
      itemsCount,
      paymentMethod: editOrderPaymentMethod,
      status: editOrderStatus,
      note: editOrderNote,
    };

    // Calculate stock changes if onUpdateProduct is provided
    if (onUpdateProduct) {
      const oldQtyMap: Record<string, number> = {};
      if (editingOrder.items) {
        editingOrder.items.forEach((it) => {
          const code = it.product?.code || it.product?.id;
          if (code) {
            oldQtyMap[code] = (oldQtyMap[code] || 0) + (Number(it.quantity) || 0);
          }
        });
      }

      const newQtyMap: Record<string, number> = {};
      editOrderItems.forEach((it) => {
        const code = it.product?.code || it.product?.id;
        if (code) {
          newQtyMap[code] = (newQtyMap[code] || 0) + (Number(it.quantity) || 0);
        }
      });

      const allProductCodes = Array.from(new Set([...Object.keys(oldQtyMap), ...Object.keys(newQtyMap)]));

      allProductCodes.forEach((code) => {
        const oldQty = oldQtyMap[code] || 0;
        const newQty = newQtyMap[code] || 0;
        const deltaQty = newQty - oldQty;

        if (deltaQty !== 0) {
          const prod = products.find((p) => p.code === code || p.id === code);
          if (prod) {
            const currentStock = Number(prod.stock || 0);
            const updatedStock = Math.max(0, currentStock - deltaQty);
            onUpdateProduct({ ...prod, stock: updatedStock });
          }
        }
      });
    }

    if (onUpdateOrder) {
      onUpdateOrder(editingOrder.id, updatedOrderData);
    }

    alert(`Đã cập nhật thông tin hóa đơn ${editOrderCode} thành công!`);
    setShowEditOrderModal(false);
    setEditingOrder(null);
  };

  // Pagination states
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);

  React.useEffect(() => {
    setCurrentPage(1);
    setShowAddPurchaseTab(false);
  }, [currentView]);

  const filteredOrders = React.useMemo(() => {
    const list = orders.filter((o) => {
      const isReturn = o.status === 'Trả hàng' || Boolean(o.returnCode) || o.orderCode.startsWith('HDTH') || o.orderCode.startsWith('TH');
      if (currentView === 'returns') {
        if (!isReturn) return false;
      } else if (currentView === 'orders') {
        if (isReturn) return false;
      }
      return (
        o.orderCode.toLowerCase().includes(search.toLowerCase()) ||
        o.customerName.toLowerCase().includes(search.toLowerCase())
      );
    });
    return list.sort((a, b) => {
      const timeA = parseDateToMillis(a.date, a.createdAt);
      const timeB = parseDateToMillis(b.date, b.createdAt);
      if (timeA !== timeB) return timeB - timeA;
      return b.orderCode.localeCompare(a.orderCode);
    });
  }, [orders, search, currentView]);

  const filteredPurchases = React.useMemo(() => {
    const list = purchases.filter((p) => {
      const isReturn = p.type === 'return' || p.code.startsWith('THN') || p.status === 'Đã trả hàng';
      if (currentView === 'purchase-returns') {
        if (!isReturn) return false;
      } else if (currentView === 'purchases') {
        if (isReturn) return false;
      }
      return (
        p.code.toLowerCase().includes(search.toLowerCase()) ||
        p.supplierName.toLowerCase().includes(search.toLowerCase())
      );
    });
    return list.sort((a, b) => {
      const timeA = parseDateToMillis(pDate(a), a.createdAt);
      const timeB = parseDateToMillis(pDate(b), b.createdAt);
      if (timeA !== timeB) return timeB - timeA;
      return b.code.localeCompare(a.code);
    });
  }, [purchases, search, currentView]);

  function pDate(p: PurchaseOrder): string {
    return p.date || '';
  }

  const paginatedOrders = React.useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredOrders.slice(start, start + pageSize);
  }, [filteredOrders, currentPage, pageSize]);

  const paginatedPurchases = React.useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredPurchases.slice(start, start + pageSize);
  }, [filteredPurchases, currentPage, pageSize]);

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

  const handleOpenEditPurchase = (p: PurchaseOrder) => {
    setEditingPurchaseId(p.id);
    const isRet = p.type === 'return' || p.code?.startsWith('THN') || p.status === 'Đã trả hàng';
    setPurchaseFormType(isRet ? 'return' : 'import');
    setNewPurchaseCode(p.code || '');
    setNewSupplier(p.supplierName || '');
    setSelectedRefPurchaseCode(p.originalPurchaseCode || '');

    const matchedSupp = suppliers.find((s) => s.name === p.supplierName);
    setSelectedSupplierCode(matchedSupp ? matchedSupp.code : '');

    setNewNote(p.note || '');
    setNewDiscount(p.discount || 0);
    setDiscountType('amount');
    setPaidToSupplier(p.paidAmount || 0);

    if (p.items && p.items.length > 0) {
      setNewPurchaseItems(
        p.items.map((it) => {
          const matchedProd = products.find(
            (prod) => prod.code === it.productCode || prod.name === it.productName
          );
          return {
            productCode: it.productCode || matchedProd?.code || '',
            productName: it.productName || matchedProd?.name || '',
            unit: matchedProd?.unit || 'bao',
            quantity: it.quantity || 1,
            unitPrice: it.unitPrice || it.importPrice || matchedProd?.importPrice || 0,
            discount: it.discount || 0,
          };
        })
      );
    } else {
      setNewPurchaseItems([]);
    }

    setShowAddPurchaseTab(true);
  };

  const handleCreateReturnFromPurchase = (p: PurchaseOrder) => {
    setEditingPurchaseId(null);
    setPurchaseFormType('return');
    setNewPurchaseCode(`THN${String(Math.floor(100000 + Math.random() * 900000))}`);
    setNewSupplier(p.supplierName || '');
    const matchedSupp = suppliers.find((s) => s.name === p.supplierName);
    setSelectedSupplierCode(matchedSupp ? matchedSupp.code : '');
    setSelectedRefPurchaseCode(p.code || '');
    setNewNote(`Trả hàng từ phiếu nhập ${p.code}`);
    setNewDiscount(0);
    setDiscountType('amount');
    setPaidToSupplier(0);

    if (p.items && p.items.length > 0) {
      setNewPurchaseItems(
        p.items.map((it) => {
          const matchedProd = products.find(
            (prod) => prod.code === it.productCode || prod.name === it.productName
          );
          return {
            productCode: it.productCode || matchedProd?.code || '',
            productName: it.productName || matchedProd?.name || '',
            unit: matchedProd?.unit || 'bao',
            quantity: it.quantity || 1,
            unitPrice: it.unitPrice || it.importPrice || matchedProd?.importPrice || 0,
            discount: it.discount || 0,
          };
        })
      );
    } else {
      setNewPurchaseItems([]);
    }

    setShowAddPurchaseTab(true);
  };

  const handleSaveNewPurchase = (status: 'Phiếu tạm' | 'Đã nhập hàng' | 'Đã trả hàng') => {
    if (newPurchaseItems.length === 0) {
      alert('Vui lòng chọn ít nhất 1 sản phẩm!');
      return;
    }

    const targetStatus = purchaseFormType === 'return'
      ? (status === 'Phiếu tạm' ? 'Phiếu tạm' : 'Đã trả hàng')
      : (status === 'Phiếu tạm' ? 'Phiếu tạm' : 'Đã nhập hàng');

    if (targetStatus === 'Đã nhập hàng' || targetStatus === 'Đã trả hàng') {
      setShowCompleteConfirmModal(true);
    } else {
      executeSavePurchase('Phiếu tạm');
    }
  };

  const executeSavePurchase = (status: 'Phiếu tạm' | 'Đã nhập hàng' | 'Đã trả hàng') => {
    setShowCompleteConfirmModal(false);

    const isReturn = purchaseFormType === 'return';
    const defaultPrefix = isReturn ? 'THN' : 'PN';
    const code = newPurchaseCode.trim() || `${defaultPrefix}${String(Math.floor(100000 + Math.random() * 900000))}`;
    const now = new Date();
    const dateFormatted = `${now.getDate().toString().padStart(2, '0')}/${(now.getMonth() + 1).toString().padStart(2, '0')}/${now.getFullYear()} ${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

    const calculatedTotalItems = newPurchaseItems.reduce(
      (sum, item) => sum + (item.quantity * item.unitPrice - item.discount),
      0
    );
    const actualDiscount =
      discountType === 'percent'
        ? (calculatedTotalItems * newDiscount) / 100
        : newDiscount;
    const calculatedNetTotal = Math.max(0, calculatedTotalItems - actualDiscount);
    const paidVal = (typeof paidToSupplier === 'number' && !isNaN(paidToSupplier)) ? paidToSupplier : (parseFloat(paidToSupplier as string) || 0);

    const purchasePayload: Partial<PurchaseOrder> = {
      code,
      type: isReturn ? 'return' : 'import',
      originalPurchaseCode: isReturn ? selectedRefPurchaseCode : undefined,
      supplierName: newSupplier.trim() || 'Chưa chọn nhà cung cấp',
      itemsCount: newPurchaseItems.length || 1,
      totalAmount: calculatedNetTotal,
      status,
      paidAmount: paidVal,
      paymentMethod,
      note: newNote,
      discount: actualDiscount,
      items: newPurchaseItems.map((item) => ({
        productCode: item.productCode,
        productName: item.productName,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        importPrice: item.unitPrice,
        discount: item.discount,
      })),
    };

    if (editingPurchaseId) {
      if (onUpdatePurchase) {
        onUpdatePurchase(editingPurchaseId, {
          ...purchasePayload,
          date: dateFormatted,
        });
      } else if (onAddPurchase) {
        onAddPurchase({
          id: editingPurchaseId,
          date: dateFormatted,
          creator: 'Chống Thấm 36',
          buyer: 'Chống Thấm 36',
          ...purchasePayload,
        } as PurchaseOrder);
      }
    } else {
      const createdPurchase: PurchaseOrder = {
        id: `po-${Date.now()}`,
        code,
        date: dateFormatted,
        creator: 'Chống Thấm 36',
        buyer: 'Chống Thấm 36',
        ...purchasePayload,
      } as PurchaseOrder;

      if (onAddPurchase) {
        onAddPurchase(createdPurchase);
      }
    }

    // 1. Stock Updates
    const existingP = editingPurchaseId ? purchases.find((p) => p.id === editingPurchaseId) : null;
    const wasCompletedBefore = existingP && (existingP.status === 'Đã nhập hàng' || existingP.status === 'Đã trả hàng');

    const combinedProducts = [...products];
    quickCreatedProducts.forEach((qp) => {
      if (!combinedProducts.some((p) => p.id === qp.id || p.code === qp.code)) {
        combinedProducts.push(qp);
      }
    });

    const oldQtyMap: Record<string, number> = {};
    if (wasCompletedBefore && existingP?.items) {
      existingP.items.forEach((it) => {
        const matched = combinedProducts.find(
          (p) =>
            p.code === it.productCode ||
            p.id === it.productCode ||
            (p.name && it.productName && p.name.toLowerCase() === it.productName.toLowerCase())
        );
        const pCode = matched?.code || it.productCode;
        if (pCode) {
          oldQtyMap[pCode] = (oldQtyMap[pCode] || 0) + (Number(it.quantity) || 0);
        }
      });
    }

    const newQtyMap: Record<string, number> = {};
    const isCompletedNow = status === 'Đã nhập hàng' || status === 'Đã trả hàng';
    if (isCompletedNow) {
      newPurchaseItems.forEach((it) => {
        const matched = combinedProducts.find(
          (p) =>
            p.code === it.productCode ||
            (p.name && it.productName && p.name.toLowerCase() === it.productName.toLowerCase())
        );
        const pCode = matched?.code || it.productCode;
        if (pCode) {
          newQtyMap[pCode] = (newQtyMap[pCode] || 0) + (Number(it.quantity) || 0);
        }
      });
    }

    const allProductCodes = Array.from(new Set([...Object.keys(oldQtyMap), ...Object.keys(newQtyMap)]));

    allProductCodes.forEach((pCode) => {
      const oldQty = oldQtyMap[pCode] || 0;
      const newQty = newQtyMap[pCode] || 0;

      // Import: stock INCREASES (+newQty - oldQty)
      // Return: stock DECREASES (-newQty + oldQty)
      const deltaStock = isReturn ? -(newQty - oldQty) : (newQty - oldQty);

      if (deltaStock !== 0 || isCompletedNow) {
        const prod = combinedProducts.find(
          (p) =>
            p.code === pCode ||
            p.id === pCode ||
            (p.name && pCode && p.name.toLowerCase() === pCode.toLowerCase())
        );
        if (prod && onUpdateProduct) {
          const currentStock = Number(prod.stock || 0);
          const updatedStock = Math.max(0, currentStock + deltaStock);
          const newItem = newPurchaseItems.find(
            (it) => it.productCode === pCode || (it.productName && prod.name && it.productName.toLowerCase() === prod.name.toLowerCase())
          );
          const newCostPrice = (!isReturn && newItem && newItem.unitPrice) ? newItem.unitPrice : prod.costPrice;

          onUpdateProduct({
            ...prod,
            stock: updatedStock,
            costPrice: newCostPrice,
          });
        }
      }
    });

    // 2. Supplier Debt Updates
    const currentSupplierName = newSupplier.trim();
    const oldSupplierName = existingP?.supplierName?.trim() || '';

    const isSupplierChanged =
      !!existingP &&
      !!oldSupplierName &&
      !!currentSupplierName &&
      oldSupplierName.toLowerCase() !== currentSupplierName.toLowerCase();

    const oldWasCompleted = existingP && (existingP.status === 'Đã nhập hàng' || existingP.status === 'Đã trả hàng');
    const oldWasReturn = existingP && (existingP.type === 'return' || existingP.code?.startsWith('THN') || existingP.status === 'Đã trả hàng');
    const oldTotal = oldWasCompleted ? (existingP.totalAmount || 0) : 0;
    const oldPaid = oldWasCompleted ? (existingP.paidAmount || 0) : 0;
    const oldNetDebt = Math.max(0, oldTotal - oldPaid);

    if (isSupplierChanged && oldWasCompleted) {
      const oldSupp = suppliers.find(
        (s) =>
          s.name.toLowerCase() === oldSupplierName.toLowerCase() ||
          (existingP.supplierCode && s.code === existingP.supplierCode)
      );
      if (oldSupp && onUpdateSupplier) {
        const revertDebt = oldWasReturn ? oldNetDebt : -oldNetDebt;
        const revertTotal = oldWasReturn ? oldTotal : -oldTotal;
        const updatedOldDebt = Math.max(0, Number(oldSupp.currentDebt || 0) + revertDebt);
        const updatedOldTotal = Math.max(0, Number(oldSupp.totalPurchased || 0) + revertTotal);
        onUpdateSupplier(oldSupp.id, {
          currentDebt: updatedOldDebt,
          totalPurchased: updatedOldTotal,
        });
      }
    }

    const supp = suppliers.find(
      (s) =>
        s.name.toLowerCase() === currentSupplierName.toLowerCase() ||
        (selectedSupplierCode && s.code === selectedSupplierCode)
    );

    const remainingDebt = Math.max(0, calculatedNetTotal - paidVal);

    let netDebtToAdd: number;
    let netTotalToAdd: number;

    if (isReturn) {
      if (isSupplierChanged) {
        netDebtToAdd = isCompletedNow ? -remainingDebt : 0;
        netTotalToAdd = isCompletedNow ? -calculatedNetTotal : 0;
      } else {
        const prevImpactDebt = oldWasCompleted ? (oldWasReturn ? -oldNetDebt : oldNetDebt) : 0;
        const prevImpactTotal = oldWasCompleted ? (oldWasReturn ? -oldTotal : oldTotal) : 0;
        const newImpactDebt = isCompletedNow ? -remainingDebt : 0;
        const newImpactTotal = isCompletedNow ? -calculatedNetTotal : 0;
        netDebtToAdd = newImpactDebt - prevImpactDebt;
        netTotalToAdd = newImpactTotal - prevImpactTotal;
      }
    } else {
      if (isSupplierChanged) {
        netDebtToAdd = isCompletedNow ? remainingDebt : 0;
        netTotalToAdd = isCompletedNow ? calculatedNetTotal : 0;
      } else {
        const prevImpactDebt = oldWasCompleted ? (oldWasReturn ? -oldNetDebt : oldNetDebt) : 0;
        const prevImpactTotal = oldWasCompleted ? (oldWasReturn ? -oldTotal : oldTotal) : 0;
        const newImpactDebt = isCompletedNow ? remainingDebt : 0;
        const newImpactTotal = isCompletedNow ? calculatedNetTotal : 0;
        netDebtToAdd = newImpactDebt - prevImpactDebt;
        netTotalToAdd = newImpactTotal - prevImpactTotal;
      }
    }

    if (supp && onUpdateSupplier) {
      const updatedDebt = Math.max(0, Number(supp.currentDebt || 0) + netDebtToAdd);
      const updatedTotalPurchased = Math.max(0, Number(supp.totalPurchased || 0) + netTotalToAdd);
      onUpdateSupplier(supp.id, {
        currentDebt: updatedDebt,
        totalPurchased: updatedTotalPurchased,
      });
    } else if (onAddSupplier && currentSupplierName && isCompletedNow) {
      const suppCode = selectedSupplierCode || `NCC${Math.floor(100000 + Math.random() * 900000)}`;
      onAddSupplier({
        code: suppCode,
        name: currentSupplierName,
        phone: '',
        email: '',
        address: '',
        note: isReturn ? 'Tự động tạo khi trả hàng nhập' : 'Tự động tạo khi hoàn thành phiếu nhập',
        currentDebt: isReturn ? 0 : remainingDebt,
        totalPurchased: isReturn ? 0 : calculatedNetTotal,
      });
    }

    const wasEditing = !!editingPurchaseId;
    setEditingPurchaseId(null);
    setNewPurchaseItems([]);
    setNewPurchaseCode('');
    setNewOrderCode('');
    setNewInvoiceNo('');
    setNewDiscount(0);
    setNewNote('');
    setPaidToSupplier(0);
    setSelectedRefPurchaseCode('');
    setShowAddPurchaseTab(false);

    alert(
      wasEditing
        ? `Đã hoàn thành! Phiếu gốc đã được cập nhật thành công (${code}). Tồn kho và công nợ đã được ghi nhận.`
        : (isReturn
          ? (status === 'Đã trả hàng'
            ? `Đã hoàn thành phiếu trả hàng ${code}! Tồn kho hàng hóa và công nợ nhà cung cấp đã được tự động trừ.`
            : `Đã lưu tạm phiếu trả hàng ${code}!`)
          : (status === 'Đã nhập hàng'
            ? `Đã hoàn thành phiếu nhập ${code}! Tồn kho hàng hóa và công nợ nhà cung cấp đã được tự động cập nhật.`
            : `Đã lưu tạm phiếu nhập ${code}!`))
    );
  };

  const handleOpenQuickAddSuppModal = () => {
    setQuickSuppName(newSupplier.trim());
    const nextNum = suppliers.length + 1;
    setQuickSuppCode(`NCC${String(nextNum).padStart(6, '0')}`);
    setQuickSuppPhone('');
    setQuickSuppAddress('');
    setQuickSuppEmail('');
    setQuickSuppDebt(0);
    setQuickSuppNote('');
    setShowQuickAddSuppModal(true);
  };

  const handleSaveQuickSupplier = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickSuppName.trim()) {
      alert('Vui lòng nhập tên Nhà cung cấp!');
      return;
    }

    const finalCode = quickSuppCode.trim() || `NCC${Math.floor(100000 + Math.random() * 900000)}`;
    const initialDebt = (typeof quickSuppDebt === 'number' && !isNaN(quickSuppDebt)) ? quickSuppDebt : (parseFloat(quickSuppDebt as string) || 0);

    const newSupp: Omit<Supplier, 'id'> = {
      code: finalCode,
      name: quickSuppName.trim(),
      phone: quickSuppPhone.trim(),
      email: quickSuppEmail.trim(),
      address: quickSuppAddress.trim(),
      note: quickSuppNote.trim(),
      currentDebt: initialDebt,
      totalPurchased: 0,
    };

    if (onAddSupplier) {
      onAddSupplier(newSupp);
    }

    setNewSupplier(quickSuppName.trim());
    setSelectedSupplierCode(finalCode);
    setShowSuppDropdown(false);
    setShowQuickAddSuppModal(false);
  };

  const handleOpenQuickAddProdModal = () => {
    setQuickProdName(prodSearchKey.trim());
    setQuickProdCode(`SP${Math.floor(100000 + Math.random() * 900000)}`);
    setQuickProdUnit('bao');
    setQuickProdCategory('Chống thấm');
    setQuickProdCostPrice(180000);
    setQuickProdPrice(250000);
    setQuickProdQuantity(1);
    setShowQuickAddProdModal(true);
  };

  const handleSaveQuickProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickProdName.trim()) {
      alert('Vui lòng nhập tên hàng hóa!');
      return;
    }

    const finalCode = quickProdCode.trim() || `SP${Math.floor(100000 + Math.random() * 900000)}`;
    const costP = (typeof quickProdCostPrice === 'number' && !isNaN(quickProdCostPrice)) ? quickProdCostPrice : (parseFloat(quickProdCostPrice) || 0);
    const sellP = (typeof quickProdPrice === 'number' && !isNaN(quickProdPrice)) ? quickProdPrice : (parseFloat(quickProdPrice) || costP);
    const qty = Math.max(1, (typeof quickProdQuantity === 'number' && !isNaN(quickProdQuantity)) ? quickProdQuantity : (parseInt(quickProdQuantity) || 1));

    const newProd: Product = {
      id: `prod-${Date.now()}`,
      code: finalCode,
      name: quickProdName.trim(),
      unit: quickProdUnit || 'bao',
      category: quickProdCategory || 'Chống thấm',
      price: sellP,
      costPrice: costP,
      stock: 0,
      loaiHang: 'Hàng hóa',
      dangKinhDoanh: 1,
      duocBanTrucTiep: 1,
    };

    if (onAddProduct) {
      onAddProduct(newProd);
    }

    setQuickCreatedProducts((prev) => [...prev, newProd]);

    setNewPurchaseItems((prev) => [
      ...prev,
      {
        productCode: finalCode,
        productName: quickProdName.trim(),
        unit: quickProdUnit || 'bao',
        quantity: qty,
        unitPrice: costP,
        discount: 0,
      },
    ]);

    setProdSearchKey('');
    setShowProdDropdown(false);
    setShowQuickAddProdModal(false);
  };

  // If user opened "Thêm phiếu nhập" tab
  if (showAddPurchaseTab) {
    const calculatedTotalItems = newPurchaseItems.reduce(
      (sum, item) => sum + (item.quantity * item.unitPrice - item.discount),
      0
    );
    const actualDiscount =
      discountType === 'percent'
        ? (calculatedTotalItems * newDiscount) / 100
        : newDiscount;
    const calculatedNetTotal = Math.max(0, calculatedTotalItems - actualDiscount);

    const defaultProductsList = products || [];

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
            <h2 className="text-base font-extrabold text-gray-900 whitespace-nowrap">
              {editingPurchaseId ? `Chỉnh sửa phiếu nhập ${newPurchaseCode}` : 'Nhập hàng'}
            </h2>

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
                  <button
                    type="button"
                    onClick={handleOpenQuickAddProdModal}
                    className="p-0.5 hover:bg-blue-50 text-gray-500 hover:text-blue-600 rounded transition-colors"
                    title="Thêm nhanh hàng hóa mới"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Dropdown Menu */}
              {showProdDropdown && prodSearchKey && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-xl z-50 max-h-60 overflow-y-auto">
                  {filteredProdOptions.length > 0 ? (
                    filteredProdOptions.map((p, pIdx) => (
                      <div
                        key={p.id ? `${p.id}-${pIdx}` : `prod-opt-${pIdx}`}
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
                                unitPrice: p.costPrice ?? (p as any).importPrice ?? 0,
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
                            {(p.costPrice ?? (p as any).importPrice ?? 0).toLocaleString('vi-VN')}đ
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
                              <span>{(rowTotal || 0).toLocaleString('vi-VN')}</span>
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
                        const val = e.target.value;
                        setNewSupplier(val);
                        setShowSuppDropdown(val.trim().length > 0);
                      }}
                      onFocus={() => {
                        if (newSupplier.trim().length > 0) {
                          setShowSuppDropdown(true);
                        }
                      }}
                      placeholder="Tìm kiếm nhà cung cấp (F4)"
                      className="w-full text-xs font-semibold text-gray-800 placeholder-gray-400 bg-transparent focus:outline-none"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleOpenQuickAddSuppModal}
                    className="p-1.5 border border-gray-300 hover:bg-blue-50 hover:text-blue-600 rounded-lg text-gray-600 transition-colors"
                    title="Thêm Nhà cung cấp mới"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>

                {showSuppDropdown && newSupplier.trim().length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-xl z-50 max-h-56 overflow-y-auto">
                    {suppliers.filter(
                      (s) =>
                        s.name.toLowerCase().includes(newSupplier.toLowerCase()) ||
                        s.code.toLowerCase().includes(newSupplier.toLowerCase()) ||
                        s.phone.includes(newSupplier)
                    ).length > 0 ? (
                      suppliers
                        .filter(
                          (s) =>
                            s.name.toLowerCase().includes(newSupplier.toLowerCase()) ||
                            s.code.toLowerCase().includes(newSupplier.toLowerCase()) ||
                            s.phone.includes(newSupplier)
                        )
                        .map((s, sIdx) => (
                          <div
                            key={s.id ? `${s.id}-${sIdx}` : `supp-opt-${sIdx}`}
                            onClick={() => {
                              setNewSupplier(s.name);
                              setSelectedSupplierCode(s.code);
                              setShowSuppDropdown(false);
                            }}
                            className="p-2 hover:bg-blue-50 cursor-pointer text-xs border-b border-gray-100 flex justify-between items-center"
                          >
                            <div>
                              <span className="font-mono font-bold text-blue-600 mr-2">{s.code}</span>
                              <span className="font-semibold text-gray-900">{s.name}</span>
                              {s.phone && <span className="text-gray-500 text-[11px] ml-1">({s.phone})</span>}
                            </div>
                            <div className="text-right">
                              <span className="text-[11px] text-gray-500">Nợ: </span>
                              <span className="font-mono font-bold text-rose-600">
                                {(s.currentDebt || 0).toLocaleString('vi-VN')}đ
                              </span>
                            </div>
                          </div>
                        ))
                    ) : (
                      <div className="p-3 text-center text-xs text-gray-500">
                        Không tìm thấy nhà cung cấp. Click dấu <Plus className="w-3.5 h-3.5 inline mx-0.5 text-blue-600" /> để thêm mới!
                      </div>
                    )}
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
                      {(calculatedTotalItems || 0).toLocaleString('vi-VN')}
                    </span>
                  </div>

                  <div className="flex justify-between items-center">
                    <div className="flex flex-col">
                      <span className="text-gray-600 font-medium">Giảm giá</span>
                      {discountType === 'percent' && newDiscount > 0 && (
                        <span className="text-[10px] text-gray-500 font-mono">
                          ({(actualDiscount || 0).toLocaleString('vi-VN')}đ)
                        </span>
                      )}
                    </div>
                    <div className="flex items-center space-x-1">
                      <input
                        type="number"
                        min="0"
                        max={discountType === 'percent' ? 100 : undefined}
                        value={newDiscount === 0 ? '' : newDiscount}
                        onChange={(e) =>
                          setNewDiscount(e.target.value === '' ? 0 : parseFloat(e.target.value) || 0)
                        }
                        placeholder="0"
                        className="w-20 text-right font-mono border border-gray-300 rounded px-2 py-1 text-xs focus:outline-none focus:border-blue-600 bg-white"
                      />
                      <div className="flex border border-gray-300 rounded overflow-hidden text-[10px] font-bold">
                        <button
                          type="button"
                          onClick={() => setDiscountType('amount')}
                          className={`px-1.5 py-1 transition-colors ${
                            discountType === 'amount'
                              ? 'bg-blue-600 text-white'
                              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                          }`}
                          title="Giảm giá theo số tiền (VND)"
                        >
                          VND
                        </button>
                        <button
                          type="button"
                          onClick={() => setDiscountType('percent')}
                          className={`px-1.5 py-1 transition-colors ${
                            discountType === 'percent'
                              ? 'bg-blue-600 text-white'
                              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                          }`}
                          title="Giảm giá theo phần trăm (%)"
                        >
                          %
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-between items-center pt-1 font-bold">
                    <span className="text-gray-900">Cần trả nhà cung cấp</span>
                    <span className="font-mono text-blue-600 text-sm">
                      {(calculatedNetTotal || 0).toLocaleString('vi-VN')}
                    </span>
                  </div>

                  {/* Tiền trả nhà cung cấp (F8) */}
                  <div className="pt-2 border-t border-dashed border-gray-200 space-y-1.5">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-700 font-medium flex items-center space-x-1">
                        <span>Tiền trả nhà cung cấp (F8)</span>
                        <CreditCard className="w-4 h-4 text-blue-600 ml-1 inline shrink-0" />
                      </span>
                      <input
                        type="number"
                        min="0"
                        value={paidToSupplier}
                        onChange={(e) => setPaidToSupplier(e.target.value === '' ? '' : parseFloat(e.target.value) || 0)}
                        className="w-32 text-right font-mono font-bold border border-gray-300 rounded px-2 py-1 text-xs text-gray-900 focus:outline-none focus:border-blue-600 bg-white"
                        placeholder="0"
                      />
                    </div>

                    <div className="text-gray-500 text-[11px] font-medium flex justify-between items-center">
                      <span>Tiền mặt</span>
                      <select
                        value={paymentMethod}
                        onChange={(e) => setPaymentMethod(e.target.value)}
                        className="text-[11px] text-gray-600 bg-transparent border-none focus:outline-none font-medium cursor-pointer"
                      >
                        <option value="Tiền mặt">Tiền mặt</option>
                        <option value="Chuyển khoản">Chuyển khoản</option>
                        <option value="Thẻ">Thẻ</option>
                      </select>
                    </div>

                    <div className="flex justify-between items-center pt-1 text-xs font-bold">
                      <span className="text-gray-800">Tính vào công nợ</span>
                      <span className={`font-mono text-sm ${((typeof paidToSupplier === 'number' && !isNaN(paidToSupplier)) ? paidToSupplier : (parseFloat(paidToSupplier as string) || 0)) - calculatedNetTotal < 0 ? 'text-gray-900' : 'text-emerald-600'}`}>
                        {((((typeof paidToSupplier === 'number' && !isNaN(paidToSupplier)) ? paidToSupplier : (parseFloat(paidToSupplier as string) || 0)) - (calculatedNetTotal || 0)) || 0).toLocaleString('vi-VN')}
                      </span>
                    </div>
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

        {/* Operational Business Impact Modal when Completing Purchase */}
        {showCompleteConfirmModal && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full p-6 space-y-5 border border-gray-200 animate-in zoom-in-95">
              {/* Header */}
              <div className="flex items-center space-x-3 pb-3 border-b border-gray-100">
                <div className="p-2.5 bg-emerald-100 text-emerald-700 rounded-xl">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-gray-900">
                    {purchaseFormType === 'return'
                      ? 'Thông báo nghiệp vụ Hoàn thành trả hàng nhập'
                      : 'Thông báo nghiệp vụ Hoàn thành nhập hàng'}
                  </h3>
                  <p className="text-xs text-gray-500 font-medium">
                    Mã phiếu: <span className="font-mono font-bold text-blue-600">{newPurchaseCode}</span>
                  </p>
                </div>
              </div>

              {/* Info Notice Banner */}
              <div className="p-3.5 bg-blue-50/80 border border-blue-200 rounded-xl text-xs text-blue-900 leading-relaxed font-medium flex items-start space-x-2.5">
                <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <div>
                  {editingPurchaseId ? (
                    <span>
                      Quý khách đang <strong>sửa {purchaseFormType === 'return' ? 'phiếu trả hàng nhập' : 'phiếu nhập hàng'}</strong>. Khi chọn <strong>[Xác nhận & Hoàn thành]</strong>, thông tin phiếu sẽ được cập nhật đồng bộ.
                    </span>
                  ) : (
                    <span>
                      Quý khách chuẩn bị <strong>hoàn thành {purchaseFormType === 'return' ? 'phiếu trả hàng nhập' : 'phiếu nhập hàng'}</strong>. Hệ thống sẽ tự động thực hiện đồng bộ các nghiệp vụ kinh doanh dưới đây.
                    </span>
                  )}
                </div>
              </div>

              {/* Business Tasks List */}
              <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
                <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 space-y-1">
                  <div className="flex items-center space-x-2 text-xs font-bold text-gray-900">
                    <FileText className="w-4 h-4 text-indigo-600 shrink-0" />
                    <span>1. Cập nhật {purchaseFormType === 'return' ? 'phiếu trả hàng nhập' : 'phiếu nhập hàng'}</span>
                  </div>
                  <p className="text-[11px] text-gray-600 pl-6">
                    {editingPurchaseId
                      ? `Phiếu gốc (${newPurchaseCode}) sẽ được cập nhật thành công với ${newPurchaseItems.length} danh mục sản phẩm.`
                      : `Khởi tạo chính thức phiếu ${purchaseFormType === 'return' ? 'trả hàng' : 'nhập hàng'} mới (${newPurchaseCode}) với ${newPurchaseItems.length} danh mục sản phẩm.`}
                  </p>
                </div>

                <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 space-y-2">
                  <div className="flex items-center space-x-2 text-xs font-bold text-gray-900">
                    <Package className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>2. Cập nhật Tồn kho Hàng hóa ({newPurchaseItems.length} mặt hàng)</span>
                  </div>
                  <div className="pl-6 space-y-1.5">
                    <p className="text-[11px] text-gray-600">
                      {purchaseFormType === 'return'
                        ? 'Số lượng tồn kho sẽ được tự động trừ tương ứng khỏi kho hàng:'
                        : 'Số lượng tồn kho sẽ được kiểm tra và cộng dồn tự động vào kho hàng hóa:'}
                    </p>
                    <div className="max-h-36 overflow-y-auto border border-gray-200 rounded-lg bg-white divide-y divide-gray-100 text-[11px]">
                      {newPurchaseItems.map((item, idx) => {
                        const prod = products.find((p) => p.code === item.productCode || p.id === item.productCode);
                        const currentStock = prod ? Number(prod.stock || 0) : 0;
                        const qty = Number(item.quantity || 0);
                        const newStock = purchaseFormType === 'return'
                          ? Math.max(0, currentStock - qty)
                          : currentStock + qty;
                        return (
                          <div key={idx} className="p-2 flex items-center justify-between hover:bg-gray-50">
                            <div>
                              <div className="font-semibold text-gray-900">{item.productName}</div>
                              <div className="font-mono text-[10px] text-gray-500">{item.productCode}</div>
                            </div>
                            <div className="text-right">
                              <span className="text-gray-500">Tồn hiện tại: </span>
                              <span className="font-mono font-medium text-gray-800">{currentStock}</span>
                              <span className="mx-1.5 text-blue-600 font-bold">→</span>
                              <span className="text-gray-500">Tồn mới: </span>
                              <span className="font-mono font-bold text-gray-900">{newStock}</span>
                              <span className={`ml-1 text-[10px] font-bold px-1.5 py-0.5 rounded border ${
                                purchaseFormType === 'return'
                                  ? 'text-amber-700 bg-amber-50 border-amber-200'
                                  : 'text-emerald-600 bg-emerald-50 border-emerald-200'
                              }`}>
                                {purchaseFormType === 'return' ? `-${qty}` : `+${qty}`}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 space-y-1">
                  <div className="flex items-center space-x-2 text-xs font-bold text-gray-900">
                    <CreditCard className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>3. Hạch toán Công nợ Nhà cung cấp ({newSupplier})</span>
                  </div>
                  <div className="text-[11px] text-gray-600 pl-6 space-y-0.5">
                    {(() => {
                      const totalVal = newPurchaseItems.reduce((s, i) => s + i.quantity * i.unitPrice - i.discount, 0);
                      const disc = discountType === 'percent' ? (totalVal * newDiscount) / 100 : newDiscount;
                      const net = Math.max(0, totalVal - disc);
                      const paid = (typeof paidToSupplier === 'number' && !isNaN(paidToSupplier)) ? paidToSupplier : (parseFloat(paidToSupplier as string) || 0);
                      const debt = Math.max(0, net - paid);
                      return (
                        <>
                          <div>• Tổng giá trị trả hàng: <strong className="font-mono text-gray-900">{net.toLocaleString('vi-VN')} đ</strong></div>
                          <div>• NCC hoàn tiền/thanh toán: <strong className="font-mono text-emerald-700">{paid.toLocaleString('vi-VN')} đ</strong></div>
                          <div>• Trừ vào công nợ NCC: <strong className="font-mono text-amber-700">{debt.toLocaleString('vi-VN')} đ</strong></div>
                        </>
                      );
                    })()}
                  </div>
                </div>

                <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 space-y-1">
                  <div className="flex items-center space-x-2 text-xs font-bold text-gray-900">
                    <ClipboardCheck className="w-4 h-4 text-purple-600 shrink-0" />
                    <span>4. Ghi Sổ kho & Sổ quỹ</span>
                  </div>
                  <p className="text-[11px] text-gray-600 pl-6">
                    Tự động lưu vết biến động tồn kho và nhật ký giao dịch trả hàng nhập theo thời gian thực.
                  </p>
                </div>
              </div>

              {/* Footer */}
              <div className="flex justify-end items-center space-x-2 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowCompleteConfirmModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-xl text-xs font-bold text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="button"
                  onClick={() => executeSavePurchase(purchaseFormType === 'return' ? 'Đã trả hàng' : 'Đã nhập hàng')}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-extrabold transition-colors shadow-md flex items-center space-x-1.5 cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Xác nhận & Hoàn thành</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Quick Add Product Modal */}
        {showQuickAddProdModal && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full overflow-hidden border border-gray-200 animate-in fade-in zoom-in-95">
              {/* Header */}
              <div className="bg-[#1e0b54] text-white px-5 py-3.5 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Plus className="w-5 h-5 text-amber-400" />
                  <h3 className="font-bold text-sm">Thêm nhanh hàng hóa mới vào phiếu nhập</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowQuickAddProdModal(false)}
                  className="text-gray-300 hover:text-white p-1 rounded-md transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Form Body */}
              <form onSubmit={handleSaveQuickProduct} className="p-5 space-y-4 text-xs">
                {/* Tên sản phẩm */}
                <div>
                  <label className="block text-gray-700 font-bold mb-1">
                    Tên hàng hóa <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={quickProdName}
                    onChange={(e) => setQuickProdName(e.target.value)}
                    placeholder="VD: Màng chống thấm Bitum, Keo cấy thép..."
                    className="w-full p-2.5 border border-gray-300 rounded-lg text-xs font-semibold text-gray-900 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
                  />
                </div>

                {/* Mã hàng & ĐVT */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-gray-700 font-medium mb-1">Mã hàng hóa</label>
                    <input
                      type="text"
                      value={quickProdCode}
                      onChange={(e) => setQuickProdCode(e.target.value)}
                      placeholder="Mã tự động"
                      className="w-full p-2 border border-gray-300 rounded-lg text-xs font-mono font-bold text-blue-700 focus:outline-none focus:border-blue-600"
                    />
                  </div>

                  <div>
                    <label className="block text-gray-700 font-medium mb-1">Đơn vị tính (ĐVT)</label>
                    <select
                      value={quickProdUnit}
                      onChange={(e) => setQuickProdUnit(e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded-lg text-xs font-medium text-gray-800 focus:outline-none focus:border-blue-600 bg-white"
                    >
                      <option value="bao">bao</option>
                      <option value="can">can</option>
                      <option value="tuýp">tuýp</option>
                      <option value="thùng">thùng</option>
                      <option value="kg">kg</option>
                      <option value="cuộn">cuộn</option>
                      <option value="bộ">bộ</option>
                      <option value="chai">chai</option>
                      <option value="lít">lít</option>
                      <option value="m2">m2</option>
                      <option value="mét">mét</option>
                      <option value="cặp">cặp</option>
                      <option value="gói">gói</option>
                    </select>
                  </div>
                </div>

                {/* Nhóm hàng */}
                <div>
                  <label className="block text-gray-700 font-medium mb-1">Nhóm hàng</label>
                  <select
                    value={quickProdCategory}
                    onChange={(e) => setQuickProdCategory(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-lg text-xs font-medium text-gray-800 focus:outline-none focus:border-blue-600 bg-white"
                  >
                    <option value="Chống thấm">Chống thấm</option>
                    <option value="Keo dán gạch">Keo dán gạch</option>
                    <option value="Phụ gia bê tông">Phụ gia bê tông</option>
                    <option value="Vật tư chống thấm">Vật tư chống thấm</option>
                    <option value="Sơn chống thấm">Sơn chống thấm</option>
                    <option value="Dụng cụ thi công">Dụng cụ thi công</option>
                    <option value="Khác">Khác</option>
                  </select>
                </div>

                {/* Price & CostPrice & Quantity */}
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-gray-700 font-medium mb-1">
                      Giá nhập (Giá vốn)
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="1000"
                      value={quickProdCostPrice}
                      onChange={(e) => setQuickProdCostPrice(e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded-lg text-xs font-mono font-bold text-gray-900 focus:outline-none focus:border-blue-600"
                    />
                  </div>

                  <div>
                    <label className="block text-gray-700 font-medium mb-1">Giá bán</label>
                    <input
                      type="number"
                      min="0"
                      step="1000"
                      value={quickProdPrice}
                      onChange={(e) => setQuickProdPrice(e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded-lg text-xs font-mono font-bold text-blue-800 focus:outline-none focus:border-blue-600"
                    />
                  </div>

                  <div>
                    <label className="block text-gray-700 font-medium mb-1">Số lượng nhập</label>
                    <input
                      type="number"
                      min="1"
                      value={quickProdQuantity}
                      onChange={(e) => setQuickProdQuantity(e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded-lg text-xs font-mono font-bold text-emerald-700 focus:outline-none focus:border-blue-600"
                    />
                  </div>
                </div>

                {/* Footer Buttons */}
                <div className="flex items-center justify-end space-x-2 pt-3 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={() => setShowQuickAddProdModal(false)}
                    className="px-4 py-2 border border-gray-300 hover:bg-gray-100 font-semibold text-gray-700 rounded-lg transition-colors"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-[#1e0b54] hover:bg-[#15073c] text-white font-bold rounded-lg shadow-sm transition-colors flex items-center space-x-1.5"
                  >
                    <Plus className="w-4 h-4 text-amber-400" />
                    <span>Lưu & Thêm vào phiếu nhập</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
        {/* Quick Add Supplier Modal */}
        {showQuickAddSuppModal && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full overflow-hidden border border-gray-200 animate-in fade-in zoom-in-95">
              {/* Header */}
              <div className="bg-[#1e0b54] text-white px-5 py-3.5 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Plus className="w-5 h-5 text-amber-400" />
                  <h3 className="font-bold text-sm">Thêm nhanh Nhà cung cấp mới</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowQuickAddSuppModal(false)}
                  className="text-gray-300 hover:text-white p-1 rounded-md transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Form Body */}
              <form onSubmit={handleSaveQuickSupplier} className="p-5 space-y-3.5 text-xs">
                <div>
                  <label className="block text-gray-700 font-bold mb-1">
                    Tên Nhà cung cấp <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={quickSuppName}
                    onChange={(e) => setQuickSuppName(e.target.value)}
                    placeholder="VD: Công ty Sika Việt Nam, Vitec, Bestmix..."
                    className="w-full p-2.5 border border-gray-300 rounded-lg text-xs font-semibold text-gray-900 focus:outline-none focus:border-blue-600"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-gray-700 font-medium mb-1">Mã nhà cung cấp</label>
                    <input
                      type="text"
                      value={quickSuppCode}
                      onChange={(e) => setQuickSuppCode(e.target.value)}
                      placeholder="Mã tự động"
                      className="w-full p-2 border border-gray-300 rounded-lg text-xs font-mono font-bold text-blue-700 focus:outline-none focus:border-blue-600"
                    />
                  </div>

                  <div>
                    <label className="block text-gray-700 font-medium mb-1">Số điện thoại</label>
                    <input
                      type="text"
                      value={quickSuppPhone}
                      onChange={(e) => setQuickSuppPhone(e.target.value)}
                      placeholder="VD: 0987654321"
                      className="w-full p-2 border border-gray-300 rounded-lg text-xs font-mono font-medium text-gray-900 focus:outline-none focus:border-blue-600"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-gray-700 font-medium mb-1">Địa chỉ</label>
                    <input
                      type="text"
                      value={quickSuppAddress}
                      onChange={(e) => setQuickSuppAddress(e.target.value)}
                      placeholder="Hà Nội, Thanh Hóa..."
                      className="w-full p-2 border border-gray-300 rounded-lg text-xs text-gray-900 focus:outline-none focus:border-blue-600"
                    />
                  </div>

                  <div>
                    <label className="block text-gray-700 font-medium mb-1">Email</label>
                    <input
                      type="email"
                      value={quickSuppEmail}
                      onChange={(e) => setQuickSuppEmail(e.target.value)}
                      placeholder="contact@nhacungcap.vn"
                      className="w-full p-2 border border-gray-300 rounded-lg text-xs text-gray-900 focus:outline-none focus:border-blue-600"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-gray-700 font-medium mb-1">Nợ cần trả hiện tại (Công nợ ban đầu)</label>
                  <input
                    type="number"
                    value={quickSuppDebt}
                    onChange={(e) => setQuickSuppDebt(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-lg text-xs font-mono font-bold text-rose-600 focus:outline-none focus:border-blue-600"
                    placeholder="0"
                  />
                </div>

                <div>
                  <label className="block text-gray-700 font-medium mb-1">Ghi chú</label>
                  <textarea
                    rows={2}
                    value={quickSuppNote}
                    onChange={(e) => setQuickSuppNote(e.target.value)}
                    placeholder="Ghi chú thêm về nhà cung cấp..."
                    className="w-full p-2 border border-gray-300 rounded-lg text-xs text-gray-800 focus:outline-none focus:border-blue-600"
                  />
                </div>

                <div className="flex items-center justify-end space-x-2 pt-3 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={() => setShowQuickAddSuppModal(false)}
                    className="px-4 py-2 border border-gray-300 hover:bg-gray-100 font-semibold text-gray-700 rounded-lg transition-colors"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-[#1e0b54] hover:bg-[#15073c] text-white font-bold rounded-lg shadow-sm transition-colors flex items-center space-x-1.5"
                  >
                    <Plus className="w-4 h-4 text-amber-400" />
                    <span>Lưu Nhà cung cấp</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    );
  }

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
            <div className="flex items-center space-x-1 bg-[#f0f2f8] p-1 rounded-xl border border-gray-200/80 text-xs sm:text-sm font-medium shadow-2xs">
              {(currentView === 'purchases' || currentView === 'purchase-returns') ? (
                <>
                  <button
                    onClick={() => onSelectView('suppliers')}
                    className="px-4 py-2 rounded-lg text-gray-700 hover:text-gray-900 hover:bg-gray-200/60 transition-all font-medium"
                  >
                    Nhà cung cấp
                  </button>
                  <button
                    onClick={() => onSelectView('purchases')}
                    className={`px-4 py-2 rounded-lg font-bold transition-all ${
                      currentView === 'purchases'
                        ? 'bg-[#1e0b54] text-white shadow-2xs'
                        : 'text-gray-700 hover:text-gray-900 hover:bg-gray-200/60 font-medium'
                    }`}
                  >
                    Nhập hàng
                  </button>
                  <button
                    onClick={() => onSelectView('purchase-returns')}
                    className={`px-4 py-2 rounded-lg font-bold transition-all ${
                      currentView === 'purchase-returns'
                        ? 'bg-[#1e0b54] text-white shadow-2xs'
                        : 'text-gray-700 hover:text-gray-900 hover:bg-gray-200/60 font-medium'
                    }`}
                  >
                    Trả hàng nhập
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => onSelectView('orders')}
                    className={`px-4 py-2 rounded-lg font-bold transition-all ${
                      currentView === 'orders'
                        ? 'bg-[#1e0b54] text-white shadow-2xs'
                        : 'text-gray-700 hover:text-gray-900 hover:bg-gray-200/60 font-medium'
                    }`}
                  >
                    Hóa đơn bán
                  </button>
                  <button
                    onClick={() => onSelectView('returns')}
                    className={`px-4 py-2 rounded-lg font-bold transition-all ${
                      currentView === 'returns'
                        ? 'bg-[#1e0b54] text-white shadow-2xs'
                        : 'text-gray-700 hover:text-gray-900 hover:bg-gray-200/60 font-medium'
                    }`}
                  >
                    Khách trả hàng
                  </button>
                </>
              )}
            </div>
          )}

          {(currentView === 'purchases' || currentView === 'purchase-returns') && (
            <div className="flex items-center space-x-2 shrink-0">
              {currentView === 'purchases' && (
                <button
                  type="button"
                  onClick={() => {
                    setEditingPurchaseId(null);
                    setPurchaseFormType('import');
                    setNewPurchaseCode(`PN${String(Math.floor(100000 + Math.random() * 900000))}`);
                    setNewSupplier('');
                    setSelectedSupplierCode('');
                    setSelectedRefPurchaseCode('');
                    setNewNote('');
                    setNewDiscount(0);
                    setDiscountType('amount');
                    setPaidToSupplier(0);
                    setNewPurchaseItems([]);
                    setShowAddPurchaseTab(true);
                  }}
                  className="bg-[#1e0b54] hover:bg-[#15073c] text-white font-bold px-3.5 py-2 rounded-lg text-xs flex items-center shadow-md transition-colors shrink-0 cursor-pointer"
                >
                  <Plus className="w-4 h-4 mr-1.5 text-amber-400" />
                  Thêm phiếu nhập
                </button>
              )}

              {currentView === 'purchase-returns' && (
                <button
                  type="button"
                  onClick={() => {
                    setEditingPurchaseId(null);
                    setPurchaseFormType('return');
                    setNewPurchaseCode(`THN${String(Math.floor(100000 + Math.random() * 900000))}`);
                    setNewSupplier('');
                    setSelectedSupplierCode('');
                    setSelectedRefPurchaseCode('');
                    setNewNote('');
                    setNewDiscount(0);
                    setDiscountType('amount');
                    setPaidToSupplier(0);
                    setNewPurchaseItems([]);
                    setShowAddPurchaseTab(true);
                  }}
                  className="bg-[#1e0b54] hover:bg-[#15073c] text-white font-bold px-3.5 py-2 rounded-lg text-xs flex items-center shadow-md transition-colors shrink-0 cursor-pointer"
                >
                  <Plus className="w-4 h-4 mr-1.5 text-amber-400" />
                  Thêm phiếu trả hàng nhập
                </button>
              )}
            </div>
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
                <th className="p-3">{currentView === 'purchase-returns' ? 'Mã phiếu trả' : 'Mã phiếu nhập'}</th>
                <th className="p-3">{currentView === 'purchase-returns' ? 'Thời gian trả' : 'Thời gian nhập'}</th>
                <th className="p-3">Nhà cung cấp</th>
                <th className="p-3 text-center">Số mặt hàng</th>
                <th className="p-3 text-right">{currentView === 'purchase-returns' ? 'Tổng tiền trả' : 'Tổng tiền nhập'}</th>
                <th className="p-3 text-center">Trạng thái</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {paginatedPurchases.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-gray-400 italic">
                    {currentView === 'purchase-returns' ? 'Chưa có phiếu trả hàng nhập nào.' : 'Chưa có phiếu nhập hàng nào.'}
                  </td>
                </tr>
              ) : (
                paginatedPurchases.map((p, pIdx) => {
                  const isExpanded = expandedOrderId === p.id;

                  return (
                    <React.Fragment key={p.id ? `${p.id}-${pIdx}` : `purch-${pIdx}`}>
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
                          {(p.totalAmount || 0).toLocaleString('vi-VN')}đ
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
                                      {p.supplierName || 'Chưa chọn nhà cung cấp'}
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
                                      if (confirm(`Bạn có chắc chắn muốn xóa phiếu ${p.code}?`)) {
                                        if (onDeletePurchase) {
                                          onDeletePurchase(p.id);
                                        }
                                      }
                                    }}
                                    className="flex items-center px-3 py-1.5 border border-rose-200 bg-rose-50 hover:bg-rose-100 rounded text-xs font-semibold text-rose-700 transition-colors cursor-pointer"
                                  >
                                    <Trash2 className="w-3.5 h-3.5 mr-1 text-rose-600" />
                                    Xóa phiếu
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
                                      handleOpenEditPurchase(p);
                                    }}
                                    className="flex items-center px-4 py-1.5 bg-[#0066ff] hover:bg-blue-700 text-white rounded text-xs font-bold shadow-xs transition-colors cursor-pointer"
                                    title="Mở phiếu để chỉnh sửa thông tin"
                                  >
                                    <ExternalLink className="w-3.5 h-3.5 mr-1.5" />
                                    Mở phiếu
                                  </button>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleOpenEditPurchase(p);
                                    }}
                                    className="flex items-center px-3 py-1.5 border border-gray-300 rounded text-xs font-medium text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer"
                                    title="Chỉnh sửa thông tin phiếu nhập"
                                  >
                                    <Pencil className="w-3.5 h-3.5 mr-1 text-gray-500" />
                                    Chỉnh sửa
                                  </button>
                                  {p.type !== 'return' && !p.code.startsWith('THN') && (
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleCreateReturnFromPurchase(p);
                                      }}
                                      className="flex items-center px-3 py-1.5 border border-amber-300 bg-amber-50 hover:bg-amber-100 rounded text-xs font-semibold text-amber-800 transition-colors cursor-pointer"
                                      title="Tạo phiếu trả hàng cho đơn nhập này"
                                    >
                                      <RotateCcw className="w-3.5 h-3.5 mr-1 text-amber-600" />
                                      Trả hàng nhập
                                    </button>
                                  )}
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
                      <React.Fragment key={ord.id ? `${ord.id}-${idx}` : `ord-${idx}`}>
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
                                        <Edit3
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleOpenEditOrder(ord);
                                          }}
                                          className="w-3.5 h-3.5 text-blue-600 cursor-pointer ml-1 hover:text-blue-800"
                                          title="Mở phiếu để chỉnh sửa thông tin"
                                        />
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
                                          handleOpenEditOrder(ord);
                                        }}
                                        className="flex items-center px-4 py-1.5 bg-[#0066ff] hover:bg-blue-700 text-white rounded text-xs font-bold shadow-xs transition-colors cursor-pointer"
                                        title="Mở phiếu để chỉnh sửa thông tin"
                                      >
                                        <ExternalLink className="w-3.5 h-3.5 mr-1.5" />
                                        Mở phiếu
                                      </button>
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleOpenEditOrder(ord);
                                        }}
                                        className="flex items-center px-3 py-1.5 border border-gray-300 rounded text-xs font-medium text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer"
                                        title="Chỉnh sửa thông tin hóa đơn"
                                      >
                                        <Pencil className="w-3.5 h-3.5 mr-1 text-gray-500" />
                                        Chỉnh sửa
                                      </button>
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          const noteToSave = editingNotes[ord.id] !== undefined ? editingNotes[ord.id] : (ord.note || '');
                                          if (onUpdateOrder) {
                                            onUpdateOrder(ord.id, { note: noteToSave });
                                            alert(`Đã cập nhật ghi chú cho đơn hàng ${ord.orderCode}`);
                                          }
                                        }}
                                        className="flex items-center px-3 py-1.5 border border-gray-300 rounded text-xs font-medium text-gray-700 hover:bg-gray-100 transition-colors"
                                      >
                                        <Save className="w-3.5 h-3.5 mr-1 text-gray-500" />
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

      {/* Edit Order Modal */}
      {showEditOrderModal && editingOrder && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="bg-[#1e0b54] text-white px-6 py-4 flex items-center justify-between shrink-0">
              <div className="flex items-center space-x-3">
                <FileText className="w-6 h-6 text-indigo-300" />
                <div>
                  <h3 className="font-extrabold text-base tracking-wide flex items-center gap-2">
                    <span>Chỉnh sửa Hóa đơn bán hàng</span>
                    <span className="bg-indigo-900/60 text-indigo-200 px-2.5 py-0.5 rounded text-xs font-mono font-bold border border-indigo-400/30">
                      {editOrderCode}
                    </span>
                  </h3>
                  <p className="text-xs text-indigo-200 mt-0.5">
                    Cập nhật thông tin khách hàng, danh sách sản phẩm, giá bán và thanh toán
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowEditOrderModal(false);
                  setEditingOrder(null);
                }}
                className="p-1.5 hover:bg-white/10 rounded-full transition-colors text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 overflow-y-auto space-y-5 flex-1 text-xs">
              {/* Info Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-gray-50 p-4 rounded-xl border border-gray-200">
                {/* Customer Selection */}
                <div className="relative">
                  <label className="block text-gray-700 font-bold mb-1">Khách hàng</label>
                  <div className="flex items-center border border-gray-300 rounded-lg bg-white px-2.5 py-1.5 focus-within:border-blue-600">
                    <User className="w-3.5 h-3.5 text-gray-400 mr-1.5 shrink-0" />
                    <input
                      type="text"
                      value={editOrderCustomerName}
                      onChange={(e) => {
                        setEditOrderCustomerName(e.target.value);
                        setOrderCustSearchKey(e.target.value);
                        setShowOrderCustDropdown(true);
                      }}
                      onFocus={() => setShowOrderCustDropdown(true)}
                      placeholder="Nhập tên hoặc chọn khách..."
                      className="w-full text-xs font-semibold text-gray-800 bg-transparent focus:outline-none"
                    />
                  </div>
                  {showOrderCustDropdown && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-48 overflow-y-auto">
                      {customers.map((c, cIdx) => (
                        <div
                          key={c.id ? `${c.id}-cust-${cIdx}` : `cust-${cIdx}`}
                          onClick={() => {
                            setEditOrderCustomerName(c.name);
                            setEditOrderCustomerCode(c.code || 'KH000009');
                            setShowOrderCustDropdown(false);
                          }}
                          className="p-2 hover:bg-blue-50 cursor-pointer border-b border-gray-100 flex justify-between items-center"
                        >
                          <span className="font-semibold text-gray-900">{c.name}</span>
                          <span className="font-mono text-[10px] text-gray-500">{c.code}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Customer Code */}
                <div>
                  <label className="block text-gray-700 font-bold mb-1">Mã khách hàng</label>
                  <input
                    type="text"
                    value={editOrderCustomerCode}
                    onChange={(e) => setEditOrderCustomerCode(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-lg text-xs font-mono font-medium text-gray-800 bg-white"
                  />
                </div>

                {/* Date & Time */}
                <div>
                  <label className="block text-gray-700 font-bold mb-1">Thời gian lập phiếu</label>
                  <input
                    type="text"
                    value={editOrderDate}
                    onChange={(e) => setEditOrderDate(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-lg text-xs font-mono text-gray-800 bg-white"
                  />
                </div>
              </div>

              {/* Product Search Bar */}
              <div className="space-y-2">
                <label className="block text-gray-800 font-bold text-xs">Sản phẩm / Vật tư trong hóa đơn</label>
                <div className="relative">
                  <div className="flex items-center border border-gray-300 rounded-lg bg-white px-3 py-2 focus-within:border-blue-600 focus-within:ring-1 focus-within:ring-blue-600">
                    <Search className="w-4 h-4 text-gray-400 mr-2 shrink-0" />
                    <input
                      type="text"
                      value={orderProdSearchKey}
                      onChange={(e) => {
                        setOrderProdSearchKey(e.target.value);
                        setShowOrderProdDropdown(true);
                      }}
                      onFocus={() => setShowOrderProdDropdown(true)}
                      placeholder="Tìm thêm sản phẩm vào hóa đơn (mã, tên)..."
                      className="w-full text-xs text-gray-800 placeholder-gray-400 bg-transparent focus:outline-none"
                    />
                  </div>

                  {showOrderProdDropdown && orderProdSearchKey && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-xl z-50 max-h-52 overflow-y-auto">
                      {products
                        .filter(
                          (p) =>
                            p.name.toLowerCase().includes(orderProdSearchKey.toLowerCase()) ||
                            p.code.toLowerCase().includes(orderProdSearchKey.toLowerCase())
                        )
                        .map((p, pIdx) => (
                          <div
                            key={p.id ? `${p.id}-pdrop-${pIdx}` : `pdrop-${pIdx}`}
                            onClick={() => {
                              setEditOrderItems((prev) => {
                                const existingIdx = prev.findIndex(
                                  (it) => it.product.code === p.code || it.product.id === p.id
                                );
                                if (existingIdx > -1) {
                                  const updated = [...prev];
                                  updated[existingIdx].quantity += 1;
                                  return updated;
                                }
                                return [
                                  ...prev,
                                  {
                                    product: p,
                                    quantity: 1,
                                    unitPrice: p.price,
                                  },
                                ];
                              });
                              setOrderProdSearchKey('');
                              setShowOrderProdDropdown(false);
                            }}
                            className="p-2.5 hover:bg-blue-50 cursor-pointer border-b border-gray-100 flex justify-between items-center"
                          >
                            <div>
                              <span className="font-mono font-bold text-blue-600 mr-2">{p.code}</span>
                              <span className="font-semibold text-gray-900">{p.name}</span>
                            </div>
                            <div className="text-right font-mono font-bold text-gray-800">
                              {p.price.toLocaleString('vi-VN')}đ
                            </div>
                          </div>
                        ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Product Items Table */}
              <div className="border border-gray-200 rounded-xl overflow-hidden shadow-2xs">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-gray-100 text-gray-700 font-bold border-b border-gray-200">
                    <tr>
                      <th className="p-2.5 border-r border-gray-200 text-center w-10">STT</th>
                      <th className="p-2.5 border-r border-gray-200 min-w-[100px]">Mã hàng</th>
                      <th className="p-2.5 border-r border-gray-200 min-w-[180px]">Tên sản phẩm</th>
                      <th className="p-2.5 border-r border-gray-200 text-center w-16">ĐVT</th>
                      <th className="p-2.5 border-r border-gray-200 text-center min-w-[100px]">Số lượng</th>
                      <th className="p-2.5 border-r border-gray-200 text-right min-w-[110px]">Đơn giá (đ)</th>
                      <th className="p-2.5 border-r border-gray-200 text-right min-w-[120px]">Thành tiền</th>
                      <th className="p-2.5 text-center w-12">Xóa</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 bg-white">
                    {editOrderItems.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="text-center py-6 text-gray-400 italic">
                          Chưa có sản phẩm nào trong hóa đơn
                        </td>
                      </tr>
                    ) : (
                      editOrderItems.map((item, idx) => {
                        const lineTotal = item.quantity * item.unitPrice;
                        return (
                          <tr key={idx} className="hover:bg-gray-50">
                            <td className="p-2.5 border-r border-gray-100 text-center text-gray-500 font-mono">
                              {idx + 1}
                            </td>
                            <td className="p-2.5 border-r border-gray-100 font-mono text-blue-600 font-bold">
                              {item.product.code}
                            </td>
                            <td className="p-2.5 border-r border-gray-100 font-medium text-gray-900">
                              {item.product.name}
                            </td>
                            <td className="p-2.5 border-r border-gray-100 text-center text-gray-600">
                              {item.product.unit || 'cái'}
                            </td>
                            <td className="p-2 border-r border-gray-100 text-center">
                              <div className="flex items-center justify-center space-x-1">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditOrderItems((prev) =>
                                      prev.map((it, i) =>
                                        i === idx
                                          ? { ...it, quantity: Math.max(1, it.quantity - 1) }
                                          : it
                                      )
                                    );
                                  }}
                                  className="w-6 h-6 border border-gray-300 rounded font-bold hover:bg-gray-100 flex items-center justify-center text-gray-700"
                                >
                                  -
                                </button>
                                <input
                                  type="number"
                                  min={1}
                                  value={item.quantity}
                                  onChange={(e) => {
                                    const val = Math.max(1, parseInt(e.target.value) || 1);
                                    setEditOrderItems((prev) =>
                                      prev.map((it, i) => (i === idx ? { ...it, quantity: val } : it))
                                    );
                                  }}
                                  className="w-12 text-center border border-gray-300 rounded p-1 font-mono font-bold text-gray-800"
                                />
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditOrderItems((prev) =>
                                      prev.map((it, i) =>
                                        i === idx ? { ...it, quantity: it.quantity + 1 } : it
                                      )
                                    );
                                  }}
                                  className="w-6 h-6 border border-gray-300 rounded font-bold hover:bg-gray-100 flex items-center justify-center text-gray-700"
                                >
                                  +
                                </button>
                              </div>
                            </td>
                            <td className="p-2 border-r border-gray-100">
                              <input
                                type="number"
                                value={item.unitPrice}
                                onChange={(e) => {
                                  const val = Math.max(0, parseFloat(e.target.value) || 0);
                                  setEditOrderItems((prev) =>
                                    prev.map((it, i) => (i === idx ? { ...it, unitPrice: val } : it))
                                  );
                                }}
                                className="w-full text-right border border-gray-300 rounded p-1 font-mono text-gray-800"
                              />
                            </td>
                            <td className="p-2.5 border-r border-gray-100 text-right font-mono font-bold text-gray-900">
                              {lineTotal.toLocaleString('vi-VN')}
                            </td>
                            <td className="p-2.5 text-center">
                              <button
                                type="button"
                                onClick={() => {
                                  setEditOrderItems((prev) => prev.filter((_, i) => i !== idx));
                                }}
                                className="p-1 hover:bg-red-50 text-red-500 rounded transition-colors"
                              >
                                <Trash2 className="w-3.5 h-3.5 mx-auto" />
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              {/* Bottom Note & Payment Math */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                <div>
                  <label className="block text-gray-700 font-bold mb-1">Ghi chú hóa đơn</label>
                  <textarea
                    rows={4}
                    value={editOrderNote}
                    onChange={(e) => setEditOrderNote(e.target.value)}
                    placeholder="Nhập ghi chú hóa đơn..."
                    className="w-full p-2.5 border border-gray-300 rounded-lg text-xs text-gray-800 focus:outline-none focus:border-blue-600 bg-white shadow-2xs"
                  />
                </div>

                <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 space-y-2.5">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-gray-600 font-medium">Tổng tiền hàng:</span>
                    <span className="font-mono font-bold text-gray-900">
                      {editOrderItems
                        .reduce((sum, item) => sum + item.quantity * item.unitPrice, 0)
                        .toLocaleString('vi-VN')}đ
                    </span>
                  </div>

                  <div className="flex justify-between items-center text-xs">
                    <span className="text-gray-600 font-medium">Giảm giá:</span>
                    <input
                      type="number"
                      value={editOrderDiscount}
                      onChange={(e) => setEditOrderDiscount(Math.max(0, parseFloat(e.target.value) || 0))}
                      className="w-28 text-right p-1 border border-gray-300 rounded font-mono text-gray-800 bg-white"
                    />
                  </div>

                  <div className="flex justify-between items-center text-xs font-bold text-gray-900 pt-2 border-t border-gray-200">
                    <span>Khách cần trả:</span>
                    <span className="font-mono text-blue-700 text-sm">
                      {Math.max(
                        0,
                        editOrderItems.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0) -
                          editOrderDiscount +
                          editOrderSurcharge
                      ).toLocaleString('vi-VN')}đ
                    </span>
                  </div>

                  <div className="flex justify-between items-center text-xs">
                    <span className="text-gray-600 font-medium">Khách đã trả:</span>
                    <input
                      type="number"
                      value={editOrderAmountPaid}
                      onChange={(e) => setEditOrderAmountPaid(Math.max(0, parseFloat(e.target.value) || 0))}
                      className="w-28 text-right p-1 border border-gray-300 rounded font-mono font-bold text-gray-800 bg-white"
                    />
                  </div>

                  <div className="flex justify-between items-center text-xs">
                    <span className="text-gray-600 font-medium">Hình thức thanh toán:</span>
                    <select
                      value={editOrderPaymentMethod}
                      onChange={(e) => setEditOrderPaymentMethod(e.target.value as PaymentMethod)}
                      className="p-1 border border-gray-300 rounded text-xs bg-white text-gray-800 font-medium"
                    >
                      <option value="cash">Tiền mặt</option>
                      <option value="transfer">Chuyển khoản</option>
                      <option value="card">Thẻ ngân hàng</option>
                      <option value="wallet">Ví điện tử</option>
                    </select>
                  </div>

                  <div className="flex justify-between items-center text-xs">
                    <span className="text-gray-600 font-medium">Trạng thái:</span>
                    <select
                      value={editOrderStatus}
                      onChange={(e) => setEditOrderStatus(e.target.value as any)}
                      className="p-1 border border-gray-300 rounded text-xs bg-white text-gray-800 font-semibold"
                    >
                      <option value="Đã thanh toán">Đã thanh toán</option>
                      <option value="Trả hàng">Trả hàng</option>
                      <option value="Đã hủy">Đã hủy</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="bg-gray-100 px-6 py-3 border-t border-gray-200 flex justify-end space-x-3 shrink-0">
              <button
                type="button"
                onClick={() => {
                  setShowEditOrderModal(false);
                  setEditingOrder(null);
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg text-xs font-semibold text-gray-700 bg-white hover:bg-gray-50 transition-colors"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={handleSaveOrderEdits}
                className="px-5 py-2 bg-[#0066ff] hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-colors shadow-xs flex items-center space-x-1.5"
              >
                <Save className="w-4 h-4" />
                <span>Lưu thay đổi</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
