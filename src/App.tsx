import React, { useState, useEffect } from 'react';
import { ViewMode, Product, Customer, Order, ActivityLog, CartItem, PaymentMethod } from './types';
import { 
  INITIAL_CUSTOMERS, 
  INITIAL_ORDERS, 
  INITIAL_ACTIVITY_LOGS,
  INITIAL_PURCHASES 
} from './data/mockData';
import {
  subscribeProducts,
  addProduct,
  updateProduct
} from './lib/productsService';

import { Header } from './components/Header';
import { DashboardView } from './components/Dashboard/DashboardView';
import { PosView } from './components/POS/PosView';
import { GoodsModal } from './components/Modals/GoodsModal';
import { OrdersModal } from './components/Modals/OrdersModal';
import { CustomersModal } from './components/Modals/CustomersModal';
import { CashbookModal } from './components/Modals/CashbookModal';
import { InvoiceReceiptModal } from './components/Modals/InvoiceReceiptModal';
import { QrPaymentModal } from './components/Modals/QrPaymentModal';

export default function App() {
  const [currentView, setCurrentView] = useState<ViewMode>('dashboard');

  // Application Persistent State
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState<boolean>(true);
  const [customers, setCustomers] = useState<Customer[]>(INITIAL_CUSTOMERS);
  const [orders, setOrders] = useState<Order[]>(INITIAL_ORDERS);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>(INITIAL_ACTIVITY_LOGS);

  // Subscribe to Firebase Firestore for products real-time data
  useEffect(() => {
    const unsubscribe = subscribeProducts(
      (firebaseProducts) => {
        setProducts(firebaseProducts);
        setLoadingProducts(false);
      },
      (error) => {
        console.error('Firebase error:', error);
        setLoadingProducts(false);
      }
    );
    return () => unsubscribe();
  }, []);

  // Daily totals
  const [todayRevenue, setTodayRevenue] = useState<number>(1410000);
  const [todayOrdersCount, setTodayOrdersCount] = useState<number>(3);

  // Modals state
  const [showQrModal, setShowQrModal] = useState<boolean>(false);
  const [selectedOrderForReceipt, setSelectedOrderForReceipt] = useState<{
    orderCode: string;
    date: string;
    customerName: string;
    cart: CartItem[];
    discount: number;
    surcharge: number;
    amountPaid: number;
    paymentMethod: PaymentMethod;
    totalAmount: number;
    note?: string;
  } | null>(null);

  // Handlers
  const handleAddNewProduct = async (newProduct: Product) => {
    try {
      await addProduct(newProduct);
    } catch (err) {
      console.error('Failed to add product to Firestore:', err);
    }
  };

  const handleUpdateProduct = async (updatedProduct: Product) => {
    try {
      await updateProduct(updatedProduct.id, updatedProduct);
    } catch (err) {
      console.error('Failed to update product in Firestore:', err);
    }
  };

  const handleAddNewCustomer = (newCust: Customer) => {
    setCustomers([newCust, ...customers]);
  };

  // Complete Order Checkout Handler
  const handleCompleteCheckout = (checkoutData: {
    customerName: string;
    cart: CartItem[];
    discount: number;
    surcharge: number;
    amountPaid: number;
    paymentMethod: PaymentMethod;
    totalAmount: number;
    note: string;
  }) => {
    const orderCode = `HD${10295 + orders.length}`;
    const dateStr = new Date().toLocaleDateString('vi-VN') + ' ' + new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });

    const newOrder: Order = {
      id: `ord-${Date.now()}`,
      orderCode,
      date: dateStr,
      customerName: checkoutData.customerName,
      totalAmount: checkoutData.totalAmount,
      itemsCount: checkoutData.cart.reduce((sum, item) => sum + item.quantity, 0),
      paymentMethod: checkoutData.paymentMethod,
      status: 'Đã thanh toán',
      items: checkoutData.cart,
    };

    // Update state
    setOrders([newOrder, ...orders]);
    setTodayRevenue((prev) => prev + checkoutData.totalAmount);
    setTodayOrdersCount((prev) => prev + 1);

    // Add activity log
    const newLog: ActivityLog = {
      id: `log-${Date.now()}`,
      time: 'vừa xong',
      type: 'sale',
      storeName: 'Chống Thấm 36',
      actionText: 'vừa bán đơn hàng',
      amount: checkoutData.totalAmount,
      formattedAmount: checkoutData.totalAmount.toLocaleString('vi-VN'),
    };
    setActivityLogs([newLog, ...activityLogs]);

    // Open Receipt Printable Modal
    setSelectedOrderForReceipt({
      orderCode,
      date: dateStr,
      customerName: checkoutData.customerName,
      cart: checkoutData.cart,
      discount: checkoutData.discount,
      surcharge: checkoutData.surcharge,
      amountPaid: checkoutData.amountPaid,
      paymentMethod: checkoutData.paymentMethod,
      totalAmount: checkoutData.totalAmount,
      note: checkoutData.note,
    });
  };

  // Reprint previous order
  const handleReprintOrder = (ord: Order) => {
    setSelectedOrderForReceipt({
      orderCode: ord.orderCode,
      date: ord.date,
      customerName: ord.customerName,
      cart: ord.items,
      discount: 0,
      surcharge: 0,
      amountPaid: ord.totalAmount,
      paymentMethod: ord.paymentMethod,
      totalAmount: ord.totalAmount,
    });
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#f3f4f6] text-gray-800 font-sans antialiased">
      {/* If currentView === 'pos', render dedicated Fullscreen Cashier Screen */}
      {currentView === 'pos' ? (
        <PosView
          products={products}
          customers={customers}
          onBackToDashboard={() => setCurrentView('dashboard')}
          onCompleteCheckout={handleCompleteCheckout}
          onAddNewCustomer={handleAddNewCustomer}
        />
      ) : (
        /* Standard Management Navigation Layout */
        <div className="flex-1 flex flex-col min-h-screen">
          <Header
            currentView={currentView}
            onSelectView={(v) => setCurrentView(v)}
            onOpenPos={() => setCurrentView('pos')}
            unreadNotifications={2}
          />

          {/* Main View Router */}
          {currentView === 'dashboard' && (
            <DashboardView
              activityLogs={activityLogs}
              todayRevenue={todayRevenue}
              todayOrdersCount={todayOrdersCount}
              onOpenQrInfo={() => setShowQrModal(true)}
            />
          )}

          {(currentView === 'goods' || currentView === 'stock-check') && (
            <GoodsModal
              products={products}
              onAddProduct={handleAddNewProduct}
              onUpdateProduct={handleUpdateProduct}
            />
          )}

          {(currentView === 'orders' || currentView === 'returns' || currentView === 'purchases' || currentView === 'purchase-returns') && (
            <OrdersModal
              orders={orders}
              purchases={INITIAL_PURCHASES}
              currentView={currentView}
              onSelectView={(v) => setCurrentView(v)}
              onReprintOrder={handleReprintOrder}
            />
          )}

          {(currentView === 'customers' || currentView === 'suppliers' || currentView === 'employees' || currentView === 'promotions') && (
            <CustomersModal
              customers={customers}
              currentView={currentView}
              onSelectView={(v) => setCurrentView(v)}
              onAddCustomer={handleAddNewCustomer}
            />
          )}

          {(currentView === 'cashbook' || currentView === 'reports' || currentView === 'online' || currentView === 'tax') && (
            <CashbookModal todayRevenue={todayRevenue} />
          )}
        </div>
      )}

      {/* QR Code Ting Ting Modal */}
      {showQrModal && (
        <QrPaymentModal onClose={() => setShowQrModal(false)} />
      )}

      {/* Invoice Printable Receipt Modal */}
      {selectedOrderForReceipt && (
        <InvoiceReceiptModal
          orderCode={selectedOrderForReceipt.orderCode}
          date={selectedOrderForReceipt.date}
          customerName={selectedOrderForReceipt.customerName}
          cart={selectedOrderForReceipt.cart}
          discount={selectedOrderForReceipt.discount}
          surcharge={selectedOrderForReceipt.surcharge}
          amountPaid={selectedOrderForReceipt.amountPaid}
          paymentMethod={selectedOrderForReceipt.paymentMethod}
          totalAmount={selectedOrderForReceipt.totalAmount}
          note={selectedOrderForReceipt.note}
          onClose={() => setSelectedOrderForReceipt(null)}
        />
      )}
    </div>
  );
}
