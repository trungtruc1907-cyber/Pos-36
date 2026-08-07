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
  customerName: string;
  discount: number;
  surcharge: number;
  amountPaid: number;
  paymentMethod: PaymentMethod;
  note: string;
}

export interface Order {
  id: string;
  orderCode: string;
  date: string;
  customerName: string;
  totalAmount: number;
  itemsCount: number;
  paymentMethod: PaymentMethod;
  status: 'Đã thanh toán' | 'Đã hủy' | 'Trả hàng';
  items: CartItem[];
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  address?: string;
  totalSpent: number;
  orderCount: number;
}

export interface PurchaseOrder {
  id: string;
  code: string;
  supplierName: string;
  date: string;
  totalAmount: number;
  itemsCount: number;
  status: 'Đã nhập hàng' | 'Đã thanh toán' | 'Đang xử lý';
}

export interface ActivityLog {
  id: string;
  time: string;
  type: 'sale' | 'import' | 'return';
  storeName: string;
  actionText: string;
  amount: number;
  formattedAmount: string;
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
