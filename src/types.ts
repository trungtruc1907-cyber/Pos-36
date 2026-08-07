export type ViewMode = 
  | 'dashboard' 
  | 'pos' 
  | 'goods' 
  | 'orders' 
  | 'customers' 
  | 'cashbook' 
  | 'reports' 
  | 'online' 
  | 'tax';

export type PaymentMethod = 'cash' | 'transfer' | 'card' | 'wallet';

export interface Product {
  id: string;
  code: string;
  name: string;
  unit: string;
  price: number;
  costPrice: number;
  stock: number;
  category: string;
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
