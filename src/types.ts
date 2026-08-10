export type ViewMode = 
  | 'dashboard' 
  | 'pos' 
  | 'goods' 
  | 'stock-check'
  | 'suppliers'
  | 'purchases'
  | 'purchase-returns'
  | 'orders' 
  | 'returns'
  | 'customers' 
  | 'promotions'
  | 'employees'
  | 'cashbook' 
  | 'reports' 
  | 'online' 
  | 'tax';

export type PaymentMethod = 'cash' | 'transfer' | 'card' | 'wallet';

export interface Product {
  id: string;
  loaiHang?: string;        // Loại hàng (Dịch vụ / Hàng hóa)
  nhomHang?: string;        // Nhóm hàng (3 Cấp)
  code: string;             // Mã hàng
  maVach?: string;          // Mã vạch
  name: string;             // Tên hàng
  brand?: string;            // Thương hiệu
  price: number;            // Giá bán
  costPrice: number;        // Giá vốn
  stock: number;            // Tồn kho
  unit: string;             // ĐVT
  maDvtCoBan?: string;      // Mã ĐVT Cơ bản
  quyDoi?: number;          // Quy đổi
  imageUrl?: string;        // Hình ảnh (url)
  tichDiem?: number;        // Tích điểm (1/0)
  dangKinhDoanh?: number;    // Đang kinh doanh (1/0)
  duocBanTrucTiep?: number; // Được bán trực tiếp (1/0)
  description?: string;     // Mô tả
  location?: string;        // Vị trí
  category: string;         // Nhóm hàng (đồng bộ với UI)
  createdAt?: string;
  updatedAt?: string;
}

export interface StockCheckItem {
  productId?: string;
  productCode: string;
  productName: string;
  systemQty: number;      // SL sổ sách
  actualQty: number;      // SL thực tế
  diffQty: number;        // Chênh lệch
  costPrice: number;      // Giá vốn
}

export interface StockCheck {
  id: string;
  code: string;            // Mã kiểm kho (KK000656)
  time: string;            // Thời gian (04/08/2026 09:52)
  balancedDate: string;    // Ngày cân bằng (04/08/2026 09:52)
  actualQty: number;       // SL thực tế (10)
  totalActualValue: number;// Tổng thực tế (650,000)
  totalDiff: number;       // Tổng chênh lệch (7)
  increaseDiffQty: number; // SL lệch tăng (7)
  decreaseDiffQty: number; // SL lệch giảm (0)
  status?: 'Đã cân bằng' | 'Phiếu tạm' | 'Đã hủy';
  note?: string;
  items?: StockCheckItem[];
  starred?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
  unitPrice: number;
  note?: string;
}

export interface InvoiceTab {
  id: string;
  title: string;
  cart: CartItem[];
  customerId: string;
  customerCode?: string;
  customerName: string;
  discount: number;
  discountType?: 'amount' | 'percent';
  surcharge: number;
  amountPaid: number;
  paymentMethod: PaymentMethod;
  note: string;
}

export interface Order {
  id: string;
  orderCode: string;          // Mã hóa đơn (HD009721...)
  date: string;               // Thời gian (07/08/2026 10:03:12)
  returnCode?: string;        // Mã trả hàng
  customerCode?: string;      // Mã KH (KH000009, TS...)
  customerName: string;       // Khách hàng (Khách lẻ...)
  subtotal: number;           // Tổng tiền hàng
  discount: number;           // Giảm giá
  totalAmount: number;        // Tổng sau giảm giá
  amountPaid: number;         // Khách đã trả
  itemsCount: number;         // Số lượng
  paymentMethod: PaymentMethod;
  status: 'Đã thanh toán' | 'Đã hủy' | 'Trả hàng';
  items: CartItem[];
  note?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Customer {
  id: string;
  code?: string;
  name: string;
  phone: string;
  email?: string;
  address?: string;
  totalSpent: number;
  orderCount: number;
  creator?: string;
  createdAt?: string;
  customerGroup?: string;
  dob?: string;
  facebook?: string;
  gender?: string;
  note?: string;
  debt?: number;
  points?: number;
}

export interface Supplier {
  id: string;
  code: string;           // Mã nhà cung cấp (NCC000048)
  name: string;           // Tên nhà cung cấp (Cường Việt NA)
  phone: string;          // Điện thoại (0975325757)
  email?: string;         // Email
  currentDebt: number;    // Nợ cần trả hiện tại
  totalPurchased: number; // Tổng mua
  address?: string;       // Địa chỉ
  note?: string;          // Ghi chú
  createdAt?: string;
  updatedAt?: string;
}

export interface PurchaseOrderItem {
  productCode?: string;
  productName?: string;
  quantity: number;
  unitPrice: number;
  discount?: number;
  importPrice?: number;
}

export interface PurchaseOrder {
  id: string;
  code: string;
  supplierName: string;
  date: string;
  totalAmount: number;
  itemsCount: number;
  status: 'Đã nhập hàng' | 'Đã thanh toán' | 'Đang xử lý' | 'Phiếu tạm';
  creator?: string;
  buyer?: string;
  items?: PurchaseOrderItem[];
  discount?: number;
  paidAmount?: number;
  note?: string;
  createdAt?: string;
  updatedAt?: string;
}

export type ActivityType = 
  | 'sale' 
  | 'import' 
  | 'return' 
  | 'customer_debt' 
  | 'supplier_debt' 
  | 'inventory';

export interface ActivityLog {
  id: string;
  time: string;
  type: ActivityType;
  storeName: string;
  actionText: string;
  amount?: number;
  formattedAmount?: string;
  orderCode?: string;
  orderId?: string;
  entityCode?: string;
  entityType?: 'order' | 'purchase' | 'customer' | 'supplier' | 'product';
  inventoryImpact?: string;
  customerDebtImpact?: string;
  supplierDebtImpact?: string;
  details?: string;
}

export interface DayRevenue {
  day: string;
  amount: number; // in Millions (tr) or VND
}

export interface TopProductStat {
  name: string;
  value: number; // e.g. 31.3 tr
  quantity: number;
}

export interface TopCustomerStat {
  name: string;
  value: number; // e.g. 26.0 tr
}
